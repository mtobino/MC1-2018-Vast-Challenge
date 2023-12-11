function setMap() {

    birdId = getSelectedFileId()
    
    var mapSvg = d3.select("#road-map")
    
    mapSvg.selectAll("circle").remove();
    


    let dot = mapSvg.selectAll("circle")
        .data(Object.entries(birdSoundsByFileId))
        .enter()
        .append("circle");
        

    dot.attr("cx", function(d, i) {
        return (d[1]["x"] / 200.0 * 100.0) + "%";
    })
    .attr("cy", function(d, i) {
        return (100.0 - (d[1]["y"] / 200.0 * 100.0)) + "%"; // Y is down
    })
    .attr("r", function(d, i) {
        if(checkYear(d[1]["year"])){
            if(checkName(d[1]["englishName"]))
                return 5;
    
            return 0;
}})
    .attr("fill", function(d, i) {
        if (getSelectedFileId() == d[0])
            return "red"

        return "green"
    })
    .attr("opacity", function(d, i) {
        if (getSelectedFileId() == d[0])
            return "1"

        return "0.5"
    });
}
    
function checkYear(year)
{
    birdId = getSelectedFileId()
    currentYear = birdSoundsByFileId[birdId]["year"]

    return (year == currentYear || year == currentYear - 1 || year == currentYear + 1) 
}

function checkName(name)
{
    birdName = getSelectedBirdName()

    return (name == birdName)
}