#!/usr/bin/env node

var hostname = "192.168.2.142";
var username = "newdeveloper";
var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username);

var colorConverter = require("./colorconverter").colorConverter();

var arg = process.argv[2];
if (arg) {
	// console.log("RGB2HUE, saw: ", arg);
	rgb = JSON.parse(arg);
} else {
	console.error("You must provide an rgb value, in quotes: '[0,0,0]'");
	process.exit(1);
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

// var luminosity = rgb.max();
var color = colorConverter.rgbToXyBri({
	r: rgb[0]/255, g: rgb[1]/255, b: rgb[2]/255
});
color = colorConverter.xyBriForModel(color, 'LCT001');

api.setGroupLightState(0, {
	// bri: luminosity,
	xy: [ color.x, color.y ]
}, function (err, lights) {
	if (err) { console.error("ERROR: ", err); }
});
