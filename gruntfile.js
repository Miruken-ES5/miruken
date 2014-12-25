module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      js: {
        files: ['**'],
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
      all: ['gruntfile.js', '*.js', 'test/**/*.js']
    },
    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: ['test/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-env');

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  //Test task.
  grunt.registerTask('test', ['mochaTest']);
};
