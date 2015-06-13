new function(){
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'WelcomeController'
	});

	eval(this.imports);

	var WelcomeController = Controller.extend({});

	eval(this.exports);
}
