var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  textifyRequest: () => textifyRequest,
  textifyResponse: () => textifyResponse
});
var import_bodyParser = __toModule(require("./bodyParser"));
function textifyRequest(request, data) {
  let requestPath;
  try {
    requestPath = new URL(request.url).pathname;
  } catch (e) {
    requestPath = request.url;
  }
  let headerText = `${request.method} ${requestPath} HTTP/${request.httpVersion}\r
`;
  const headers = request.rawHeaders;
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];
    headerText += `${key}: ${value}\r
`;
  }
  const dataText = (0, import_bodyParser.encodeRequestData)(data, request.headers["content-type"]);
  return `${headerText}\r
${dataText.toString()}`;
}
function textifyResponse(request, data) {
  let headerText = `HTTP/${request.httpVersion} ${request.statusCode} ${request.statusMessage}\r
`;
  const headers = request.rawHeaders;
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];
    headerText += `${key}: ${value}\r
`;
  }
  const dataText = (0, import_bodyParser.encodeRequestData)(data, request.headers["content-type"]);
  return `${headerText}\r
${dataText.toString()}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  textifyRequest,
  textifyResponse
});
