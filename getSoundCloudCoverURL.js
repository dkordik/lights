#!/usr/bin/env node

var config = require("./.config.json");

var artist = process.argv[2];
var album = process.argv[3];

var googleapis = require('googleapis');
var cheerio = require('cheerio');
var request = require('request');

var tryResolution = (baseUrl, resolution) => {
	let url = baseUrl.replace('t500x500', resolution);

	return new Promise((resolve, reject) => {
		request({ url: url, method: 'HEAD' }).on('response', (resp) => {
			let code = resp.statusCode;
			if (code === 404) {
				reject();
			} else if (code === 200) {
				resolve(url);
			} else {
				throw new Error('Unhandled response code while trying to download image: ' + code);
			}
		});
	});
}

var getBestResolution = (baseUrl) => {
	return tryResolution(baseUrl, 'original')
		.catch(() => tryResolution(baseUrl, 't500x500'))
		.catch(() => {
			throw new Error("Found matching thumbnail, but couldn't find any working high resolution images.");
		});
};

googleapis.discover('customsearch', 'v1').execute((err, client) => {
	if (err) console.error("GoogleAPIs:customsearch:v1 ERROR:", err);
	if (!client) console.error("GoogleAPIs:customsearch:v1 couldn't get client");

	var query = 'inurl:i1.sndcdn.com/artworks ' + album + ' ' + artist;

	var request = client.customsearch.cse.list({
		q: query,
		cx: config.soundcloudArtSearch.SEARCH_ENGINE_ID,
		searchType: 'image'
	}).withApiKey(config.soundcloudArtSearch.API_KEY);

	request.execute((err, response) => {
		if (err) {
			throw new Error(err);
		} else if (!response.items || response.items.length == 0) {
			throw new Error("No google results for query: " + query);
		} else {
			var imageUrl = response.items[0].link;

			getBestResolution(imageUrl).then((bestResolutionUrl) => {
				console.log('{ "url": "' + bestResolutionUrl + '" }');
				process.exit(0);
			});
		}
	});
});
