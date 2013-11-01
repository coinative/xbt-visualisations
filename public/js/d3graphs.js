APP.d3Graphs = function () {
  var _barGraphWidth = 300;
  var _barGraphHeight = 700;
  var _barWidth = 14;
  var _barGraphTopPadding = 20;
  var _barGraphBottomPadding = 50;
  var _barGraphSVG = d3.select('body').append('svg').attr('id', 'barGraph');

  function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
      var suffixes = ["", "K", "M", "B", "T"];
      var suffixNum = Math.floor(("" + value).length / 3);
      var shortValue = '';
      for (var precision = 3; precision >= 1; precision--) {
        shortValue = parseFloat((suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));
        var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
        if (dotLessShortValue.length <= 3) {
          break;
        }
      }
      if (shortValue % 1 != 0) shortNum = shortValue.toFixed(1);
      newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
  }

  function setupGraph() {
    _barGraphSVG
      .attr('id', 'barGraph')
      .attr('width', _barGraphWidth)
      .attr('height', _barGraphHeight)
      .attr('class', 'overlayCountries noPointer');
  }

  function createBars(data, yScale) {
    var rects = _barGraphSVG
      .selectAll('rect.totals')
      .data(data);

    var yTotal = 0
    rects.enter().append('rect').attr('style', function (d) {
      var country = highlightedCountries[d.country];
      return 'fill: hsl(' + (240 - country.h) + ', 50%, 50%); stroke: rgb(0, 0, 0);';
    }).attr('x', 0).attr('width', _barWidth);

    rects.attr('y', function (d) {
      var value = _barGraphHeight - _barGraphBottomPadding - yTotal - yScale(d.amount);
      yTotal += yScale(d.amount);
      return value;
    }).attr('height', function (d) {
      return yScale(d.amount);
    });
  }

  function createSmallLabel(label) {
    label.append('text').text(function(d) {
      return '£' + abbreviateNumber(d.amount);
    }).attr('text-anchor', 'end').attr('alignment-baseline', 'central').attr('font-size', function(d) {
      return 10;
    });
  }

  function createMediumLabel(label) {
    label.append('text').text(function(d) {
      return '£' + abbreviateNumber(d.amount);
    }).attr('text-anchor', 'end').attr('font-size', function(d) {
      return 15;
    });
    label.append('text').text(function(d) {
      return d.country;
    }).attr('text-anchor', 'end').attr('y', 15).attr('font-size', function (d) {
      return 7;
    });
  }

  function createLargeLabel(label) {
    label.append('text').text(function(d) {
      console.log(abbreviateNumber(d.amount));
      return '£' + abbreviateNumber(d.amount);
    }).attr('text-anchor', 'end').attr('font-size', function(d) {
      return 20;
    }).attr('y', -7);
    label.append('text').text(function(d) {
      console.log(abbreviateNumber(d.country));
      return d.country;
    }).attr('text-anchor', 'end').attr('y', 8).attr('font-size', function (d) {
      return 10;
    });
  }

  function createLabels(totals, yScale) {
    var totalYScale = 0;
    var smallLabelSize = 22;
    var mediumLabelSize = 40;
    var countryTotalLabels = _barGraphSVG.selectAll("g.countryTotal").data(totals);

    countryTotalLabels.enter().append("g").attr('class', function(d) {
      console.log('CLASS')
      return 'countryTotal ' + d.country;
    });
    countryTotalLabels.attr('transform', function(d) {
      console.log('TRANSFORM')
      var value = _barGraphHeight - _barGraphBottomPadding - totalYScale - yScale(d.amount) / 2;
      totalYScale = yScale(d.amount);
      var translate = 'translate(' + (_barGraphWidth / 2 - 25) + "," + value + ")";
      return translate;
    }).attr('display', function(d) {
      if (d.amount == 0) {
        return 'none';
      }
      return null;
    });
    countryTotalLabels.selectAll("*").remove();

    countryTotalLabels[0].forEach(function (ele, index) {
      var label = d3.select(ele);
      var data = totals[index];
      var barHeight = yScale(data.amount);
      var labelHeight = -1;
      var labelWidth = -1;

      label.data(data);

      if (barHeight < smallLabelSize) {
        createSmallLabel(label);
      }
      else if (barHeight < smallLabelSize) {
        createMediumLabel(label);
      }
      else {
        createLargeLabel(label);
      }
    });
  }

  function createTotalLabels(maxAll, count) {
    var overallMoneyLabel = _barGraphSVG.selectAll('text.totalLabel').data([1]);
    overallMoneyLabel.enter().append('text').attr('x', 80).attr('text-anchor', 'end').attr('class', 'totalLabel').attr('y', _barGraphHeight - _barGraphBottomPadding + 25);
    overallMoneyLabel.text('£' + abbreviateNumber(maxAll)).attr('visibility', 'visible');

    var captionLabel = _barGraphSVG.selectAll('text.captionLabel').data([1]);
    captionLabel.enter().append('text').attr('x', 45).attr('text-anchor', 'end').text('TOTAL').attr('class', 'captionLabel').attr('y', _barGraphHeight - _barGraphBottomPadding + 45);
    captionLabel.attr('visibility', 'visible');


    var countTotalLabel = _barGraphSVG.selectAll('text.countTotalLabel').data([1]);
    countTotalLabel.enter().append('text').attr('x', 170).attr('text-anchor', 'end').attr('class', 'countTotalLabel').attr('y', _barGraphHeight - _barGraphBottomPadding + 25);
    countTotalLabel.text(abbreviateNumber(count)).attr('visibility', 'visible');

    var countLabel = _barGraphSVG.selectAll('text.countLabel').data([1]);
    countLabel.enter().append('text').attr('x', 170).attr('text-anchor', 'end').text('COUNT').attr('class', 'countLabel').attr('y', _barGraphHeight - _barGraphBottomPadding + 45);
    countLabel.attr('visibility', 'visible');
  }

  return {
    drawBarGraph: function (countryTotals) {
      var totals = countryTotals.slice(-10);
      var max = totals.reduce(function (m, c) { return m + c.amount; }, 0);
      var maxAll = countryTotals.reduce(function (m, c) { return m + c.amount; }, 0);
      var count = countryTotals.reduce(function (m, c) { return m + c.count; }, 0);
      var minImExAmount = Number.MAX_VALUE;
      var maxImExAmount = Number.MIN_VALUE;
      var yScale = d3.scale.linear()
        .domain([0, max])
        .range([0, _barGraphHeight - _barGraphBottomPadding - _barGraphTopPadding]);

      setupGraph();
      createBars(totals, yScale);
      createLabels(totals, yScale);
      createTotalLabels(maxAll, count);
    }
  };
}();
