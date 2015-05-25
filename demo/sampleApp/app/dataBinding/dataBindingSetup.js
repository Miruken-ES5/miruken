new function(){
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.ioc',
		exports: 'DataBindingInstaller'
	});

	eval(this.imports);

	var DataBindingInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/dataBinding', {
					templateUrl: 'app/dataBinding/dataBinding.html',
					controller: 'DataBindingController',
					controllerAs: 'vm'
				});
		}
	});

	eval(this.exports);
}