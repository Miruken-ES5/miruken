module.exports = function (config) {
  "use strict";

  config.set({

    jspm: {
      config    : "config.js",
      packages  : "bower_components/system.js/dist",
      serveFiles: [
        "src/*.js"
        //"node_modules/**/*.js"
      ],
      loadFiles: [
        "src/*.js",
        "tests/*.js"
      ]
    },

    files: [
      "bower_components/miruken/dist/miruken-bundle.js"
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/*.js': ['coverage']
    },

    autoWatch: true,

    frameworks: ["jspm", "mocha", "chai"],

    browsers: ["Chrome"],

    plugins: [
      "karma-jspm",
      "karma-mocha",
      "karma-mocha-reporter",
      "karma-chrome-launcher",
      "karma-chai"
    ],

    reporters: ["mocha", "coverage"]

  });
};
