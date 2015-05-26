new function(){
	
	var sampleApp = new base2.Package(this, {
		name: 'sampleApp',
		imports: 'miruken.mvc',
		exports: 'JavascriptInheritanceController'
	});

	eval(this.imports);

	var JavascriptInheritanceController = Controller.extend({
		constructor: function(){
			
			var Person = function(first, last, gender){
				this.first = first;
				this.last = last;
				this.gender = gender;

				console.debug('Created person: ' + this.first + ' ' + this.last);
			}

			Person.prototype.fullname = function(){
				return this.first + ' ' + this.last;
			}

			Person.MALE = 'MALE';
			Person.FEMALE = 'FEMALE';

			var Employee = function(first, last, gender, payGrade){
				this.first = first;
				this.last = last;
				this.payGrade = payGrade;
			}

			Employee.prototype = new Person();
			Employee.prototype.constructor = Employee;
			
			this.extend({
				person:  new Person('Hari', 'Seldon', Person.MALE),
				employee: new Employee('Raych', 'Seldon', Person.MALE, 3),
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