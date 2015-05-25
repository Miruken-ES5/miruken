new function(){
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.mvc',
		exports: 'HelloWorldController'
	});

	eval(this.imports);

	var HelloWorldController = Controller.extend({
		$properties:{
			message: 'Hello, World!'
		}
	});

	eval(this.exports);
}