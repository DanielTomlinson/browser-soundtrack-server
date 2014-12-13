var request = require("request");
var express = require("express");
var async = require("async");

var getSongURL = function(pageURL, callback) {
  request.get({ uri: "http://access.alchemyapi.com/calls/url/URLGetRankedNamedEntities", json: true, qs: {
    apikey: process.env.ALCHEMY_API_KEY,
    outputMode: "json",
    url: pageURL
  } }, function (error, response, body) {
    if (error) return callback(error);
    if (!body.hasOwnProperty("entities")) return callback("invalid alchemy response");
    if (body.entities.length < 1) return callback("no entities");
    var previewURL = null;
    async.each(body.entities, function(entity, callback) {
      console.log(entity.text);
      request.get({ uri: "http://api.musixmatch.com/ws/1.1/track.search", json: true, qs: {
        apikey: process.env.MUSIXMATCH_API_KEY,
        q: entity.text,
        // s_track_rating: "desc"
      } }, function(error, response, body) {
        if (error) return callback(error);
        var tracks = body.message.body.track_list;
        if (tracks.length < 1) return callback("no tracks");
        async.each(tracks, function(track, callback) {
          console.log(track.track.track_spotify_id);
          request({
            uri: "https://api.spotify.com/v1/tracks/" + track.track.track_spotify_id,
            json: true
          }, function(error, response, body) {
            console.log(error, body.preview_url);
            if (error) return callback(error);
            previewURL = body.preview_url;
            if (previewURL) {
              console.log("calling back done")
              callback("done");
            } else {
              callback();
            }
          });
        }, callback);
      });
    }, function(error) {
      console.log("got callback: " + error);
      if (error == "done") {
        callback(null, previewURL);
      } else {
        callback(error);
      }
    });
  });
};

var app = express();

app.get("/", function(req, res) {
  res.send();
});

app.get("*/*", function(req, res) {
  getSongURL(req.originalUrl.substring(1), function(error, url) {
    if (error) {
      console.log(error);
      res.status(500).send();
    } else {
      res.send(url);
    }
  });
});

app.listen(process.env.PORT);
