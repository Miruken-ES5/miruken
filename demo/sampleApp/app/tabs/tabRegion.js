new function () {
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.ng,miruken.mvc',
		exports: 'TabRegion,TabController'
	});

	eval(this.imports);

	var TabRegion = Directive.extend({
        restrict: 'E',
		scope:    true,
        constructor: function () {
            this.extend({
                link: function (scope, element, attr) {
                    var style         = attr.style,
                        context       = scope.context,
                        tabController = context.resolve(TabController);
                    style = style ? eval(style) : TabProviding;
                    var provider = style || TabProviding,
                        template = provider(context).tabContainer();
                    
                }
            });
        },
		templatez: 	'<div>' +
						'<ul class="nav" ng-class="{\'nav-tabs\': !vm.pills, \'nav-pills\': vm.pills}">' +
						  '<li role="presentation" ng-repeat="tab in vm.tabs" ng-click="vm.load(tab)" ng-class="{\'active\': tab.active}">' +
						  	'<a href="">{{ tab.name }}</a>' +
						  '</li>' +
						'</ul>' +
						'<div region="vm.name" onload="vm.load(vm.active ? vm.active : vm.default)" foo="bar">' +
						'</div>' +
					'</div>'
	});

	eval(this.exports);
        
}
