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
            ViewRegion(this.content.context).present({
                templateUrl:  'app/regions/partialOne.html',
                controller:   'PartialOneController as vm'
            });
        },
        partialTwo: function () {
            ViewRegion(this.content.context).present({
                templateUrl:  'app/regions/partialTwo.html',
                controller:   'PartialTwoController as vm'
        },
        partialThree: function () {
            ViewRegion(this.content.context).present({
                templateUrl:  'app/regions/partialThree.html',
                controller:   'PartialThreeController as vm'
            });
        }
	});

	eval(this.exports);
        
}
