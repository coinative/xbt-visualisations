var d3Graphs = {
  barGraphWidth: 300,
  barGraphHeight: 700,
  barWidth: 14,
  barGraphTopPadding: 20,
  barGraphBottomPadding: 50,
  barGraphSVG: d3.select('body').append('svg').attr('id', 'barGraph'),
  drawBarGraph: function (countryTotals) {
    var totals = countryTotals.slice(-10);
    var max = totals.reduce(function (m, c) { return m + c.amount; }, 0);
    var maxAll = countryTotals.reduce(function (m, c) { return m + c.amount; }, 0);
    var count = countryTotals.reduce(function (m, c) { return m + c.count; }, 0);
    var minImExAmount = Number.MAX_VALUE;
    var maxImExAmount = Number.MIN_VALUE;
    this.barGraphSVG.attr('id', 'barGraph').attr('width', d3Graphs.barGraphWidth).attr('height', d3Graphs.barGraphHeight).attr('class', 'overlayCountries noPointer');
    var yScale = d3.scale.linear().domain([0, max]).range([0, this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
    var rects = this.barGraphSVG.selectAll('rect.totals').data(totals);
    this.cTotal = 0;
    rects.enter().append('rect').attr('style', function (d) {
      var country = highlightedCountries[d.country];
      return 'fill: hsl(' + (240 - country.h) + ', 50%, 50%); stroke: rgb(0, 0, 0);';
    }).attr('x', 0).attr('width', this.barWidth);

    rects.attr('y', function (d) {
      var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cTotal - yScale(d.amount);
      d3Graphs.cTotal += yScale(d.amount);
      return value;
    }).attr('height', function (d) {
      return yScale(d.amount);
    });

    this.cumImportLblY = 0;
    this.previousImportLabelTranslateY = 0;
    this.previousExportLabelTranslateY = 0;
    var paddingFromBottomOfGraph = 00;
    var heightPerLabel = 25;
    var fontSizeInterpolater = d3.interpolateRound(10, 28);
    var smallLabelSize = 22;
    var mediumLabelSize = 40;
    var importLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG").data(totals);
    importLabelBGs.enter().append('rect').attr('class', function(d) {
      return 'barGraphLabelBG ' + d.country;
    });
    var importLabels = this.barGraphSVG.selectAll("g.importLabel").data(totals);
    importLabels.enter().append("g").attr('class', function(d) {
      return 'importLabel ' + d.country;
    });
    importLabels.attr('transform', function(d) {
      var translate = 'translate(' + (d3Graphs.barGraphWidth / 2 - 25) + ",";
      var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportLblY - yScale(d.amount) / 2;
      d3Graphs.cumImportLblY += yScale(d.amount);
      translate += value + ")";
      this.previousImportLabelTranslateY = value;
      return translate;
    }).attr('display', function(d) {
      if (d.amount == 0) {
        return 'none';
      }
      return null;
    });
    importLabels.selectAll("*").remove();
    var importLabelArray = importLabels[0];
    var importLabelBGArray = importLabelBGs[0];
    for (var i = 0; i < importLabelArray.length; i++) {
      var importLabelE = importLabelArray[i];
      var importLabel = d3.select(importLabelE);
      var data = totals[i];
      importLabel.data(data);
      var pieceHeight = yScale(data.amount);
      var labelHeight = -1;
      var labelBGYPos = -1;
      var labelWidth = -1;
      var importLabelBG = d3.select(importLabelBGArray[i]);
      if (pieceHeight < smallLabelSize) {
        var numericLabel = importLabel.append('text').text(function(d) {
          return '£' + abbreviateNumber(d.amount);
        }).attr('text-anchor', 'end').attr('alignment-baseline', 'central').attr('font-size', function(d) {
          return 10;
          //return fontSizeInterpolater((d.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        }).attr('font-size', function (d) {
          return 5;
        });
        labelHeight = fontSizeInterpolater((data.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        labelHeight = 10;
        labelBGYPos = -labelHeight / 2;
        var numericLabelEle = numericLabel[0][0];
        labelWidth = numericLabelEle.getComputedTextLength();
      } else if (pieceHeight < mediumLabelSize) {
        var numericLabel = importLabel.append('text').text(function(d) {
          return '£' + abbreviateNumber(d.amount);
        }).attr('text-anchor', 'end').attr('font-size', function(d) {
          return 15;
          //return fontSizeInterpolater((d.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        });
        var textLabel = importLabel.append('text').text(function(d) {
          return d.country;
        }).attr('text-anchor', 'end').attr('y', 15).attr('class', function(d) {
          return 'import';
        }).attr('font-size', function (d) {
          return 7;
        });
        labelHeight = fontSizeInterpolater((data.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        labelHeight = 15;
        labelBGYPos = -labelHeight;
        labelHeight += 16;
        var numericLabelEle = numericLabel[0][0];
        var textLabelEle = textLabel[0][0];
        labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
      } else {
        var numericLabel = importLabel.append('text').text(function(d) {
          return '£' + abbreviateNumber(d.amount);
        }).attr('text-anchor', 'end').attr('font-size', function(d) {
          return 20;
          //return fontSizeInterpolater((d.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        }).attr('y', -7);
        var textLabel = importLabel.append('text').text(function(d) {
          return d.country;
        }).attr('text-anchor', 'end').attr('y', 8).attr('class', function(d) {
          return 'import';
        }).attr('font-size', function (d) {
          return 10;
        });
        labelHeight = fontSizeInterpolater((data.amount - minImExAmount) / (maxImExAmount - minImExAmount));
        labelHeight = 20;
        labelBGYPos = -labelHeight - 7;
        labelHeight += 16 + 14;
        var numericLabelEle = numericLabel[0][0];
        var textLabelEle = textLabel[0][0];
        labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
      }
      if (labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
        importLabelBG.attr('x', -labelWidth).attr('y', labelBGYPos).attr('width', labelWidth).attr('height', labelHeight).attr('transform', importLabel.attr('transform'));
      }
    }
    var importTotalLabel = this.barGraphSVG.selectAll('text.totalLabel').data([1]);
    importTotalLabel.enter().append('text').attr('x', 80).attr('text-anchor', 'end').attr('class', 'totalLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 25);
    importTotalLabel.text('£' + abbreviateNumber(maxAll)).attr('visibility', 'visible');
    var importLabel = this.barGraphSVG.selectAll('text.importLabel').data([1]);
    importLabel.enter().append('text').attr('x', 45).attr('text-anchor', 'end').text('TOTAL').attr('class', 'importLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
    importLabel.attr('visibility', 'visible');

    var countTotalLabel = this.barGraphSVG.selectAll('text.countTotalLabel').data([1]);
    countTotalLabel.enter().append('text').attr('x', 170).attr('text-anchor', 'end').attr('class', 'countTotalLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 25);
    countTotalLabel.text(abbreviateNumber(count)).attr('visibility', 'visible');
    var countLabel = this.barGraphSVG.selectAll('text.countLabel').data([1]);
    countLabel.enter().append('text').attr('x', 170).attr('text-anchor', 'end').text('COUNT').attr('class', 'countLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
    countLabel.attr('visibility', 'visible');
  }
}

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
