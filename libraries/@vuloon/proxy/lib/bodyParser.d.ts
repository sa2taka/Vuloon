/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { RequestData } from '.';
export declare function parse(body: Buffer, headers: IncomingHttpHeaders): string | Buffer;
export declare function parseReuqestData(body: Buffer, headers: IncomingHttpHeaders): RequestData;
