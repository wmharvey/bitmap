var fs = require('fs');
var Transform = require('stream').Transform;
var util = require('util');

//async function to open the file and read just the header info
function getHeader(filename, callback) {
  var buffer = new Buffer(54);
  fs.open(filename, 'r', function(err, fd) {
    if (err) {
      return callback(err);
    } else {
      fs.read(fd, buffer, 0, 54, 0, readHeader);
      fs.close(fd);
    }
  });

  function readHeader (err, bytesRead, buffer) {
    if (err) {
      callback(err);
    } else {
      var image = {};

      image.type = String.fromCharCode(buffer.readUInt8(0)) + String.fromCharCode(buffer.readUInt8(1));
      image.start = buffer.readUInt32LE(10);
      image.dibHeaderSize = buffer.readUInt32LE(14);
      image.width = buffer.readInt32LE(18);
      image.height = buffer.readInt32LE(22);
      image.depth = buffer.readUInt16LE(28);
      image.size = buffer.readUInt32LE(34);

      callback(null, image);
    }
  };
};

//Read the image file header, streams image if it is 24bpp
function grayScale(readFile, writeFile) {
  getHeader(readFile, function(err, image) {
    if (err) {
      console.log('could not get header', err);
    }
    else if (image.depth === 24) {
      fs.createReadStream(readFile)
        .pipe(new GrayscaleStream())
        .pipe(fs.createWriteStream(writeFile));
    }
  });
};

util.inherits(GrayscaleStream, Transform);

function GrayscaleStream() {
  Transform.call(this);
  this.offset = 0;
  this.headerOverflow = false;
  this.leftovers = null;
}

GrayscaleStream.prototype._transform = function (chunk, encoding, processed) {
  var length = chunk.length;
  if (this.offset < 54) { //check to see if past image start
    if (54 - this.offset >= length) { //check to see if chunk contains more than header
      this.push(chunk);
      this.offset += length;
    } else {
      this.push(chunk.slice(this.offset, 54)); //push header down the pipe
      this.offset = 54;
      this.leftovers = chunk.slice(54); //store extra pixels
      this.headerOverflow = true;
    }
  }
  if (this.offset >= 54) { //conditions for chunks that did not contain any header info
    if (this.leftovers && !this.headerOverflow) {
      this.leftovers = Buffer.concat([this.leftovers, chunk]);
    } else if (!this.leftovers && !this.headerOverflow) {
      this.leftovers = chunk;
    }
  }
  this.headerOverflow = false;
  while (this.leftovers.length >= 3) {
    var oldBlue = this.leftovers.readUInt8(0);
    var oldGreen = this.leftovers.readUInt8(1);
    var oldRed = this.leftovers.readUInt8(2);
    var hue = (oldBlue + oldGreen + oldRed) / 3;
    this.leftovers.writeUInt8(hue, 0);
    this.leftovers.writeUInt8(hue, 1);
    this.leftovers.writeUInt8(hue, 2);
    this.push(this.leftovers.slice(0, 3));
    this.leftovers = this.leftovers.slice(3);
  }
  processed();
};


//command to be called
grayScale('./img/non-palette-bitmap.bmp', './img/gray-non-palette.bmp');
