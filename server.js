var http = require('http');
var express = require('express');
var BlockListener = require('./BlockBroadcaster');

var app = express();
var port = 3000;
var htmlDir = './public';

app.use("/", express.static(htmlDir));

var server = http.createServer(app);
var listener = new BlockListener(server);

server.on('listening', function () {
  listener.start();
});
server.listen(port);
console.log('app is up and serving pages in', htmlDir);
