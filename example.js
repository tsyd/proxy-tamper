var proxy = require('./lib/proxy-mock');

proxy.start({port: 8080}, function (p) {
  p.mock(/test/, 'mocked');
  p.mock(/translate/, function () {
    return '{"responseData": {"translatedText": "La la la."}}'
  });

  p.mock(/tsyd\.net/, function (request) {
    request.onResponse(function (response) {
      // called when we have the response from the mocked url
      if (response.headers['content-type'] = 'text/html') {
        var matches = response.body.match(/(<h\d>.*?<\/h\d>)/mg);

        if (matches) {
          // reverse the text within all header tags
          matches.forEach(function (match) {
            var parts = match.match(/(<h\d>)(.*?)(<\/h\d>)/);
            response.body = response.body.replace(parts[0],
              parts[1] + parts[2].split('').reverse().join('') + parts[3]);
          });
        }
      }

      // the onResponse handler must complete the response
      response.complete();
    });
  });
});
