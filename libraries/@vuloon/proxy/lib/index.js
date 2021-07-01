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
var import_crypto = __toModule(require("crypto"));
var import_fs = __toModule(require("fs"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_mkdirp = __toModule(require("mkdirp"));
var import_net = __toModule(require("net"));
var import_node_forge = __toModule(require("node-forge"));
var import_path = __toModule(require("path"));
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
  get rootKeyPath() {
    return `${this.#options.ssl.caDir}/${this.#RootKeyFilePath}`;
  }
  get rootCertPath() {
    return `${this.#options.ssl.caDir}/${this.#RootCertFilePath}`;
  }
  get keyPath() {
    return `${this.#options.ssl.caDir}/keys/`;
  }
  get certPath() {
    return `${this.#options.ssl.caDir}/certs/`;
  }
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
    requestData.on("end", async () => {
      let _requestData = requestData;
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
      let parsed = (0, import_bodyParser.parseReuqestData)(buffer, requestData.headers);
      const uuid = (0, import_crypto.randomUUID)();
      for (const { listener } of Object.values(this.#requestListeners)) {
        const httpText = (0, import_textify.textifyRequest)(_requestData, parsed);
        try {
          const result = await listener({
            request: _requestData,
            data: parsed
          }, httpText, uuid);
          if (result) {
            _requestData = result.request;
            parsed = result.data;
          }
        } catch (e) {
        }
      }
      const data = (0, import_bodyParser.encodeRequestData)(parsed, _requestData.headers["content-type"]);
      _requestData.headers["content-length"] = data.length.toString();
      _requestData.headers["x-vuloon-proxy"] = "true";
      _requestData.headers["proxy-connection"] = "keep-alive";
      _requestData.headers["connection"] = "keep-alive";
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
        headers: _requestData.headers,
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
      const parsed = (0, import_bodyParser.parse)(buffer, header);
      const httpText = (0, import_textify.textifyResponse)(response, parsed);
      Object.values(this.#responseListeners).forEach(({ listener }) => {
        listener({
          request: response,
          data: parsed
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
