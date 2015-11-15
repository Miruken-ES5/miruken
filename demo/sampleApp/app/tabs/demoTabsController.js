new function () {
    
	base2.package(this, {
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
			                controller:   'TabAController as vm'
		            	}
					}),
					new Tab({
						name: 'Tab B',
						view: {
			                templateUrl:  'app/tabs/tabB.html',
			                controller:   'TabBController as vm'
		            	}
					})
				],
				tabSetTwo: [
					new Tab({
						name: 'Tab C',
						view: {
			                templateUrl:  'app/tabs/tabC.html',
			                controller:   'TabCController as vm'
		            	}
					}),
					new Tab({
						name: 'Tab D',
						view: {
			                templateUrl:  'app/tabs/tabD.html',
			                controller:   'TabDController as vm'
		            	}
					}),
					new Tab({
						name: 'Tab E',
						view: {
			                templateUrl:  'app/tabs/tabE.html',
			                controller:   'TabEController as vm'
		            	}
					})
				]
			});
		}
	});

	eval(this.exports);
        
}
