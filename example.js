var proxy = require('./lib/proxy-mock');

proxy.start({ port: 8080 }, function (p) {
  p.mock(/\/test/, 'mocked');

  p.mock(/translate\.google\..*?\/translate_a\/t/, function (request) {
    // disallow translations
    request.url = request.url.replace(/hl=../, 'hl=en').replace(/tl=../, 'tl=en')
      .replace(/sl=../, 'sl=en').replace(/text=.*/, 'text=No+translation+for+you!');
  });

  p.mock(/tsyd\.net\/$/, function (request) {
    request.onResponse(function (response) {
      // called when we have the response from the mocked url
      
      response.body = reverseHeadings(response.body);
      response.headers['server'] = 'proxy-mock 1337';
      
      // the onResponse handler must complete the response
      response.complete();
    });
  });
});

function reverseHeadings (str) {
  var matches = str.match(/(<h\d>.*?<\/h\d>)/mg);

  if (matches) {
    // reverse the text within all header tags
    matches.forEach(function (match) {
      var parts = match.match(/(<h\d>)(.*?)(<\/h\d>)/);
      str = str.replace(parts[0],
          parts[1] + parts[2].split('').reverse().join('') + parts[3]);
    });
  }

  return str;
};
