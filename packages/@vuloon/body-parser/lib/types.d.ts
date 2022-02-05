/// <reference types="node" />
export declare type RequestBody = StringRequestBody | BinaryRequestBody | UrlEncodedRequestBody | FormRequestBody | JsonRequestBody;
export declare type ResponseBody = StringRequestBody | BinaryRequestBody;
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
export interface JsonRequestBody {
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
export declare type JsonPrimitive = boolean | number | string | null;
export declare type JsonArray = JsonPrimitive[] | JsonObject[];
export declare type JsonObject = {
    [key: string]: JsonPrimitive | JsonObject | JsonArray;
};
export declare type Json = JsonArray | JsonObject;
