var proxy = require('./lib/proxy-mock');

proxy.start({port: 80}, function (p) {
  p.mock(/test/, 'mocked');
  p.mock(/translate/, function () {
    return '{"responseData": {"translatedText": "La la la."}}'
  });
});
