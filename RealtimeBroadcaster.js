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
  var ws = new WebSocket('ws://ws.blockchain.info/inv');

  ws.on('open', function () {
    ws.send(JSON.stringify({ op: 'unconfirmed_sub' }));
  });

  ws.on('message', function (json, flags) {
    // get location from IP address
    var data = JSON.parse(json);
    var location = maxmind.getLocation(data.x.relayed_by);

    if (!location) return;

    // create JSON object
    var payLoad = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.countryCode,
      amount: data.x.out.reduce(function (memo, out) {
        return memo + parseInt(out.value, 10);
      }, 0) / 100000000
    };

    // send to server
    console.log('SENDING', payLoad);
    this.primus.write(payLoad);
  }.bind(this));

  ws.on('error', function (err) {
    console.log('ERROR', err);
    ws.close();
  });

  ws.on('close', function (code, message) {
    console.log('DISCONNECTED?', code, message);
    clearInterval(interval);
  });

  setInterval(function () {
    ws.ping(null);
  }, 20000);
};
