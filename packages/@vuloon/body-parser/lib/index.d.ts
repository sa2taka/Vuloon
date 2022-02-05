/// <reference types="node" />
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { RequestBody, ResponseBody } from './types';
export declare function parse(body: Buffer, headers: IncomingHttpHeaders): ResponseBody;
export declare function parseReuqestBody(body: Buffer, headers: IncomingHttpHeaders): RequestBody;
export declare function encodeRequestBody(body: RequestBody, contentType?: string): Buffer;
export declare function textifyRequest(request: IncomingMessage, data: RequestBody): string;
export declare function textifyResponse(request: IncomingMessage, data: RequestBody): string;
export * from './types';
