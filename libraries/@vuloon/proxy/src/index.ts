import { existsSync, readFileSync, writeFileSync } from 'fs';
import {
  createServer as createHttpServer,
  IncomingMessage,
  request as httpRequest,
  Server as HttpServer,
  ServerResponse,
} from 'http';
import {
  createServer as createHttpsServer,
  Server as HttpsServer,
  ServerOptions,
  request as httpsRequest,
} from 'https';
import { connect } from 'net';
import { pki } from 'node-forge';
import ProxyAgent from 'proxy-agent';
import { Duplex } from 'stream';
import { encodeRequestData, parse, parseReuqestData } from './bodyParser';
import { Ca } from './ca';
import { Semaphore } from './semaphore';
import { textifyRequest, textifyResponse } from './textify';
import { RequestData } from './types';

export interface RequestArgs {
  request: IncomingMessage;
  data: RequestData;
}

export interface ResponsArgs {
  request: IncomingMessage;
  data: RequestData;
}

export interface RequestListener {
  listener: (request: RequestArgs, rawHttp: string) => RequestArgs | void;
}

export interface ResponseListener {
  listener: (response: ResponsArgs, rawHttp: string) => void;
}

export interface Options {
  port?: number;
  nextProxy?: string;
  keepAlive?: string;
  ssl: {
    port?: number;
    caDir: string;
  };
}

interface SslServer {
  sslServer?: HttpServer;
  port: number;
}

export class Proxy {
  #port: number;
  #sslPort: number;
  #nextProxy?: URL;
  #server!: HttpServer;
  #sslServer!: HttpsServer;
  #requestListeners: Record<string, RequestListener>;
  #responseListeners: Record<string, ResponseListener>;
  #options: Options;
  #connectRequests: Record<string, IncomingMessage> = {};

  #sslServers: Record<string, SslServer> = {};
  #sslSemaphores: Record<string, Semaphore> = {};
  #ca!: Ca;

  #RootKeyFilePath = 'root/key.pem';
  #RootCertFilePath = 'root/cert.pem';

  #avoidList = [/https:\/\/[^/]+google\.com/];

  /**
   * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or detault port, 5110)
   * @param port proxy port (default: 5110)
   * @param nextProxy next proxy url if using multiproxy
   */
  constructor(options: Options) {
    this.#requestListeners = {};
    this.#responseListeners = {};
    this.#options = options;

    this.#port = options.port || 5110;
    this.#sslPort = options.ssl.port || 5443;

    const nextProxyUrl = options.nextProxy ? new URL(options.nextProxy) : undefined;
    this.#nextProxy = nextProxyUrl;

    this.#initializeServer();
    this.#initializeHttpsServer();
    this.#initializeCa();
  }

  #initializeCa(): void {
    const rootKeyFilePath = `${this.#options.ssl.caDir}/${this.#RootKeyFilePath}`;
    const isRootKeyFileExists = existsSync(rootKeyFilePath);
    const rootCertFilePath = `${this.#options.ssl.caDir}/${this.#RootCertFilePath}`;
    const isRootCertFileExists = existsSync(rootCertFilePath);
    if (!isRootCertFileExists || !isRootKeyFileExists) {
      const { privateKey, certificate } = Ca.createRootCertificate();
      writeFileSync(rootKeyFilePath, pki.privateKeyToPem(privateKey));
      writeFileSync(rootCertFilePath, pki.certificateToPem(certificate));
    }

    this.#ca = new Ca(rootKeyFilePath, rootCertFilePath);
  }

  #initializeServer(): void {
    this.#server = createHttpServer(this.#onRequest.bind(this, false))
      .on('error', this.#onError.bind(this))
      .on('clientError', this.#onError.bind(this))
      .on('connect', this.#onHttpsConnect.bind(this));
  }

  #initializeHttpsServer(): void {
    this.#sslServer = createHttpsServer({});
  }

  #createHttpsServer(options: ServerOptions): HttpsServer {
    return createHttpsServer(options, this.#onRequest.bind(this, true))
      .on('error', this.#onError.bind(this))
      .on('clientError', this.#onError.bind(this))
      .on('connect', this.#onHttpsConnect.bind(this));
  }

  /**
   * Start to listen.
   */
  start(): void {
    this.#server.listen(this.#port);
    this.#sslServer.listen(this.#sslPort);
  }

  /**
   * Close proxy.
   */
  stop(): void {
    this.#server.close();
    this.#sslServer.close();
    Object.values(this.#sslServers).forEach((server) => {
      server.sslServer?.close();
    });
  }

  /**
   * Add listener on proxy response.
   * @param id listner id for remove.
   * @param listener response listener
   */
  addResponseListener(id: string, listener: ResponseListener['listener']): void {
    this.#responseListeners[id] = {
      listener,
    };
  }

  removeResponseListener(id: string): void {
    delete this.#responseListeners[id];
  }

  /**
   * Add listener on proxy request.
   * @param id listner id for remove.
   * @param listener response listener
   */
  addRequestListener(id: string, listener: RequestListener['listener']): void {
    this.#requestListeners[id] = {
      listener,
    };
  }

  removeRequestListener(id: string): void {
    delete this.#requestListeners[id];
  }

  #onRequest(isSsl: boolean, requestData: IncomingMessage, response: ServerResponse): void {
    let buffer: Buffer = Buffer.from([]);

    requestData.on('data', (data: Uint8Array) => {
      buffer = Buffer.concat([buffer, data]);
    });

    requestData.on('end', () => {
      let _requestData = requestData;
      if (!requestData.url) {
        return;
      }

      let requestUrl: URL;
      try {
        requestUrl = new URL(requestData.url);
      } catch (e) {
        console.error(e);
        response.writeHead(400);
        response.write('vuloon proxy');
        response.end();
        return;
      }

      let parsed = parseReuqestData(buffer, requestData.headers);

      Object.values(this.#requestListeners).forEach(({ listener }) => {
        const httpText = textifyRequest(_requestData, parsed);
        const result = listener(
          {
            request: _requestData,
            data: parsed,
          },
          httpText
        );

        if (result) {
          _requestData = result.request;
          parsed = result.data;
        }
      });

      const data = encodeRequestData(parsed, _requestData.headers['content-type']);

      _requestData.headers['content-length'] = data.length.toString();
      _requestData.headers['x-vuloon-proxy'] = 'true';

      const headers: Record<string, string | string[] | undefined> = {};
      for (const h in requestData.headers) {
        // don't forward proxy- headers
        if (!/^proxy-/i.test(h)) {
          headers[h] = requestData.headers[h];
        }
      }

      const request = isSsl ? httpsRequest : httpRequest;

      const serverRequest = request({
        host: requestUrl.hostname,
        port: requestUrl.port,
        method: requestData.method,
        path: requestUrl.pathname,
        headers: _requestData.headers,
        agent: this.#nextProxy ? new ProxyAgent(this.#nextProxy.toString()) : undefined,
      })
        .on('error', () => response.writeHead(502).end())
        .on('timeout', () => response.writeHead(504).end())
        .on('response', this.#onResponse.bind(this))
        .on('response', (serverResponse) => {
          serverResponse.headers['x-vuloon-proxy'] = 'true';
          response.writeHead(serverResponse.statusCode!, serverResponse.headers);
          serverResponse.pipe(response);
        });

      serverRequest.write(data);
      serverRequest.end();
    });
  }

  #onResponse(response: IncomingMessage): void {
    const header = response.headers;
    let buffer = Buffer.from([]);

    response.on('data', (data: Uint8Array) => {
      buffer = Buffer.concat([buffer, data]);
    });

    response.on('end', () => {
      const parsed = parse(buffer, header);
      const httpText = textifyResponse(response, parsed);
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener(
          {
            request: response,
            data: parsed,
          },
          httpText
        );
      });
    });
  }
  #onHttpsConnect(clientRequest: IncomingMessage, clientSocket: Duplex, clientHead: Buffer): void {
    clientSocket.on('error', this.#onError.bind(this));

    if (!clientHead || clientHead.length === 0) {
      clientSocket.once('data', this.#onHttpServerConnectData.bind(this, clientRequest, clientSocket));
      clientSocket.write('HTTP/1.1 200 OK\r\n');

      if (this.#options.keepAlive && clientRequest.headers['proxy-connection'] === 'keep-alive') {
        clientSocket.write('Proxy-Connection: keep-alive\r\n');
        clientSocket.write('Connection: keep-alive\r\n');
      }
      clientSocket.write('\r\n');
    }
  }

  #onHttpServerConnectData(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    socket.pause();

    /*
     * Detect TLS from first bytes of data
     * Inspired from https://gist.github.com/tg-x/835636
     * used heuristic:
     * - an incoming connection using SSLv3/TLSv1 records should start with 0x16
     * - an incoming connection using SSLv2 records should start with the record size
     *   and as the first record should not be very big we can expect 0x80 or 0x00 (the MSB is a flag)
     * - everything else is considered to be unencrypted
     */
    if (head[0] == 0x16 || head[0] == 0x80 || head[0] == 0x00) {
      // URL is in the form 'hostname:port'
      const hostname = request.url!.split(':', 2)[0];
      const sslServer = this.#sslServers[hostname];
      if (sslServer) {
        return this.#makeConnection(request, socket, head, sslServer.port);
      }
      const wildcardHost = hostname.replace(/[^.]+\./, '*.');
      let semaphore = this.#sslSemaphores[wildcardHost];
      if (!semaphore) {
        semaphore = this.#sslSemaphores[wildcardHost] = new Semaphore(1);
      }
      semaphore.use(async () => {
        if (this.#sslServers[hostname]) {
          return this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
        }
        if (this.#sslServers[wildcardHost]) {
          this.#sslServers[hostname] = this.#sslServers[wildcardHost];
          return this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
        }
        this.#generateHttpsServer(hostname);
        this.#makeConnection(request, socket, head, this.#sslPort);
      });
    } else {
      return this.#makeConnection(request, socket, head, this.#port);
    }
  }

  #onError(error: Error): void {
    console.error(error);
  }

  #makeConnection(request: IncomingMessage, socket: Duplex, head: Buffer, port: number): void {
    // open a TCP connection to the remote host
    const conn = connect(
      {
        port: port,
        allowHalfOpen: true,
      },
      () => {
        // create a tunnel between the two hosts
        conn.on('finish', () => {
          socket.destroy();
        });
        socket.on('close', () => {
          conn.end();
        });
        const connectKey = conn.localPort + ':' + conn.remotePort;
        this.#connectRequests[connectKey] = request;
        socket.pipe(conn);
        conn.pipe(socket);
        socket.emit('data', head);
        return socket.resume();
      }
    );
    conn.on('error', this.#onError.bind(this));
  }

  #generateHttpsServer(hostname: string): void {
    const { privateKeyPem, certificatePem } = this.#generateServerKeyAndCertificate(hostname);

    if (!hostname.match(/^[\d.]+$/)) {
      this.#sslServer.addContext(hostname, {
        key: privateKeyPem,
        cert: certificatePem,
      });
      this.#sslServers[hostname] = { port: this.#sslPort };
      return;
    } else {
      const server = this.#createHttpsServer({ key: privateKeyPem, cert: certificatePem });
      const address = server.address();
      if (address && typeof address !== 'string') {
        const sslServer = {
          server: server,
          port: address.port,
        };
        this.#sslServers[hostname] = sslServer;
      }
    }
  }

  #generateServerKeyAndCertificate(host: string): {
    privateKeyPem: string;
    certificatePem: string;
  } {
    const keyFile = this.#getKeyFile(host);
    const isKeyFileExists = existsSync(keyFile);
    const certFile = this.#getCertFile(host);
    const isCertFileExists = existsSync(certFile);

    if (isKeyFileExists && isCertFileExists) {
      return {
        privateKeyPem: readFileSync(keyFile).toString(),
        certificatePem: readFileSync(certFile).toString(),
      };
    } else {
      const { privateKey, certificate } = this.#ca.generateServerCertificates(host);
      const privateKeyPem = pki.privateKeyToPem(privateKey);
      writeFileSync(keyFile, privateKeyPem);
      const certificatePem = pki.certificateToPem(certificate);
      writeFileSync(certFile, certificatePem);

      return {
        privateKeyPem,
        certificatePem,
      };
    }
  }

  #getKeyFile(host: string): string {
    return `${this.#options.ssl.caDir}/keys/${host}.key`;
  }

  #getCertFile(host: string): string {
    return `${this.#options.ssl.caDir}/certs/${host}.crt`;
  }
}
