new function () {
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'WelcomeController'
	});

	eval(this.imports);

	var WelcomeController = Controller.extend({});

	eval(this.exports);
   
}
