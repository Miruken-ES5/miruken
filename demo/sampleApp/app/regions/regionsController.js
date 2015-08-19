new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'RegionsController'
	});

	eval(this.imports);

	var RegionsController = Controller.extend({
		$properties:{
            content: null,
			message: 'Hello, Regions!'
		},
        partialOne: function () {
            var viewOne = {
                templateUrl:  'app/regions/partialOne.html',
                controller:   'PartialOneController as vm'
            };
            ViewRegion(this.content).present(viewOne);
        },
        partialTwo: function () {
            var viewOne = {
                templateUrl:  'app/regions/partialTwo.html',
                controller:   'PartialTwoController as vm'
            };
            ViewRegion(this.content).present(viewOne);
        },
        partialThree: function () {
            var viewOne = {
                templateUrl:  'app/regions/partialThree.html',
                controller:   'PartialThreeController as vm'
            };
            ViewRegion(this.content).present(viewOne);
        }
	});

	eval(this.exports);
        
}
