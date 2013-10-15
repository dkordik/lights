#!/usr/bin/env node

var config = require("./.config.json");

var artist = process.argv[2];
var album = process.argv[3];

var googleapis = require('googleapis');
var scraper = require('scraper');

var scrapeBigArtwork = function (pageURL) {
	scraper(pageURL, function(err, jQuery) {
		if (err) {
			console.error(err);
			process.exit(1);
		}

		var artworkEl = jQuery(".artwork[width=170]");

		if (artworkEl.length != 0) {
			var bigArtURL = artworkEl[0].src.replace("170x170", "1200x1200");

			console.log('{ "url": "' + bigArtURL + '" }');
			process.exit(0);
		} else {
			console.error("No artwork found on Apple page with width of 170px");
			process.exit(1);
		}
	});
};

googleapis.discover('customsearch', 'v1').execute( function (err, client) {
	var request = client.customsearch.cse.list({
		q: album + ' by ' + artist + ' inurl:album',
		cx: config.googleSearch.CX_ITUNES_APPLE_COM
	}).withApiKey(config.googleSearch.API_KEY);

	request.execute( function (err, response) {
		if (err) {
			console.error(err);
			process.exit(1);
		} else if (!response.items || response.items.length == 0) {
			console.error("No google results.");
			process.exit(1);
		} else {
			var albumPageURL = response.items[0].link;

			scrapeBigArtwork(albumPageURL);
		}
	});
});
