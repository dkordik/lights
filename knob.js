#!/usr/bin/env node

var util = require('util');
var exec = require('child_process').exec;
var http = require('http');
var fs = require('fs');

require('longjohn'); //long stack traces

var settingsFile = fs.readFileSync(
	__dirname + "/_localsettings", { encoding:"utf8" }
);
var settings = {};
settingsFile.split("\n").forEach(function (s) {
	var kv = s.split("=");
	settings[kv[0]] = kv[1] && kv[1].replace(/\"/g,'');
});

var hostname = "192.168.2.142";
var username = settings.LOCAL_ID || "newdeveloper";

var localGroup = settings.LOCAL_GROUP || 1;

var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username + "-sync");

var ThrottledHue = require('./throttled-hue.js');
var hue = new ThrottledHue({
	ip: hostname,
	key: username,
	interval: 600,
	throttled: false
});

var PowerMate = require('node-powermate');
var powermate = new PowerMate();

console.log("Started Hue Knob.");
console.log("loaded settings...", settings);
console.log("username:", username);

var LIGHTS = {
	OFFICE: {
		ids: [ 8, 9 ],
		on: true
	},
	LIVINGROOM: {
		ids: [ 2 ],
		on: true,
		bri: 0
	},
	KITCHEN: {
		ids: [ 4, 5, 6 ],
		bri: 0
		//follows LIVINGROOM on state
	}
}

var getGroupFromLight = function (lightNum) {
	for (group in LIGHTS) {
		if (LIGHTS[group].ids.indexOf( Number(lightNum) ) > -1) {
			return LIGHTS[group];
		}
	}
};

var getLatestLightStates = function () {
	api.getFullState(function (err, config) {
		if (err) {
			console.error(new Date() + " -- " + err);
		} else {
			for (var lightNum in config.lights) {
				var lightState = config.lights[lightNum].state;
				group = getGroupFromLight(lightNum);
				group.on = lightState.on;
				group.bri = lightState.bri;
			}
		}
	});
	if (LIGHTS.LIVINGROOM.on) {
		powermate.setTrackedBrightness(0);
	}
};


powermate.setTrackedBrightness = function (val) {
	if (val < 0) val = 0;
	if (val > 255) val = 255;
	powermate.setBrightness(val);
	powermate._brightness = val;
};
powermate._brightness = 10;
powermate.setTrackedBrightness(powermate._brightness);

getLatestLightStates(); //populate initial light states
setInterval(getLatestLightStates, 6000);

var sys = function (command) {
	exec(command, function (error, stdout, stderr) {
		if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error !== null) {
			console.error('exec error: ' + error
				+ "(attempted command -->"+ command + "<--)");
		}
	});
}

var runInOffice = function (command, isGlobal) {
	var OFFICE_ROOT = "/Users/dkordik/Documents/code/lights";
	var fullCommand =
		'ssh dkordik@192.168.2.4 "'
		+ (isGlobal ? command : OFFICE_ROOT + '/' + command)
		+ '"';
	sys(fullCommand);
};

var run = function (command) {
	sys(__dirname + "/" + command)
};

var darkPowermate = false;
var buttonHoldTimeoutId;
powermate.on('buttonDown', function () {
	LIGHTS.LIVINGROOM.on = !LIGHTS.LIVINGROOM.on;
	if (LIGHTS.LIVINGROOM.on) {
		run("onWithSunTemp " + powermate._brightness); //re-use sun-temp logic
	} else {
		hue.group(localGroup, { on: false });
	}
	powermate.setTrackedBrightness(50);
	clearTimeout(buttonHoldTimeoutId);
	buttonHoldTimeoutId = setTimeout(function () {
		//super dark mode
		darkPowermate = true;
		runInOffice("sleepDisplay");
		hue.group(4, { on: false });
	}, 2000);
});

powermate.on('buttonUp', function () {
	if (darkPowermate) {
		powermate.setTrackedBrightness(0);
		darkPowermate = false;
	} else {
		if (LIGHTS.LIVINGROOM.on) {
			powermate.setTrackedBrightness(0);
		} else {
			powermate.setTrackedBrightness(1);
		}
	}
	clearTimeout(buttonHoldTimeoutId);
});

var turnThrottleId;
powermate.on('wheelTurn', function (wheelDelta) {
	if (LIGHTS.LIVINGROOM.on == false) {
		powermate.setTrackedBrightness(powermate._brightness + (wheelDelta * 4));
	} else {
		LIGHTS.LIVINGROOM.bri += (wheelDelta * 4);
		if (LIGHTS.LIVINGROOM.bri > 255) {
			LIGHTS.LIVINGROOM.bri = 255;
		} else if (LIGHTS.LIVINGROOM.bri < 1) {
			LIGHTS.LIVINGROOM.bri = 1;
		}

		clearTimeout(turnThrottleId);
		turnThrottleId = setTimeout(function () {

			LIGHTS.KITCHEN.bri = LIGHTS.LIVINGROOM.bri - 75;
			if (LIGHTS.KITCHEN.bri < 1) {
				LIGHTS.KITCHEN.bri = 1;
			};
			hue.group(localGroup, { bri: LIGHTS.LIVINGROOM.bri });
		}, 100);
	}
});

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Uncaught exception... CRASH!");
  process.exit(1);
});
