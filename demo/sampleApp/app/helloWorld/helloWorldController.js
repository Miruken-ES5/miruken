new function(){
	 base2.package(this, {
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
