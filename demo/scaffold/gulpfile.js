var gulp = require('gulp');

gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    return gulp.src('./index.html')
        .pipe(wiredep())
        .pipe(gulp.dest('./'));
});