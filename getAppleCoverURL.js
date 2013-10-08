#!/usr/bin/env node

var google = require('google');
var scraper = require('scraper');

var artist = process.argv[2];
var album = process.argv[3];

google("site:itunes.apple.com " + album + " by " + artist, function(err, next, links){
	if (err) { console.error(err); exit(1); }
	if (!links) {
		console.error("No google results.");
		exit(1);
	}
	scraper(links[0].href, function(err, jQuery) {
		if (err) { console.error(err); exit(1); }

		var artworkEl = jQuery(".artwork[width=170]");
		if (artworkEl.length != 0) {
			var bigArtURL = artworkEl[0].src.replace("170x170", "1200x1200");
			console.log('{ "url": "' + bigArtURL + '" }');
			exit(0);
		} else {
			console.error("No artwork found on Apple page with width of 170px");
			exit(1);
		}
	});
});