import { createServer, get, Server, request } from 'http';
import { encode } from 'iconv-lite';
import ProxyAgent from 'proxy-agent';
import { Proxy } from '../src/index';

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

    await getWithProxy();
  });

  describe('charset', () => {
    test('utf-8', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('日本語テスト');
      });

      await getWithProxy('/charset/utf8');
    });

    test('shift_jis', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('日本語テスト');
      });

      await getWithProxy('/charset/shift_jis');
    });
  });

  describe('binary', () => {
    test('image/png', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toEqual(Buffer.from([1, 2, 3]));
      });

      await getWithProxy('/image/png');
    });

    test('audio/mp3', async () => {
      proxy.addResponseListener('id', (serverResponse, data) => {
        expect(data).toBe('unaccept');
      });

      await getWithProxy('/audio/mp3');
    });
  });

  describe('request', () => {
    test('multipart/form-data', async () => {
      proxy.addRequestListener('id', (a) => {
        return a;
      });

      await postWithProxy(
        '/',
        '--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nHello\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain\r\n\r\naaa\r\n--boundary--',
        {
          'Content-Type': 'multipart/form-data; boundary=boundary',
        }
      );
    });
  });
});

function getWithProxy(path = '/') {
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

function postWithProxy(path = '/', data = '', headers: any = {}) {
  const agent = new ProxyAgent('http://localhost:5110');
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: 80,
      path: path,
      method: 'POST',
      agent,
      headers: Object.assign(
        {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(data),
        },
        headers
      ),
    };
    const reqContext = request(options, (res) => {
      resolve(res);
    });
    reqContext.write(data);
    reqContext.end();
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
