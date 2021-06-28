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
  Proxy: () => Proxy
});
var import_http = __toModule(require("http"));
var import_proxy_agent = __toModule(require("proxy-agent"));
var import_bodyParser = __toModule(require("./bodyParser"));
class Proxy {
  #port;
  #nextProxy;
  #server;
  #requestListeners;
  #responseListeners;
  constructor(port, nextProxy) {
    this.#requestListeners = {};
    this.#responseListeners = {};
    this.#port = port || 5110;
    const nextProxyUrl = nextProxy ? new URL(nextProxy) : void 0;
    this.#nextProxy = nextProxyUrl;
    this.#initializeServer();
  }
  #initializeServer() {
    this.#server = (0, import_http.createServer)(this.#onRequest.bind(this));
  }
  start() {
    this.#server.listen(this.#port);
  }
  stop() {
    this.#server.close();
  }
  addResponseListener(id, listener) {
    this.#responseListeners[id] = {
      listener
    };
  }
  removeResponseListener(id) {
    delete this.#responseListeners[id];
  }
  addRequestListener(id, listener) {
    this.#requestListeners[id] = {
      listener
    };
  }
  removeRequestListener(id) {
    delete this.#requestListeners[id];
  }
  #onRequest(requestData, response) {
    let buffer = Buffer.from([]);
    requestData.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    requestData.on("end", () => {
      if (!requestData.url) {
        return;
      }
      let requestUrl;
      try {
        requestUrl = new URL(requestData.url);
      } catch (e) {
        console.error(e);
        return;
      }
      let parsed = (0, import_bodyParser.parseReuqestData)(buffer, requestData.headers);
      Object.values(this.#requestListeners).forEach(({ listener }) => {
        parsed = listener(parsed);
      });
      const serverRequest = (0, import_http.request)({
        host: requestUrl.hostname,
        port: requestUrl.port,
        method: requestData.method,
        path: requestUrl.pathname,
        headers: requestData.headers,
        agent: this.#nextProxy ? new import_proxy_agent.default(this.#nextProxy.toString()) : void 0
      }).on("error", () => response.writeHead(502).end()).on("timeout", () => response.writeHead(504).end()).on("response", this.#onResponse.bind(this)).on("response", (serverResponse) => {
        response.writeHead(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(response);
      });
    });
  }
  #onResponse(response) {
    const header = response.headers;
    let buffer = Buffer.from([]);
    response.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    response.on("end", () => {
      const parsed = (0, import_bodyParser.parse)(buffer, header);
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener({
          request: response,
          data: parsed
        });
      });
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Proxy
});
