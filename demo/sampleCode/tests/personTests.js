new function() {

	eval(base2.person.namespace);

	describe("Person", () => {
		it("should have fullName property", () => {
			var hari = new Person({
				firstName: "Hari",
				lastName : "Seldon"
			});

			hari.fullName.should.be.equal("Hari Seldon");
		});
	});

};