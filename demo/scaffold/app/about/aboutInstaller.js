new function() {

  var about = new base2.Package(this, {
    name:    'about',
    parent:  scaffoldApp,
    imports: 'miruken.ioc',
    exports: 'AboutInstaller'
  });

  eval(this.imports);

  var AboutInstaller = Installer.extend({
    $inject: ['$stateProvider'],
    constructor: function($stateProvider){
      $stateProvider
        .state('about', {
            url:          '/about',
            templateUrl:  'app/about/about.html',
            controller:   'AboutController',
            controllerAs: 'vm'
        });
    }
  });

  eval(this.exports);

};
