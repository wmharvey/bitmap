var fs = require('fs');

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(BufferStream, Transform);
util.inherits(GrayscaleStream, Transform);

function BufferStream() {
  Transform.call(this);

  this.header = null;
  this.imageStart = null;
  this.doneHeader = false;
}
var bufferStream = new BufferStream();
var grayscaleStream = new GrayscaleStream(bufferStream);

BufferStream.prototype._transform = function (chunk, encoding, processed) {
  if (this.doneHeader) {
    this.push(chunk);
  } else {
    if (!this.header) { //handle first chunk
      this.header = chunk;
    } else {
      this.header = Buffer.concat([this.header, chunk]);
    }
    if (!this.imageStart) { //get image start info if available
      if (this.header.length >= 14) {
        this.imageStart = this.header.readUInt32LE(10);
      }
    }
    if (this.imageStart) {
      if (this.header.length >= this.imageStart) {
        this.push(this.header);
        this.doneHeader = true;
      }
    }
  }
  processed();
};

function GrayscaleStream() {
  Transform.call(this);
}

GrayscaleStream.prototype._transform = function (chunk, encoding, processed) {
  // TODO
}
