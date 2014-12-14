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
    async.eachSeries(body.entities, function(entity, nextEntity) {
      console.log(entity.text);
      request.get({ uri: "http://developer.echonest.com/api/v4/song/search", json: true, useQuerystring: true, qs: {
        api_key: process.env.ECHONEST_API_KEY,
        title: entity.text,
        sort: "song_hotttness-desc",
        bucket: ["id:spotify", "tracks"]
      } }, function(error, response, body) {
        if (error) return nextEntity(error);
        var tracks = body.message.body.track_list;
        if (tracks.length < 1) return nextEntity("no tracks");
        async.eachSeries(tracks, function(track, nextTrack) {
          console.log(track.track.track_spotify_id);
          request({
            uri: "https://api.spotify.com/v1/tracks/" + track.track.track_spotify_id,
            json: true
          }, function(error, response, body) {
            console.log(error, body.preview_url);
            if (error) return nextTrack(error);
            previewURL = body.preview_url;
            if (previewURL) {
              console.log(track.track.track_name);
              nextTrack("done");
            } else {
              nextTrack();
            }
          });
        }, function(error) {
          nextEntity(error);
        });
      });
    }, function(error) {
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
