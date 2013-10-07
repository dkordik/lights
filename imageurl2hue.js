#!/usr/bin/env node

var exec = require('child_process').exec;

var fs = require('fs');
var request = require('request');

var hostname = "192.168.2.142";
var username = "newdeveloper";
var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username);

var colorConverter = require("./colorconverter").colorConverter();

//the node.js community is amazing... so many great libraries made my job easy.

var rb = function (cmd, next) {
	exec(__dirname + "/" + cmd, function (error, stdout, stderr) {
		if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error === null) {
			next(JSON.parse(stdout));
		} else {
			console.log('exec error: ' + error);
		}
	});
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

var getLumSatValue = function (rgb) {
	var luminosity = rgb.max();
	var saturation = (luminosity - rgb.min()) / luminosity;
	if ( luminosity == 0 ) {
		return 0;
	} else {
		return luminosity + Math.round(saturation * 255);
	}
};

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

if (process.argv[2]) {
	imageUrl = process.argv[2];
} else {
	console.log("You must provide an image URL.");
	console.dir(process.argv);
	process.exit();
}

downloadImage(imageUrl, function () {
	rb("getDominantCoverColors.rb", function (colors) {

		var bestColor = colors.sort(function (a, b) {
			return getLumSatValue(b) - getLumSatValue(a);
		})[0];

		var luminosity, color;

		if (bestColor.min() > (bestColor.max() - 5) ) {
			console.log("BLACK+WHITE=GOLD");
			luminosity = 127;
			color = { x: 0.5258, y: 0.4134 }; //GOLD
		} else {
			console.log("best color: ", bestColor);
			luminosity = bestColor.max();
			color = colorConverter.rgbToXyBri({
				r: bestColor[0]/255, g: bestColor[1]/255, b: bestColor[2]/255
			});
			color = colorConverter.xyBriForModel(color, 'LCT001');
		}

		api.setGroupLightState(0, {
			bri: luminosity,
			xy: [ color.x, color.y ]
		}, function (err, lights) {
			if (err) { console.log("ERROR: ", err); }
		});
	});
});
