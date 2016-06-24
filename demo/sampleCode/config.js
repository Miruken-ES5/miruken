System.config({
  transpiler         : "babel",
  defaultJSExtensions: true,
  map: {
    "babel"   : "node_modules/babel-core/browser.js",
    "card"    : "src/cards/card.js",
    "messages": "src/messages.js",
  },
  babelOptions:{
    stage: 0
  }
});
