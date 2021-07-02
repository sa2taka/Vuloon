import { createServer, get, Server, request } from 'http';
import { get as getHttps } from 'https';
import { encode } from 'iconv-lite';
import ProxyAgent from 'proxy-agent';
import { Proxy } from '../src/index';
import { JsonObject } from '../src/index';

let mockServer: Server;
let proxy: Proxy;

beforeAll(() => {
  mockServer = createMock().listen(2345);
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
});

beforeEach(() => {
  proxy?.stop();
  proxy = new Proxy({
    port: 5110,
    ssl: {
      caDir: __dirname + '/../ca',
      port: 5443,
    },
  });
  proxy.start();
});

afterAll(() => {
  proxy?.stop();
  mockServer.close();
});

describe('Proxy', () => {
  test('normal', async () => {
    const fn = jest.fn();
    proxy.addResponseListener('test', 'id', ({ data }) => {
      expect(data.value).toBe('vuloon_test');
      fn();
    });

    await getWithProxy();
    expect(fn).toBeCalled();
  });

  describe('charset', () => {
    const fn = jest.fn();
    test('utf-8', async () => {
      proxy.addResponseListener('test', 'id', ({ data }) => {
        expect(data.value).toBe('日本語テスト');
        fn();
      });

      await getWithProxy('/charset/utf8');
      expect(fn).toBeCalled();
    });

    test('shift_jis', async () => {
      const fn = jest.fn();
      proxy.addResponseListener('test', 'id', ({ data }) => {
        expect(data.value).toBe('日本語テスト');
        fn();
      });

      await getWithProxy('/charset/shift_jis');
      expect(fn).toBeCalled();
    });
  });

  describe('binary', () => {
    const fn = jest.fn();
    test('image/png', async () => {
      proxy.addResponseListener('test', 'id', ({ data }) => {
        expect(data.value).toEqual(Buffer.from([1, 2, 3]));
        fn();
      });

      await getWithProxy('/image/png');
      expect(fn).toBeCalled();
    });
  });

  describe('request', () => {
    test('application/x-www-form-urlencoded', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async ({ data }) => {
        expect(data.value).toEqual({
          key: ['value', 'value2'],
          nextKey: 'nextValue',
        });
        fn();
      });

      await postWithProxy('/direct/header', 'key=value&key=value2&nextKey=nextValue', {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      expect(fn).toBeCalled();
    });

    test('multipart/form-data', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async ({ data }) => {
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
        fn();
      });

      await postWithProxy(
        '/direct/header',
        '--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nHello\r\n--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nWorld\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain\r\n\r\naaa\r\n--boundary--',
        {
          'Content-Type': 'multipart/form-data; boundary=boundary',
        }
      );
      expect(fn).toBeCalled();
    });

    test('application/json', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async ({ data }) => {
        expect(data.value).toEqual({
          key: 'value',
          numberKey: 5110,
          arrayKey: [1, 2, 3],
          objectKey: {
            nestedKey: 'nestedValue',
            nestedNumber: 51101,
          },
        });
        fn();
      });

      await postWithProxy(
        '/direct/header',
        '{"key": "value","numberKey": 5110,"arrayKey":[1, 2, 3],"objectKey":{"nestedKey":"nestedValue","nestedNumber":51101}}',
        {
          'Content-Type': 'application/json',
        }
      );
      expect(fn).toBeCalled();
    });
  });

  describe('callable', () => {
    test('get', async () => {
      const requestListener = jest.fn();
      const responseListener = jest.fn();

      proxy.addRequestListener('test', 'id', requestListener);
      proxy.addResponseListener('test', 'id', responseListener);

      await getWithProxy();
      expect(requestListener).toBeCalledTimes(1);
      expect(responseListener).toBeCalledTimes(1);
    });

    test('post', async () => {
      const requestListener = jest.fn();
      const responseListener = jest.fn();

      proxy.addRequestListener('test', 'id', requestListener);
      proxy.addResponseListener('test', 'id', responseListener);

      await postWithProxy();
      expect(requestListener).toBeCalledTimes(1);
      expect(responseListener).toBeCalledTimes(1);
    });
  });

  describe('tampering', () => {
    test('header', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async (data) => {
        // wait 0.5s second.
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });

        data.request.headers['additional-header'] = 'additional-header';
        return data;
      });

      proxy.addResponseListener('test', 'id', ({ data }) => {
        expect(data.value).toContain('default-header');
        expect(data.value).toContain('additional-header');
        fn();
      });

      await postWithProxy('/direct/header', '', {
        'Default-Header': 'default-header',
      });
      expect(fn).toBeCalled();
    });

    test('application/x-www-form-urlencoded', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async (data) => {
        if (data.data.type !== 'urlencoded') {
          fail();
        }

        data.data.value['additionalData'] = 'additionalValue';
        return data;
      });

      proxy.addResponseListener('test', 'id', ({ data }) => {
        if (data.type !== 'string') {
          fail();
        }

        expect(data.value).toEqual(`key=value&key=value2&nextKey=nextValue&additionalData=additionalValue`);
        fn();
      });

      await postWithProxy('/direct/body', 'key=value&key=value2&nextKey=nextValue', {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      expect(fn).toBeCalled();
    });

    test('multipart/form-data', async () => {
      const fn = jest.fn();

      proxy.addRequestListener('test', 'id', async (data) => {
        if (data.data.type !== 'formdata') {
          fail();
        }
        data.data.value.push({
          key: 'additionalKey',
          value: 'additionalValue',
          filename: 'additonalFile',
        });
        return data;
      });

      proxy.addResponseListener('test', 'id', ({ data }) => {
        if (data.type !== 'string') {
          fail();
        }

        expect(data.value).toEqual(
          `--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nHello\r\n--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nWorld\r\n\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain\r\n\r\naaa\r\n--boundary\r\nContent-Disposition: formdata; name ="additionalKey"; filename=additonalFile\r\nContent-Type: text/plain\r\n\r\n\r\nadditionalValue\r\n--boundary--`
        );
        fn();
      });

      await postWithProxy(
        '/direct/body',
        '--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nHello\r\n--boundary\r\nContent-Disposition: form-data; name="message"\r\n\r\nWorld\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt";\r\nContent-Type: text/plain\r\n\r\naaa\r\n--boundary--',
        {
          'Content-Type': 'multipart/form-data; boundary=boundary',
        }
      );
      expect(fn).toBeCalled();
    });

    test('application/json', async () => {
      const fn = jest.fn();
      proxy.addRequestListener('test', 'id', async (data) => {
        if (data.data.type !== 'json') {
          fail();
        }

        (data.data.value as JsonObject)['additional'] = 'additionalValue';
      });

      proxy.addResponseListener('test', 'id', ({ data }) => {
        if (data.type !== 'string') {
          fail();
        }

        expect(data.value).toEqual(
          `{"key":"value","numberKey":5110,"arrayKey":[1,2,3],"objectKey":{"nestedKey":"nestedValue","nestedNumber":51101},"additional":"additionalValue"}`
        );
        fn();
      });

      await postWithProxy(
        '/direct/body',
        '{"key": "value","numberKey": 5110,"arrayKey":[1, 2, 3],"objectKey":{"nestedKey":"nestedValue","nestedNumber":51101}}',
        {
          'Content-Type': 'application/json',
        }
      );
      expect(fn).toBeCalled();
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

function getHttpsWithProxy(path = '/') {
  const agent = new ProxyAgent('http://localhost:5110');
  return new Promise((resolve) => {
    getHttps(
      {
        port: 443,
        host: 'blog.sa2taka.com',
        path: path,
        agent,
      },
      (res) => {
        console.log(res);
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
