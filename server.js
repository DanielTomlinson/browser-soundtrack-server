var request = require("request");
var express = require("express");

var getSongURL = function (pageURL, callback) {
  request.get({ uri: "http://access.alchemyapi.com/calls/url/URLGetRankedNamedEntities", json: true, qs: {
    apikey: process.env.ALCHEMY_API_KEY,
    url: pageURL
  } }, function (error, response, body) {
    if (error) return callback(error);
    if (body.entities.length < 1) return callback("no entities");
    console.log(body.entities.map(function(x) { return x.name }));
    callback(null);
  });
};

var app = express();

app.get("*/*", function (req, res) {
  getSongURL(req.originalUrl.substring(1), function(error, url) {
    if (error) {
      res.status(500).send();
    } else {
      res.send(url);
    }
  });
});

app.listen(process.env.PORT);
