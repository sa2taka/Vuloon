export type RequestData = string | Buffer | NodeJS.Dict<string | string[]> | FormData[] | Json;
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
