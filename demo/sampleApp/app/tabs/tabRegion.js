new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.ng,miruken.mvc',
		exports: 'Tab,TabRegion,BsTabRegion'
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
		controller: Controller.extend({
			load: function(tab){
				for (var i = 0; i < this.tabs.length; i++) {
					this.tabs[i].active = false;
				};
				tab.active = true;	
				ViewRegion(this.tabContent.context).present(tab.view);
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

	var BsTabRegion = TabRegion.extend({
		scope: {
			tabs:   '=',
			active: '=',
			pills:   '='
		},
		template: 	'<div>' +
						'<ul class="nav" ng-class="{\'nav-tabs\': !vm.pills, \'nav-pills\': vm.pills}">' +
						  '<li role="presentation" ng-repeat="tab in vm.tabs" ng-click="vm.load(tab)" ng-class="{\'active\': tab.active}">' +
						  	'<a href="">{{ tab.name }}</a>' +
						  '</li>' +
						'</ul>' +
						'<div region="tabContent" onload="vm.load(vm.active ? vm.active : vm.default)" foo="bar">' +
						'</div>' +
					'</div>'
	});

	eval(this.exports);
        
}
