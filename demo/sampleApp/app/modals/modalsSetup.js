new function (){
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc',
		exports: 'ModalsInstaller'
	});

	eval(this.imports);

	var ModalsInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function ($routeProvider){
			$routeProvider.when('/modals', {
				templateUrl:  'app/modals/modals.html',
				controller:   'ModalsController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);
}
