import { createServer, get, Server, request } from 'http';
import { encode } from 'iconv-lite';
import ProxyAgent from 'proxy-agent';
import { Proxy } from '../src/index';

let mockServer: Server;
let proxy: Proxy;

beforeAll(() => {
  mockServer = createMock().listen(2345);
});

beforeEach(() => {
  proxy?.stop();
  proxy = new Proxy(5110);
  proxy.start();
});

afterAll(() => {
  proxy.stop();
  mockServer.close();
});

describe('Proxy', () => {
  test('normal', async () => {
    proxy.addResponseListener('id', ({ data }) => {
      expect(data.value).toBe('vuloon_test');
    });

    await getWithProxy();
  });

  describe('charset', () => {
    test('utf-8', async () => {
      proxy.addResponseListener('id', ({ data }) => {
        expect(data.value).toBe('日本語テスト');
      });

      await getWithProxy('/charset/utf8');
    });

    test('shift_jis', async () => {
      proxy.addResponseListener('id', ({ data }) => {
        expect(data.value).toBe('日本語テスト');
      });

      await getWithProxy('/charset/shift_jis');
    });
  });

  describe('binary', () => {
    test('image/png', async () => {
      proxy.addResponseListener('id', ({ data }) => {
        expect(data.value).toEqual(Buffer.from([1, 2, 3]));
      });

      await getWithProxy('/image/png');
    });
  });

  describe('request', () => {
    test('application/x-www-form-urlencoded', async () => {
      proxy.addRequestListener('id', ({ data }) => {
        expect(data.value).toEqual({
          key: ['value', 'value2'],
          nextKey: 'nextValue',
        });
      });

      await postWithProxy('/direct/header', 'key=value&key=value2&nextKey=nextValue', {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
    });

    test('multipart/form-data', async () => {
      proxy.addRequestListener('id', ({ data }) => {
        expect(data.value).toEqual([
          {
            key: 'message',
            value: ['Hello', 'World'],
            filename: undefined,
            filenameAster: undefined,
            rawHeader: 'Content-Disposition: form-data; name="message"',
          },
          {
            key: 'file',
            value: 'aaa',
            filename: 'a.txt',
            filenameAster: undefined,
            rawHeader: 'Content-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain',
          },
        ]);
      });

      await postWithProxy(
        '/direct/header',
        '--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nHello\r\n--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nWorld\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain\r\n\r\naaa\r\n--boundary--',
        {
          'Content-Type': 'multipart/form-data; boundary=boundary',
        }
      );
    });

    test('application/json', async () => {
      proxy.addRequestListener('id', ({ data }) => {
        expect(data.value).toEqual({
          key: 'value',
          numberKey: 5110,
          arrayKey: [1, 2, 3],
          objectKey: {
            nestedKey: 'nestedValue',
            nestedNumber: 51101,
          },
        });
      });

      await postWithProxy(
        '/direct/header',
        '{"key": "value","numberKey": 5110,"arrayKey":[1, 2, 3],"objectKey":{"nestedKey":"nestedValue","nestedNumber":51101}}',
        {
          'Content-Type': 'application/json',
        }
      );
    });
  });

  describe('callable', () => {
    test('get', async () => {
      const requestListener = jest.fn();
      const responseListener = jest.fn();

      proxy.addRequestListener('id', requestListener);
      proxy.addResponseListener('id', responseListener);

      await getWithProxy();
      expect(requestListener).toBeCalledTimes(1);
      expect(responseListener).toBeCalledTimes(1);
    });

    test('post', async () => {
      const requestListener = jest.fn();
      const responseListener = jest.fn();

      proxy.addRequestListener('id', requestListener);
      proxy.addResponseListener('id', responseListener);

      await postWithProxy();
      expect(requestListener).toBeCalledTimes(1);
      expect(responseListener).toBeCalledTimes(1);
    });
  });
});

function getWithProxy(path = '/') {
  const agent = new ProxyAgent('http://localhost:5110');
  return new Promise((resolve) => {
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

function postWithProxy(path = '/', data = '', headers: Record<string, string> = {}) {
  const agent = new ProxyAgent('http://localhost:5110');
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 2345,
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

    let buffer = Buffer.from('');

    clientRequest.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
    });

    clientRequest.on('end', () => {
      let text = '';
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
        case '/direct/header':
          for (let i = 0; i < clientRequest.rawHeaders.length; i += 2) {
            text += `${clientRequest.rawHeaders[i]}: ${clientRequest.rawHeaders[i + 1]}\r\n`;
          }
          clientResponse.write(text);
          break;
        case '/direct/body':
          clientResponse.write(buffer);
          break;
        default:
          clientResponse.writeHead(200, { 'Content-Type': 'text/plain' });
          clientResponse.write('vuloon_test');
      }
      clientResponse.end();
    });
  });
}
