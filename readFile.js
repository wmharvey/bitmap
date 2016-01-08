var fs = require('fs');

function getBuffer (filename) {
  return fs.readFileSync(filename);
};

function getImageInfo (buffer) {
  var image = {};

  image.type = String.fromCharCode(buffer.readUInt8(0)) + String.fromCharCode(buffer.readUInt8(1));
  console.log('image type: ' + image.type);

  image.start = buffer.readUInt32LE(10);
  console.log('image start:' + image.start);

  image.dibHeaderSize = buffer.readUInt32LE(14);
  console.log('image headerSize:' + image.dibHeaderSize);

  image.width = buffer.readInt32LE(18);
  console.log('image width: ' + image.width);

  image.height = buffer.readInt32LE(22);
  console.log('image height: ' + image.height);

  image.depth = buffer.readUInt16LE(28);
  console.log('image depth: ' + image.depth);

  image.size = buffer.readUInt32LE(34);
  console.log('image size: ' + image.size);

  if (image.depth <= 8) {
    image.paletteSize = Math.pow(2, image.depth) * 4;
    console.log('paletteSize:', image.paletteSize);

    image.palette = getPalette();
    console.log('image palette:', image.palette[28].red, image.palette[28].green, image.palette[28].blue);
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
  };
  return image;
};

function reverseImage (readFile, writeFile) {
  var buffer = getBuffer(readFile);
  var image = getImageInfo(buffer);

  var revBuffer = new Buffer (buffer);
  for (var row = 0; row < image.height; row++) {
    var regArray = getRow(row);
    var revArray = regArray.reverse();
    writeRow(row);
  }
  fs.writeFile(writeFile, revBuffer);

  function getRow(row) {
    var rowArray = [];
    if (image.palette) {
      var rowSize = image.width;
      for (var i = 0; i < image.width; i++) {
        rowArray.push(buffer.readUInt8(image.start + (rowSize * row) + i));
      }
    } else {
      var rowSize = image.width * 3;
      for (var i = 0; i < 300; i += 3) {
        var pixel = {};
        pixel.blue = buffer.readUInt8(image.start + (rowSize * row) + i);
        pixel.green = buffer.readUInt8(image.start + (rowSize * row) + i + 1);
        pixel.red = buffer.readUInt8(image.start + (rowSize * row) + i + 2);
        rowArray.push(pixel);
      }
    }
    return rowArray;
  };

  function writeRow(row) {
    if (image.palette) {
      for (var i = 0; i < image.width; i++) {
        revBuffer.writeUInt8(revArray[i], image.start + (100 * row)  + i);
      }
    } else {
      index = 0;
      for (var i = 0; i < 300; i += 3) {
        revBuffer.writeUInt8(regArray[index].blue, image.start + (image.width * 3 * row) + i);
        revBuffer.writeUInt8(regArray[index].green, image.start + (image.width * 3 * row) + i + 1);
        revBuffer.writeUInt8(regArray[index].red, image.start + (image.width * 3 * row) + i + 2);
        index++;
      }
    }
  };
};

function invertColors(readFile, writeFile) {
  var buffer = getBuffer(readFile);
  var image = getImageInfo(buffer);

  var invertBuffer = new Buffer(buffer);
  if (image.depth <= 8) {
    invertPalette();
  } else {
    invertPixels();
  }
  fs.writeFile(writeFile, invertBuffer);

  function invertPixels() {
    for (var offset = 0; offset < 30000; offset += 3) {
      var newBlue = 255 - buffer.readUInt8(image.start + offset);
      var newGreen = 255 - buffer.readUInt8(image.start + offset + 1);
      var newRed = 255 - buffer.readUInt8(image.start + offset + 2);
      invertBuffer.writeUInt8(newBlue, image.start + offset);
      invertBuffer.writeUInt8(newGreen, image.start + offset + 1);
      invertBuffer.writeUInt8(newRed, image.start + offset + 2);
    }
  };

  function invertPalette() {
    var index = 0;
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var newRed = 255 - image.palette[index].red;
      var newGreen = 255 - image.palette[index].green;
      var newBlue = 255 - image.palette[index].blue;
      invertBuffer.writeUInt8(newRed, 14 + image.dibHeaderSize + offset);
      invertBuffer.writeUInt8(newGreen, 14 + image.dibHeaderSize + offset + 1);
      invertBuffer.writeUInt8(newBlue, 14 + image.dibHeaderSize + offset + 2);
      index++;
    }
  };
};

function grayScale(readFile, writeFile) {
  var buffer = getBuffer(readFile);
  var image = getImageInfo(buffer);

  var grayBuffer = new Buffer(buffer);
  if (image.depth <= 8) {
    grayscalePalette();
  } else {
    grayscalePixels();
  }
  fs.writeFile(writeFile, grayBuffer);

  function grayscalePixels () {
    for (var offset = 0; offset < 30000; offset += 3) {
      var oldBlue = buffer.readUInt8(image.start + offset);
      var oldGreen = buffer.readUInt8(image.start + offset + 1);
      var oldRed = buffer.readUInt8(image.start + offset + 2);
      var hue = (oldBlue + oldGreen + oldRed) / 3;
      grayBuffer.writeUInt8(hue, image.start + offset);
      grayBuffer.writeUInt8(hue, image.start + offset + 1);
      grayBuffer.writeUInt8(hue, image.start + offset + 2);
    }
  };

  function grayscalePalette() {
    var index = 0;
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var hue = (image.palette[index].red + image.palette[index].green + image.palette[index].blue) / 3;
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset);
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 1);
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 2);
      index++;
    }
  };
};


reverseImage('./img/non-palette-bitmap.bmp', './img/reverse-non-palette.bmp');
invertColors('./img/palette-bitmap.bmp', './img/invert-palette.bmp');
grayScale('./img/non-palette-bitmap.bmp', './img/gray-non-palette.bmp');
