module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      js: {
        files: ['lib/**.js'],
        tasks: ['jshint'],
        options: {
          livereload: true,
        },
      },
      mocha: {
        files: ['test/**/*.js'],
        tasks: ['mochaTest']
      }
    },
    jshint: {
      all: ['gruntfile.js', 'lib/*.js', 'test/**/*.js']
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      test: ['mochaTest', 'watch']
    },
    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: ['test/**/*.js']
    },
    browserify: {
      dist: {
        files: {
           'dist/miruken-bundle.js': ['lib/index.js'],
           'dist/miruken-ng-bundle.js': ['lib/index.js', 'lib/mvc/index.js', 'lib/angular/index.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-browserify');

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  //Test task.
  grunt.registerTask('test', ['concurrent:test']);
};
