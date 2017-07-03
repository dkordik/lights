#!/usr/bin/env node

var config = require("./.config.json");

var artist = process.argv[2];
var album = process.argv[3];

var googleapis = require('googleapis');
var cheerio = require('cheerio');
var request = require('request');

var _tryUrl = (url) => {
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
};

var logArtworkUrl = (pageURL) => {
	request(pageURL, (err, resp, body) => {
		if (err) {
			throw new Error(err);
		}

		var $ = cheerio.load(body);
		var srcSet = $("picture.product-artwork source").attr("srcset");
		var lowResImageUrl = srcSet.split(" ")[0];
		var imageUrlBase = lowResImageUrl.substring(0, lowResImageUrl.lastIndexOf("/"));

		_tryUrl(imageUrlBase + '/1500x0w.png')
			.catch(() => _tryUrl(imageUrlBase + '/1500x0w.jpg'))
			.catch(() => { throw new Error("No working images found from Apple page."); })
			.then((url) => {
				console.log('{ "url": "' + url + '" }');
				process.exit(0);
			});
	});
};

googleapis.discover('customsearch', 'v1').execute((err, client) => {
	if (err) console.error("GoogleAPIs:customsearch:v1 ERROR:", err);
	if (!client) console.error("GoogleAPIs:customsearch:v1 couldn't get client");

	var query = album + ' by ' + artist + ' inurl:album';
	var request = client.customsearch.cse.list({
		q: query,
		cx: config.itunesArtSearch.SEARCH_ENGINE_ID
	}).withApiKey(config.itunesArtSearch.API_KEY);

	request.execute((err, response) => {
		if (err) {
			throw new Error(err);
		} else if (!response.items || response.items.length == 0) {
			throw new Error("No google results for query: " + query);
		} else {
			var albumPageURL = response.items[0].link;
			logArtworkUrl(albumPageURL);
		}
	});
});
