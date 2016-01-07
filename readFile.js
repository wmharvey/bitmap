var fs = require('fs');

function getBuffer (filename) {
  return fs.readFileSync(filename);
}

var image = {};

function getImageInfo (buffer) {
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

  image.palette = getPalette();
  console.log('image palette: ' + image.palette[31].red);

  function getPalette () {
    var paletteArr = [];
    for (var index = 0; index <= 128; index += 4) {
      var color = {};
      color.red = buffer.readUInt8(14 + image.dibHeaderSize + index);
      color.green = buffer.readUInt8(14 + image.dibHeaderSize + index + 1);
      color.blue = buffer.readUInt8(14 + image.dibHeaderSize + index + 2);
      color.alpha = buffer.readUInt8(14 + image.dibHeaderSize + index + 3);
      paletteArr.push(color);
    }
    return paletteArr;
  }
}

function grayScale (buffer) {

}

getImageInfo(getBuffer('./img/palette-bitmap.bmp'));
