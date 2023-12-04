/**
 * A quick wrapper class around KissFFT's C api
 * Inputs passed into realFFT.forward and realFFT.reverse are copied into
 * internal buffers.
 * Returned buffers are reused and will be clobbered upon the next call to
 * realFFT.forward or realFFT.reverse
 */
class RealFFT {
    constructor(size, kissFFT) {
        this.realSize = size;
        this.complexSize = size / 2 + 1;

        let forwardCfg = kissFFT._kiss_fftr_alloc(size, false, 0, 0);
        let reverseCfg = kissFFT._kiss_fftr_alloc(size, true, 0, 0);

        let realBufferSize = 4 * this.size;
        let complexBufferSize = 2 * 4 * this.complexSize; // Complex[size/2 + 1] or float[size + 2]
        // Allocate one contiguous buffer for both the input and output
        let fullBufferPtr = kissFFT._malloc(realBufferSize + complexBufferSize);

        let realBufferPtr = fullBufferPtr;
        let realBuffer = new Float32Array(kissFFT.HEAPU8.buffer, realBufferPtr, this.realSize);
        
        let complexBufferPtr = fullBufferPtr + realBufferSize;
        let complexBuffer = new Float32Array(kissFFT.HEAPU8.buffer, complexBufferPtr, this.complexSize * 2);

        this.close = () => {
            kissFFT._free(forwardCfg);
            kissFFT._free(reverseCfg);
            kissFFT._free(fullBufferPtr);
        };

        this.forward = (input) => {
            realBuffer.set(input);
            kissFFT._kiss_fftr(forwardCfg, realBufferPtr, complexBufferPtr);
            return complexBuffer;
        };
        // Note: I haven't actually tested reverse
        this.reverse = (input) => {
            complexBuffer.set(input);
            kissFFT._kiss_fftr(reverseCfg, realBufferPtr, complexBufferPtr);
            return realBuffer;
        };
    }
}