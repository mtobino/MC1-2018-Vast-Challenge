function setMap() {

    birdId = getSelectedFileId()
    
    var mapSvg = d3.select("#road-map")
    
    mapSvg.selectAll("circle").remove();
    


    let dot = mapSvg.selectAll("circle")
        .data(Object.entries(birdSoundsByFileId))
        .enter()
        .append("circle");
        

    dot.attr("cx", function(d, i) {
        return d[1]["x"];
    })
    .attr("cy", function(d, i) {
        return d[1]["y"];
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

        return "0.15";
    });
}
    
function checkYear(year)
{
    birdId = getSelectedFileId()
    currentYear = birdSoundsByFileId[birdId]["year"]

    return (year == currentYear) 
}

function checkName(name)
{
    birdName = getSelectedBirdName()

    return (name == birdName)
}