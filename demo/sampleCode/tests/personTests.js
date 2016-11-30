new function() {

	eval(base2.person.namespace);

	describe("Person", () => {
		var hari;

		beforeEach(() => {
			hari = new Person({
				firstName: "Hari",
				lastName : "Seldon",
				gender   : Person.male
			});
		});

		it("should have a firstName property", () => {
			hari.firstName.should.be.equal("Hari");
		});

		it("should have a lastName property", () => {
			hari.lastName.should.be.equal("Seldon");
		});

		it("should have a gender property", () => {
			hari.gender.should.be.equal(Person.male);
		});

		it("should have fullName property", () => {
			hari.fullName.should.be.equal("Hari Seldon");
		});
	});

};