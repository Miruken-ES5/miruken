new function() {

	base2.package(this, {
		name   : "person",
		exports: "Person"
	});

	eval(this.imports);

	const Person = Base.extend({
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