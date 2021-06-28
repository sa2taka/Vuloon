/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { BinaryRequestData, RequestData, StringRequestData } from './types';
export declare function parse(body: Buffer, headers: IncomingHttpHeaders): StringRequestData | BinaryRequestData;
export declare function parseReuqestData(body: Buffer, headers: IncomingHttpHeaders): RequestData;
export declare function encodeRequestData(data: RequestData, contentType?: string): Buffer;
