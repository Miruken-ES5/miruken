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
		}
	});

	eval(this.exports);
        
}
