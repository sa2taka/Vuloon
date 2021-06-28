import { createServer, IncomingMessage, request, Server, ServerResponse } from 'http';
import ProxyAgent from 'proxy-agent';
import { encodeRequestData, parse, parseReuqestData } from './bodyParser';
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
  listener: (request: RequestArgs) => RequestArgs;
}

export interface ResponseListener {
  listener: (response: ResponsArgs) => void;
}

export class Proxy {
  #port: number;
  #nextProxy?: URL;
  #server!: Server;
  #requestListeners: Record<string, RequestListener>;
  #responseListeners: Record<string, ResponseListener>;

  /**
   * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or detault port, 5110)
   * @param port proxy port (default: 5110)
   * @param nextProxy next proxy url if using multiproxy
   */
  constructor(port?: number, nextProxy?: string) {
    this.#requestListeners = {};
    this.#responseListeners = {};
    this.#port = port || 5110;

    const nextProxyUrl = nextProxy ? new URL(nextProxy) : undefined;
    this.#nextProxy = nextProxyUrl;

    this.#initializeServer();
  }

  #initializeServer(): void {
    this.#server = createServer(this.#onRequest.bind(this));
  }

  /**
   * Start to listen.
   */
  start(): void {
    try {
      this.#server.listen(this.#port);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Close proxy.
   */
  stop(): void {
    this.#server.close();
  }

  /**
   * Add listener on proxy response.
   * @param id listner id for remove.
   * @param listener response listener
   */
  addResponseListener(id: string, listener: (response: ResponsArgs) => void): void {
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
  addRequestListener(id: string, listener: (request: RequestArgs) => RequestArgs): void {
    this.#requestListeners[id] = {
      listener,
    };
  }

  removeRequestListener(id: string): void {
    delete this.#requestListeners[id];
  }

  #onRequest(requestData: IncomingMessage, response: ServerResponse): void {
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
        return;
      }

      let parsed = parseReuqestData(buffer, requestData.headers);

      Object.values(this.#requestListeners).forEach(({ listener }) => {
        const result = listener({
          request: _requestData,
          data: parsed,
        });

        _requestData = result.request;
        parsed = result.data;
      });

      const data = encodeRequestData(parsed, _requestData.headers['content-type']);

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
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener({
          request: response,
          data: parsed,
        });
      });
    });
  }
}
