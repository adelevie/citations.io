var express = require('express');
var app = express();
app.use(express.bodyParser());
var walverine = require('walverine');
var _ = require('underscore');
require('citation');
var querystring = require("querystring");

var setResponseHeaders = function(response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With");
};

var formatPinCiteForURl = function(pinCite) {
  return pinCite.split(" ").join("+");
};

var makeCaseCitationUrlResolver = function(handler) {
  return function(myCaseCitation) {
    var volume = myCaseCitation.volume;
    var caseName = myCaseCitation.match.split(volume)[0];
    var pinCite = myCaseCitation.volume + myCaseCitation.match.split(volume)[1];

    return handler(pinCite, caseName);
  };
};

var casetextUrlFromCaseCitation = makeCaseCitationUrlResolver(function(pinCite, caseName) {
  var slug = formatPinCiteForURl(pinCite);
  var baseUrl = "https://casetext.com/search/?q=";
  var url = baseUrl + slug;
  return url;
});

var googleScholarResultsUrlFromCaseCitation = makeCaseCitationUrlResolver(function(pinCite, caseName) {
  var slug = querystring.stringify({foo: pinCite}).split('foo=')[1];
  var url = "http://scholar.google.com/scholar?hl=en&q=" + slug + "&btnG=&as_sdt=20006";
  return url;
});

var courtListenerUrlFromCaseCitation = makeCaseCitationUrlResolver(function(pinCite, caseName) {
  var citation = pinCite.split(" ").join("+");
  var caseName = caseName.split(" ").join("+");
  var url = "https://www.courtlistener.com/?q=citation%3A" + citation + "&case_name=" + caseName + "&stat_Precedential=on&order_by=dateFiled+desc";
  return url;
});

var callUrlResolver = function(caseCitation) {
  return function(urlResolver) {
    return {
      source: urlResolver.source,
      url: urlResolver.resolver(caseCitation)
    };
  };
};

var urlsFromCaseCitation = function(caseCitation) {
  var urlResolvers = [
    {
      source: "casetext",
      resolver: casetextUrlFromCaseCitation
    },
    {
      source: "google_scholar",
      resolver: googleScholarResultsUrlFromCaseCitation
    },
    {
      source: "courtlistener", 
      resolver: courtListenerUrlFromCaseCitation
    }
  ];
  return _.map(urlResolvers, callUrlResolver(caseCitation));
};

var getCitationsFromText = function(text) {
  var citations = Citation.find(text)['citations'];
  var walverineCitations = walverine.get_citations(text);
  walverineCitations = _.map(walverineCitations, function(citation) {
    citation.match = citation.match.split(')')[0] + ')';
    citation.type = "case";
    citation['urls'] = urlsFromCaseCitation(citation);
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

// serve underscore
serveStaticFile('/static/underscore.min.js', 'static/underscore.min.js');

app.listen(3000);
console.log('Listening on port 3000');