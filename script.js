 // Filter out vocalization types and file ids that don't exist in bird-sounds-db.js
 for (const englishName in birdSoundsDrillDown) {
    const byVocalizationType = birdSoundsDrillDown[englishName];
    for (const vocalizationType in byVocalizationType) {
        byVocalizationType[vocalizationType] = byVocalizationType[vocalizationType]
            .filter(fileId => birdSounds[fileId] !== undefined);
        if (byVocalizationType[vocalizationType].length == 0) {
            delete byVocalizationType[vocalizationType];
        } else {
            byVocalizationType[vocalizationType].sort((a, b) => parseInt(a) - parseInt(b));
        }
    }
}

var audioData = undefined;
var audioObjectURL = "";

function getSelectedBirdName() {
    return document.getElementById("bird-name").value;
}
function getSelectedVocalizationType() {
    return document.getElementById("vocalization-type").value;
}
function getSelectedFileId() {
    return document.getElementById("file-id").value;
}

function updateList(selector, dataset) {
    let selection = d3.select(selector)
        .selectAll("option")
        .data(dataset);
        console.log
    // Add new options
    selection.enter()
        .append("option");
    // Update value and text of new and old options
    selection.attr("value", (d) => d)
        .text((d) => d);
    // Remove extra options
    selection.exit()
        .remove()
}

function updateVocalizationTypeList() {
    let birdName = getSelectedBirdName();
    let vocalizationTypes = Object.getOwnPropertyNames(birdSoundsDrillDown[birdName]);
    vocalizationTypes.sort();
    updateList("#vocalization-type", vocalizationTypes);
    updateFileIdList();
}

function updateFileIdList() {
    let birdName = getSelectedBirdName();
    let vocalizationType = getSelectedVocalizationType();
    let fileIds = birdSoundsDrillDown[birdName][vocalizationType];
    updateList("#file-id", fileIds);
    onFileIdSelected();
}


function onFileIdSelected() {
    let fileId = getSelectedFileId();
    let metadataNames = {"quality": "Quality", "time": "Time", "year": "Year", "x": "X", "y": "Y"};
    let metadataOrder = ["time", "year", "quality", "x", "y"];

    d3.select("#metadata")
        .selectAll("p")
        .remove();

    let p = d3.select("#metadata")
        .selectAll("p")
        .data(metadataOrder)
        .enter()
        .append("p");
    p.append("strong")
        .text((d) => metadataNames[d] + ": ");
    p.append("span")
        .text((d) => birdSoundsByFileId[fileId][d]);

    setAudio(fileId);
}

let birdNames = Object.getOwnPropertyNames(birdSoundsDrillDown);
birdNames.sort();
updateList("#bird-name", birdNames);

d3.select("#bird-name")
    .on("change", updateVocalizationTypeList);
d3.select("#vocalization-type")
    .on("change", updateFileIdList);
d3.select("#file-id")
    .on("change", onFileIdSelected);
updateVocalizationTypeList();

function setAudio(fileId) {
    if (audioObjectURL != "") {
        URL.revokeObjectURL(audioObjectURL);
    }
    let binString = atob(birdSounds[fileId]);
    audioData = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    audioObjectURL = URL.createObjectURL(new Blob([audioData], {type: 'audio/opus'}));
    document.getElementById("audio-controls").src = audioObjectURL;
}