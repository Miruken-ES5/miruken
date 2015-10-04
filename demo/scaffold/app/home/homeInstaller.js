new function() {

  var home = new base2.Package(this, {
    name:    'home',
    parent:  scaffoldApp,
    imports: 'miruken.ioc',
    exports: 'HomeInstaller'
  });

  eval(this.imports);

  var HomeInstaller = Installer.extend({
    $inject: ['$stateProvider'],
    constructor: function($stateProvider){
      $stateProvider
        .state('home', {
            url:          '/',
            templateUrl:  'app/home/home.html',
            controller:   'HomeController',
            controllerAs: 'vm'
        });
    }
  });

  eval(this.exports);

};
