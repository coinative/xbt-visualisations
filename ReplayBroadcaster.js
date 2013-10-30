var Primus = require('primus');
var WebSocket = require('ws');
var maxmind = require('maxmind');
var fs = require('fs');

var ReplayBroadcaster = module.exports = function (server) {
  this.primus = new Primus(server, {
    transformer: 'engine.io',
    parser: 'JSON'
  });
  this.txs = JSON.parse(fs.readFileSync('tx.json'));
  /*console.log(this.txs.reduce(function (memo, tx) {
    return memo + tx.out.reduce(function (memo, out, n) {
      if (n == tx.out.length - 2) {
        return memo;calc
      }
      return memo + parseInt(out.value, 10);
    }, 0);
  }, 0));*/
  maxmind.init('./GeoLiteCity.dat');
}

ReplayBroadcaster.prototype.start = function () {
  var interval = setInterval(function () {
    if (this.txs.length === 0) {
      return clearInterval(interval);
    }
    var tx = this.txs.pop();
    var location = maxmind.getLocation(tx.relayed_by);

    if (!location) return;

    var payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.countryCode,
      amount: tx.out.reduce(function (memo, out) {
        return memo + parseInt(out.value, 10);
      }, 0) / 100000000
    };

    console.log('SENDING', payload);
    this.primus.write(payload);
  }.bind(this), 1);
};
