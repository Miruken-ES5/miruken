new function () {

  base2.package(this, {
    name   : "instances",
    exports: "Logger" 
  });

  eval(this.imports);

  const Logger = Base.extend({
    // hold the name for this logger
    name: "",

    constructor: function(name) {
      this.name = name;
    }

  });

  eval(this.exports);

};