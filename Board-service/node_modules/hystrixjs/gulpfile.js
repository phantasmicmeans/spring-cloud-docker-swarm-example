var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var jasmine = require('gulp-jasmine');
var bump = require('gulp-bump');
var git = require('gulp-git');
var argv = require('yargs').argv;

var path = require('path');

var paths = {
    es6: ['src/**/*.js'],
    es5: 'lib'
};

gulp.task('babel', function (cb) {
    gulp.src(paths.es6)
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest(paths.es5));
    cb();
});

gulp.task('test', function () {
    return gulp.src(['test/**/*.spec.js', '!test/http/HystrixSSEStream-missing-deps.spec.js'])
        .pipe(jasmine({
            verbose:true,
            includeStackTrace:true
        })
    );
});

gulp.task('test-missing-deps', function () {
    return gulp.src(['test/**/*.spec.js', '!test/http/HystrixSSEStream.spec.js'])
        .pipe(jasmine({
            verbose:true,
            includeStackTrace:true
        })
    );
});

gulp.task('watch', function() {
    gulp.watch(paths.es6, ['babel']);
    gulp.watch(['test/**/*','lib/**/*'], ['test']);
});

gulp.task('bump', function () {
    return gulp.src(['./package.json'])
        .pipe(bump({type: argv.type || 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('tag', ['bump'], function () {
    var pkg = require('./package.json');
    var v = 'v' + pkg.version;
    var message = 'Release ' + v;

    return gulp.src('./')
        .pipe(git.commit(message))
        .pipe(git.tag(v, message))
        .pipe(git.push('origin', 'master', '--tags'))
        .pipe(gulp.dest('./'));
});

gulp.task('npm', ['tag'], function (done) {
    require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' })
        .on('close', done);
});

gulp.task('default', ['watch']);
