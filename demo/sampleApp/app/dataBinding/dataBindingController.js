new function(){
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'DataBindingController'
	});

	eval(this.imports);

	var DataBindingController = Controller.extend({
		$properties:{
			first: 'Hari',
			last:  'Seldon'
		},
        get fullName() { 
			return format('%1 %2', this.first, this.last);
		}
	});

	eval(this.exports);
    
}
