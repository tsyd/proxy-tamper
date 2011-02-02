var http = require('http');

var ProxyMock = function (options) {
  var _patterns = [];

  var _server = http.createServer(function (req, resp) {
    var proxy = null;
    var proxyReq = null;
    var mockData = null;

    _patterns.forEach(function (p) {
      if (req.url.search(p.pattern) != -1) {
        switch (p.mock.constructor.name) {
        case 'Function':
          mockData = p.mock.call(null, null); break;
        case 'String':
          mockData = p.mock; break;
        default:
          throw new Error('Mock must be a function or string but was a '
            + p.mock.constructor.name + '.'); break;
        }
      }
    });

    if (mockData != null) {
      resp.writeHead(200, {'server': 'proxy-mock', 'connection': 'close'});
      resp.write(mockData, 'binary');
      resp.end();
      return;
    }

    proxy = http.createClient(80, req.headers['host']);
    proxyReq = proxy.request(req.method, req.url, req.headers);

    proxyReq.addListener('response', function (proxyResp) {
      proxyResp.addListener('data', function (chunk) {
        resp.write(chunk, 'binary');
      });

      proxyResp.addListener('end', function () {
        resp.end();
      });

      resp.writeHead(proxyResp.statusCode, proxyResp.headers);
    });

    req.addListener('data', function (chunk) {
      proxyReq.write(chunk, 'binary');
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
