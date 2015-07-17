new function(){
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.ioc,miruken.ng',
		exports: 'DataBindingInstaller,ReverseFilter'
	});

	eval(this.imports);

	var DataBindingInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function ($routeProvider){
			$routeProvider.when('/dataBinding', {
			    templateUrl:  'app/dataBinding/dataBinding.html',
			    controller:   'DataBindingController',
			    controllerAs: 'vm'
		    });
		}
	});
    
    var ReverseFilter = Filter.extend({
        filter: function (input, uppercase) {
            var output = "";
            input = input || '';
            for (var i = 0; i < input.length; i++) {
                output = input.charAt(i) + output;
            }
            if (uppercase) {
                output = output.toUpperCase();
            }
            return output;
        }
    });

	eval(this.exports);
}
