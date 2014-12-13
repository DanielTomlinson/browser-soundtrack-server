var request = require("request");
var express = require("express");

var getSongURL = function (pageURL, callback) {
  request.get({ uri: "http://access.alchemyapi.com/calls/url/URLGetRankedNamedEntities", json: true, qs: {
    apikey: process.env.ALCHEMY_API_KEY,
    outputMode: "json",
    url: pageURL
  } }, function (error, response, body) {
    if (error) return callback(error);
    console.log(body);
    if (body.entities.length < 1) return callback("no entities");
    console.log(body.entities.map(function(x) { return x.name }));
    request.get({ uri: "http://api.musixmatch.com/ws/1.1/track.search", json: true, qs: {
      apikey: process.env.MUSIXMATCH_API_KEY,
      q: body.entities[0].text,
      s_track_rating: "desc"
    } }, function(error, response, body) {
      if (error) return callback(error);
      console.log(body);
      var tracks = body.message.body.track_list;
      if (tracks.length < 1) return callback("no tracks");
      request({ uri: "https://api.spotify.com/v1/tracks/" + tracks[0].track.track_spotify_id, json: true }, function(error, response, body) {
        console.log(body);
        if (error) return callback(error);
        callback(null, body.preview_url);
      });
    });
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
