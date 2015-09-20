new function() {

  var home = new base2.Package(this, {
    name:    'home',
    parent:  scaffoldApp,
    imports: 'miruken.mvc',
    exports: 'HomeController'
  });

  eval(this.imports);

  var HomeController = Controller.extend({
    $properties:{
      message: 'Hello, Miruken!'
    },
    constructor: function(){

    }
  });

  eval(this.exports);

}
