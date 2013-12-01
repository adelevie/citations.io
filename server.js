var express = require('express');
var app = express();
app.use(express.bodyParser());
var walverine = require('walverine');
var _ = require('underscore');
require('citation');

var setResponseHeaders = function(response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With");
};

var getCitationsFromText = function(text) {
  var citations = Citation.find(text)['citations'];
  var walverineCitations = walverine.get_citations(text);
  walverineCitations = _.map(walverineCitations, function(citation) {
    citation.match = citation.match.split(')')[0] + ')';
    return citation;
  });
  results = citations.concat(walverineCitations);
  return results;
};

// serve citations api
app.post('/citation/find', function(request, response) {
  setResponseHeaders(response);
  var text = request.body.text;
  var citations = getCitationsFromText(text);
  response.send(citations);
});

var serveStaticFile = function(route, path) {
  app.get(route, function(request, response) {
    response.sendfile(path);
  });
};

// serve home page
serveStaticFile('/', 'static/index.html');

// serve client.js
serveStaticFile('/static/client.js', 'static/client.js');

// serve jquery
serveStaticFile('/static/jquery.min.js', 'static/jquery.min.js');

app.listen(3000);
console.log('Listening on port 3000');