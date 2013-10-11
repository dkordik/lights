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
	currentlyNormalLights = true;
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
		sys("getDominantCoverColors.rb", function (colors) {

			var bestColor = colors.sort(function (a, b) {
				return getLumSatValue(b) - getLumSatValue(a);
			})[0];

			if (bestColor.min() > (bestColor.max() - 5) ) {
				console.log("BLACK+WHITE=GOLD");
				bestColor = [243, 166, 63];
			} else {
				console.log("best color: ", bestColor);
			}

			sys("rgb2hue.js '[" + bestColor + "]'")
		});
	});
}

playback.on('playing', function (data) {
	console.dir(data);
	updateLightsToAlbum();
});

playback.on('paused', function (data) {
	restoreLights();
});

process.on('SIGINT', function () {
	process.stdout.write("\nRestoring light settings... ");
	restoreLights(function () {
		process.stdout.write("Exiting.\n");
		process.exit();
	});
});
