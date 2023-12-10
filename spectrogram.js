/**
 * Create a Spectrogram visualization for an audio file.
 * 
 * Dependencies: kissfft/kissfft.js, kissfft/kissfft-wrapper.js, magma-colormap.js, d3/d3.v3.js
 * Author: David Choo
 */

// https://en.wikipedia.org/wiki/Hann_function
function createHannWindow(size) {
    let output = new Float32Array(size);
    for (var i = 0; i < size; i++) {
        output[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return output;
}

// Global constants for all spectrograms
const sampleRate = 32000;
const audioCtx = new AudioContext({sampleRate});
const fftSize = 512; // 16ms windows and 62.5hz per bin
const overlap = 0.25;
const zeroPaddingFactor = 2; // Pad FFT with (zeroPaddingFactor-1) * fftSize zeros

// Unfortunately, there's a limit on how large an ImageBitmap can be. 
const maxFramesPerImage = 8192; // ~30 seconds at 32khz 512 bins and 25% overlap

const hannWindow = createHannWindow(fftSize);

var kissFFT = {};
var realFFT = (async () => {
    await KissFFTModule(kissFFT);
    return new RealFFT(fftSize * zeroPaddingFactor, kissFFT);
})();

class SpectrogramVisualization {
    /**
     * Create a SpectrogramVisualization
     * @param {Node} parentNode the Node that will contain the spectrogram canvas and overlay
     */
    constructor(parentNode) {
        this.parentNode = parentNode;
        
        let parent = d3.select(parentNode)
            .classed("spectrogram", true);

        this.overlay = parent.append("svg")
            .classed("overlay", true);
        this.canvas = parent.append("canvas")
            .classed("main-canvas", true)
            .node();
        this.ctx = this.canvas.getContext("2d");

        this.timeScale = d3.scale.linear();
        this.freqScale = d3.scale.linear();

        this.axisGroup = this.overlay.append("g")
            .style("visibility", "hidden");

        this.xAxisGfx = this.axisGroup.append("g")
            .classed("axis", true);
        this.xAxisLabel = this.axisGroup.append("text")
            .classed("axis-label", true)
            .style("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .text("Time (s)");
        this.yAxisGfx = this.axisGroup.append("g")
            .classed("axis", true);
        this.yAxisLabel = this.axisGroup.append("text")
            .classed("axis-label", true)
            .style("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("dy", "1em")
            .text("Frequency (hz)");
        this.playHeadGfx = this.axisGroup.append("g")
            .classed("playhead", true);
        this.playHeadGfx.append("line");

        this.playHeadTime = -1;
        this.playHeadVisible = false;

        this.spinnerGfx = this.overlay.append("image")
            .attr("href", "3-dots-bounce.svg");
        // Do the initial draw without any audio loaded
        this.redraw();

        window.addEventListener("resize", () => this.redraw());
        
        this.overlay.on("mousedown", () => {
                let event = this.transformMouseEvent(d3.event);
                if (event.inCanvas) {
                    d3.event.preventDefault();
                }
            })
            .on("mousemove", () => {
                let event = this.transformMouseEvent(d3.event);
                if (event.buttons != 1) {
                    // Only dragging when the primary mouse button is held
                    return;
                }
                if (event.inCanvas) {
                    d3.event.preventDefault();
                    this.handleMouseDrag(d3.event.movementX, d3.event.movementY);
                }
            })
            .on("wheel", () => {
                let event = this.transformMouseEvent(d3.event);
                if (event.inCanvas) {
                    d3.event.preventDefault();
                    this.handleWheel(event.x, event.y, d3.event.deltaY, d3.event.shiftKey);
                }
            })
            .on("dblclick", () => {
                let event = this.transformMouseEvent(d3.event);
                if (event.inCanvas) {
                    d3.event.preventDefault();
                    this.handleDoubleClick();
                }
            });
    }

    /**
     * Returns an ImageBitmap with the spectrogram of the audioData
     * 1 pixel in the x = overlap * fftSize/sampleRate seconds
     * 1 pixel in the y = sampleRate/fftSize hz
     * @param {ArrayBuffer} audioData the raw bytes of the audio file
     * @param {RealFFT} realFFT 
     * @param {*} window the window to apply before running the FFT, a rectangle window will be used if not provided
     * @returns a Promise with ImageBitmaps and the domain of each axis of the spectrogram
     */
    async generateSpectrogram(audioData, realFFT, window) {
        console.log("Loading audio file for spectrogram generation.");
        return audioCtx.decodeAudioData(audioData)
            .then(audioBuffer => {
                // Apply STFT to audio samples with the given window
                let samples = audioBuffer.getChannelData(0);
                let hopSize = fftSize * overlap;
                let frames = Math.floor(samples.length / hopSize);
                let spectrumByFrame = [];
                console.log(`Starting STFT. Num samples: ${samples.length} Frames: ${frames}`);
                console.time("STFT");
                var start = 0;
                let frame = new Float32Array(realFFT.realSize);
                for (var i = 0; i < frames; i++) {
                    let end = start + fftSize;
                    frame.set(samples.subarray(start, end));
                    if (window) {
                        // Apply the windowing function
                        for (var j = 0; j < window.length; j++) {
                            frame[j] *= window[j];
                        }
                    }

                    let spectrum = new Float32Array(realFFT.complexSize);
                    let complexBins = realFFT.forward(frame);
                    // Convert complex spectrum to dBFS power spectrum
                    for (var j = 0; j < spectrum.length; j++) {
                        let real = complexBins[2 * j];
                        let complex = complexBins[2 * j + 1];
                        let power = real * real + complex * complex + 0.0001; // Small offset to avoid log(0) = -Inf
                        let dbfs = 20 * Math.log10(power);
                        spectrum[j] = dbfs;
                    }

                    spectrumByFrame[i] = spectrum;
                    start += hopSize;
                }
                console.timeEnd("STFT");
                return spectrumByFrame;
            })
            .then(spectrumsByFrame => {
                if (spectrumsByFrame.length == 0) {
                    // Not enough samples for even 1 FFT?
                    return null;
                }
                let totalWidth = spectrumsByFrame.length;
                let height = spectrumsByFrame[0].length;
                // Find min and max dBFS to later normalize into [0, 1] range
                var maxDbfs = -Infinity;
                var minDbfs = Infinity;
                for (var i = 0; i < totalWidth; i++) {
                    let spectrum = spectrumsByFrame[i];
                    for (var j = 0; j < height; j++) {
                        let val = spectrum[j];
                        maxDbfs = Math.max(maxDbfs, val);
                        minDbfs = Math.min(minDbfs, val);
                    }
                }
                let rangeDbfs = maxDbfs - minDbfs;

                console.log(`Generating spectrogram images Total Size: ${totalWidth}x${height} dBFS: [${minDbfs}, ${maxDbfs}]`);
                console.time("SpectrogramImage");
                var startFrame = 0;
                let imagePromises = [];
                // Split up the spectrogram into multiple images of at most (maxFramesPerImage)x(height) pixels each
                while ((spectrumsByFrame.length - startFrame) > 0) {
                    let width = Math.min(spectrumsByFrame.length - startFrame, maxFramesPerImage);
                    let imageArray = new Uint8ClampedArray(4 * width * height);
                    for (var x = 0; x < width; x++) {
                        let spectrum = spectrumsByFrame[x + startFrame];
                        for (var y = 0; y < height; y++) {
                            let val = spectrum[y];
                            let rgb = magmaColorMap((val - minDbfs) / rangeDbfs);
                            imageArray[4 * width * y + 4 * x + 0] = rgb[0];
                            imageArray[4 * width * y + 4 * x + 1] = rgb[1];
                            imageArray[4 * width * y + 4 * x + 2] = rgb[2];
                            imageArray[4 * width * y + 4 * x + 3] = 255;
                        }
                    }
                    let imageData = new ImageData(imageArray, width, height);
                    imagePromises.push(createImageBitmap(imageData, {imageOrientation: "flipY"}));
                    startFrame += width;
                }
                console.timeEnd("SpectrogramImage");
                
                return Promise.all(imagePromises)
                    .then(bitmaps => {
                        console.log(`Finished generating ${bitmaps.length} spectrogram image(s)`);
                        return {
                            bitmaps,
                            totalWidth,
                            timeDomain: [0, totalWidth * fftSize / sampleRate * overlap],
                            frequencyDomain: [0, sampleRate / 2],
                            dbfsDomain: [minDbfs, maxDbfs],
                        }
                    });
            });
    }

    async updateSpectrogram(audioData) {
        if (this.spectrogram) {
            this.spectrogram.bitmaps.forEach(bitmap => bitmap.close())
            this.spectrogram = null;
            this.redraw();
        }
        this.spectrogram = await this.generateSpectrogram(new Uint8Array(audioData).buffer, await realFFT, hannWindow);
        if (this.spectrogram == null) {
            return;
        }
        this.playHeadVisible = false;
        this.playHeadTime = -1;
        this.timeScale.domain(this.spectrogram.timeDomain);
        this.freqScale.domain(this.spectrogram.frequencyDomain);
        this.redraw();
    }

    redraw() {
        let overlayRect = this.overlay.node().getBoundingClientRect();
        let canvasRect = this.canvas.getBoundingClientRect();

        // Relative to overlay coordinates
        let canvasLeft = canvasRect.left - overlayRect.left;
        let canvasRight = canvasRect.right - overlayRect.left;
        let canvasTop = canvasRect.top - overlayRect.top;
        let canvasBottom = canvasRect.bottom - overlayRect.top - 1;

        let overlayW = overlayRect.width;
        let overlayH = overlayRect.height;

        this.canvas.width = canvasRect.width;
        this.canvas.height = canvasRect.height;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.overlay.attr("width", overlayW)
            .attr("height", overlayH);

        let spinnerSize = Math.min(overlayW, overlayH) * 0.1;
        this.spinnerGfx.attr("x", overlayW / 2 - spinnerSize / 2)
            .attr("y", overlayH / 2 - spinnerSize / 2)
            .attr("width", spinnerSize)
            .attr("height", spinnerSize)
            .style("visibility", this.spectrogram ? "hidden" : "visible");

        if (!this.spectrogram) {
            // Hide axis while waiting for spectrogram to be loaded
            this.axisGroup.style("visibility", "hidden");
            return;
        }
        this.ctx.imageSmoothingEnabled = false;

        let timeRange = this.timeScale.domain()[1] - this.timeScale.domain()[0];
        let timeScale = (this.spectrogram.timeDomain[1] - this.spectrogram.timeDomain[0]) / timeRange;

        let freqRange = this.freqScale.domain()[1] - this.freqScale.domain()[0];
        let freqScale = (this.spectrogram.frequencyDomain[1] - this.spectrogram.frequencyDomain[0]) / freqRange;

        var xStart = -this.timeScale.domain()[0] / timeRange * this.canvas.width;
        let yStart = this.freqScale.domain()[0] / freqRange * this.canvas.height;
        for (var i = 0; i < this.spectrogram.bitmaps.length; i++) {
            let bitmap = this.spectrogram.bitmaps[i];
            let width = this.canvas.width * timeScale / this.spectrogram.totalWidth * bitmap.width;
            this.ctx.drawImage(
                bitmap,
                xStart,
                (1 - freqScale) * this.canvas.height + yStart, // Y Down nonsense
                width,
                this.canvas.height * freqScale
            );
            xStart = Math.floor(xStart + width);
        }

        this.timeScale.range([canvasLeft, canvasRight]);
        this.freqScale.range([canvasBottom, canvasTop]);

        var xAxis = d3.svg.axis()
            .scale(this.timeScale)
            .orient("bottom")
            .ticks(12);
        var yAxis = d3.svg.axis()
            .scale(this.freqScale)
            .orient("left")
            .ticks(12);

        this.axisGroup.style("visibility", "visible");
        this.xAxisGfx.attr("transform", `translate(0, ${canvasBottom})`)
            .call(xAxis);
        this.xAxisLabel.attr("x", (canvasLeft + canvasRight) / 2)
            .attr("y", overlayH);

        this.yAxisGfx.attr("transform", `translate(${canvasLeft}, 0)`)
            .call(yAxis);
        this.yAxisLabel.attr("x", -(canvasTop + canvasBottom) / 2) // transform="rotate(-90)" rotates the coordinates system
            .attr("y", 0);
        
        this.updatePlayhead(this.playHeadVisible, this.playHeadTime);
    }

    transformMouseEvent(mouseEvent) {
        let overlayBB = this.canvas.getBoundingClientRect();
        let x = mouseEvent.clientX - overlayBB.x;
        let y = mouseEvent.clientY - overlayBB.y;
        let inCanvas = 0 <= x && x <= overlayBB.width &&
            0 <= y && y <= overlayBB.height;
        return {x, y, inCanvas, buttons: mouseEvent.buttons};
    }

    handleMouseDrag(movementX, movementY) {
        let timeDomain = this.timeScale.domain();
        let freqDomain = this.freqScale.domain();

        let secondsPerPixel = (timeDomain[1] - timeDomain[0]) / this.canvas.width;
        let hzPerPixel = (freqDomain[1] - freqDomain[0]) / this.canvas.height;

        let timeOffset = -movementX * secondsPerPixel
        let freqOffset = movementY * hzPerPixel; // Y is down
        
        this.timeScale.domain([timeDomain[0] + timeOffset, timeDomain[1] + timeOffset]);
        this.freqScale.domain([freqDomain[0] + freqOffset, freqDomain[1] + freqOffset]);
        this.redraw();
    }

    handleWheel(x, y, amount, shiftKey) {
        let zoomFactor = 2;
        if (amount < 0) {
            zoomFactor = 0.5;
        }

        function zoomScale(scale, zoomFactor, origin, minRange) {
            let domain = scale.domain();
            let domainRange = domain[1] - domain[0];
            if (domainRange * zoomFactor < minRange) {
                return;
            }
            let scaleOrigin = origin * domainRange + domain[0];
            scale.domain([
                (domain[0] - scaleOrigin) * zoomFactor + scaleOrigin,
                (domain[1] - scaleOrigin) * zoomFactor + scaleOrigin
            ]);
        }

        if (!shiftKey) {
            zoomScale(this.timeScale, zoomFactor, x / this.canvas.width, 1);
        } else {
            zoomScale(this.freqScale, zoomFactor, 1 - (y / this.canvas.height), 100); // Y is down
        }
        this.redraw();
    }

    handleDoubleClick() {
        this.timeScale.domain(this.spectrogram.timeDomain);
        this.freqScale.domain(this.spectrogram.frequencyDomain);
        this.redraw();
    }

    updatePlayhead(visible, time) {
        let overlayW = this.overlay.property("clientHeight");
        var x = 0;
        if (visible && this.timeScale.domain()[0] <= time && time <= this.timeScale.domain()[1]) {
            x = this.timeScale(time);
        } else {
            visible = false;
        }
        this.playHeadVisible = visible;
        this.playHeadTime = time;
        
        this.playHeadGfx.attr("transform", `translate(${x}, 0)`)
            .style("visibility", visible ? "visible" : "hidden")
            .select("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", overlayW);
    }
}