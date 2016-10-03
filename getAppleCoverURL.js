#!/usr/bin/env node

var config = require("./.config.json");

var artist = process.argv[2];
var album = process.argv[3];

var googleapis = require('googleapis');
var cheerio = require('cheerio');
var request = require('request');

var tryResolution = (baseUrl, resolution) => {
	let url = baseUrl.replace(/[0-9]{3}x[0-9]{3}/, resolution);

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

var getValidArtwork = (baseUrl) => {
	return tryResolution(baseUrl, '1200x1200')
		.catch(() => tryResolution(baseUrl, '600x600'))
		.catch(() => {
			throw new Error("Found matching thumbnail, but couldn't find any working high resolution images.");
		});
};

var scrapeBigArtwork = (pageURL) => {
	request(pageURL, (err, resp, body) => {
		if (err) {
			throw new Error(err);
		}

		var $ = cheerio.load(body);
		var artworkEl = $(".artwork[width=170]");

		if (artworkEl.length != 0) {
			let baseUrl = artworkEl.attr("src-swap-high-dpi");
			getValidArtwork(baseUrl).then((artUrl) => {
				console.log('{ "url": "' + artUrl + '" }');
				process.exit(0);
			}).catch(() => {
				throw new Error("No images found from baseUrl: " + baseUrl);
			});
		} else {
			throw new Error("No matching artwork found on Apple page");
		}
	});
};

googleapis.discover('customsearch', 'v1').execute((err, client) => {
	var query = album + ' by ' + artist + ' inurl:album';
	var request = client.customsearch.cse.list({
		q: query,
		cx: config.googleSearch.CX_ITUNES_APPLE_COM
	}).withApiKey(config.googleSearch.API_KEY);

	request.execute((err, response) => {
		if (err) {
			throw new Error(err);
		} else if (!response.items || response.items.length == 0) {
			throw new Error("No google results for query: " + query);
		} else {
			var albumPageURL = response.items[0].link;

			scrapeBigArtwork(albumPageURL);
		}
	});
});
