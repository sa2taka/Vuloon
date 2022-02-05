import { randomUUID } from 'crypto';
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
  request as httpsRequest,
  Server as HttpsServer,
  ServerOptions,
} from 'https';
import { sync as mkdirpSync } from 'mkdirp';
import { connect } from 'net';
import { pki } from 'node-forge';
import path, { dirname } from 'path';
import ProxyAgent from 'proxy-agent';
import { Duplex } from 'stream';
import {
  encodeRequestBody,
  isEqualRequestBody,
  parse,
  parseRequestBody,
  stringifyRequest,
  stringifyResponse,
  RequestBody,
  ResponseBody,
} from '@vuloon/body-parser';
import { Ca } from './ca';
import { Semaphore } from './semaphore';

export interface RequestData {
  header: IncomingMessage;
  body: RequestBody;
}

export interface ResponseData {
  header: IncomingMessage;
  body: ResponseBody;
}

export interface RequestListener {
  listener: (request: RequestData, rawHttp: string, id: string) => void;
}

export interface AfterTamperingRequestListener {
  listener: (request: RequestData, rawHttp: string, id: string, tampering: boolean) => void;
}

export interface TamperingRequestListener {
  listener: (request: RequestData, rawHttp: string, id: string) => Promise<RequestData | void>;
}

export interface ResponseListener {
  listener: (response: ResponseData, rawHttp: string, id: string) => void;
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
  #beforeTamperingRequestListeners: Record<string, Record<string, RequestListener>>;
  #tamperingRequestListeners: Record<string, Record<string, TamperingRequestListener>>;
  #afterTamperingRequestListeners: Record<string, Record<string, AfterTamperingRequestListener>>;
  #responseListeners: Record<string, Record<string, ResponseListener>>;
  #options: Options;
  #connectRequests: Record<string, IncomingMessage> = {};

  #sslServers: Record<string, SslServer> = {};
  #sslSemaphores: Record<string, Semaphore> = {};
  #ca!: Ca;

  #RootKeyFilePath = 'root/key.pem';
  #RootCertFilePath = 'root/cert.pem';

  get port(): number {
    return this.#port;
  }

  get rootKeyPath(): string {
    return path.join(this.#options.ssl.caDir, this.#RootKeyFilePath);
  }

  get rootCertPath(): string {
    return path.join(this.#options.ssl.caDir, this.#RootCertFilePath);
  }

  get keyPath(): string {
    return path.join(this.#options.ssl.caDir, 'keys');
  }

  get certPath(): string {
    return path.join(this.#options.ssl.caDir, 'certs');
  }

  /**
   * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or default port, 5110)
   * @param port proxy port (default: 5110)
   * @param nextProxy next proxy url if using multi proxy
   */
  constructor(options: Options) {
    this.#beforeTamperingRequestListeners = {};
    this.#tamperingRequestListeners = {};
    this.#afterTamperingRequestListeners = {};
    this.#responseListeners = {};
    this.#options = options;

    this.#port = options.port || 5110;
    this.#sslPort = options.ssl.port || 5443;

    const nextProxyUrl = options.nextProxy ? new URL(options.nextProxy) : undefined;
    this.#nextProxy = nextProxyUrl;

    this.#initializeServer();
    this.#initializeHttpsServer();
    this.#initializeCa();
    this.#registerOnClose();
  }

  #initializeCa(): void {
    const rootKeyFilePath = this.rootKeyPath;
    const isRootKeyFileExists = existsSync(rootKeyFilePath);
    const rootCertFilePath = this.rootCertPath;
    const isRootCertFileExists = existsSync(rootCertFilePath);
    if (!isRootCertFileExists || !isRootKeyFileExists) {
      const keyParentDir = dirname(this.rootKeyPath);
      const certParentDir = dirname(this.rootCertPath);
      mkdirpSync(keyParentDir);
      mkdirpSync(certParentDir);

      const { privateKey, certificate } = Ca.createRootCertificate();
      writeFileSync(rootKeyFilePath, pki.privateKeyToPem(privateKey));
      writeFileSync(rootCertFilePath, pki.certificateToPem(certificate));
    }

    if (!existsSync(this.keyPath)) {
      mkdirpSync(this.keyPath);
    }

    if (!existsSync(this.certPath)) {
      mkdirpSync(this.certPath);
    }

    this.#ca = new Ca(rootKeyFilePath, rootCertFilePath);
  }

  #initializeServer(): void {
    this.#server = createHttpServer(this.#onRequest.bind(this, false))
      .on('error', this.#onError.bind(this, 'http_server_error'))
      .on('clientError', this.#onError.bind(this, 'http_server_client_error'))
      .on('connect', this.#onHttpsConnect.bind(this));
  }

  #initializeHttpsServer(): void {
    this.#sslServer = this.#createHttpsServer({});
    this.#sslServer.timeout = 0;
  }

  #createHttpsServer(options: ServerOptions): HttpsServer {
    return createHttpsServer(options, this.#onRequest.bind(this, true))
      .on('error', this.#onError.bind(this, 'https_server_error'))
      .on('clientError', this.#onError.bind(this, 'https_client_server_error'))
      .on('connect', this.#onHttpsConnect.bind(this));
  }

  #registerOnClose(): void {
    process.on('exit', () => {
      this.stop();
    });
    process.on('SIGINT', () => {
      this.stop();
    });
  }

  /**
   * Start to listen.
   */
  start(): void {
    this.#startServer();
    this.#startSslServer();
  }

  #startServer(): void {
    this.#server.listen(this.#port);
  }

  #startSslServer(): void {
    this.#sslServer.listen(this.#sslPort);
  }

  /**
   * Close proxy.
   */
  stop(): void {
    this.#stopServer();
    this.#stopSslServer();
  }

  #stopServer(): void {
    this.#server.close();
  }

  #stopSslServer(): void {
    this.#sslServer.close();
    Object.values(this.#sslServers).forEach((server) => {
      server.sslServer?.close();
    });
  }

  updatePort({ port, sslPort }: { port?: number; sslPort?: number }): void {
    if (port) {
      this.#port = port;
      this.#stopServer();
      this.#startServer();
    }
    if (sslPort) {
      this.#sslPort = sslPort;
      this.#stopSslServer();
      this.#startSslServer();
    }
  }

  /**
   * Add listener on proxy response.
   * @param moduleName module name to register the listener
   * @param id the listener id for remove.
   * @param listener response listener
   */
  addResponseListener(moduleName: string, id: string, listener: ResponseListener['listener']): void {
    if (!this.#responseListeners[moduleName]) {
      this.#responseListeners[moduleName] = {};
    }
    this.#responseListeners[moduleName][id] = {
      listener,
    };
  }

  removeAllResponseListener(moduleName: string): void {
    delete this.#responseListeners[moduleName];
  }

  removeResponseListener(moduleName: string, id: string): void {
    delete this.#responseListeners[moduleName][id];
  }

  /**
   * Add listener on proxy request.
   * @param moduleName module name to register the listener
   * @param id listener id for remove.
   * @param listener response listener
   */
  addRequestListener(moduleName: string, id: string, listener: TamperingRequestListener['listener']): void {
    if (!this.#tamperingRequestListeners[moduleName]) {
      this.#tamperingRequestListeners[moduleName] = {};
    }
    this.#tamperingRequestListeners[moduleName][id] = {
      listener,
    };
  }

  removeAllRequestListener(moduleName: string): void {
    delete this.#tamperingRequestListeners[moduleName];
  }

  removeRequestListener(moduleName: string, id: string): void {
    delete this.#tamperingRequestListeners[moduleName][id];
  }

  /**
   * Add listener on proxy request before tampering.
   * @param moduleName module name to register the listener
   * @param id listener id for remove.
   * @param listener response listener
   */
  addBeforeTamperingRequestListener(
    moduleName: string,
    id: string,
    listener: TamperingRequestListener['listener']
  ): void {
    if (!this.#beforeTamperingRequestListeners[moduleName]) {
      this.#beforeTamperingRequestListeners[moduleName] = {};
    }
    this.#beforeTamperingRequestListeners[moduleName][id] = {
      listener,
    };
  }

  removeAllBeforeTamperingRequestListener(moduleName: string): void {
    delete this.#beforeTamperingRequestListeners[moduleName];
  }

  removeBeforeTamperingRequestListener(moduleName: string, id: string): void {
    delete this.#beforeTamperingRequestListeners[moduleName][id];
  }

  /**
   * Add listener on proxy request after tampering.
   * @param moduleName module name to register the listener
   * @param id listener id for remove.
   * @param listener response listener
   */
  addAfterTamperingRequestListener(
    moduleName: string,
    id: string,
    listener: TamperingRequestListener['listener']
  ): void {
    if (!this.#afterTamperingRequestListeners[moduleName]) {
      this.#afterTamperingRequestListeners[moduleName] = {};
    }
    this.#afterTamperingRequestListeners[moduleName][id] = {
      listener,
    };
  }

  removeAllAfterTamperingRequestListener(moduleName: string): void {
    delete this.#afterTamperingRequestListeners[moduleName];
  }

  removeAfterTamperingRequestListener(moduleName: string, id: string): void {
    delete this.#afterTamperingRequestListeners[moduleName][id];
  }

  #onRequest(isSsl: boolean, requestData: IncomingMessage, response: ServerResponse): void {
    let buffer: Buffer = Buffer.from([]);

    requestData.on('data', (data: Uint8Array) => {
      buffer = Buffer.concat([buffer, data]);
    });

    requestData.on('end', async () => {
      if (!requestData.url) {
        return;
      }

      const parseHost = this.#parseHost(requestData, isSsl ? 443 : 80);
      if (!parseHost) {
        response.writeHead(400);
        response.write('vuloon proxy');
        response.end();
        return;
      }
      const { host, port } = parseHost;

      let parsed = parseRequestBody(buffer, requestData.headers);
      const uuid = randomUUID();

      this.#emitBeforeListener(requestData, parsed, uuid);
      const result = await this.#emitTamperingListener(requestData, parsed, uuid);

      const before = { header: requestData, body: parsed };

      requestData = result.requestData;
      parsed = result.parsed;

      const after = { header: requestData, body: parsed };

      const tampering = this.#isEqualHeaderAndBody(before, after);
      this.#emitAfterListener(requestData, parsed, uuid, tampering);

      const data = encodeRequestBody(parsed, requestData.headers['content-type']);

      requestData.headers['content-length'] = data.length.toString();
      requestData.headers['x-vuloon-proxy'] = 'true';
      requestData.headers['proxy-connection'] = 'keep-alive';
      requestData.headers['connection'] = 'keep-alive';

      const headers: Record<string, string | string[] | undefined> = {};
      for (const h in requestData.headers) {
        // don't forward proxy- headers
        if (!/^proxy-/i.test(h)) {
          headers[h] = requestData.headers[h];
        }
      }

      const request = isSsl ? httpsRequest : httpRequest;

      const serverRequest = request({
        host: host,
        port: port,
        method: requestData.method,
        path: requestData.url,
        headers: requestData.headers,
        agent: this.#nextProxy ? new ProxyAgent(this.#nextProxy.toString()) : undefined,
      })
        .on('error', () => response.writeHead(502).end())
        .on('timeout', () => response.writeHead(504).end())
        .on('response', this.#onResponse.bind(this, uuid))
        .on('response', (serverResponse) => {
          serverResponse.headers['x-vuloon-proxy'] = 'true';
          response.writeHead(serverResponse.statusCode!, serverResponse.headers);
          serverResponse.pipe(response);
        });

      serverRequest.write(data);
      serverRequest.end();
    });
  }

  #onResponse(uuid: string, response: IncomingMessage): void {
    const header = response.headers;
    let buffer = Buffer.from([]);

    response.on('data', (data: Uint8Array) => {
      buffer = Buffer.concat([buffer, data]);
    });

    response.on('end', () => {
      const parsed = parse(buffer, header);
      this.#emitResponseListener(response, parsed, uuid);
    });
  }

  #emitBeforeListener(requestData: IncomingMessage, parsed: RequestBody, uuid: string): void {
    const beforeTamperingHttpText = stringifyRequest(requestData, parsed);
    Object.values(this.#beforeTamperingRequestListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        try {
          listener(
            {
              header: requestData,
              body: parsed,
            },
            beforeTamperingHttpText,
            uuid
          );
        } catch {
          //
        }
      });
    });
  }

  async #emitTamperingListener(
    requestData: IncomingMessage,
    parsed: RequestBody,
    uuid: string
  ): Promise<{ requestData: IncomingMessage; parsed: RequestBody }> {
    for (const modulesListeners of Object.values(this.#tamperingRequestListeners)) {
      for (const { listener } of Object.values(modulesListeners)) {
        const httpText = stringifyRequest(requestData, parsed);
        try {
          const result = await listener(
            {
              header: requestData,
              body: parsed,
            },
            httpText,
            uuid
          );

          if (result) {
            requestData = result.header;
            parsed = result.body;
          }
        } catch (e) {
          //
        }
      }
    }
    return { requestData, parsed };
  }

  #emitAfterListener(requestData: IncomingMessage, parsed: RequestBody, uuid: string, tampering: boolean): void {
    const afterTamperingHttpText = stringifyRequest(requestData, parsed);
    Object.values(this.#afterTamperingRequestListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        try {
          listener(
            {
              header: requestData,
              body: parsed,
            },
            afterTamperingHttpText,
            uuid,
            tampering
          );
        } catch {
          //
        }
      });
    });
  }

  #emitResponseListener(response: IncomingMessage, parsed: ResponseBody, uuid: string): void {
    const httpText = stringifyResponse(response, parsed);
    Object.values(this.#responseListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        listener(
          {
            header: response,
            body: parsed,
          },
          httpText,
          uuid
        );
      });
    });
  }

  #onHttpsConnect(clientRequest: IncomingMessage, clientSocket: Duplex, clientHead: Buffer): void {
    clientSocket.on('error', this.#onError.bind(this, 'client_socket_error'));

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
     * TLS record should start with 22(0x16).
     */
    if (head[0] == 0x16) {
      // URL is in the form 'hostname:port'
      const hostname = request.url!.split(':', 2)[0];
      const sslServer = this.#sslServers[hostname];
      if (sslServer) {
        this.#makeConnection(request, socket, head, sslServer.port);
        return;
      }
      const wildcardHost = hostname.replace(/[^.]+\./, '*.');
      let semaphore = this.#sslSemaphores[wildcardHost];
      if (!semaphore) {
        semaphore = this.#sslSemaphores[wildcardHost] = new Semaphore(1);
      }
      semaphore.use(async () => {
        if (this.#sslServers[hostname]) {
          this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
          return;
        }
        this.#generateHttpsServer(hostname);
        this.#makeConnection(request, socket, head, this.#sslPort);
      });
      return;
    } else {
      this.#makeConnection(request, socket, head, this.#port);
      return;
    }
  }

  #onError(at: string, error: Error): void {
    console.error(`Error occured at ${at}`);
    console.error(error);
  }

  #makeConnection(request: IncomingMessage, socket: Duplex, head: Buffer, port: number): void {
    // open a TCP connection to the remote host
    const conn = connect(
      {
        port: port,
        host: 'localhost',
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
        conn.on('end', () => {
          delete this.#connectRequests[connectKey];
        });
        socket.resume();
        return;
      }
    );
    conn.on('error', this.#onError.bind(this, 'connect_error'));
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

  #parseHost(
    request: IncomingMessage,
    port: number
  ): {
    host: string;
    port: string | number;
  } | null {
    const _parseHost = (host: string, defaultPort: number) => {
      const match = host.match(/^https?:\/\/(.*)/);
      if (match) {
        const parsedUrl = new URL(host);
        return {
          host: parsedUrl.hostname,
          port: parsedUrl.port,
        };
      }

      const hostPort = host.split(':');
      const _host = hostPort[0];
      const _port = hostPort.length === 2 ? hostPort[1] : defaultPort;

      return {
        host: _host,
        port: _port,
      };
    };
    if (!request.url) {
      return null;
    }
    const match = request.url.match(/^https?:\/\/([^/]+)(.*)/);
    if (match) {
      request.url = match[2] || '/';
      return _parseHost(match[1], port);
    } else if (request.headers.host) {
      return _parseHost(request.headers.host, port);
    } else {
      return null;
    }
  }

  /**
   * Compare request data.
   * Only the header and body are compared.
   * @param left RequestData
   * @param right RequestData
   */
  #isEqualHeaderAndBody(left: RequestData, right: RequestData): boolean {
    return this.#isEqualHeader(left.header.headers, right.header.headers) && isEqualRequestBody(left.body, right.body);
  }

  /**
   * compare headers
   */
  #isEqualHeader(left: IncomingMessage['headers'], right: IncomingMessage['headers']): boolean {
    const hasAll = (target: IncomingMessage['headers'], compare: IncomingMessage['headers']): boolean => {
      return Object.entries(target).every(([name, value]) => {
        const comparedValue = compare[name];
        if (Array.isArray(value)) {
          return Array.isArray(comparedValue) && value.every((v, i) => v === comparedValue[i]);
        }
        return value === comparedValue;
      });
    };

    return hasAll(left, right) && hasAll(right, left);
  }

  #getKeyFile(host: string): string {
    return `${this.#options.ssl.caDir}/keys/${host}.key`;
  }

  #getCertFile(host: string): string {
    return `${this.#options.ssl.caDir}/certs/${host}.crt`;
  }
}

export * from '@vuloon/body-parser/lib/types';
