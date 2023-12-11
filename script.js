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

var mainSpectrogram = {
    audioData: undefined,
    audioObjectUrl: "",
    audioControls: d3.select("#main-audio-controls"),
    visualization: new SpectrogramVisualization(document.getElementById("main-spectrogram"))
};
var testBirdSpectrogram = {
    audioData: undefined,
    audioObjectUrl: "",
    audioControls: d3.select("#test-bird-audio-controls"),
    visualization: new SpectrogramVisualization(document.getElementById("test-bird-spectrogram"))
};

function getSelectedBirdName() {
    return document.getElementById("bird-name").value;
}
function getSelectedVocalizationType() {
    return document.getElementById("vocalization-type").value;
}
function getSelectedFileId() {
    return document.getElementById("file-id").value;
}

function getSelectedTestBirdId() {
    return document.getElementById("test-bird-id").value;
}

function updateList(selector, dataset) {
    let selection = d3.select(selector)
        .selectAll("option")
        .data(dataset);
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
    updateBirdBarGraph();
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

    setAudio(birdSounds, fileId, mainSpectrogram);
    setMap();
}

function onTestBirdIdSelected() {
    let testBirdId = getSelectedTestBirdId();
    setAudio(testBirdSounds, testBirdId, testBirdSpectrogram);
}

let birdNames = Object.getOwnPropertyNames(birdSoundsDrillDown);
birdNames.sort();
updateList("#bird-name", birdNames);

d3.select("#bird-name") // when a bird name is selected
    .on("change", updateVocalizationTypeList);
d3.select("#vocalization-type") // when the vocalization type is changed
    .on("change", updateFileIdList);
d3.select("#file-id")
    .on("change", onFileIdSelected);
updateVocalizationTypeList();

let testBirdIds = Object.getOwnPropertyNames(testBirdSounds);
updateList("#test-bird-id", testBirdIds);

d3.select("#test-bird-id")
    .on("change", onTestBirdIdSelected);
onTestBirdIdSelected();

function setAudio(source, fileId, spectrogramObj) {
    if (spectrogramObj.audioObjectURL != "") {
        URL.revokeObjectURL(spectrogramObj.audioObjectURL);
    }
    console.log(`Setting audio file to ${fileId}`);
    let binString = atob(source[fileId]);
    spectrogramObj.audioData = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    spectrogramObj.audioObjectURL = URL.createObjectURL(new Blob([spectrogramObj.audioData], {type: 'audio/opus'}));
    if (spectrogramObj.audioControls) {
        spectrogramObj.audioControls.property("src", spectrogramObj.audioObjectURL);
    }
    spectrogramObj.visualization.updateSpectrogram(spectrogramObj.audioData);
}

function linkAudioControls(spectrogramObj) {
    let audioControls = spectrogramObj.audioControls.node();
    var playHeadInterval = -1;
    function updatePlayhead() {
        spectrogramObj.visualization.updatePlayhead(!audioControls.paused, audioControls.currentTime);
        if (audioControls.paused) {
            clearInterval(playHeadInterval);
        }
    }
    spectrogramObj.audioControls
        .on("play", () => {
            clearInterval(playHeadInterval);
            playHeadInterval = setInterval(updatePlayhead, 1000/30);
        })
        .on("timeupdate", updatePlayhead)
        .on("ended", () => {
            clearInterval(playHeadInterval);
            updatePlayhead();
        });
}
linkAudioControls(mainSpectrogram);
linkAudioControls(testBirdSpectrogram);
