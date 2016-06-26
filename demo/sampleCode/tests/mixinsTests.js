new function(){

	eval(base2.mixins.namespace)

	describe("statics", () => {
		
		let rover = new Animal('Rover');

		it("should export Animal", ()=>{
			Animal.should.not.be.null;
		});

		it("should have a verify method", () => {
			rover.verify().should.be.true
		});

	});
}