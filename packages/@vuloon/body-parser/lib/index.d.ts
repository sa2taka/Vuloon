/// <reference types="node" />
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { RequestData, ResponseData } from './types';
export declare function parse(body: Buffer, headers: IncomingHttpHeaders): ResponseData;
export declare function parseReuqestData(body: Buffer, headers: IncomingHttpHeaders): RequestData;
export declare function encodeRequestData(data: RequestData, contentType?: string): Buffer;
export declare function textifyRequest(request: IncomingMessage, data: RequestData): string;
export declare function textifyResponse(request: IncomingMessage, data: RequestData): string;
export * from './types';
