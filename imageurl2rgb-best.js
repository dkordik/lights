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
		var imageStream = fs.createWriteStream(__dirname + "/.cover.png");
		imageStream.on("close", function () {
			if (next) { next(); }
		})
		request(uri).pipe(imageStream);
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
		// console.log("dominant colors:", colors.map(function (rgb) {
		// 	return "\n<div style='background-color:rgb("+
		// 			rgb[0]+","+rgb[1]+","+rgb[2]+
		// 		")'></div>";
		// }).join(""));
		sys("pickBestColor.js '" + JSON.stringify(colors) + "'", function (color) {
			console.log(color);
		});
	});
});
