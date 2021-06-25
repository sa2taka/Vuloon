/// <reference types="node" />
import { IncomingMessage } from 'http';
export interface RequestListener {
    listener: (request: IncomingMessage) => IncomingMessage;
}
export interface ResponseListener {
    listener: (response: IncomingMessage, data: string | Buffer) => void;
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
     * Add listener on proxy request.
     * @param id listner id for remove.
     * @param listener response listener
     */
    addResponseListener(id: string, listener: (response: IncomingMessage, data: string | Buffer) => void): void;
    removeResponseListener(id: string): void;
}
