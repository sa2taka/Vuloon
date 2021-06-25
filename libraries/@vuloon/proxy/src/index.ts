import { createServer, IncomingMessage, request, Server } from 'http';
import ProxyAgent from 'proxy-agent';
import { parse } from './bodyParser';

export interface ProxyListener {
  listener: (response: IncomingMessage, data: string | Buffer) => void;
}

export class Proxy {
  #port: number;
  #nextProxy?: URL;
  #server!: Server;
  #responseListeners: Record<string, ProxyListener>;

  /**
   * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or detault port, 5110)
   * @param port proxy port (default: 5110)
   * @param nextProxy next proxy url if using multiproxy
   */
  constructor(port?: number, nextProxy?: string) {
    this.#responseListeners = {};
    this.#port = port || 5110;

    const nextProxyUrl = nextProxy ? new URL(nextProxy) : undefined;
    this.#nextProxy = nextProxyUrl;

    this.#initializeServer();
  }

  #initializeServer(): void {
    this.#server = createServer((clientRequest, clientResponse) => {
      if (!clientRequest.url) {
        return;
      }
      const requestUrl = new URL(clientRequest.url);

      const serverRequest = request({
        host: requestUrl.hostname,
        port: requestUrl.port,
        method: clientRequest.method,
        path: requestUrl.pathname,
        headers: clientRequest.headers,
        agent: this.#nextProxy ? new ProxyAgent(this.#nextProxy.toString()) : undefined,
      })
        .on('error', () => clientResponse.writeHead(502).end())
        .on('timeout', () => clientResponse.writeHead(504).end())
        .on('response', this.#onResponse.bind(this))
        .on('response', (serverResponse) => {
          clientResponse.writeHead(serverResponse.statusCode!, serverResponse.headers);
          serverResponse.pipe(clientResponse);
        });

      clientRequest.pipe(serverRequest);
    });
  }

  /**
   * Start to listen.
   */
  start(): void {
    this.#server.listen(this.#port);
  }

  /**
   * Close proxy.
   */
  stop(): void {
    this.#server.close();
  }

  /**
   * Add listener on proxy request.
   * @param id listner id for remove.
   * @param listener response listener
   */
  addResponseListener(id: string, listener: (response: IncomingMessage, data: string | Buffer) => void): void {
    this.#responseListeners[id] = {
      listener,
    };
  }

  removeResponseListener(id: string): void {
    delete this.#responseListeners[id];
  }

  #onResponse(response: IncomingMessage): void {
    const header = response.headers;
    let buffer = Buffer.from([]);

    response.on('data', (data: Uint8Array) => {
      buffer = Buffer.concat([buffer, data]);
    });

    response.on('end', () => {
      const parsed = parse(buffer, header);
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener(response, parsed);
      });
    });
  }
}
