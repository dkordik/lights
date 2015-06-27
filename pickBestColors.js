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

var arg1 = process.argv[2];
if (arg1) {
	colors = JSON.parse(arg1);
} else {
	console.error("You must provide colors, : '[[0,0,0],[0,0,0]]'");
	process.exit(1);
}

var colorsByLumSat = colors.sort(function (a, b) {
	return getLumSatValue(b) - getLumSatValue(a);
});

var whatColorAmI = function (rgb) {
	var RGB = {
		0: "R",
		1: "G",
		2: "B"
	}
	var index = rgb.indexOf( rgb.max() );
	return RGB[index];
}

var bestColor = colorsByLumSat[0];
var secondaryColor = colorsByLumSat.filter(function (color) {
	//filter to next best color that's different
	return whatColorAmI(color) != whatColorAmI(bestColor);
})[0];

if (bestColor.min() > (bestColor.max() - 5) ) {
	//if the best color is still pretty gray
	//just output GOLD

	bestColor = [243, 166, 63];
	secondaryColor = [243, 166, 63];
}

console.log(JSON.stringify([bestColor, secondaryColor]));

// console.log(colorsByLumSat.map(function (rgb) {
// 			return "\n<div style='background-color:rgb("+
// 					rgb[0]+","+rgb[1]+","+rgb[2]+
// 				")'>"+
// 				whatColorAmI(rgb)+
// 				"</div>";
// 		}).join(""));