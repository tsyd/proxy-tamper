# proxy-mock

A HTTP proxy library for node.js that allows for selective requests to be mocked.

## Examples

To mock HTTP requests with a string or result of a function call, specify a regular expression for the URL and a string or function:

    var proxy = require('./lib/proxy-mock');

    proxy.start({port: 80}, function (p) {
      p.mock(/test/, 'mocked');
      p.mock(/translate/, function () {
        return '{"responseData": {"translatedText": "La la la."}}'
      }); 
    });

It is also possible to modify the response before proxying it back to the original request by specifying an `onResponse` handler:

    var proxy = require('./lib/proxy-mock');

    proxy.start({port: 8080}, function (p) {
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

The `onResponse` handler has read and write access to a subset of the `http.ClientResponse` response object, namely: `response.headers`, `response.statusCode`, and `response.url`. The `onResponse` handler may also modfiy the string representation of the response body by accessing `response.body`. 

## License

(The MIT License)

Copyright (c) 2011 Thomas Sydorowski

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
