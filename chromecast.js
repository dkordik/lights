#!/usr/bin/env node

var chromecast = require('chromecast')();

chromecast.on('device', function(device){

  device.launch(process.argv[2] || 'ChromeCast', {
    v: process.argv[3] || "release-9e8c585405ea9a5cecd82885e8e35d28a16609c6"
  }).then(function(){
    console.log('Sent to TV!');
  }, function(err){
    console.error('Something Went Wrong: ', err);
  })

});

chromecast.discover();