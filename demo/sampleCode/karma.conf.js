module.exports = function (config) {
  "use strict";

  config.set({

    jspm: {
      config    : "config.js",
      packages  : "bower_components/system.js/dist",
      serveFiles: [
        "src/**/*.js",
        "node_modules/**/*.js"
      ],
      loadFiles: [
        "src/person.js",
        "src/doctor.js",
        "src/*.js",
        "tests/*.js"
      ]
    },

    files: [
      "bower_components/miruken/dist/miruken-bundle.js",
    ],

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

    reporters: ["mocha"]

  });
};
