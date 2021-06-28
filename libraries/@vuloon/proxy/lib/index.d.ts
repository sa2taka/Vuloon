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
    listener: (request: RequestArgs, rawHttp: string) => RequestArgs | void;
}
export interface ResponseListener {
    listener: (response: ResponsArgs, rawHttp: string) => void;
}
export declare class Proxy {
    #private;
    /**
     * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or detault port, 5110)
     * @param port proxy port (default: 5110)
     * @param nextProxy next proxy url if using multiproxy
     */
    constructor(port?: number, nextProxy?: string);
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
