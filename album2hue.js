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

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

var getLS = function (rgb) {
	var l = rgb.max(); //luminosity
	var s = (l - rgb.min()) / l; //saturation
	if ( l == 0 ) {
		return 0;
	} else {
		return l + Math.round(s * 255);
	}
};

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

			var bestColor = colors.sort(function (a, b) {
				return getLS(b) - getLS(a);
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

			lights("OFFICE", {
				bri: luminosity,
				xy: [ color.x, color.y ]
			});

			lights("LIVINGROOM", {
				bri: luminosity,
				xy: [ color.x, color.y ]
			});

		});
	});
}

playback.on('playing', function(data) {
	console.dir(data);
	updateLightsToAlbum();
});
