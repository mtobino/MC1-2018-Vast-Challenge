function updateBirdBarGraph()
{
    let birdName = getSelectedBirdName();   // get the bird name
    let vocalizationType = getSelectedVocalizationType(); // get the current vocalization type
    let fileIds = birdSoundsDrillDown[birdName][vocalizationType]; // get all the file ids that map to that specific bird and specfic vocalization type
    let freqMap = {}; // start a frequency map
    console.log(fileIds); // log for debug
    for(let i = 0; i < fileIds.length; i++) // iterating through all of the file ids
    {
        console.log(fileIds[i]); // log for debug
        const birdInfo = birdSoundsByFileId[fileIds[i]]; // get the bird information based on the file id
        console.log(birdInfo); // log for debug
        freqMap[birdInfo["quality"]] = (freqMap[birdInfo.quality] || 0) + 1; // in the frequency map, set the key to the 'quality' or grade of the bird sound
        // set the value equal to the current recorded number of sounds with that grade + 1
        // || 0 means that that the grade in the freqMap does not exist yet and therefore we are setting it to 0 and adding 1 afterwards
        // this is basically a hashmap.getOrDefault(key, 0)
    }
    console.log(freqMap); // log for debug
    dataset = []; // start an array that will be based into the d3
    for(const vocalization in freqMap) // for each key in freqMap object
    {
        dataset.push({"grade" : vocalization, "count" : freqMap[vocalization]}); // add an entry object to the array
        // EX: dataset[0] -> {"grade" : 'B', "count" : 5}
    }
    console.log(dataset); // log for debug
    d3.select('#bar-graph').selectAll('*').remove(); // clear the current bar graph
    // code stolen and modified from https://observablehq.com/@d3/horizontal-bar-chart/2
    const barHeight = 25;
    const marginTop = 30;
    const marginRight = 0;
    const marginBottom = 10;
    const marginLeft = 30;
    const width = 600;
    const height = Math.ceil((dataset.length + 0.1) * barHeight) + marginTop + marginBottom;
    console.log(height);
    // creating the scales
    var x = d3.scale.linear()
        .domain([0, d3.max(dataset, d => d.count)])
        .range([marginLeft, width - marginRight]);
    
    var y = d3.scale.ordinal()
        .domain(dataset.sort((a,b) => {
            return a.count - b.count;
        }).map(d => d.grade))
        .rangeBands([marginTop, height - marginBottom]);
    
    // Create a value format.
    const format = x.tickFormat(20, "%"); // unused
    
    console.log(x) // log for debug
    console.log(x(5)) // log for debug
    console.log(y) // log for debug
    console.log(y("A")) // log for debug

    // Create the SVG container.
    const svg = d3.select("#bar-graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    //Append a rect for each letter.
    svg.append("g")
        .attr("fill", "steelblue")
        .selectAll()
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", (d, i) =>  y(d.grade))
        .attr("width", (d) => x(d.count) - x(0))
        .attr("height", (d) => y.rangeBand());

    // Add the number value to the bar
    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "end")
        .selectAll()
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", (d) => x(d.count))
        .attr("y", (d) => y(d.grade) + y.rangeBand() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text((d) => (d.count))
        .call((text) => text.filter(d => x(d.count) - x(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", "black")
        .attr("text-anchor", "start"));

    // Create axis
    var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(dataset.length + 1);
    
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(dataset.length + 1);

    // Add axis to the svg
    svg.append("g")
        .attr("class", "axis")
        .attr("transform",`translate(0,${marginTop})`) // swapping marginTop and zero sorta flip it
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis);                                                                    
}