var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _port, _nextProxy, _server, _listeners, _initializeServer, initializeServer_fn;
import { createServer, request } from "http";
import ProxyAgent from "proxy-agent";
export class Proxy {
  constructor(port, nextProxy) {
    __privateAdd(this, _initializeServer);
    __privateAdd(this, _port, void 0);
    __privateAdd(this, _nextProxy, void 0);
    __privateAdd(this, _server, void 0);
    __privateAdd(this, _listeners, void 0);
    __privateSet(this, _listeners, {});
    __privateSet(this, _port, port || 5110);
    const nextProxyUrl = nextProxy ? new URL(nextProxy) : void 0;
    __privateSet(this, _nextProxy, nextProxyUrl);
    __privateMethod(this, _initializeServer, initializeServer_fn).call(this);
  }
  start() {
    __privateGet(this, _server).listen(__privateGet(this, _port));
  }
  stop() {
    __privateGet(this, _server).close();
  }
  addListener(id, event, listener) {
    __privateGet(this, _listeners)[id] = {
      event,
      listener
    };
  }
  removeListener(id) {
    delete __privateGet(this, _listeners)[id];
  }
}
_port = new WeakMap();
_nextProxy = new WeakMap();
_server = new WeakMap();
_listeners = new WeakMap();
_initializeServer = new WeakSet();
initializeServer_fn = function() {
  __privateSet(this, _server, createServer((clientRequest, clientResponse) => {
    if (!clientRequest.url) {
      return;
    }
    const requestUrl = new URL(clientRequest.url);
    const serverRequest = request({
      host: requestUrl.hostname,
      port: requestUrl.port,
      method: clientRequest.method,
      path: requestUrl.pathname,
      headers: clientRequest.headers,
      agent: __privateGet(this, _nextProxy) ? new ProxyAgent(__privateGet(this, _nextProxy).toString()) : void 0
    }).on("error", () => clientResponse.writeHead(502).end()).on("timeout", () => clientResponse.writeHead(504).end()).on("response", (serverResponse) => {
      clientResponse.writeHead(serverResponse.statusCode, serverResponse.headers);
      serverResponse.pipe(clientResponse);
    });
    for (const [, value] of Object.entries(__privateGet(this, _listeners))) {
      serverRequest.on(value.event, value.listener);
    }
    clientRequest.pipe(serverRequest);
  }));
};
