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
  Proxy: () => Proxy2
});
var import_crypto = __toModule(require("crypto"));
var import_fs = __toModule(require("fs"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_mkdirp = __toModule(require("mkdirp"));
var import_net = __toModule(require("net"));
var import_node_forge = __toModule(require("node-forge"));
var import_path = __toModule(require("path"));
var import_proxy_agent = __toModule(require("proxy-agent"));
var import_body_parser = __toModule(require("@vuloon/body-parser"));
var import_ca = __toModule(require("./ca"));
var import_semaphore = __toModule(require("./semaphore"));
__reExport(exports, __toModule(require("@vuloon/body-parser/lib/types")));
class Proxy2 {
  #port;
  #sslPort;
  #nextProxy;
  #server;
  #sslServer;
  #beforeTamperingRequestListeners;
  #tamperingRequestListeners;
  #afterTamperingRequestListeners;
  #responseListeners;
  #options;
  #connectRequests = {};
  #sslServers = {};
  #sslSemaphores = {};
  #ca;
  #RootKeyFilePath = "root/key.pem";
  #RootCertFilePath = "root/cert.pem";
  get port() {
    return this.#port;
  }
  get rootKeyPath() {
    return import_path.default.join(this.#options.ssl.caDir, this.#RootKeyFilePath);
  }
  get rootCertPath() {
    return import_path.default.join(this.#options.ssl.caDir, this.#RootCertFilePath);
  }
  get keyPath() {
    return import_path.default.join(this.#options.ssl.caDir, "keys");
  }
  get certPath() {
    return import_path.default.join(this.#options.ssl.caDir, "certs");
  }
  constructor(options) {
    this.#beforeTamperingRequestListeners = {};
    this.#tamperingRequestListeners = {};
    this.#afterTamperingRequestListeners = {};
    this.#responseListeners = {};
    this.#options = options;
    this.#port = options.port || 5110;
    this.#sslPort = options.ssl.port || 5443;
    const nextProxyUrl = options.nextProxy ? new URL(options.nextProxy) : void 0;
    this.#nextProxy = nextProxyUrl;
    this.#initializeServer();
    this.#initializeHttpsServer();
    this.#initializeCa();
    this.#registerOnClose();
  }
  #initializeCa() {
    const rootKeyFilePath = this.rootKeyPath;
    const isRootKeyFileExists = (0, import_fs.existsSync)(rootKeyFilePath);
    const rootCertFilePath = this.rootCertPath;
    const isRootCertFileExists = (0, import_fs.existsSync)(rootCertFilePath);
    if (!isRootCertFileExists || !isRootKeyFileExists) {
      const keyParentDir = (0, import_path.dirname)(this.rootKeyPath);
      const certParentDir = (0, import_path.dirname)(this.rootCertPath);
      (0, import_mkdirp.sync)(keyParentDir);
      (0, import_mkdirp.sync)(certParentDir);
      const { privateKey, certificate } = import_ca.Ca.createRootCertificate();
      (0, import_fs.writeFileSync)(rootKeyFilePath, import_node_forge.pki.privateKeyToPem(privateKey));
      (0, import_fs.writeFileSync)(rootCertFilePath, import_node_forge.pki.certificateToPem(certificate));
    }
    if (!(0, import_fs.existsSync)(this.keyPath)) {
      (0, import_mkdirp.sync)(this.keyPath);
    }
    if (!(0, import_fs.existsSync)(this.certPath)) {
      (0, import_mkdirp.sync)(this.certPath);
    }
    this.#ca = new import_ca.Ca(rootKeyFilePath, rootCertFilePath);
  }
  #initializeServer() {
    this.#server = (0, import_http.createServer)(this.#onRequest.bind(this, false)).on("error", this.#onError.bind(this, "http_server_error")).on("clientError", this.#onError.bind(this, "http_server_client_error")).on("connect", this.#onHttpsConnect.bind(this));
  }
  #initializeHttpsServer() {
    this.#sslServer = this.#createHttpsServer({});
    this.#sslServer.timeout = 0;
  }
  #createHttpsServer(options) {
    return (0, import_https.createServer)(options, this.#onRequest.bind(this, true)).on("error", this.#onError.bind(this, "https_server_error")).on("clientError", this.#onError.bind(this, "https_client_server_error")).on("connect", this.#onHttpsConnect.bind(this));
  }
  #registerOnClose() {
    process.on("exit", () => {
      this.stop();
    });
    process.on("SIGINT", () => {
      this.stop();
    });
  }
  start() {
    this.#startServer();
    this.#startSslServer();
  }
  #startServer() {
    this.#server.listen(this.#port);
  }
  #startSslServer() {
    this.#sslServer.listen(this.#sslPort);
  }
  stop() {
    this.#stopServer();
    this.#stopSslServer();
  }
  #stopServer() {
    this.#server.close();
  }
  #stopSslServer() {
    this.#sslServer.close();
    Object.values(this.#sslServers).forEach((server) => {
      server.sslServer?.close();
    });
  }
  updatePort({ port, sslPort }) {
    if (port) {
      this.#port = port;
      this.#stopServer();
      this.#startServer();
    }
    if (sslPort) {
      this.#sslPort = sslPort;
      this.#stopSslServer();
      this.#startSslServer();
    }
  }
  addResponseListener(moduleName, id, listener) {
    if (!this.#responseListeners[moduleName]) {
      this.#responseListeners[moduleName] = {};
    }
    this.#responseListeners[moduleName][id] = {
      listener
    };
  }
  removeAllResponseListener(moduleName) {
    delete this.#responseListeners[moduleName];
  }
  removeResponseListener(moduleName, id) {
    delete this.#responseListeners[moduleName][id];
  }
  addRequestListener(moduleName, id, listener) {
    if (!this.#tamperingRequestListeners[moduleName]) {
      this.#tamperingRequestListeners[moduleName] = {};
    }
    this.#tamperingRequestListeners[moduleName][id] = {
      listener
    };
  }
  removeAllRequestListener(moduleName) {
    delete this.#tamperingRequestListeners[moduleName];
  }
  removeRequestListener(moduleName, id) {
    delete this.#tamperingRequestListeners[moduleName][id];
  }
  addBeforeTamperingRequestListener(moduleName, id, listener) {
    if (!this.#beforeTamperingRequestListeners[moduleName]) {
      this.#beforeTamperingRequestListeners[moduleName] = {};
    }
    this.#beforeTamperingRequestListeners[moduleName][id] = {
      listener
    };
  }
  removeAllBeforeTamperingRequestListener(moduleName) {
    delete this.#beforeTamperingRequestListeners[moduleName];
  }
  removeBeforeTamperingRequestListener(moduleName, id) {
    delete this.#beforeTamperingRequestListeners[moduleName][id];
  }
  addAfterTamperingRequestListener(moduleName, id, listener) {
    if (!this.#afterTamperingRequestListeners[moduleName]) {
      this.#afterTamperingRequestListeners[moduleName] = {};
    }
    this.#afterTamperingRequestListeners[moduleName][id] = {
      listener
    };
  }
  removeAllAfterTamperingRequestListener(moduleName) {
    delete this.#afterTamperingRequestListeners[moduleName];
  }
  removeAfterTamperingRequestListener(moduleName, id) {
    delete this.#afterTamperingRequestListeners[moduleName][id];
  }
  #onRequest(isSsl, requestData, response) {
    let buffer = Buffer.from([]);
    requestData.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    requestData.on("end", async () => {
      if (!requestData.url) {
        return;
      }
      const parseHost = this.#parseHost(requestData, isSsl ? 443 : 80);
      if (!parseHost) {
        response.writeHead(400);
        response.write("vuloon proxy");
        response.end();
        return;
      }
      const { host, port } = parseHost;
      let parsed = (0, import_body_parser.parseRequestBody)(buffer, requestData.headers);
      const uuid = (0, import_crypto.randomUUID)();
      this.#emitBeforeListener(requestData, parsed, uuid);
      const result = await this.#emitTamperingListener(requestData, parsed, uuid);
      requestData = result.requestData;
      parsed = result.parsed;
      this.#emitAfterListener(requestData, parsed, uuid);
      const data = (0, import_body_parser.encodeRequestBody)(parsed, requestData.headers["content-type"]);
      requestData.headers["content-length"] = data.length.toString();
      requestData.headers["x-vuloon-proxy"] = "true";
      requestData.headers["proxy-connection"] = "keep-alive";
      requestData.headers["connection"] = "keep-alive";
      const headers = {};
      for (const h in requestData.headers) {
        if (!/^proxy-/i.test(h)) {
          headers[h] = requestData.headers[h];
        }
      }
      const request = isSsl ? import_https.request : import_http.request;
      const serverRequest = request({
        host,
        port,
        method: requestData.method,
        path: requestData.url,
        headers: requestData.headers,
        agent: this.#nextProxy ? new import_proxy_agent.default(this.#nextProxy.toString()) : void 0
      }).on("error", () => response.writeHead(502).end()).on("timeout", () => response.writeHead(504).end()).on("response", this.#onResponse.bind(this, uuid)).on("response", (serverResponse) => {
        serverResponse.headers["x-vuloon-proxy"] = "true";
        response.writeHead(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(response);
      });
      serverRequest.write(data);
      serverRequest.end();
    });
  }
  #onResponse(uuid, response) {
    const header = response.headers;
    let buffer = Buffer.from([]);
    response.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    response.on("end", () => {
      const parsed = (0, import_body_parser.parse)(buffer, header);
      this.#emitResponseListener(response, parsed, uuid);
    });
  }
  #emitBeforeListener(requestData, parsed, uuid) {
    const beforeTamperingHttpText = (0, import_body_parser.stringifyRequest)(requestData, parsed);
    Object.values(this.#beforeTamperingRequestListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        try {
          listener({
            header: requestData,
            body: parsed
          }, beforeTamperingHttpText, uuid);
        } catch {
        }
      });
    });
  }
  async #emitTamperingListener(requestData, parsed, uuid) {
    for (const modulesListeners of Object.values(this.#tamperingRequestListeners)) {
      for (const { listener } of Object.values(modulesListeners)) {
        const httpText = (0, import_body_parser.stringifyRequest)(requestData, parsed);
        try {
          const result = await listener({
            header: requestData,
            body: parsed
          }, httpText, uuid);
          if (result) {
            requestData = result.header;
            parsed = result.body;
          }
        } catch (e) {
        }
      }
    }
    return { requestData, parsed };
  }
  #emitAfterListener(requestData, parsed, uuid) {
    const afterTamperingHttpText = (0, import_body_parser.stringifyRequest)(requestData, parsed);
    Object.values(this.#afterTamperingRequestListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        try {
          listener({
            header: requestData,
            body: parsed
          }, afterTamperingHttpText, uuid);
        } catch {
        }
      });
    });
  }
  #emitResponseListener(response, parsed, uuid) {
    const httpText = (0, import_body_parser.stringifyResponse)(response, parsed);
    Object.values(this.#responseListeners).forEach((moduleListener) => {
      Object.values(moduleListener).forEach(({ listener }) => {
        listener({
          header: response,
          body: parsed
        }, httpText, uuid);
      });
    });
  }
  #onHttpsConnect(clientRequest, clientSocket, clientHead) {
    clientSocket.on("error", this.#onError.bind(this, "client_socket_error"));
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
    if (head[0] == 22) {
      const hostname = request.url.split(":", 2)[0];
      const sslServer = this.#sslServers[hostname];
      if (sslServer) {
        this.#makeConnection(request, socket, head, sslServer.port);
        return;
      }
      const wildcardHost = hostname.replace(/[^.]+\./, "*.");
      let semaphore = this.#sslSemaphores[wildcardHost];
      if (!semaphore) {
        semaphore = this.#sslSemaphores[wildcardHost] = new import_semaphore.Semaphore(1);
      }
      semaphore.use(async () => {
        if (this.#sslServers[hostname]) {
          this.#makeConnection(request, socket, head, this.#sslServers[hostname].port);
          return;
        }
        this.#generateHttpsServer(hostname);
        this.#makeConnection(request, socket, head, this.#sslPort);
      });
      return;
    } else {
      this.#makeConnection(request, socket, head, this.#port);
      return;
    }
  }
  #onError(at, error) {
    console.error(`Error occured at ${at}`);
    console.error(error);
  }
  #makeConnection(request, socket, head, port) {
    const conn = (0, import_net.connect)({
      port,
      host: "localhost",
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
      conn.on("end", () => {
        delete this.#connectRequests[connectKey];
      });
      socket.resume();
      return;
    });
    conn.on("error", this.#onError.bind(this, "connect_error"));
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
  #parseHost(request, port) {
    const _parseHost = (host, defaultPort) => {
      const match2 = host.match(/^https?:\/\/(.*)/);
      if (match2) {
        const parsedUrl = new URL(host);
        return {
          host: parsedUrl.hostname,
          port: parsedUrl.port
        };
      }
      const hostPort = host.split(":");
      const _host = hostPort[0];
      const _port = hostPort.length === 2 ? hostPort[1] : defaultPort;
      return {
        host: _host,
        port: _port
      };
    };
    if (!request.url) {
      return null;
    }
    const match = request.url.match(/^https?:\/\/([^/]+)(.*)/);
    if (match) {
      request.url = match[2] || "/";
      return _parseHost(match[1], port);
    } else if (request.headers.host) {
      return _parseHost(request.headers.host, port);
    } else {
      return null;
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
