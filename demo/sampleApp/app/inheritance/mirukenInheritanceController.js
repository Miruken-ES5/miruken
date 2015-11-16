new function (){
	
	base2.package(this, {
		name: 'sampleApp',
		imports: 'miruken.mvc',
		exports: 'MirukenInheritanceController'
	});

	eval(this.imports);

	var MirukenInheritanceController = Controller.extend({
		constructor: function(){
			
			var Person = Base.extend({
				$properties: {
					first:  '',
					last:   '',
					gender: ''
				},
				get fullname() {
					return this.first + ' ' + this.last;
				}
			},{
				MALE:   'MALE',
				FEMALE: 'FEMALE'	
			});

			var Employee = Person.extend({
				$properties: {
					title: '',
					payGrade: 0
				},
				get fullname() {
					return this.base() + ', ' + this.title;
				}
			});
			
			this.extend({
				person:  new Person({
					first:   'Hari', 
					last:    'Seldon', 
					gender:  Person.MALE}),
				employee: new Employee({
					first:    'Raych', 
					last:     'Seldon', 
					gender:   Person.MALE, 
					payGrade: 3,
					title:    'Professor'}),
				isObject: function(object){
					return object instanceof Object;
				},
				isPerson: function(object){
					return object instanceof Person;
				},
				isEmployee: function(object){
					return object instanceof Employee;
				}
			})
			
		}
	});

	eval(this.exports);

}
