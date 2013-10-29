#!/usr/bin/env node

var hostname = "192.168.2.142";
var username = "newdeveloper";
var HueApi = require("node-hue-api").HueApi;
var api = new HueApi(hostname, username);

var colorConverter = require("./colorconverter").colorConverter();

var rgbArg = process.argv[2];
if (rgbArg) {
	// console.log("RGB2HUE, saw: ", rgbArg);
	rgb = JSON.parse(rgbArg);
} else {
	console.error("You must provide an rgb value, in quotes: '[0,0,0]'");
	process.exit(1);
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

var luminosity = rgb.max();
var color = colorConverter.rgbToXyBri({
	r: rgb[0]/255, g: rgb[1]/255, b: rgb[2]/255
});
color = colorConverter.xyBriForModel(color, 'LCT001');

var state = {
	xy: [ color.x, color.y ]
};

var lightGroup = process.argv[3] | 0;

var ignoreLuminosityArg = process.argv[4];
if (!ignoreLuminosityArg) {
	state.bri = luminosity;
}

api.setGroupLightState(lightGroup, state, function (err, lights) {
	if (err) { console.error("ERROR: ", err); }
});
