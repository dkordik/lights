#!/usr/bin/env node

let util = require('util'),
	exec = require('child_process').exec,
	http = require('http'),
	fs = require('fs'),

	PowerMate = require('../node-powermate');

//the main

const POWERMATE_IDS = {
	LIGHT_SWITCH: 'Griffin PowerMate@fd131340'
}

let testLights = [0];

testLights.map(i => {
	return new PowerMate(i);
}).forEach(p => {
	if (p.path.includes(POWERMATE_IDS.LIGHT_SWITCH)) {
		setupLightSwitch(p);
	}
});


//the bits

function setupLightSwitch(powermate) {
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

	console.log("Started Hue Knob.");
	console.log("loaded settings...", settings);
	console.log("username:", username);

	powermate.setBrightness(0); //lights off!

	var LIGHTS = {
		on: true,
		bri: 0
	}

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

	var run = function (command) {
		sys(__dirname + "/" + command)
	};

	powermate.on('buttonDown', function () {
		LIGHTS.on = !LIGHTS.on;
		if (LIGHTS.on) {
			run("onWithSunTemp 50"); //re-use sun-temp logic
		} else {
			hue.group(localGroup, { on: false });
		}
	});

	var turnThrottleId;
	powermate.on('wheelTurn', function (wheelDelta) {
		if (LIGHTS.on) {
			LIGHTS.bri += (wheelDelta * 4);
			if (LIGHTS.bri > 255) {
				LIGHTS.bri = 255;
			} else if (LIGHTS.bri < 1) {
				LIGHTS.bri = 1;
			}

			clearTimeout(turnThrottleId);
			turnThrottleId = setTimeout(function () {
				hue.group(localGroup, { bri: LIGHTS.bri });
			}, 50);
		}
	});
}

//the rest

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Uncaught exception... CRASH!");
  process.exit(1);
});
