function setMap() {
    let fileId = getSelectedFileId();
    let metadataNames = {"x": "X", "y": "Y"};
    let testData = [300, 250]

    var mapSvg = d3.select("canvas")
        .append("svg")
        .attr("width", 400)
        .attr("height", 400);

    // d3.select("canvas")
    //     .selectAll("p")
    //     .remove();

    let dot = mapSvg.select("circle")
        .data(testData)
        .enter()
        .append("circle");
        
    dot.attr("cx", function(d, i) {
        console.log(d);
        return d;
    })
    .attr("cy", function(d, i) {
        console.log(d);
        return d;
    })
    .attr("r", 50)
    .attr("fill", "green");
}