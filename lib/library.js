var path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    shortid = require('shortid'),
    Track = require('../models/Track.js'),
    downloader = require('./downloader.js'),
    mp3info = require('mp3info');


var library = {

    scan: function() {
        var self = this;

        Track.find().then(function(tracks) {
            console.log('%s Checking %d tracks...', '[library]'.green, tracks.length);

            tracks.forEach(function(track) {
                track.path = self.generatePath(track);

                self.verify(track).then(function() {
                    // File checked
                }, function(error) {
                    // Error with file
                    console.log('%s %s %s - %s added', '[library]'.green, ('['+error+']').yellow, track.title, track.artist);
                    downloader.get(track).then(function() {
                        // New file downloaded
                    }, function(error) {
                        console.log('%s Error downloding file', '[library]'.green, error);
                    });
                });
            });
        });
    },

    add: function(title, artist, album) {
        var self = this;

        return new Promise(function(resolve, reject) {
            // Check if song is already included
            Track.findOne({ title: title, artist: artist }).then(function(result) {

                if (result) {
                    // Track already exists
                    console.log('%s %s - %s found in library', '[library]'.green, title, artist);

                    resolve(result);
                    return;
                }

                console.log('%s Adding %s - %s', '[library]'.green, title, artist);

                // Create object
                var track = new Track({
                        _id: shortid.generate(),
                        title: title,
                        artist: artist,
                        album : {
                            title: album
                        }
                    });
                
                track.path = self.generatePath(track);

                downloader.get(track).then(function(mp3Path) {
                    console.log('%s %s - %s added', '[library]'.green, track.title, track.artist);

                    // Get track duration
                    console.log(mp3Path);
                    mp3info(mp3Path).then(function(data) {
                        console.log('mp3 data', data);
                    }, function(error) {
                        console.log('mp3 error', error);
                    })

                    track.save();
                    resolve(track);
                }, function(error) {
                    console.log('%s Error downloding file - %s', '[library]'.green,  error);
                    reject(error);
                });

            });
        });
    },

    verify: function(track) {
        var self = this;

        return new Promise(function(resolve, reject) {

            // Do we have the track?
            fs.exists(track.path, function(exists) { 
                if (exists) { 
                    resolve();
                } else {
                    reject('File not found');
                }
            });

        });
    },


    generatePath: function(track) {
        return path.join(global.__base, 'data', 'music', track._id + '.mp3');
    }

}

library.scan();

module.exports = library;