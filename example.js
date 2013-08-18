var proxy = require('./lib/proxy-tamper').start({port: 8080});

// block all URLs that contain 'block' in them
proxy.tamper(/block/, 'This content is blocked!');

// disallow Google 
proxy.tamper(/google/, function (request) {
  request.url = request.url.replace(/google/g, 'bing'); 
}); 

// replace all instances of 'Apple' with 'Orange' in Techcrunch articles
proxy.tamper(/techcrunch.com.*\/$/, function (request) {
  console.log('tampering ' + request.url);

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
