new function() {

	eval(base2.doctor.namespace);

	describe("Dr", () => {
		it("should have fullName with Dr and specialty", () => {
			var jack = new Doctor({
				firstName: "Jack",
				lastName : "Shephard",
				specialty: Doctor.spinalSurgeon
			});

			jack.fullName.should.be.equal("Dr. Jack Shephard, OSS");
		});
	});

};