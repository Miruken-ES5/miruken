new function (){
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc',
		exports: 'InheritanceInstaller'
	});

	eval(this.imports);

	var InheritanceInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider
				.when('/javascriptInheritance', {
					templateUrl: 'app/inheritance/javascriptInheritance.html',
					controller: 'JavascriptInheritanceController',
					controllerAs: 'vm'
				})
				.when('/mirukenInheritance', {
					templateUrl: 'app/inheritance/mirukenInheritance.html',
					controller: 'MirukenInheritanceController',
					controllerAs: 'vm'
				})
		}
	});

	eval(this.exports);
}
