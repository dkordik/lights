#!/usr/bin/env node

var config = require("./.config.json");

var exec = require('child_process').exec;

var rgb = process.argv[2];
if (!rgb) {
	console.error("USAGE: activespeakers2hue.js '[r,g,b]'");
	process.exit(1);
}

var sys = function (cmd, next) {
	exec(__dirname + "/" + cmd, function (error, stdout, stderr) {
		// if (stdout) { console.log('stdout: ' + stdout); }
		if (stderr) { console.log('stderr: ' + stderr); }
		if (error === null) {
			if (next) {
				next(stdout);
			}
		} else {
			console.error('activespeakers2hue error: ' + error);
		}
	});
}

sys("getSpeakers.applescript", function (speakers) {
	speakers = speakers.replace("\n","").split(", ");
	speakers.forEach(function (speakerName) {
		sys("rgb2hue.js '" + rgb + "' '" + config.speakers2lights[speakerName] + "'");
	});
});
