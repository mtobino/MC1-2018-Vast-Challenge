// Populate the bird dropdown menu with bird names
var birdDropdown = d3.select("#birdDropdown");
birdDropdown.selectAll("option")
    .data(birdNames)
    .enter().append("option")
    .text(function(d) { return d; });

// Function to update the chart based on the selected bird
function updateChart(selectedBird) {
    // Remove any existing chart
    d3.select("#connor-bar").selectAll('*').remove();

    // Create SVG element with increased height
    var svg = d3.select("#connor-bar")
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);

    var padding = 50;

    // Filter data for the selected bird
    var filteredData = Object.values(birdSoundsDrillDown[selectedBird])
        .reduce((acc, val) => acc.concat(val), [])
        .map((fileId) => birdSoundsByFileId[fileId])
        .filter((bird) => bird.year != "unknown"); // Filter bird calls with unknown years
    
    // Count occurrences of each year
    var yearCounts = {};
    filteredData.forEach(function(bird) {
        yearCounts[bird.year] = (yearCounts[bird.year] || 0) + 1;
    });

    // Convert yearCounts object to an array of objects and sort by year
    var countData = Object.entries(yearCounts)
        .map(function(entry) {
            return { year: entry[0], count: entry[1] };
        })
        .sort(function(a, b) {
            return d3.ascending(a.year, b.year);
        });

    // Create scales
    var xScale = d3.scale.ordinal()
        .domain(countData.map(function(d) { return d.year; }))
        .rangeRoundBands([padding, svg.attr("width") - padding], 0.2);

    var yScale = d3.scale.linear()
        .domain([0, d3.max(countData, function(d) { return d.count; })])
        .range([svg.attr("height") - padding, padding]);
    console.log(countData);
    // Create bars
    svg.selectAll(".bar")
        .data(countData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d.year); })
        .attr("y", function(d) { return yScale(d.count); })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) { return svg.attr("height") - padding - yScale(d.count); })
        .style("fill", "steelblue");

    // Add custom axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    var yScaleSize = yScale.domain()[1];
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(yScaleSize > 10 ? 10 : yScaleSize);

    svg.append("g")
        .attr("class", "custom-axis")
        .attr("transform", `translate(0, ${svg.attr("height") - padding})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("class", "custom-axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    // Add title
    svg.append("text")
        .attr("x", 400) 
        .attr("y", padding / 2)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Bird Count Chart for " + selectedBird);
}

// Event listener for dropdown change
birdDropdown.on("change", function() {
    var selectedBird = d3.select(this).property("value");
    // Update the chart for the selected bird
    updateChart(selectedBird);
});
// Initial chart creation for the first bird in the dataset
updateChart(birdNames[0]);