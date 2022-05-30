readHubIp = function() {
    var fs = require('fs');

    var contents = fs.readFileSync(
        __dirname + '/_hub_IP',  { encoding: "utf8" }
    );

    return contents.trim();
}

module.exports = readHubIp;
