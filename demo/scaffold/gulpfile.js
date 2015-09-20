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

gulp.task('index', function () {
    var target = gulp.src('./index.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
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
        'app/**/*.js'
    ]).on('change', reload);

    //gulp.watch('app/styles/**/*.css', ['styles']);
    //gulp.watch('app/fonts/**/*', ['fonts']);
    //gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('jshint', function () {
    return gulp.src(['./gulpfile.js', 'app/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', { verbose: true }));
});

gulp.task('default',['wiredep', 'index'], function(){

});

