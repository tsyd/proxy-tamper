var http = require('http');

var ProxyTamper = function (options) {
  var _patterns = [];

  var _server = http.createServer(function (req, resp) {
    var proxy = null;
    var proxyReq = null;
    var tamperBody = null;
    var buffers = [];

    _patterns.forEach(function (p) {
      if (req.url.search(p.pattern) != -1) {
        switch (p.tamper.constructor.name) {
        case 'Function':
          switch (parseInt(p.tamper.length)) {
          case 1:
            var reqProxyObj = {
              method: req.method, url: req.url, headers: req.headers,
              onResponse: function (thisOnResultHandler) {
                resp._onResultHandler = thisOnResultHandler;
              }
            };

            p.tamper.call(null, reqProxyObj);
            req.url = reqProxyObj.url;
            req.headers = reqProxyObj.headers;
            req.method = reqProxyObj.method;
            break;
          case 0:
          default:
            tamperBody = p.tamper.call(null, null);
            break;
          }
          break;
        case 'String':
          tamperBody = p.tamper; break;
        default:
          throw new Error('Tamper object must be a function or string but was a '
            + p.tamper.constructor.name + '.'); break;
        }
      }
    });

    if (!resp._onResultHandler && tamperBody) {
      resp.writeHead(200, {});
      resp.write(tamperBody, 'utf8');
      resp.end();
      return;
    }

    proxy = http.createClient(80, req.headers['host']);
    proxyReq = proxy.request(req.method, req.url, req.headers);

    proxy.addListener('error', function (e) {});

    proxyReq.addListener('response', function (proxyResp) {
      proxyResp.addListener('data', function (chunk) { buffers.push(chunk); });
      proxyResp.addListener('error', function (e) {});
      proxyResp.addListener('end', function () {
        var strBody = '';
        buffers.forEach(function (buf) { strBody += buf.toString(); });
        var originalStrBody = strBody;

        var proxyRespProxyObj = {
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
          resp._onResultHandler.call(null, proxyRespProxyObj);
        }
        else {
          proxyRespProxyObj.complete.call(proxyRespProxyObj);
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
    tamper: function (pattern, obj) {
      _patterns.unshift({ pattern: pattern, tamper: obj });
    }
  };
}

exports.start = function (options, block) {
  var proxyTamper = new ProxyTamper(options);
  block.call(proxyTamper, proxyTamper);
  return proxyTamper;
};
