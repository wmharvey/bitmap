var gulp = require('gulp');
var jshint = require('gulp-jshint');
require('jshint-stylish');
var mocha = require('gulp-mocha');

gulp.task('run-tests', ['lint'], function() {
  gulp.src(['test/*.js'], {read: false})
    .pipe(mocha());
});

gulp.task('lint', function() {
  gulp.src(['./*.js', 'test/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', ['run-tests']);
