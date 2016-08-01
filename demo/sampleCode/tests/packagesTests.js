new function() {

	base2.package(this, {
		name    : "packageTests",
		imports : "person"
	});

	eval(this.imports);

	describe("Person package", function() {
		var person;
		var patient;
		var student;

		beforeEach( () => {
			person = new Person({
				firstName: "Sean",
				lastName: "O'Brien",
				gender: Person.Male
			});
			patient = new Patient({
				firstName: "Sean",
				lastName: "O'Brien",
				gender: Person.Male,
				exams: [
					{
						type: "Lipids",
						result: 200
					},
				]
			});
			student = new Student({
				firstName: "Sean",
				lastName: "O'Brien",
				gender: Person.Male,
				grade: 92
			});
		});

		it("should have a person", function() {
			expect(person).to.exist;
		});

		it("should have a patient", function() {
			expect(patient).to.exist;
		});

		it("should have a student", function() {
			expect(student).to.exist;
		});
	});

};