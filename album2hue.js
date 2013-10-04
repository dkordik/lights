#!/usr/bin/env node

var exec = require('child_process').exec;

var hostname = "192.168.2.142";
var username = "newdeveloper";
var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username);

var colorConverter = require("./colorconverter").colorConverter();

var playback = require('playback');

//the node.js community is amazing... so many great libraries made my job easy.

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

var getLumSatValue = function (rgb) {
	var luminosity = rgb.max();
	var saturation = (luminosity - rgb.min()) / luminosity;
	if ( luminosity == 0 ) {
		return 0;
	} else {
		return luminosity + Math.round(saturation * 255);
	}
};

// ----------------------------------------------------
// SET HUE LIGHTS TO DOMINANT ITUNES COVER ART COLOR
// ----------------------------------------------------

var currentlyNormalLights = true;
var originalLightStates = {};

api.getFullState(function (err, config) {
	if (err) { console.log("ERROR: ", err); }
	originalLightStates = config.lights;
});

var restoreLights = function (doneCallback) {
	for (lightNum in originalLightStates) {
		var state = originalLightStates[lightNum].state;
		api.setLightState(lightNum, {
			bri: state.bri,
			xy: state.xy
		}, function(err, lights) {
			if (err) { console.log("ERROR: ", err); }
			if (doneCallback && lightNum == Object.keys(originalLightStates).length) {
				doneCallback();
			}
		});
	}
}

var updateLightsToAlbum = function () {
	if (currentlyNormalLights) {
		api.getFullState(function (err, config) {
			if (err) { console.log("ERROR: ", err); }
			originalLightStates = config.lights;
		});
		currentlyNormalLights = false;
	}
	applescript("getItunesCover.applescript", function () {
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
}

playback.on('playing', function (data) {
	console.dir(data);
	updateLightsToAlbum();
});

playback.on('paused', function (data) {
	restoreLights();
	currentlyNormalLights = true;
});

process.on('SIGINT', function () {
	process.stdout.write("\nRestoring light settings... ");
	restoreLights(function () {
		process.stdout.write("Exiting.\n");
		process.exit();
	});
});
