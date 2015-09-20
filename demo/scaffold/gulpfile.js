var gulp = require('gulp');
var inject = require('gulp-inject');
var browserSync = require('browser-sync');
var jshint = require('gulp-jshint');
var reload = browserSync.reload;

gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    return gulp.src('./index.html')
        .pipe(wiredep())
        .pipe(gulp.dest('./'));
});

gulp.task('inject', function () {
    var target = gulp.src('./index.html');
    var sources = gulp.src(['./app/**/*.js', './css/**/*.css'], {read: false});

    return target.pipe(inject(sources))
        .pipe(gulp.dest('./'));
});

gulp.task('serve', function () {
    browserSync({
        notify: false,
        port: 9100,
        server: {
            baseDir: './'
        }
    });

    // watch for changes
    gulp.watch([
        './**/*.html',
        'app/**/*.js',
        'css/**/*.css'
    ]).on('change', reload);

    //gulp.watch('css/**/*.css', ['styles']);
    gulp.watch('app/**/*.js', ['inject']);
    gulp.watch('bower.json', ['wiredep']);
});

gulp.task('jshint', function () {
    return gulp.src(['./gulpfile.js', 'app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', { verbose: true }));
});

gulp.task('default',['wiredep', 'index'], function(){

});

