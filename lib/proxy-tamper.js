var http = require('http');

var ProxyTamper = function (options) {
  var _patterns = [];

  var _server = http.createServer(function (req, resp) {
    var proxy = null;
    var proxyReq = null;
    var tamperBody = null;
    var buffers = [];
    var chunks = [];
    var body = '';

    var interceptRequest = function () {
      _patterns.forEach(function (p) {
        if (req.url.search(p.pattern) != -1) {
          switch (p.tamper.constructor.name) {
          case 'Function':
            switch (parseInt(p.tamper.length)) {
            case 1:
              var reqProxyObj = {
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: body,
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

      var options = {
        'host': req.headers['host'].split(':')[0] || req.headers['host'],
        'port': parseInt(req.headers['host'].split(':')[1] || 80),
        'path': req.url,
        'method': req.method,
        'headers': req.headers
      };

      proxyReq = http.request(options, function (proxyResp) {
        proxyResp.on('data', function (chunk) { buffers.push(chunk); });
        proxyResp.on('error', function (e) {});
        proxyResp.on('end', function () {
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

      proxyReq.on('error', function (e) {
          console.log('error: ' + e.message);
      });

      chunks.forEach(function (chunk) { proxyReq.write(chunk); });

      proxyReq.end();
    }


    req.on('data', function (chunk) {
      chunks.push(chunk);
    });

    req.on('end', function () {
      chunks.forEach(function (chunk) {
        body += chunk.toString();
      });
      interceptRequest();
    });
  }).listen(options.port);

  return {
    tamper: function (pattern, obj) {
      _patterns.unshift({ pattern: pattern, tamper: obj });
    }
  };
}

exports.start = function (options) {
  var proxyTamper = new ProxyTamper(options);
  return proxyTamper;
};
