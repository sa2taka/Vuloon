import { pki, md } from 'node-forge';
import { readFileSync } from 'fs';

export interface KeyAndCert {
  privateKey: pki.rsa.PrivateKey;
  certificate: pki.Certificate;
}

export class Ca {
  #key: pki.rsa.PrivateKey;
  #cert: pki.Certificate;

  constructor(privateKeyPemFile: string, certPemFile: string) {
    const key = readFileSync(privateKeyPemFile).toString();
    const cert = readFileSync(certPemFile).toString();

    this.#key = pki.privateKeyFromPem(key);
    this.#cert = pki.certificateFromPem(cert);
  }

  generateServerCertificates(hosts: string | string[]): KeyAndCert {
    const _hosts = typeof hosts === 'string' ? [hosts] : hosts;
    const mainHost = _hosts[0];

    const serverKeyPair = pki.rsa.generateKeyPair(4096);
    const serverCertificate = pki.createCertificate();

    serverCertificate.publicKey = serverKeyPair.publicKey;
    serverCertificate.serialNumber = Ca.#generateRandomSerialNumber();
    serverCertificate.validity.notBefore = new Date();
    serverCertificate.validity.notBefore.setDate(serverCertificate.validity.notBefore.getDate() - 1);
    serverCertificate.validity.notAfter = new Date();
    serverCertificate.validity.notAfter.setFullYear(serverCertificate.validity.notBefore.getFullYear() + 5);
    const attrsServer = Ca.ServerSubject.slice(0);
    attrsServer.unshift({
      name: 'commonName',
      value: mainHost,
    });
    serverCertificate.setSubject(attrsServer);
    serverCertificate.setIssuer(this.#cert.issuer.attributes);
    serverCertificate.setExtensions(
      Ca.ServerExtensions.concat([
        {
          name: 'subjectAltName',
          altNames: _hosts.map((host) => {
            if (host.match(/^[\d.]+$/)) {
              return { type: 7, ip: host };
            }
            return { type: 2, value: host };
          }),
        },
      ] as any[])
    );
    serverCertificate.sign(this.#key, md.sha256.create());
    return {
      privateKey: serverKeyPair.privateKey,
      certificate: serverCertificate,
    };
  }

  static RootSubject = [
    {
      name: 'commonName',
      value: 'VuloonProxyCA',
    },
    {
      name: 'countryName',
      value: 'Internet',
    },
    {
      shortName: 'ST',
      value: 'Internet',
    },
    {
      name: 'localityName',
      value: 'Internet',
    },
    {
      name: 'organizationName',
      value: 'VuloonProxyCA',
    },
    {
      shortName: 'OU',
      value: 'CA',
    },
  ];

  static RootExtensions = [
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ];

  static ServerSubject = [
    {
      name: 'countryName',
      value: 'Internet',
    },
    {
      shortName: 'ST',
      value: 'Internet',
    },
    {
      name: 'localityName',
      value: 'Internet',
    },
    {
      name: 'organizationName',
      value: 'VuloonProxyCA',
    },
    {
      shortName: 'OU',
      value: 'VuloonProxyOU',
    },
  ];

  static ServerExtensions = [
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyCertSign: false,
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: false,
      objsign: false,
      sslCA: false,
      emailCA: false,
      objCA: false,
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ];

  static createRootCertificate(): KeyAndCert {
    const keyPair = pki.rsa.generateKeyPair(4096);
    const cert = pki.createCertificate();
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = this.#generateRandomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10);
    cert.setSubject(this.RootSubject);
    cert.setIssuer(this.RootSubject);
    cert.setExtensions(this.RootExtensions);
    cert.sign(keyPair.privateKey, md.sha256.create());
    return {
      privateKey: keyPair.privateKey,
      certificate: cert,
    };
  }

  static #generateRandomSerialNumber(): string {
    let sn = '';
    for (let i = 0; i < 4; i++) {
      sn += ('00000000' + Math.floor(Math.random() * Math.pow(256, 4)).toString(16)).slice(-8);
    }
    return sn;
  }
}
