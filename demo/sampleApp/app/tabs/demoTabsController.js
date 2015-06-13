new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'DemoTabsController'
	});

	eval(this.imports);

	var Tab = Model.extend({
		name: null,
		view: null,
		active: null,
		regionContext: null
	});

	var DemoTabsController = Controller.extend({
		constructor: function(){
			this.extend({
				tabs: [
					new Tab({
						name: 'Tab A',
						view: {	
			                template:     'app/tabs/tabA.html',
			                controller:   'TabAController',
			                controllerAs: 'vm'
		            	},
		            	active: true
					}),
					new Tab({
						name: 'Tab B',
						view: {
			                template:     'app/tabs/tabB.html',
			                controller:   'TabBController',
			                controllerAs: 'vm'
		            	},
		            	active: false
					}),
					new Tab({
						name: 'Tab C',
						view: {
			                template:     'app/tabs/tabC.html',
			                controller:   'TabCController',
			                controllerAs: 'vm'
		            	},
		            	active: false
					})
				]
			});
		},
		load: function(tab){
			for (var i = 0; i < this.tabs.length; i++) {
				this.tabs[i].active = false;
			};
			tab.active = true;
			ViewRegion(this.tabContent.context).present(tab.view);
		}
	});

	eval(this.exports);
        
}
