import { RequestBody } from '@vuloon/body-parser';
import type { IncomingMessage } from 'http';

export type SerializableRequestHeader = {
  httpVersion: IncomingMessage['httpVersion'];
  httpVersionMajor: IncomingMessage['httpVersionMajor'];
  httpVersionMinor: IncomingMessage['httpVersionMinor'];
  complete: IncomingMessage['complete'];
  headers: IncomingMessage['headers'];
  rawHeaders: IncomingMessage['rawHeaders'];
  method: IncomingMessage['method'];
  url: IncomingMessage['url'];
};
export type SerializableRequest = {
  body: RequestBody;
  header: SerializableRequestHeader;
};

export type SerializableResponseHeader = {
  httpVersion: IncomingMessage['httpVersion'];
  httpVersionMajor: IncomingMessage['httpVersionMajor'];
  httpVersionMinor: IncomingMessage['httpVersionMinor'];
  complete: IncomingMessage['complete'];
  headers: IncomingMessage['headers'];
  rawHeaders: IncomingMessage['rawHeaders'];
  statusCode: IncomingMessage['statusCode'];
  statusMessage: IncomingMessage['statusMessage'];
};
export type SerializableResponse = {
  body: RequestBody;
  header: SerializableResponseHeader;
};

export type SerializableRequestListenerParameter = {
  request: SerializableRequest;
  rawHttp: string;
};

export type SerializableAfterTamperingRequestListenerParameter = SerializableRequestListenerParameter & {
  tampering: boolean;
};

export type SerializableResponseListenerParameter = {
  response: SerializableResponse;
  rawHttp: string;
};
