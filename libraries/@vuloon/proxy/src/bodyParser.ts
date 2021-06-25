import { IncomingHttpHeaders } from 'http';
import { unzipSync } from 'zlib';
import { decode } from 'iconv-lite';
import { RequestData } from '.';

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
  return parse(body, headers);
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
