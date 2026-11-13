/**
 * GovMind AI - In-Process Test Harness
 * Dispatches HTTP requests directly to Express without network sockets.
 */
const { EventEmitter } = require('events');
const { Readable } = require('stream');

function createInProcessRequester(app) {
  function makeRequest(method, url, { headers = {}, body = null } = {}) {
    return new Promise((resolve, reject) => {
      // 1. Create mock IncomingMessage (Readable stream)
      const req = new Readable({
        read() {},
      });

      req.method = method.toUpperCase();
      req.url = url;
      req.headers = {
        'content-type': 'application/json',
        ...Object.keys(headers).reduce((acc, k) => {
          acc[k.toLowerCase()] = headers[k];
          return acc;
        }, {}),
      };
      const mockSocket = {
        remoteAddress: '127.0.0.1',
        encrypted: false,
        destroy() {},
        end() {},
        resume() {},
        pause() {},
        write() {},
        on() {},
        once() {},
        emit() {},
      };
      req.connection = mockSocket;
      req.socket = mockSocket;

      let bodyStr = '';
      if (body !== null && body !== undefined) {
        bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        req.headers['content-length'] = Buffer.byteLength(bodyStr);
        req.push(bodyStr);
      }
      req.push(null); // End of stream

      // 2. Create mock ServerResponse
      const res = new EventEmitter();
      res.statusCode = 200;
      res._headers = {};
      res._chunks = [];

      res.setHeader = (key, val) => {
        res._headers[key.toLowerCase()] = val;
      };
      res.getHeader = (key) => res._headers[key.toLowerCase()];
      res.removeHeader = (key) => {
        delete res._headers[key.toLowerCase()];
      };

      res.writeHead = (statusCode, headers = {}) => {
        res.statusCode = statusCode;
        Object.keys(headers).forEach((k) => res.setHeader(k, headers[k]));
        return res;
      };

      res.write = (chunk) => {
        if (chunk) {
          res._chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return true;
      };

      res.end = (chunk) => {
        if (chunk) {
          res._chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBuffer = Buffer.concat(res._chunks);
        const text = rawBuffer.toString('utf8');
        let parsedBody = null;
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text;
        }

        resolve({
          status: res.statusCode,
          statusCode: res.statusCode,
          headers: res._headers,
          body: parsedBody,
          text,
        });
      };

      // 3. Dispatch to Express application
      try {
        app.handle(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              status: 404,
              statusCode: 404,
              headers: res._headers,
              body: { message: 'Route not found' },
              text: 'Route not found',
            });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    get: (url, opts = {}) => makeRequest('GET', url, opts),
    post: (url, body, opts = {}) => makeRequest('POST', url, { ...opts, body }),
    put: (url, body, opts = {}) => makeRequest('PUT', url, { ...opts, body }),
    delete: (url, opts = {}) => makeRequest('DELETE', url, opts),
  };
}

module.exports = { createInProcessRequester };
