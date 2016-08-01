new function() {
	base2.package(this, {
		name    : "person",
		imports : "person",
		exports : "Patient"
	});

	eval(this.imports);

	const Patient = Person.extend({
		$properties: {
			exams: []
		}
	});

	eval(this.exports);
};