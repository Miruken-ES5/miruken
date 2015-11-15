new function () {
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc',
		exports: 'RegionsInstaller'
	});

	eval(this.imports);

	var RegionsInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/regions', {
				templateUrl: 'app/regions/regions.html',
				controller: 'RegionsController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);
}
