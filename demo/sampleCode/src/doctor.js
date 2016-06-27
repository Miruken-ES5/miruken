new function() {

	base2.package(this, {
		name   : "doctor",
		imports: "person",
		exports: "Doctor"
	});

	eval(this.imports);

	const Doctor = Person.extend({
		$properties: {
			firstName: null,
			lastName : null,
			gender   : null
		},
		get fullName(){
			return `${this.firstName} ${this.lastName}`
		}
	}, {
		male          : "MALE",
		female        : "FEMALE",
		complicated: "COMPLICATED"
	});

	eval(this.exports);
};