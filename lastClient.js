#!/usr/bin/env node

var exec = require("child_process").exec;

var lastClientId = "computer-lastclientchecker";

exec(__dirname + "/get", function (error, stdout, stderr) {
	var clientList = JSON.parse(stdout).config.whitelist;
	var mostRecentUseDate = new Date(0);
	var mostRecentClient = "";
	for (apiKey in clientList) {
		client = clientList[apiKey];
		clientDate = new Date(client["last use date"]);
		if (mostRecentUseDate < clientDate
			&& apiKey != lastClientId && apiKey.indexOf("-sync") == -1) {
			mostRecentUseDate = clientDate;
			mostRecentClient = apiKey;
			//console.log(client["name"], "is now newest");
		}
		//console.log(clientList[apiKey].name);
	}
	console.log(mostRecentClient);
});


