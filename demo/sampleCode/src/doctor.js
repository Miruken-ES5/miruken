new function() {

	base2.package(this, {
		name   : "doctor",
		imports: "person",
		exports: "Doctor"
	});

	eval(this.imports);

	const Doctor = Person.extend({
		$properties: {
			specialty: null
		},
		get fullName(){
			return `Dr. ${this.base()}, ${this.specialty}`
		}
	}, {
		earNoseThroat:  "ENT",
		familyPractice: "FP",
		spinalSurgeon:  "OSS"
	});

	eval(this.exports);
};