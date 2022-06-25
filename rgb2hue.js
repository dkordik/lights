#!/usr/bin/env node

var HOSTNAME = require('./readHubIp')();
var USERNAME = "newdeveloper";

const setGroupLightState = ({ groupId, state }) => {
  // return require("node-hue-api").discovery.nupnpSearch()
  //   .then((searchResults) => {
  //     const host = searchResults[0].ipaddress;
  //     console.log('found hub dynamically, nice.', host);
  const host = HOSTNAME;
  return require("node-hue-api").v3.api.createLocal(host).connect(USERNAME)
    // })
    .then((api) => {
      return api.groups.setGroupState(groupId, state);
    })
    .then((result) => {
      console.log(`Light state change was successful? ${result}`);
    })
};


var rgbArg = process.argv[2];
var lightGroup = process.argv[3] || 0;

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
console.log('rgb', rgb);

function toXY([ r, g, b ]) {
    //Gamma correctie
    red = (r > 0.04045) ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92);
    green = (g > 0.04045) ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92);
    blue = (b > 0.04045) ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92);

    //Apply wide gamut conversion D65
    var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
    var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
    var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

    var fx = X / (X + Y + Z);
    var fy = Y / (X + Y + Z);

	if (isNaN(fx)) {
        fx = 0.0;
    }
    if (isNaN(fy)) {
        fy = 0.0;
    }

    return {
		x: fx,
		y: fy,
		bri: Math.max(r, g, b) / 255
	};
}

// Old bulb colors
// var colorConverter = require("./colorconverter").colorConverter();
// var color = colorConverter.rgbToXyBri({
// 	r: rgb[0]/255, g: rgb[1]/255, b: rgb[2]/255
// });
// color = colorConverter.xyBriForModel(color, 'LCT001');
var color = toXY(rgb);

console.log('color: ', color);

var state = {
	xy: [ color.x, color.y ]
};

var ignoreLuminosityArg = process.argv[4];
if (!ignoreLuminosityArg) {
	state.bri = luminosity || 1;
}
console.log('setting light group state', lightGroup, state);
setGroupLightState({ groupId: lightGroup, state }).catch((err) => {
	console.error("ERROR: ", err);
});
