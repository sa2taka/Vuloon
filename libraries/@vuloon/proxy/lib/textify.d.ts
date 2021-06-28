/// <reference types="node" />
import { IncomingMessage } from 'http';
import { RequestData } from './types';
export declare function textifyRequest(request: IncomingMessage, data: RequestData): string;
export declare function textifyResponse(request: IncomingMessage, data: RequestData): string;
