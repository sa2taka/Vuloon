/// <reference types="node" />
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { RequestBody, ResponseBody } from './types';
export declare function parse(body: Buffer, headers: IncomingHttpHeaders): ResponseBody;
export declare function parseRequestBody(body: Buffer, headers: IncomingHttpHeaders): RequestBody;
export declare function encodeRequestBody(body: RequestBody, contentType?: string): Buffer;
export declare function stringifyRequest(header: IncomingMessage, body: RequestBody): string;
export declare function stringifyResponse(header: IncomingMessage, body: RequestBody): string;
export declare function isEqualRequestBody(left: RequestBody, right: RequestBody, contentType?: string): boolean;
export * from './types';
