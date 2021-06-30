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
  Ca: () => Ca
});
var import_node_forge = __toModule(require("node-forge"));
var import_fs = __toModule(require("fs"));
class Ca {
  #key;
  #cert;
  constructor(privateKeyPemFile, certPemFile) {
    const key = (0, import_fs.readFileSync)(privateKeyPemFile).toString();
    const cert = (0, import_fs.readFileSync)(certPemFile).toString();
    this.#key = import_node_forge.pki.privateKeyFromPem(key);
    this.#cert = import_node_forge.pki.certificateFromPem(cert);
  }
  generateServerCertificates(hosts) {
    const _hosts = typeof hosts === "string" ? [hosts] : hosts;
    const mainHost = _hosts[0];
    const serverKeyPair = import_node_forge.pki.rsa.generateKeyPair(4096);
    const serverCertificate = import_node_forge.pki.createCertificate();
    serverCertificate.publicKey = serverKeyPair.publicKey;
    serverCertificate.serialNumber = Ca.#generateRandomSerialNumber();
    serverCertificate.validity.notBefore = new Date();
    serverCertificate.validity.notBefore.setDate(serverCertificate.validity.notBefore.getDate() - 1);
    serverCertificate.validity.notAfter = new Date();
    serverCertificate.validity.notAfter.setFullYear(serverCertificate.validity.notBefore.getFullYear() + 5);
    const attrsServer = Ca.ServerSubject.slice(0);
    attrsServer.unshift({
      name: "commonName",
      value: mainHost
    });
    serverCertificate.setSubject(attrsServer);
    serverCertificate.setIssuer(this.#cert.issuer.attributes);
    serverCertificate.setExtensions(Ca.ServerExtensions.concat([
      {
        name: "subjectAltName",
        altNames: _hosts.map((host) => {
          if (host.match(/^[\d.]+$/)) {
            return { type: 7, ip: host };
          }
          return { type: 2, value: host };
        })
      }
    ]));
    serverCertificate.sign(this.#key, import_node_forge.md.sha256.create());
    return {
      privateKey: serverKeyPair.privateKey,
      certificate: serverCertificate
    };
  }
  static RootSubject = [
    {
      name: "commonName",
      value: "NodeMITMProxyCA"
    },
    {
      name: "countryName",
      value: "Internet"
    },
    {
      shortName: "ST",
      value: "Internet"
    },
    {
      name: "localityName",
      value: "Internet"
    },
    {
      name: "organizationName",
      value: "Node MITM Proxy CA"
    },
    {
      shortName: "OU",
      value: "CA"
    }
  ];
  static RootExtentions = [
    {
      name: "basicConstraints",
      cA: true
    },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: "nsCertType",
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    },
    {
      name: "subjectKeyIdentifier"
    }
  ];
  static ServerSubject = [
    {
      name: "countryName",
      value: "Internet"
    },
    {
      shortName: "ST",
      value: "Internet"
    },
    {
      name: "localityName",
      value: "Internet"
    },
    {
      name: "organizationName",
      value: "Node MITM Proxy CA"
    },
    {
      shortName: "OU",
      value: "Node MITM Proxy Server Certificate"
    }
  ];
  static ServerExtensions = [
    {
      name: "basicConstraints",
      cA: false
    },
    {
      name: "keyUsage",
      keyCertSign: false,
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false
    },
    {
      name: "nsCertType",
      client: true,
      server: true,
      email: false,
      objsign: false,
      sslCA: false,
      emailCA: false,
      objCA: false
    },
    {
      name: "subjectKeyIdentifier"
    }
  ];
  static createRootCertificate() {
    const keyPair = import_node_forge.pki.rsa.generateKeyPair(4096);
    const cert = import_node_forge.pki.createCertificate();
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = this.#generateRandomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10);
    cert.setSubject(this.RootSubject);
    cert.setIssuer(this.RootSubject);
    cert.setExtensions(this.RootExtentions);
    cert.sign(keyPair.privateKey, import_node_forge.md.sha256.create());
    return {
      privateKey: keyPair.privateKey,
      certificate: cert
    };
  }
  static #generateRandomSerialNumber() {
    let sn = "";
    for (let i = 0; i < 4; i++) {
      sn += ("00000000" + Math.floor(Math.random() * Math.pow(256, 4)).toString(16)).slice(-8);
    }
    return sn;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Ca
});
