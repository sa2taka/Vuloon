export type RequestBody =
  | StringRequestBody
  | BinaryRequestBody
  | UrlEncodedRequestBody
  | FormRequestBody
  | JsonRequetBody;

export type ResponseBody = StringRequestBody | BinaryRequestBody;

export interface StringRequestBody {
  type: 'string';
  value: string;
}

export interface BinaryRequestBody {
  type: 'binary';
  value: Buffer;
}

export interface UrlEncodedRequestBody {
  type: 'urlencoded';
  value: NodeJS.Dict<string | string[]>;
}

export interface FormRequestBody {
  type: 'formdata';
  value: FormData[];
}

export interface JsonRequetBody {
  type: 'json';
  value: Json;
}
export interface FormData {
  key: string;
  value: string | Buffer | string[];
  filename?: string;
  filenameAster?: string;
  rawHeader?: string;
}

export type JsonPrimitive = boolean | number | string | null;

export type JsonArray = JsonPrimitive[] | JsonObject[];

export type JsonObject = {
  [key: string]: JsonPrimitive | JsonObject | JsonArray;
};

export type Json = JsonArray | JsonObject;
