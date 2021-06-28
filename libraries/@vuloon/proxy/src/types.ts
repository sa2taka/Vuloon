export type RequestData =
  | StringRequestData
  | BinaryRequestData
  | UrlEncodedRequestData
  | FormRequestData
  | JsonRequetData;

export interface StringRequestData {
  type: 'string';
  value: string;
}

export interface BinaryRequestData {
  type: 'binary';
  value: Buffer;
}

export interface UrlEncodedRequestData {
  type: 'urlencoded';
  value: NodeJS.Dict<string | string[]>;
}

export interface FormRequestData {
  type: 'formdata';
  value: FormData[];
}

export interface JsonRequetData {
  type: 'json';
  value: Json;
}
export interface FormData {
  key: string;
  value: string | Buffer | string[];
  filename?: string;
  filenameAster?: string;
  rawHeader: string;
}

type JsonPrimitive = boolean | number | string | null;

type JsonArray = JsonPrimitive[] | JsonObject[];

type JsonObject = {
  [key: string]: JsonPrimitive | JsonObject | JsonArray;
};

export type Json = JsonArray | JsonObject;
