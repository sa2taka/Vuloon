import { IncomingMessage } from 'http';
import { encodeRequestData } from './bodyParser';
import { RequestData } from './types';

export function textifyRequest(request: IncomingMessage, data: RequestData): string {
  let requestPath: string | undefined;
  try {
    requestPath = new URL(request.url!).pathname;
  } catch (e) {
    requestPath = request.url;
  }

  let headerText = `${request.method} ${requestPath} HTTP/${request.httpVersion}\r\n`;
  const headers = request.rawHeaders;
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];

    headerText += `${key}: ${value}\r\n`;
  }

  const dataText = encodeRequestData(data, request.headers['content-type']);

  return `${headerText}\r\n${dataText.toString()}`;
}

export function textifyResponse(request: IncomingMessage, data: RequestData): string {
  let headerText = `HTTP/${request.httpVersion} ${request.statusCode} ${request.statusMessage}\r\n`;
  const headers = request.rawHeaders;
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];

    headerText += `${key}: ${value}\r\n`;
  }

  const dataText = encodeRequestData(data, request.headers['content-type']);

  return `${headerText}\r\n${dataText.toString()}`;
}
