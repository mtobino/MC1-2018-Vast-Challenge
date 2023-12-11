<html>
    <head>
        <title>Queenscoat</title>
    </head>
    <body>
        <h1>Queenscoat</h1>
        <p>2011-2018</p>
    </body>
</html>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Line Graph</title>
  <script src="https://d3js.org/d3.v5.min.js"></script>
  <style>
    .line {
      fill: none;
      stroke: steelblue;
      stroke-width: 2px;
    }

    .dot {
      fill: steelblue;
      stroke: white;
      stroke-width: 2px;
    }

    .label {
      font-size: 12px;
      text-anchor: middle;
    }
  </style>
</head>
<body>

<script type="text/javascript">

  // New data
  var data = [
    { year: 2011, amount: 13 },
    { year: 2012, amount: 8 },
    { year: 2013, amount: 14 },
    { year: 2014, amount: 45 },
    { year: 2015, amount: 49 },
    { year: 2016, amount: 37 },
    { year: 2017, amount: 40 },
    { year: 2018, amount: 3 }
  ];

  // Dimensions of the graph
  var width = 700;
  var height = 500;
  var padding = 23;

  // Create SVG element
  var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create scales
  var xScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.year), d3.max(data, d => d.year)])
    .range([padding, width - padding]);

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.amount)])
    .range([height - padding, padding]);

  // Create line function
  var line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.amount));

  // Append line to SVG
  svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", line);

  // Add dots for each data point
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.amount))
    .attr("r", 5);

  // Add labels for each data point
  svg.selectAll(".label")
    .data(data)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.amount) - 10)
    .text(d => `${d.year}: ${d.amount}`);

  // Create X axis
  var xAxis = d3.axisBottom(xScale);
  svg.append("g")
    .attr("transform", "translate(0," + (height - padding) + ")")
    .call(xAxis);

  // Create Y axis
  var yAxis = d3.axisLeft(yScale);
  svg.append("g")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

</script>
</body>
</html>
