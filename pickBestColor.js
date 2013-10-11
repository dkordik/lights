#!/usr/bin/env node

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

var arg = process.argv[2];
if (arg) {
	colors = JSON.parse(arg);
} else {
	console.error("You must provide colors, : '[[0,0,0],[0,0,0]]'");
	process.exit(1);
}

var bestColor = colors.sort(function (a, b) {
	return getLumSatValue(b) - getLumSatValue(a);
})[0];

if (bestColor.min() > (bestColor.max() - 5) ) {
	bestColor = [243, 166, 63];
}

console.log(bestColor);