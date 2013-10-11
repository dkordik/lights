#!/usr/bin/env node

var exec = require('child_process').exec;

var fs = require('fs');
var request = require('request');

var sys = function (cmd, next) {
	exec(__dirname + "/" + cmd, function (error, stdout, stderr) {
		if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error === null) {
			if (next) {
				next(JSON.parse(stdout));
			}
		} else {
			console.log('exec error: ' + error);
		}
	});
}

var downloadImage = function (uri, next) {
	console.log("Grabbing image from " + uri + "...");
	request.head(uri, function (err, res, body) {
		request(uri).pipe(fs.createWriteStream(__dirname + "/.cover.png"));
		if (next) { next(); }
	});
};

// ----------------------------------------------------
// SET HUE LIGHTS TO DOMINANT COLOR OF IMAGE, BY URL
// ----------------------------------------------------

var imageUrl = process.argv[2];
if (!imageUrl) {
	console.error("You must provide an image URL.");
	process.exit();
}

downloadImage(imageUrl, function () {
	sys("getDominantCoverColors.rb", function (colors) {
		sys("pickBestColor.js '" + JSON.stringify(colors) + "'", function (color) {
			sys("rgb2hue.js '" + JSON.stringify(color) + "'");
		});
	});
});
