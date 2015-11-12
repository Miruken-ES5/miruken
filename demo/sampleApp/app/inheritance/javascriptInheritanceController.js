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

			var Employee = function(first, last, gender, title, payGrade){
				Person.call(this, first, last, gender)
				this.title = title;
				this.payGrade = payGrade;
			}

			Employee.prototype = Object.create(Person.prototype, {
				constructor: {
					configurable: true,
					enumerable: true,
					value: Employee,
					writable: true
				}
			});

			Employee.prototype.fullname = function (){
				return Person.prototype.fullname.call(this) + ', ' + this.title;
			}
			
			this.extend({
				person:  new Person('Hari', 'Seldon', Person.MALE),
				employee: new Employee('Raych', 'Seldon', Person.MALE, 'Professor', 3),
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
