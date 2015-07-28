var http = require('http');
var express = require('express');
var RealtimeBroadcaster = require('./RealtimeBroadcaster');
var ReplayBroadcaster = require('./ReplayBroadcaster');

var app = express();
var port = 3000;
var htmlDir = './public';

app.use("/", express.static(htmlDir));

var server = http.createServer(app);

server.on('listening', function () {
  if (process.argv[2] === 'replay') {
    new ReplayBroadcaster(server).start();
  } else {
    new RealtimeBroadcaster(server).start();
  }
});
server.listen(port);
console.log('app is up and serving pages in', htmlDir, port);
