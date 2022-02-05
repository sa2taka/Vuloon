/// <reference types="node" />
import { IncomingMessage } from 'http';
import { RequestBody, ResponseBody } from '@vuloon/body-parser';
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
export declare class Proxy {
    #private;
    get port(): number;
    get rootKeyPath(): string;
    get rootCertPath(): string;
    get keyPath(): string;
    get certPath(): string;
    /**
     * Create new Proxy. Call {@link Proxy.start} to listen on specified port(or default port, 5110)
     * @param port proxy port (default: 5110)
     * @param nextProxy next proxy url if using multi proxy
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
    updatePort({ port, sslPort }: {
        port?: number;
        sslPort?: number;
    }): void;
    /**
     * Add listener on proxy response.
     * @param moduleName module name to register the listener
     * @param id the listener id for remove.
     * @param listener response listener
     */
    addResponseListener(moduleName: string, id: string, listener: ResponseListener['listener']): void;
    removeAllResponseListener(moduleName: string): void;
    removeResponseListener(moduleName: string, id: string): void;
    /**
     * Add listener on proxy request.
     * @param moduleName module name to register the listener
     * @param id listener id for remove.
     * @param listener response listener
     */
    addRequestListener(moduleName: string, id: string, listener: TamperingRequestListener['listener']): void;
    removeAllRequestListener(moduleName: string): void;
    removeRequestListener(moduleName: string, id: string): void;
    /**
     * Add listener on proxy request before tampering.
     * @param moduleName module name to register the listener
     * @param id listener id for remove.
     * @param listener response listener
     */
    addBeforeTamperingRequestListener(moduleName: string, id: string, listener: TamperingRequestListener['listener']): void;
    removeAllBeforeTamperingRequestListener(moduleName: string): void;
    removeBeforeTamperingRequestListener(moduleName: string, id: string): void;
    /**
     * Add listener on proxy request after tampering.
     * @param moduleName module name to register the listener
     * @param id listener id for remove.
     * @param listener response listener
     */
    addAfterTamperingRequestListener(moduleName: string, id: string, listener: TamperingRequestListener['listener']): void;
    removeAllAfterTamperingRequestListener(moduleName: string): void;
    removeAfterTamperingRequestListener(moduleName: string, id: string): void;
}
export * from '@vuloon/body-parser/lib/types';
