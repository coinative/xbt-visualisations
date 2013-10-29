var Primus = require('primus');
var WebSocket = require('ws');
var maxmind = require('maxmind');

var BlockBroadcaster = module.exports = function (server) {
  this.primus = new Primus(server, {
    transformer: 'engine.io',
    parser: 'JSON'
  });

  maxmind.init('./GeoLiteCity.dat');
}

BlockBroadcaster.prototype.start = function () {
  var self = this;
  var ws = new WebSocket('ws://ws.blockchain.info/inv');

  ws.on('open', function () {
    ws.send(JSON.stringify({ op: 'unconfirmed_sub' }));
  });

  ws.on('message', function (json, flags) {
    // get location from IP address
    var data = JSON.parse(json);
    var location = maxmind.getLocation(data.x.relayed_by);

    if (!location) return;
    /*var location = {
      latitude: 51.50722,
      longitude: -0.12750,
      city: 'London',
      countryCode: 'GB'
    };*/

    // create JSON object
    var payLoad = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.countryCode
    };

    // send to server
    console.log('SENDING', payLoad);
    self.primus.write(payLoad);
  });

  ws.on('error', function (err) {
    console.log('ERROR', err);
    ws.close();
  });

  ws.on('close', function (code, message) {
    console.log('DISCONNECTED?', code, message);
    clearInterval(interval);
  });

  setInterval(function () {
    //self.primus.write('hello');
    ws.ping(null);
  }, 20000);
};
