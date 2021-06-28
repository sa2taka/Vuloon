import { assert } from 'console';
import { IncomingHttpHeaders } from 'http';
import { decode } from 'iconv-lite';
import { parse as parseQueryString, stringify as encodeToQueryString } from 'querystring';
import { unzipSync } from 'zlib';
import {
  BinaryRequestData,
  FormData,
  FormRequestData,
  Json,
  JsonRequetData,
  RequestData,
  StringRequestData,
  UrlEncodedRequestData,
} from './types';

/**
 * Content-Encoding is in these values.
 * ref: https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Encoding
 */
const CONTENT_TYPES = ['x-gzip', 'gzip', 'compress', 'deflate', 'identity', 'br'] as const;

/**
 * These content types is not parse to string but binary.
 * This is regexps.
 */
const BINARY_CONTENT_TYPES = [/^application\/octet-stream/, /^image\/[^\s;]+/, /'video\/[^\s;]+/, /audio\/[^\s;]+/];

export function parse(body: Buffer, headers: IncomingHttpHeaders): StringRequestData | BinaryRequestData {
  const encoding = headers['content-encoding'];
  const contentType = headers['content-type'];

  const decodedBody = parseEncode(body, encoding);
  return parseContent(decodedBody, contentType);
}

export function parseReuqestData(body: Buffer, headers: IncomingHttpHeaders): RequestData {
  const contentType = headers['content-type']?.toLowerCase();
  if (contentType?.match(/^application\/x-www-form-urlencoded/)) {
    return parseForUrlEncoded(body, headers);
  }

  if (contentType?.match(/^multipart\/form-data/)) {
    return parseForFormData(body, headers);
  }

  if (contentType?.match(/^application\/json/)) {
    return parseForJson(body, headers);
  }
  return parse(body, headers);
}

export function encodeRequestData(data: RequestData, contentType?: string): Buffer {
  if (data.type === 'binary') {
    return data.value;
  }
  if (data.type === 'string') {
    return Buffer.from(data.value);
  }

  if (data.type === 'urlencoded') {
    return Buffer.from(encodeToUrlEncoded(data.value));
  }

  if (data.type === 'formdata') {
    const boundary = contentType?.match(/boundary\s*=\s*([^\s;]+)/);
    assert(boundary);
    return encodeToFormData(data.value, boundary![1]);
  }

  if (data.type === 'json') {
    return Buffer.from(encodeToJson(data.value));
  }

  return Buffer.from('');
}

function parseForUrlEncoded(body: Buffer, headers: IncomingHttpHeaders): UrlEncodedRequestData | BinaryRequestData {
  const parsed = parse(body, headers);
  if (parsed.type === 'string') {
    return { type: 'urlencoded', value: parseQueryString(parsed.value) };
  } else {
    return parsed;
  }
}

function parseForFormData(body: Buffer, headers: IncomingHttpHeaders): FormRequestData {
  const contentType = headers['content-type'];
  assert(contentType);
  const boundary = contentType?.match(/boundary\s*=\s*([^\s;]+)/);
  assert(boundary);

  const divided = divideByBoundary(body, boundary![1]);
  const partData: FormData[] = [];
  divided.forEach((data) => {
    const parsed = parseFormDataPart(data);

    const sameNameForm = partData.find((part) => part.key === parsed.key);
    if (sameNameForm && typeof parsed.value === 'string' && !(sameNameForm.value instanceof Buffer)) {
      sameNameForm.value = [sameNameForm.value, parsed.value].flat();
    } else {
      partData.push(parsed);
    }
  });

  return { type: 'formdata', value: partData };
}

function divideByBoundary(body: Buffer, boundary: string) {
  const startRawBoundary = Buffer.from('--' + boundary + '\r\n');
  const endRawBoundary = Buffer.from('\r\n--' + boundary);

  const parsed = [];
  let firstIndex = 0;

  while (body.includes(startRawBoundary, firstIndex)) {
    const dataStart = body.indexOf(startRawBoundary, firstIndex) + startRawBoundary.byteLength;
    const dataEnd = body.indexOf(endRawBoundary, dataStart);
    if (!(dataEnd && dataEnd !== -1)) {
      const endData = body.slice(dataStart, dataStart + 2);
      // 0x2d = '-'
      if (endData.equals(new Uint8Array([0x2d, 0x2d]))) {
        break;
      } else {
        throw new Error('Unexpected end of multipart data');
      }
    }
    parsed.push(body.slice(dataStart, dataEnd));
    firstIndex = dataEnd;
  }

  return parsed;
}

function parseFormDataPart(partData: Buffer): FormData {
  const headerDivider = Buffer.from('\r\n\r\n');
  const dividedPoint = partData.indexOf(headerDivider);
  const headerBuffer = partData.slice(0, dividedPoint);
  // '4' mean '\r\n\r\n' length.
  const dataBuffer = partData.slice(dividedPoint + 4);

  const headerText = parseToText(headerBuffer);
  const headerParser = /^(?<header>[^:\r\n]+):\s+(?<value>(.+))$/gm;
  const headers = [...headerText.matchAll(headerParser)].map((r) => r.groups!);
  if (!headers) {
    throw new Error('Unexpected multipart header');
  }
  const contentDisposition = headers.find((h) => h['header'].toLowerCase() === 'content-disposition');
  if (!contentDisposition) {
    throw new Error('Unexpected multipart header');
  }
  const name = contentDisposition['value'].match(/name\s*=\s*"([^"]+)"/);
  if (!name) {
    throw new Error('Unexpected multipart header');
  }
  const filename = contentDisposition['value'].match(/filename\s*=\s*"([^"]+)"/);
  const filenameAster = contentDisposition['value'].match(/filename\*\s*=\s*"([^"]+)"/);

  const contentType = headers.find((h) => h['header'].toLowerCase() === 'content-type');

  const { value } = parseContent(dataBuffer, contentType?.value);

  return {
    key: name[1],
    value,
    filename: filename ? filename[1] : undefined,
    filenameAster: filenameAster ? filenameAster[1] : undefined,
    rawHeader: headerText,
  };
}

function parseForJson(body: Buffer, headers: IncomingHttpHeaders): JsonRequetData | BinaryRequestData {
  const parsed = parse(body, headers);
  if (parsed.type === 'string') {
    return { type: 'json', value: JSON.parse(parsed.value) };
  } else {
    return parsed;
  }
}

function encodeToUrlEncoded(data: NodeJS.Dict<string | string[]>) {
  return encodeToQueryString(data);
}

function encodeToFormData(data: FormData[], boundary: string) {
  let retBuffer = Buffer.from('');

  data.forEach((form) => {
    if (typeof form.value === 'string') {
      retBuffer = Buffer.concat([
        retBuffer,
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(form.rawHeader),
        Buffer.from('\r\n\r\n'),
        Buffer.from(form.value),
      ]);
    } else if (form.value instanceof Buffer) {
      retBuffer = Buffer.concat([
        retBuffer,
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(form.rawHeader),
        Buffer.from('\r\n\r\n'),
        form.value,
      ]);
    } else {
      form.value.forEach((v) => {
        retBuffer = Buffer.concat([
          retBuffer,
          Buffer.from(`--${boundary}\r\n`),
          Buffer.from(form.rawHeader),
          Buffer.from('\r\n\r\n'),
          Buffer.from(v),
          Buffer.from('\r\n'),
        ]);
      });
    }
    retBuffer = Buffer.concat([retBuffer, Buffer.from('\r\n')]);
  });
  retBuffer = Buffer.concat([retBuffer, Buffer.from(`--${boundary}--`)]);
  return retBuffer;
}

function encodeToJson(data: Json) {
  return JSON.stringify(data);
}

function parseEncode(body: Buffer, encoding?: string) {
  if (!(encoding && encoding in CONTENT_TYPES)) {
    return body;
  }

  switch (encoding as typeof CONTENT_TYPES[number]) {
    case 'x-gzip':
    case 'gzip':
    case 'deflate':
      return unzipSync(body);
    default:
      return body;
  }
}

function parseContent(body: Buffer, contentType?: string): StringRequestData | BinaryRequestData {
  if (!contentType) {
    return { type: 'string', value: parseToText(body) };
  }

  if (BINARY_CONTENT_TYPES.some((regexp) => regexp.test(contentType))) {
    return { type: 'binary', value: body };
  }

  const charset = /charset=([^;\s]+)/.exec(contentType)?.[1];

  return { type: 'string', value: parseToText(body, charset) };
}

function parseToText(body: Buffer, charset?: string) {
  const lowerCharset = charset?.toLowerCase();

  return decode(body, lowerCharset || 'utf-8');
}
