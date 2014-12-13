var request = require("request");
var express = require("express");

var getSongURL = function (pageURL, callback) {
  request.get({ uri: "http://api.diffbot.com/v3/analyze", json: true, qs: {
    token: process.env.DIFFBOT_TOKEN,
    url: pageURL,
    fields: "tags"
  } }, function (error, response, body) {
    if (error) return callback(error);
    if (body.objects.length < 1) return callback("no objects");
    console.log(body.objects[0].tags);
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
