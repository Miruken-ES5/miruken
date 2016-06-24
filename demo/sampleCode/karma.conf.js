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
        "tests/*.js"
      ]
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

    reporters: ["mocha"]

  });
};
