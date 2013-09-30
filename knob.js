#!/usr/bin/env node

var util = require('util');
var exec = require('child_process').exec;

var HueApi = require("node-hue-api").HueApi;

var hostname = "192.168.2.142";
var username = "newdeveloper";
var api = new HueApi(hostname, username);

var PowerMate = require('node-powermate');
var powermate = new PowerMate();

console.log("Started Hue Knob.");

var LIGHTS = {
	OFFICE: {
		ids: [ 1, 3 ],
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
		if (err) throw err;
		for (lightNum in config.lights) {
			var lightState = config.lights[lightNum].state;
			group = getGroupFromLight(lightNum);
			group.on = lightState.on;
			group.bri = lightState.bri;
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
}
powermate._brightness = 10;
powermate.setTrackedBrightness(powermate._brightness);

getLatestLightStates(); //populate initial light states
setInterval(getLatestLightStates, 6000);

var lights = function (which, request) {
	LIGHTS[which].ids.forEach(function (light) {
		api.setLightState(light, request);
	});	
}

var sys = function (command) {
	exec(command, function (error, stdout, stderr) {
		if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error !== null) {
			console.log('exec error: ' + error);
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
}

var run = function (command) {
	sys(__dirname + "/" + command)
}

var darkPowermate = false;
var buttonHoldTimeoutId;
powermate.on('buttonDown', function () {
	LIGHTS.LIVINGROOM.on = !LIGHTS.LIVINGROOM.on;
	if (LIGHTS.LIVINGROOM.on) {
		run("onWithSunTemp"); //re-use sun-temp logic
	} else {
		lights("LIVINGROOM", { on: LIGHTS.LIVINGROOM.on });
		lights("KITCHEN", { on: LIGHTS.LIVINGROOM.on });
	}
	powermate.setTrackedBrightness(100);
	clearTimeout(buttonHoldTimeoutId);
	buttonHoldTimeoutId = setTimeout(function () {
		//super dark mode
		darkPowermate = true;
		runInOffice("sleepDisplay");
		lights("OFFICE", { on: false });
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
		powermate.setTrackedBrightness(powermate._brightness + (wheelDelta * 2));
	} else {
		LIGHTS.LIVINGROOM.bri += (wheelDelta * 2);
		if (LIGHTS.LIVINGROOM.bri > 255) {
			LIGHTS.LIVINGROOM.bri = 255;
		} else if (LIGHTS.LIVINGROOM.bri < 0) {
			LIGHTS.LIVINGROOM.bri = 0;
		}
		clearTimeout(turnThrottleId);
		turnThrottleId = setTimeout(function () {
			lights("LIVINGROOM", { bri: LIGHTS.LIVINGROOM.bri });
			LIGHTS.KITCHEN.bri = LIGHTS.LIVINGROOM.bri - 75;
			if (LIGHTS.KITCHEN.bri < 0) {
				LIGHTS.KITCHEN.bri = 0;
			}
			lights("KITCHEN", { bri: LIGHTS.KITCHEN.bri });
		}, 100);
	}
});






