var assert = require('assert');
var fs = require('fs');
var nonStream = require('../readFile');
var stream = require('../streamFile');

describe('end to end tests', function() {

  it('should match the pinned end image for non-streaming gray', function(done) {
    var end = fs.readFileSync('./img/gray-nonp-endtest.bmp');
    nonStream.grayScale('./img/non-palette-bitmap.bmp', './img/gray-test.bmp', function() {
      var created = fs.readFileSync('./img/gray-test.bmp');
      var comparison = end.compare(created);
      assert.equal(comparison, 0);
      done();
    });
  });

  it('should match the pinned end image for streaming gray', function(done) {
    var end = fs.readFileSync('./img/gray-nonp-endtest.bmp');
    stream.grayScale('./img/non-palette-bitmap.bmp', './img/gray-test.bmp', function() {
      var created = fs.readFileSync('./img/gray-test.bmp');
      var comparison = end.compare(created);
      assert.equal(comparison, 0);
      done();
    });
  });

  it('should match the pinned end image for non-streaming reverse', function(done) {
    var end = fs.readFileSync('./img/reverse-nonp-endtest.bmp');
    nonStream.reverseImage('./img/non-palette-bitmap.bmp', './img/reverse-test.bmp', function() {
      var created = fs.readFileSync('./img/reverse-test.bmp');
      var comparison = end.compare(created);
      assert.equal(comparison, 0);
      done();
    });
  });

});
