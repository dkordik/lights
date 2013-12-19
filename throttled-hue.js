#!/usr/bin/env node

request = require("superagent");

var ThrottledHue = function (opts) {
	this.ip = opts.ip;
	this.key = opts.key;
	this.interval = opts.interval || 800;
	this.throttled = opts.throttled || false;

	this.queuedAction = [];

	if (this.throttled) {
		this.startLoop();
	}
};

ThrottledHue.prototype.put = function (urlSuffix, data) {
	console.log('PUT', 'http://' + this.ip + '/api/' + this.key + '/' + urlSuffix);
	request('PUT', 'http://' + this.ip + '/api/' + this.key + '/' + urlSuffix)
	.send(data).end(function (err, res) {
		if (err) {
			switch (err.code) {
				case "ECONNRESET":
					console.error("hue hub killed connection");
				break;
				default:
				console.error("Some other error:", err);
			}
		}
	});
};

//T=require("./throttled-hue.js"); t = new T({ip:"192.168.2.142", key:"newdeveloper"});

ThrottledHue.prototype.light = function (num, data) {
	this.queue('put', 'lights/' + num + '/state', data);
}

ThrottledHue.prototype.group = function (num, data) {
	this.queue('put', 'groups/' + num + '/action', data);
}

ThrottledHue.prototype.queue = function (action, url, data) {
	if (this.throttled) {
		if (this.queuedAction.length == 0) {
			ThrottledHue.prototype[action].call(this, url, data);
			action = "skip";
		}
		this.queuedAction = [action, url, data];
	} else {
		ThrottledHue.prototype[action].call(this, url, data);
	}
}

ThrottledHue.prototype.startLoop = function () {
	var self = this; //setInterval, Y U NO support .call/apply?
	this.loopId = setInterval(function () {
		if (self.queuedAction.length == 0) return;
		if (self.queuedAction[0] == "skip") {
			self.queuedAction.length = 0;
			return;
		}

		ThrottledHue.prototype[self.queuedAction[0]].apply(self, self.queuedAction.splice(1));

		self.queuedAction.length = 0;
	}, this.interval)
}

ThrottledHue.prototype.stopLoop = function () {
	if (this.loopId) {
		clearInterval(this.loopId);
	}
}

module.exports = ThrottledHue;
