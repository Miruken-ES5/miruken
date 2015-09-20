new function() {

  var scaffoldApp = new base2.Package(this, {
    name:    'scaffoldApp',
    imports: 'miruken.ioc',
    exports: 'ScaffoldInstaller',
    ngModule: []
  });

  eval(this.imports);

  var ScaffoldInstaller = Installer.extend({
    constructor: function(){

    }
  });

  eval(this.exports);

};
