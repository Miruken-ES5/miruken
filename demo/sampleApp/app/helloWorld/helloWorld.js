new function(){
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.mvc',
		exports: 'HelloWorld'
	});

	eval(this.imports);

	var HelloWorld = Controller.extend({
		$properties:{
			first: 'Hari',
			last: 'Seldon'
		},
		getFullName: function(){
			return format('%1 %2', this.first, this.last);
		}
	});

	eval(this.exports);
}