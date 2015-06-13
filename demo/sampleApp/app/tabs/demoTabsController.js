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
			                template:     'app/tabs/tabA.html',
			                controller:   'TabAController',
			                controllerAs: 'vm'
		            	}
					}),
					new Tab({
						name: 'Tab B',
						view: {
			                template:     'app/tabs/tabB.html',
			                controller:   'TabBController',
			                controllerAs: 'vm'
		            	}
					})
				],
				tabSetTwo: [
					new Tab({
						name: 'Tab C',
						view: {
			                template:     'app/tabs/tabC.html',
			                controller:   'TabCController',
			                controllerAs: 'vm'
		            	}
					}),
					new Tab({
						name: 'Tab D',
						view: {
			                template:     'app/tabs/tabD.html',
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
