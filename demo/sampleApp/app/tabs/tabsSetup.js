new function () {
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc',
		exports: 'TabsInstaller'
	});

	eval(this.imports);

	var TabsInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/tabs', {
				templateUrl: 'app/tabs/demoTabs.html',
				controller: 'DemoTabsController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);
}
