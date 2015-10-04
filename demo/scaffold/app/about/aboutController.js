new function() {

  var about = new base2.Package(this, {
    name:    'about',
    parent:  scaffoldApp,
    imports: 'miruken.mvc',
    exports: 'AboutController'
  });

  eval(this.imports);

  var AboutController = Controller.extend({
    $properties:{
    },
    constructor: function(){
    }
  });

  eval(this.exports);

}
