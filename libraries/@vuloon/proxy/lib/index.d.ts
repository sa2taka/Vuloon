/// <reference types="node" />
import { IncomingMessage } from 'http';
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
    listener: (request: RequestArgs, rawHttp: string, id: string) => RequestArgs | void;
}
export interface ResponseListener {
    listener: (response: ResponsArgs, rawHttp: string, id: string) => void;
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
export declare class Proxy {
    #private;
    get rootKeyPath(): string;
    get rootCertPath(): string;
    get keyPath(): string;
    get certPath(): string;
    /**
     * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or detault port, 5110)
     * @param port proxy port (default: 5110)
     * @param nextProxy next proxy url if using multiproxy
     */
    constructor(options: Options);
    /**
     * Start to listen.
     */
    start(): void;
    /**
     * Close proxy.
     */
    stop(): void;
    /**
     * Add listener on proxy response.
     * @param id listner id for remove.
     * @param listener response listener
     */
    addResponseListener(id: string, listener: ResponseListener['listener']): void;
    removeResponseListener(id: string): void;
    /**
     * Add listener on proxy request.
     * @param id listner id for remove.
     * @param listener response listener
     */
    addRequestListener(id: string, listener: RequestListener['listener']): void;
    removeRequestListener(id: string): void;
}
