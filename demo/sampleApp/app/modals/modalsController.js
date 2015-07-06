new function(){
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.mvc',
		exports: 'ModalsController'
	});

	eval(this.imports);

	var ModalsController = Controller.extend({
		showModal: function(){
			alert('Show modal here');
		}
	});

	eval(this.exports);
}