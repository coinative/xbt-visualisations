var APP = {
  init: function () {
    if(System.support.webgl === false){
      var message = document.createElement('div');
      message.style.cssText = 'font-family:monospace;font-size:13px;text-align:center;color:#fff;background:#333;padding:1em;width:540px;margin:30em auto 0';
      message.innerHTML = 'Either your graphics card or your browser does not support WebGL.<br /><a href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">View a list</a> of WebGL compatible browsers.';
      document.body.appendChild(message);
      document.body.style.background = '#000000';
      return;
    }

    var container = document.getElementById('container');
    var globe = new DAT.Globe(container);
    var data = [];
    var cumulativeTotal = 0;
    var changed = false;

    setInterval(function () {
      if (!changed) return;
      changed = false;
      data.sort(function (a, b) {
        return a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0;
      });
      d3Graphs.drawBarGraph(data, cumulativeTotal);
    }, 500)

    var primus = Primus.connect();
    primus.on('data', function (tx) {
      highlightCountry(tx.country,  tx.amount);
      incSpike(tx.latitude, tx.longitude);

      var country = _.find(data, function (d) {
        return d.country === tx.country;
      });

      if (!country) {
        country = { country: tx.country, amount: 0 };
        data.push(country);
      }

      changed = true;

      country.amount += Math.round(tx.amount * 130);
      //console.log(tx.country, country.amount);
      cumulativeTotal += Math.round(tx.amount * 130);
      //d3Graphs.drawBarGraph(data, cumulativeTotal);


      /*data[key].count++;


      var points = [];
      _.each(data, function (place) {
        points.push(place.latitude);
        points.push(place.longitude);
        points.push(0.1 * Math.log(place.count));
      });

      globe.addData(points, { format: 'magnitude' });
      globe.removeData();
      globe.createPoints();*/
    });

    globe.animate();
  }
};
