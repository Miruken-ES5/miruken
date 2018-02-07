module.exports = function(grunt) {
  // Project Configuration
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    app: {
      scripts: [
        'bower_components/gsap/src/minified/TweenMax.min.js',
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-route/angular-route.js',
        '../../dist/miruken-ng-bundle.js',
        'app/sampleAppSetup.js',
        'app/domain/person.js',
        'app/**/*.js'
      ]
    },
    watch: {
      js: {
        files: [
          'lib/**/*.js',
          'demo/sampleApp/app/**/*.js'
        ],
        tasks: ['default'],
        options: {
            spawn: false
            //livereload: true,
        }
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
           'dist/miruken-bundle.js':    ['lib/index.js'],
           'dist/miruken-ng-bundle.js': ['lib/index.js', 'lib/mvc/index.js', 'lib/angular/index.js'],
           'dist/miruken-tests.js':     ['test/**/*.js']
        }
      },
      debug: {
        files: {
           'debug/miruken-tests.js':  ['test/ioc/ioc-test.js']
           //'debug/miruken-tests.js':     ['test/**/*.js']
        }
      }
    },
    uglify: {
        dist: {
          files: {
              'dist/miruken-bundle.min.js': ['dist/miruken-bundle.js'],
              'dist/miruken-ng-bundle.min.js': ['dist/miruken-ng-bundle.js']
          }
        }
    },
    karma: {
        ci: {
          configFile: 'karma.conf.js',
          singleRun:  true,
          reporters:  ["teamcity"]
        },
        dist: {
          configFile: 'karma.conf.js',
          singleRun: true
        },
        debug: {
          configFile: 'karma.conf.js',
          options: {
              files: ['debug/miruken-tests.js']
          },
          singleRun: false
        }
    },
    yuidoc: {
        all: {
            name:        '<%= pkg.name %>',
            description: '<%= pkg.description %>',
            version:     '<%= pkg.version %>',
            url:         '<%= pkg.homepage %>',
            options: {
                paths:       ['./lib'],
                ignorePaths: ['./lib/base2.js'],
                outdir:       './documentation/docs/',
                themedir:     './documentation/theme'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-include-source');

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  //Test task.
  grunt.registerTask('default', ['browserify:dist']);
  grunt.registerTask('test',    ['concurrent:test']);
  grunt.registerTask('build',   ['minify', 'karma:dist']);
  grunt.registerTask('ci',      ['minify', 'karma:ci']);
  grunt.registerTask('debug',   ['browserify:debug','karma:debug']);
  grunt.registerTask("minify",  ['browserify:dist', 'uglify']);
};
