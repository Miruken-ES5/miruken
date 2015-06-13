new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.ng,miruken.mvc',
		exports: 'Tab,TabRegion'
	});

	eval(this.imports);

	var Tab = Model.extend({
		name: null,
		view: null,
		active: false
	});

	var TabRegion = Directive.extend({
		scope: {
			tabs:   '=',
			active: '='
		},
		templateUrl: 'app/tabs/bootstrapTabs.html',
		controller: Controller.extend({
			load: function(tab){
				for (var i = 0; i < this.tabs.length; i++) {
					this.tabs[i].active = false;
				};
				tab.active = true;	
				ViewRegion(this.bootstrapTabContent.context).present(tab.view);
			},
			getDefault: function(){
				if(this.tabs.length){
					return this.tabs[0];
				}
			}
		}),
		controllerAs: 'vm',
		bindToController: true
	});

	eval(this.exports);
        
}
