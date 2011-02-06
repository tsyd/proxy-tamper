var http = require('http');

var ProxyMock = function (options) {
  var _patterns = [];

  var _server = http.createServer(function (req, resp) {
    var proxy = null;
    var proxyReq = null;
    var mockBody = null;
    var buffers = [];

    _patterns.forEach(function (p) {
      if (req.url.search(p.pattern) != -1) {
        switch (p.mock.constructor.name) {
        case 'Function':
          switch (parseInt(p.mock.length)) {
          case 1:
            p.mock.call(null, {
              method: req.method, url: req.url, headers: req.headers,
              onResponse: function (thisOnResultHandler) {
                resp._onResultHandler = thisOnResultHandler;
              }
            });
            break;
          case 0:
          default:
            mockBody = p.mock.call(null, null); break;
            break;
          }
        case 'String':
          mockBody = p.mock; break;
        default:
          throw new Error('Mock must be a function or string but was a '
            + p.mock.constructor.name + '.'); break;
        }
      }
    });

    if (!resp._onResultHandler && (mockBody != null)) {
      resp.writeHead(200, {});
      resp.write(mockBody, 'utf8');
      resp.end();
      return;
    }

    proxy = http.createClient(80, req.headers['host']);
    proxyReq = proxy.request(req.method, req.url, req.headers);

    proxyReq.addListener('response', function (proxyResp) {
      proxyResp.addListener('data', function (chunk) {
        buffers.push(chunk);
      });

      proxyResp.addListener('end', function () {
        var strBody = '';

        buffers.forEach(function (buf) {
          strBody += buf.toString();
        });

        var originalStrBody = strBody;

        var proxyRespProxy = {
          statusCode: proxyResp.statusCode, headers: proxyResp.headers, body: strBody,
          complete: function () {
            resp.writeHead(this.statusCode, this.headers);

            if ((strBody != this.body) && (this.body != undefined)) {
              resp.write(this.body);
            }
            else {
              buffers.forEach(function (buf) {
                resp.write(buf, 'utf8');
              });
            }

            resp.end();
          }
        };

        if (resp._onResultHandler) {
          resp._onResultHandler.call(null, proxyRespProxy);
        }
        else {
          proxyRespProxy.complete.call(proxyRespProxy);
        }
      });
    });

    req.addListener('data', function (chunk) {
      proxyReq.write(chunk, 'utf8');
    });

    req.addListener('end', function () {
      proxyReq.end();
    });
  }).listen(options.port);

  return {
    mock: function (pattern, obj) {
      _patterns.unshift({'pattern': pattern, 'mock': obj});
    }
  };
}

exports.start = function (options, block) {
  var proxyMock = new ProxyMock(options);
  block.call(proxyMock, proxyMock);
  return proxyMock;
};
