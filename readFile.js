var fs = require('fs');

function getBuffer (filename) {
  return fs.readFileSync(filename);
};

var image = {};

function getImageInfo () {
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

  image.paletteSize = Math.pow(2, image.depth) * 4;
  console.log('paletteSize:', image.paletteSize);

  image.size = buffer.readUInt32LE(34);
  console.log('image size: ' + image.size);

  image.palette = getPalette();
  console.log('image palette:', image.palette[28].red, image.palette[28].green, image.palette[28].blue);

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
};

function reverseImage () {
  var revBuffer = new Buffer (buffer);
  for (var row = 1; row <= image.height; row++) {
    var regArray = getRow(row);
    var revArray = regArray.reverse();
    writeRow(row);
  }
  fs.writeFile('img/reversed-palette.bmp', revBuffer);

  function getRow(row) {
    var rowArray = [];
    for (var i = 0; i < image.width; i++) {
      rowArray.push(buffer.readUInt8(image.start + (100 * (row - 1)) + i));
    }
    return rowArray;
  };

  function writeRow(row) {
    for (var i = 0; i < image.width; i++) {
      revBuffer.writeUInt8(revArray[i], image.start + (100 * (row - 1))  + i);
    }
  };
};

function invertColors() {
  var invertBuffer = new Buffer(buffer);
  if (image.depth <= 8) {
    invertPalette();
  }

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
    fs.writeFile('img/inverted-palette.bmp', invertBuffer);
  };
};

function grayScale() {
  var grayBuffer = new Buffer(buffer);
  if (image.depth <= 8) {
    grayscalePalette();
  }

  function grayscalePalette() {
    var index = 0;
    for (var offset = 0; offset < image.paletteSize; offset += 4) {
      var hue = (image.palette[index].red + image.palette[index].green + image.palette[index].blue) / 3;
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset);
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 1);
      grayBuffer.writeUInt8(hue, 14 + image.dibHeaderSize + offset + 2);
      index++;
    }
    fs.writeFile('img/grayscale-palette.bmp', grayBuffer);
  }
}


var buffer = getBuffer('./img/palette-bitmap.bmp');
getImageInfo();
reverseImage();
invertColors();
grayScale();
