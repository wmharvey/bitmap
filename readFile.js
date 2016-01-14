var fs = require('fs');

exports.getBuffer = function getBuffer (filename) {
  return fs.readFileSync(filename);
};

exports.getImageInfo = function getImageInfo (buffer) {
  var image = {};
  image.type = String.fromCharCode(buffer.readUInt8(0)) + String.fromCharCode(buffer.readUInt8(1));
  image.start = buffer.readUInt32LE(10);
  image.dibHeaderSize = buffer.readUInt32LE(14);
  image.width = buffer.readInt32LE(18);
  image.height = buffer.readInt32LE(22);
  image.depth = buffer.readUInt16LE(28);
  image.size = buffer.readUInt32LE(34);

  if (image.depth <= 8) {
    image.paletteSize = Math.pow(2, image.depth) * 4;
    image.palette = getPalette();
  }

  function getPalette () {
    var paletteArr = [];
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var color = {};
      color.red = buffer.readUInt8(14 + image.dibHeaderSize + offset);
      color.green = buffer.readUInt8(14 + image.dibHeaderSize + offset + 1);
      color.blue = buffer.readUInt8(14 + image.dibHeaderSize + offset + 2);
      color.alpha = buffer.readUInt8(14 + image.dibHeaderSize + offset + 3);
      paletteArr.push(color);
    }
    return paletteArr;
  }
  return image;
};

exports.reverseImage = function reverseImage (readFile, writeFile, callback) {
  var buffer = this.getBuffer(readFile);
  var image = this.getImageInfo(buffer);
  var getRow = image.palete ? getPalette : getNonPalette;
  var writeRow = image.palette ? writePalette : writeNonPalette;
  for (var row = 0; row < image.height; row++) {
    var regArray = getRow(row);
    var revArray = regArray.reverse();
    writeRow(row);
  }
  fs.writeFileSync(writeFile, buffer);
  callback();

  function getPalette(row) {
    var rowArray = [];
    var rowSize = image.width;
    for (var i = 0; i < rowSize; i++) {
      rowArray.push(buffer.readUInt8(image.start + (rowSize * row) + i));
    }
    return rowArray;
  }

  function getNonPalette(row) {
    var rowArray = [];
    var rowSize = image.width * 3;
    for (var i = 0; i < rowSize; i += 3) {
      var pixel = {};
      pixel.blue = buffer.readUInt8(image.start + (rowSize * row) + i);
      pixel.green = buffer.readUInt8(image.start + (rowSize * row) + i + 1);
      pixel.red = buffer.readUInt8(image.start + (rowSize * row) + i + 2);
      rowArray.push(pixel);
    }
    return rowArray;
  }

  function writePalette(row) {
    var rowSize = image.width;
    for (var i = 0; i < rowSize; i++) {
      buffer.writeUInt8(revArray[i], image.start + (rowSize * row)  + i);
    }
  }

  function writeNonPalette(row) {
    var rowSize = image.width * 3;
    var index = 0;
    for (var i = 0; i < rowSize; i += 3) {
      buffer.writeUInt8(regArray[index].blue, image.start + (rowSize * row) + i);
      buffer.writeUInt8(regArray[index].green, image.start + (rowSize * row) + i + 1);
      buffer.writeUInt8(regArray[index].red, image.start + (rowSize * row) + i + 2);
      index++;
    }
  }
};

exports.invertColors = function invertColors(readFile, writeFile, callback) {
  var buffer = this.getBuffer(readFile);
  var image = this.getImageInfo(buffer);

  if (image.depth <= 8) {
    invertPalette();
  } else {
    invertPixels();
  }
  fs.writeFileSync(writeFile, buffer);
  callback();

  function invertPixels() {
    for (var offset = 0; offset < 30000; offset += 3) {
      var newBlue = 255 - buffer.readUInt8(image.start + offset);
      var newGreen = 255 - buffer.readUInt8(image.start + offset + 1);
      var newRed = 255 - buffer.readUInt8(image.start + offset + 2);
      buffer.writeUInt8(newBlue, image.start + offset);
      buffer.writeUInt8(newGreen, image.start + offset + 1);
      buffer.writeUInt8(newRed, image.start + offset + 2);
    }
  }

  function invertPalette() {
    var index = 0;
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var newRed = 255 - image.palette[index].red;
      var newGreen = 255 - image.palette[index].green;
      var newBlue = 255 - image.palette[index].blue;
      buffer.writeUInt8(newRed, 14 + image.dibHeaderSize + offset);
      buffer.writeUInt8(newGreen, 14 + image.dibHeaderSize + offset + 1);
      buffer.writeUInt8(newBlue, 14 + image.dibHeaderSize + offset + 2);
      index++;
    }
  }
};

exports.grayScale = function grayScale(readFile, writeFile, callback) {
  var buffer = this.getBuffer(readFile);
  var image = this.getImageInfo(buffer);

  if (image.depth <= 8) {
    grayscalePalette();
  } else {
    grayscalePixels();
  }
  fs.writeFileSync(writeFile, buffer);
  callback();

  function grayscalePixels () {
    for (var offset = 0; offset < 30000; offset += 3) {
      var oldBlue = buffer.readUInt8(image.start + offset);
      var oldGreen = buffer.readUInt8(image.start + offset + 1);
      var oldRed = buffer.readUInt8(image.start + offset + 2);
      var hue = (oldBlue + oldGreen + oldRed) / 3;
      buffer.writeUInt8(hue, image.start + offset);
      buffer.writeUInt8(hue, image.start + offset + 1);
      buffer.writeUInt8(hue, image.start + offset + 2);
    }
  }

  function grayscalePalette() {
    var index = 0;
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var hue = (image.palette[index].red + image.palette[index].green + image.palette[index].blue) / 3;
      buffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset);
      buffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 1);
      buffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 2);
      index++;
    }
  }
};
