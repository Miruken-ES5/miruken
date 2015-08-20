new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc',
		exports: 'AnimationInstaller'
	});

	eval(this.imports);

	var AnimationInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/animation', {
				templateUrl: 'app/animation/animation.html',
				controller: 'AnimationController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);
}
