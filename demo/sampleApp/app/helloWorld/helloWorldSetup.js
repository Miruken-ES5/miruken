new function(){
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.ioc',
		exports: 'HelloWorldInstaller'
	});

	eval(this.imports);

	var HelloWorldInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/helloWorld', {
				templateUrl: 'app/helloWorld/helloWorld.html',
				controller: 'HelloWorldController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);
}