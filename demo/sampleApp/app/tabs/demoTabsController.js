new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'DemoTabsController'
	});

	eval(this.imports);

	var DemoTabsController = Controller.extend({
		constructor: function(){
			this.extend({
				tabSetOne: [
					new Tab({
						name: 'Tab A',
						view: {	
			                templateUrl:  'app/tabs/tabA.html',
			                controller:   'TabAController',
			                controllerAs: 'vm'
		            	}
					}),
					new Tab({
						name: 'Tab B',
						view: {
			                templateUrl:  'app/tabs/tabB.html',
			                controller:   'TabBController',
			                controllerAs: 'vm'
		            	}
					})
				],
				tabSetTwo: [
					new Tab({
						name: 'Tab C',
						view: {
			                templateUrl:  'app/tabs/tabC.html',
			                controller:   'TabCController',
			                controllerAs: 'vm'
		            	}
					}),
					new Tab({
						name: 'Tab D',
						view: {
			                templateUrl:  'app/tabs/tabD.html',
			                controller:   'TabDController',
			                controllerAs: 'vm'
		            	}
					})
				]
			});
		}
	});

	eval(this.exports);
        
}
