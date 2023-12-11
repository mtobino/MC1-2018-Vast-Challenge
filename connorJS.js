d3.csv("cleaned.csv").get(function(error, data) {
    // Extract unique bird names
    var uniqueBirds = Array.from(new Set(data.map(function(d) {
        return d.English_name;
    })));

    // Populate the bird dropdown menu with bird names
    var birdDropdown = d3.select("#birdDropdown");
    birdDropdown.selectAll("option")
        .data(uniqueBirds.sort())
        .enter().append("option")
        .text(function(d) { return d; });

    // Initial chart creation for the first bird in the dataset
    updateChart(uniqueBirds[0]);

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
        var filteredData = data.filter(function(d) {
            return (
                d.English_name === selectedBird &&
                !isNaN(new Date(d.Date).getFullYear())  // Exclude NaN values
            );
        });

        // Count occurrences of each year
        var yearCounts = {};
        filteredData.forEach(function(d) {
            var year = new Date(d.Date).getFullYear();
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        });

        // Convert yearCounts object to an array of objects and sort by year
        var countData = Object.keys(yearCounts)
            .map(function(year) {
                return { year: year, count: yearCounts[year] };
            })
            .sort(function(a, b) {
                return d3.ascending(a.year, b.year);
            });

        // Create scales
        var xScale = d3.scale.ordinal()
            .domain(countData.map(function(d) { return d.year; }))
            .rangeRoundBands([padding, 750 - padding], 0.2);

        var yScale = d3.scale.linear()
            .domain([0, d3.max(countData, function(d) { return d.count; })])
            .range([300, padding]);

        // Create bars
        svg.selectAll(".bar")
            .data(countData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return xScale(d.year); })
            .attr("y", function(d) { return yScale(d.count); })
            .attr("width", xScale.rangeBand())
            .attr("height", function(d) { return 300 - yScale(d.count); })
            .style("fill", "steelblue");

        // Add custom axis
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickFormat(function (d) {
                return d;
            });

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

        svg.append("g")
            .attr("class", "custom-axis")
            .attr("transform", "translate(0,300)")
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
});
