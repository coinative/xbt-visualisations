var Primus = require('primus');
var WebSocket = require('ws');
var maxmind = require('maxmind');
var currencyConverter = require('ecb-exchange-rates');

var BlockBroadcaster = module.exports = function (server) {
  this.primus = new Primus(server, {
    transformer: 'engine.io',
    parser: 'JSON'
  });

  maxmind.init('./geolite/GeoIPCity.dat');
}

BlockBroadcaster.prototype.start = function () {
  var coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
  var blockchainSocket = new WebSocket('wss://ws.blockchain.info/inv');

  var lastPriceUSD;
  var lastPriceGBP;
  var exchangeRate;

  coinbaseSocket.on('open', function () {
    coinbaseSocket.send(JSON.stringify({
      "type": "subscribe",
      "product_id": "BTC-USD"
    }));

    currencyConverter.getExchangeRate({
      fromCurrency: 'USD',
      toCurrency: 'GBP'
    } , function(data){
      exchangeRate = data.exchangeRate;
    });

  });

  blockchainSocket.on('open', function () {
    blockchainSocket.send(JSON.stringify({ op: 'unconfirmed_sub' }));
  });

  coinbaseSocket.on('message', function (msg) {
    var trade;
    try {
      trade = JSON.parse(msg);
    } catch (e) {}

    if (trade && trade.type === 'match' && exchangeRate) {
      lastPriceUSD = trade.price;
      lastPriceGBP = Math.round(trade.price * exchangeRate);
    }
  });

  blockchainSocket.on('message', function (json, flags) {
    // get location from IP address
    var data = JSON.parse(json);
    var location = maxmind.getLocation(data.x.relayed_by);

    if (!location || !lastPriceUSD) return;

    var amount = (data.x.out.reduce(function (memo, out) {
      return memo + parseInt(out.value, 10);
    }, 0) / 100000000);
    // create JSON object
    var payLoad = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.countryCode,
      amount: amount,
      amountGBP: Math.round((amount * lastPriceGBP)),
      amountUSD: Math.round((amount * lastPriceUSD))
    };

    // send to server
    console.log('SENDING', payLoad);
    this.primus.write(payLoad);
  }.bind(this));

  blockchainSocket.on('error', function (err) {
    console.log('ERROR', err);
    blockchainSocket.close();
  });

  blockchainSocket.on('close', function (code, message) {
    console.log('DISCONNECTED?', code, message);
    clearInterval(interval);
  });

  setInterval(function () {
    blockchainSocket.ping(null);
  }, 20000);
};
