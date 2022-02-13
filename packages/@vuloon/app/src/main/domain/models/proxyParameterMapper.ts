import { ResponseListenerParameter } from '@vuloon/proxy';
import { SerializableResponseListenerParameter } from '../../../@types/serializableProxyParameter';
import {
  SerializableRequest,
  SerializableResponse,
  SerializableAfterTamperingRequestListenerParameter,
  SerializableRequestListenerParameter,
} from '@/@types/serializableProxyParameter';
import {
  AfterTamperingRequestListenerParameter,
  RequestData,
  RequestListenerParameter,
  ResponseData,
} from '@vuloon/proxy';

export const requestMapper = ({ body, header }: RequestData): SerializableRequest => {
  return {
    body,
    header: {
      httpVersion: header.httpVersion,
      httpVersionMajor: header.httpVersionMajor,
      httpVersionMinor: header.httpVersionMinor,
      complete: header.complete,
      headers: header.headers,
      rawHeaders: header.rawHeaders,
      method: header.method,
      url: header.url,
    },
  };
};

export const responseMapper = ({ body, header }: ResponseData): SerializableResponse => {
  return {
    body,
    header: {
      httpVersion: header.httpVersion,
      httpVersionMajor: header.httpVersionMajor,
      httpVersionMinor: header.httpVersionMinor,
      complete: header.complete,
      headers: header.headers,
      rawHeaders: header.rawHeaders,
      statusCode: header.statusCode,
      statusMessage: header.statusMessage,
    },
  };
};

// The order is important.
export function requestListenerMapper(
  data: AfterTamperingRequestListenerParameter
): SerializableAfterTamperingRequestListenerParameter;
export function requestListenerMapper(data: RequestListenerParameter): SerializableRequestListenerParameter;
export function requestListenerMapper(
  data: RequestListenerParameter | AfterTamperingRequestListenerParameter
): SerializableRequestListenerParameter | SerializableAfterTamperingRequestListenerParameter {
  return {
    ...data,
    request: requestMapper(data.request),
  };
}

export const responseListenerMapper = (data: ResponseListenerParameter): SerializableResponseListenerParameter => {
  return {
    ...data,
    response: responseMapper(data.response),
  };
};
