# proxy-tamper

A HTTP proxy library for node.js that allows for selective requests to be tampered.

## Installation

Either install via `npm`:

    npm install proxy-tamper

Or via a `git clone`:

    cd node_modules
    git clone git://github.com/tsyd/proxy-tamper.git
    npm link

## Example

The following example demonstrates `proxy-tamper` abilities:

    var proxy = require('proxy-tamper').start({port: 8080});

    // block all URLs that contain 'block' in them
    proxy.tamper(/block/, 'This content is blocked!');
   
    // disallow Google 
    proxy.tamper(/google/, function (request) {
      request.url = request.url.replace(/google/g, 'bing'); 
    });

    // replace all instances of 'Apple' with 'Orange' in Techcrunch articles
    proxy.tamper(/techcrunch.com.*\/$/, function (request) {
      // gzip encoding is not supported when tampering the body
      delete request.headers['accept-encoding'];

      request.onResponse(function (response) {
        // tamper the body
        response.body = response.body.replace(/Apple/g, 'Orange');
        response.headers['server'] = 'proxy-tamper 1337';

        // complete the response
        response.complete();
      }); 
    });

To tamper HTTP requests with a string or result of a function call, specify a regular expression for the URL and a string or function:

    proxy.tamper(/block/, 'This content is blocked!');

The response body of all URLs that contain `block` in them will be `This content is blocked!'.

It is possible to manipulate the original request before it's executed over the proxy. The request object has access to `request.url`, `request.headers`, and `request.method`:

    proxy.tamper(/google/, function (request) {
      request.url = request.url.replace(/google/g, 'bing'); 
    });

It is also possible to modify the response before proxying it back to the original request by specifying an `onResponse` handler:
    
    // replace all instances of 'Apple' with 'Orange' in Techcrunch articles
    proxy.tamper(/techcrunch.com.*\/$/, function (request) {
      // gzip encoding is not supported when tampering the body
      delete request.headers['accept-encoding'];

      request.onResponse(function (response) {
        // tamper the body
        response.body = response.body.replace(/Apple/g, 'Orange');
        response.headers['server'] = 'proxy-tamper 1337';

        // complete the response
        response.complete();
      }); 
    });

The `onResponse` handler has read and write access to a subset of the `http.ClientResponse` response object, namely: `response.headers`, `response.statusCode`, and `response.url`. The `onResponse` handler may also modfiy the string representation of the response body by accessing `response.body`.

### Usage

To test the example application, simply run:

    node example.js

Then set your browser to use `127.0.0.1:8080` as the HTTP proxy, and visit the following URLs:

 * <http://google.com/block/>
 * <http://techcrunch.com/tag/apple/>

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
