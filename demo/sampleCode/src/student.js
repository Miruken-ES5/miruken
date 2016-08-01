new function() {
	base2.package(this, {
		name    : "person",
		imports : "person",
		exports : "Student"
	});

	eval(this.imports);

	const Student = Person.extend({
		$properties: {
			grade: 0
		}
	});

	eval(this.exports);
};