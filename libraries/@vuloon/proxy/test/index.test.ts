import { Proxy } from '../src/index';
import { createServer, get, Server } from 'http';
import ProxyAgent from 'proxy-agent';
import { encode, decode } from 'iconv-lite';

let mockServer: Server;
let proxy: Proxy;
beforeAll(() => {
  proxy = new Proxy(5110);
  proxy.start();
  mockServer = createMock().listen(2345);
});

afterAll(() => {
  proxy.stop();
  mockServer.close();
});

describe('Proxy', () => {
  test('normal', async () => {
    proxy.addResponseListener('id', (serverResponse, data) => {
      expect(data).toBe('vuloon_test');
    });

    await requestWithProxy();
  });

  describe('charset', () => {
    test('utf-8', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('日本語テスト');
      });

      await requestWithProxy('/charset/utf8');
    });

    test('shift_jis', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('日本語テスト');
      });

      await requestWithProxy('/charset/shift_jis');
    });
  });

  describe('binary', () => {
    test('image/png', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toEqual(Buffer.from([1, 2, 3]));
      });

      await requestWithProxy('/image/png');
    });

    test('audio/mp3', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('unaccept');
      });

      await requestWithProxy('/audio/mp3');
    });
  });
});

function requestWithProxy(path = '/') {
  const agent = new ProxyAgent('http://localhost:5110');
  return new Promise((resolve, reject) => {
    get(
      {
        port: 2345,
        host: 'localhost',
        path: path,
        agent,
      },
      (res) => {
        resolve(res);
      }
    );
  });
}

function createMock() {
  return createServer((clientRequest, clientResponse) => {
    if (!clientRequest.url) {
      return;
    }

    switch (clientRequest.url) {
      case '/image/png':
        clientResponse.writeHead(200, { 'Content-Type': 'image/png' });
        clientResponse.write(Buffer.from([1, 2, 3]));
        break;
      case '/audio/mp3':
        clientResponse.writeHead(200, { 'Content-Type': 'audio/mp3' });
        clientResponse.write(Buffer.from([12, 23, 34]));
        break;
      case '/charset/utf8':
        clientResponse.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        clientResponse.write('日本語テスト');
        break;
      case '/charset/shift_jis':
        clientResponse.writeHead(200, { 'Content-Type': 'text/plain; charset=shift_jis' });
        clientResponse.write(encode('日本語テスト', 'shift_jis'));
        break;
      default:
        clientResponse.writeHead(200, { 'Content-Type': 'text/plain' });
        clientResponse.write('vuloon_test');
    }
    clientResponse.end();
  });
}
