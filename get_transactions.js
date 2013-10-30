var http = require('http');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');

var autoCurry = (function () {
  var toArray = function toArray(arr, from) {
    return Array.prototype.slice.call(arr, from || 0);
  },
  curry = function curry(fn /* variadic number of args */) {
    var args = toArray(arguments, 1);
    return function curried() {
      return fn.apply(this, args.concat(toArray(arguments)));
    };
  };
  return function autoCurry(fn, numArgs) {
    numArgs = numArgs || fn.length;
    return function autoCurried() {
      if (arguments.length < numArgs) {
        return numArgs - arguments.length > 0 ?
        autoCurry(curry.apply(this, [fn].concat(toArray(arguments))),
          numArgs - arguments.length) :
        curry.apply(this, [fn].concat(toArray(arguments)));
      }
      else {
        return fn.apply(this, arguments);
      }
    };
  };
}());

var readString = autoCurry(function readString(callback, stream) {
  var s = '';
  stream.setEncoding('utf8');
  stream.on('data', function (chunk) { s += chunk; })
    .on('error', function (err) { throw err; })
    .on('end', function () { callback(s); });
});

var parseJSON = autoCurry(function parseJSON(callback, s) {
  callback(JSON.parse(s));
});

var readJSON = _.compose(readString, parseJSON);

var transactions = [];

var time = new Date('2013-10-29').getTime();
http.get('http://blockchain.info/blocks/' + time + '?format=json', readJSON(function (data) {
  async.forEach(data.blocks, function (block, next) {
    http.get('http://blockchain.info/rawblock/' + block.hash, readJSON(function (data) {
      data.tx.forEach(function (tx) {
        transactions.push(tx);
      });
      next();
    }));
  }, function (err) {
    if (err) return console.log(err);
    console.log(transactions.length)
    fs.writeFileSync('tx.json', JSON.stringify(transactions));
  });
}));
