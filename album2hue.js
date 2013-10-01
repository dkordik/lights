#!/usr/bin/env node

var exec = require('child_process').exec;

var hostname = "192.168.2.142";
var username = "newdeveloper";
var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username);

var colorConverter = require("./colorconverter").colorConverter();

var playback = require('playback');

//the node.js community is amazing... so many great libraries made my job easy.

var lights = function (which, request) {
	LIGHTS[which].ids.forEach(function (light) {
		api.setLightState(light, request, function (err, lights) {
			if (err) { console.log("ERROR: ", err); }
		});
	});	
}

var applescript = function (script, next) {
	exec("osascript " + __dirname + "/" + script, function (error, stdout, stderr) {
		if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error !== null) { console.log('exec error: ' + error); }
		next();
	});
}

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

// ----------------------------------------------------
// SET HUE LIGHTS TO DOMINANT ITUNES COVER ART COLOR
// ----------------------------------------------------

var LIGHTS = {
	OFFICE: { ids: [ 1, 3 ], on: true },
	LIVINGROOM: { ids: [ 2, 4, 5, 6 ], on: true, bri: 0 }
}

var updateLightsToAlbum = function () {
	applescript("getItunesCover.applescript", function () {
		rb("getDominantCoverColors.rb", function (colors) {

			interestingColors = colors.filter(function (rgb) {
				var max = 255;
				var thresh = max / 2;

				atleastOneLight = rgb[0] > thresh || rgb[1] > thresh || rgb[2] > thresh;
				atleastOneDark = rgb[0] < thresh || rgb[1] < thresh || rgb[2] < thresh;

				return atleastOneLight && atleastOneDark;
			});

			var bestColor = interestingColors[0]; //TODO: smarter bestColor picking

			if (!bestColor) {
				bestColor = colors[0];
			}

			var rgb = { r: bestColor[0]/255, g: bestColor[1]/255, b: bestColor[2]/255 };

			var color = colorConverter.rgbToXyBri(rgb);
			var color = colorConverter.xyBriForModel(color, 'LCT001');

			lights("OFFICE", {
				bri: Math.round(color.bri * 255),
				xy: [ color.x, color.y ]
			});

			lights("LIVINGROOM", {
				bri: Math.round(color.bri * 255),
				xy: [ color.x, color.y ]
			});

		});
	});
}

playback.on('playing', function(data) {
	console.dir(data);
	updateLightsToAlbum();
});
