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
var import_fs = __toModule(require("fs"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_net = __toModule(require("net"));
var import_node_forge = __toModule(require("node-forge"));
var import_proxy_agent = __toModule(require("proxy-agent"));
var import_bodyParser = __toModule(require("./bodyParser"));
var import_ca = __toModule(require("./ca"));
var import_semaphore = __toModule(require("./semaphore"));
var import_textify = __toModule(require("./textify"));
class Proxy {
  #port;
  #sslPort;
  #nextProxy;
  #server;
  #sslServer;
  #requestListeners;
  #responseListeners;
  #options;
  #connectRequests = {};
  #sslServers = {};
  #sslSemaphores = {};
  #ca;
  #RootKeyFilePath = "root/key.pem";
  #RootCertFilePath = "root/cert.pem";
  constructor(options) {
    this.#requestListeners = {};
    this.#responseListeners = {};
    this.#options = options;
    this.#port = options.port || 5110;
    this.#sslPort = options.ssl.port || 5443;
    const nextProxyUrl = options.nextProxy ? new URL(options.nextProxy) : void 0;
    this.#nextProxy = nextProxyUrl;
    this.#initializeServer();
    this.#initializeHttpsServer();
    this.#initializeCa();
  }
  #initializeCa() {
    const rootKeyFilePath = `${this.#options.ssl.caDir}/${this.#RootKeyFilePath}`;
    const isRootKeyFileExists = (0, import_fs.existsSync)(rootKeyFilePath);
    const rootCertFilePath = `${this.#options.ssl.caDir}/${this.#RootCertFilePath}`;
    const isRootCertFileExists = (0, import_fs.existsSync)(rootCertFilePath);
    if (!isRootCertFileExists || !isRootKeyFileExists) {
      const { privateKey, certificate } = import_ca.Ca.createRootCertificate();
      (0, import_fs.writeFileSync)(rootKeyFilePath, import_node_forge.pki.privateKeyToPem(privateKey));
      (0, import_fs.writeFileSync)(rootCertFilePath, import_node_forge.pki.certificateToPem(certificate));
    }
    this.#ca = new import_ca.Ca(rootKeyFilePath, rootCertFilePath);
  }
  #initializeServer() {
    this.#server = (0, import_http.createServer)(this.#onRequest.bind(this, false)).on("error", this.#onError.bind(this)).on("clientError", this.#onError.bind(this)).on("connect", this.#onHttpsConnect.bind(this));
  }
  #initializeHttpsServer() {
    this.#sslServer = (0, import_https.createServer)({});
  }
  #createHttpsServer(options) {
    return (0, import_https.createServer)(options, this.#onRequest.bind(this, true)).on("error", this.#onError.bind(this)).on("clientError", this.#onError.bind(this)).on("connect", this.#onHttpsConnect.bind(this));
  }
  start() {
    this.#server.listen(this.#port);
    this.#sslServer.listen(this.#sslPort);
  }
  stop() {
    this.#server.close();
    this.#sslServer.close();
    Object.values(this.#sslServers).forEach((server) => {
      server.sslServer?.close();
    });
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
  #onRequest(isSsl, requestData, response) {
    let buffer = Buffer.from([]);
    requestData.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    requestData.on("end", () => {
      let _requestData = requestData;
      if (!requestData.url) {
        return;
      }
      let requestUrl;
      try {
        requestUrl = new URL(requestData.url);
      } catch (e) {
        console.error(e);
        response.writeHead(400);
        response.write("vuloon proxy");
        response.end();
        return;
      }
      let parsed = (0, import_bodyParser.parseReuqestData)(buffer, requestData.headers);
      Object.values(this.#requestListeners).forEach(({ listener }) => {
        const httpText = (0, import_textify.textifyRequest)(_requestData, parsed);
        const result = listener({
          request: _requestData,
          data: parsed
        }, httpText);
        if (result) {
          _requestData = result.request;
          parsed = result.data;
        }
      });
      const data = (0, import_bodyParser.encodeRequestData)(parsed, _requestData.headers["content-type"]);
      _requestData.headers["content-length"] = data.length.toString();
      _requestData.headers["x-vuloon-proxy"] = "true";
      const headers = {};
      for (const h in requestData.headers) {
        if (!/^proxy-/i.test(h)) {
          headers[h] = requestData.headers[h];
        }
      }
      const request = isSsl ? import_https.request : import_http.request;
      const serverRequest = request({
        host: requestUrl.hostname,
        port: requestUrl.port,
        method: requestData.method,
        path: requestUrl.pathname,
        headers: _requestData.headers,
        agent: this.#nextProxy ? new import_proxy_agent.default(this.#nextProxy.toString()) : void 0
      }).on("error", () => response.writeHead(502).end()).on("timeout", () => response.writeHead(504).end()).on("response", this.#onResponse.bind(this)).on("response", (serverResponse) => {
        serverResponse.headers["x-vuloon-proxy"] = "true";
        response.writeHead(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(response);
      });
      serverRequest.write(data);
      serverRequest.end();
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
      const httpText = (0, import_textify.textifyResponse)(response, parsed);
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener({
          request: response,
          data: parsed
        }, httpText);
      });
    });
  }
  #onHttpsConnect(clientRequest, clientSocket, clientHead) {
    clientSocket.on("error", this.#onError.bind(this));
    if (!clientHead || clientHead.length === 0) {
      clientSocket.once("data", this.#onHttpServerConnectData.bind(this, clientRequest, clientSocket));
      clientSocket.write("HTTP/1.1 200 OK\r\n");
      if (this.#options.keepAlive && clientRequest.headers["proxy-connection"] === "keep-alive") {
        clientSocket.write("Proxy-Connection: keep-alive\r\n");
        clientSocket.write("Connection: keep-alive\r\n");
      }
      clientSocket.write("\r\n");
    }
  }
  #onHttpServerConnectData(request, socket, head) {
    socket.pause();
    if (head[0] == 22 || head[0] == 128 || head[0] == 0) {
      const hostname = request.url.split(":", 2)[0];
      const sslServer = this.#sslServers[hostname];
      if (sslServer) {
        return this.#makeConnection(request, socket, head, sslServer.port);
      }
      const wildcardHost = hostname.replace(/[^.]+\./, "*.");
      let semaphore = this.#sslSemaphores[wildcardHost];
      if (!semaphore) {
        semaphore = this.#sslSemaphores[wildcardHost] = new import_semaphore.Semaphore(1);
      }
      semaphore.use(async () => {
        if (this.#sslServers[hostname]) {
          return this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
        }
        if (this.#sslServers[wildcardHost]) {
          this.#sslServers[hostname] = this.#sslServers[wildcardHost];
          return this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
        }
        this.#generateHttpsServer(hostname);
        this.#makeConnection(request, socket, head, this.#sslPort);
      });
    } else {
      return this.#makeConnection(request, socket, head, this.#port);
    }
  }
  #onError(error) {
    console.error(error);
  }
  #makeConnection(request, socket, head, port) {
    const conn = (0, import_net.connect)({
      port,
      allowHalfOpen: true
    }, () => {
      conn.on("finish", () => {
        socket.destroy();
      });
      socket.on("close", () => {
        conn.end();
      });
      const connectKey = conn.localPort + ":" + conn.remotePort;
      this.#connectRequests[connectKey] = request;
      socket.pipe(conn);
      conn.pipe(socket);
      socket.emit("data", head);
      return socket.resume();
    });
    conn.on("error", this.#onError.bind(this));
  }
  #generateHttpsServer(hostname) {
    const { privateKeyPem, certificatePem } = this.#generateServerKeyAndCertificate(hostname);
    if (!hostname.match(/^[\d.]+$/)) {
      this.#sslServer.addContext(hostname, {
        key: privateKeyPem,
        cert: certificatePem
      });
      this.#sslServers[hostname] = { port: this.#sslPort };
      return;
    } else {
      const server = this.#createHttpsServer({ key: privateKeyPem, cert: certificatePem });
      const address = server.address();
      if (address && typeof address !== "string") {
        const sslServer = {
          server,
          port: address.port
        };
        this.#sslServers[hostname] = sslServer;
      }
    }
  }
  #generateServerKeyAndCertificate(host) {
    const keyFile = this.#getKeyFile(host);
    const isKeyFileExists = (0, import_fs.existsSync)(keyFile);
    const certFile = this.#getCertFile(host);
    const isCertFileExists = (0, import_fs.existsSync)(certFile);
    if (isKeyFileExists && isCertFileExists) {
      return {
        privateKeyPem: (0, import_fs.readFileSync)(keyFile).toString(),
        certificatePem: (0, import_fs.readFileSync)(certFile).toString()
      };
    } else {
      const { privateKey, certificate } = this.#ca.generateServerCertificates(host);
      const privateKeyPem = import_node_forge.pki.privateKeyToPem(privateKey);
      (0, import_fs.writeFileSync)(keyFile, privateKeyPem);
      const certificatePem = import_node_forge.pki.certificateToPem(certificate);
      (0, import_fs.writeFileSync)(certFile, certificatePem);
      return {
        privateKeyPem,
        certificatePem
      };
    }
  }
  #getKeyFile(host) {
    return `${this.#options.ssl.caDir}/keys/${host}.key`;
  }
  #getCertFile(host) {
    return `${this.#options.ssl.caDir}/certs/${host}.crt`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Proxy
});
