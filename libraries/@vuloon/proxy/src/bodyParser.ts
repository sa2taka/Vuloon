import { IncomingHttpHeaders } from 'http';
import { unzipSync } from 'zlib';
import { decode } from 'iconv-lite';
import { RequestData, FormData } from '.';
import { parse as parseQueryString } from 'querystring';
import { assert } from 'console';

/**
 * Content-Encoding is in these values.
 * ref: https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Encoding
 */
const CONTENT_TYPES = ['x-gzip', 'gzip', 'compress', 'deflate', 'identity', 'br'] as const;

/**
 * These content types is not parse to string but binary.
 * This is regexps.
 */
const BINARY_CONTENT_TYPES = [/^application\/octet-stream/, /^image\/[^\s;]+/];

/**
 * These content is not support.
 */
const UNACCEPT_CONTENT_TYPES = [/'video\/[^\s;]+/, /audio\/[^\s;]+/];

export function parse(body: Buffer, headers: IncomingHttpHeaders): string | Buffer {
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
    parseForJson(body, headers);
  }
  return parse(body, headers);
}

function parseForUrlEncoded(body: Buffer, headers: IncomingHttpHeaders) {
  const parsed = parse(body, headers);
  if (typeof parsed === 'string') {
    return parseQueryString(parsed);
  } else {
    return parsed;
  }
}

function parseForFormData(body: Buffer, headers: IncomingHttpHeaders) {
  const contentType = headers['content-type'];
  assert(contentType);
  const boundary = contentType?.match(/boundary\s*=\s*([^\s;]+)/);
  assert(boundary);

  const divided = divideByBoundary(body, boundary![1]);
  const partData: NodeJS.Dict<FormData> = {};
  divided.forEach((data) => {
    const [key, value] = parseFormDataPart(data);
    partData[key] = value;
  });

  return partData;
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

function parseFormDataPart(partData: Buffer): [string, FormData] {
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

  const value = parseContent(dataBuffer, contentType?.value);

  return [
    name[1],
    {
      value,
      filename: filename ? filename[1] : undefined,
      filenameAster: filenameAster ? filenameAster[1] : undefined,
    },
  ];
}

function parseForJson(body: Buffer, headers: IncomingHttpHeaders) {
  const parsed = parse(body, headers);
  if (typeof parsed === 'string') {
    return JSON.parse(parsed);
  } else {
    return parsed;
  }
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

function parseContent(body: Buffer, contentType?: string) {
  if (!contentType) {
    return parseToText(body);
  }

  if (BINARY_CONTENT_TYPES.some((regexp) => regexp.test(contentType))) {
    return body;
  }

  if (UNACCEPT_CONTENT_TYPES.some((regexp) => regexp.test(contentType))) {
    return 'unaccept';
  }

  const charset = /charset=([^;\s]+)/.exec(contentType)?.[1];

  return parseToText(body, charset);
}

function parseToText(body: Buffer, charset?: string) {
  const lowerCharset = charset?.toLowerCase();

  return decode(body, lowerCharset || 'utf-8');
}
