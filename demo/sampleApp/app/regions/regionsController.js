new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'RegionsController'
	});

	eval(this.imports);

	var RegionsController = Controller.extend({
		$properties:{
			message: 'Hello, Regions!'
		},
        partialOne: function () {
            var viewOne = {
                templateUrl:  'app/regions/partialOne.html',
                controller:   'PartialOneController as vm'
            };
            ViewRegion(this.content.context).present(viewOne);
        }
	});

	eval(this.exports);
        
}
