new function(){

	eval(base2.statics.namespace)

	describe("statics", () => {
		
		var tom   = new Animal('Tom');
		var jerry = new Animal('Jerry');

		it("should export Animal", ()=>{
			Animal.should.not.be.null;
		});

		it("tom should have id of 1", () => {
			tom.id.should.be.equal(1);
		});

		it("jerry should have id of 2", () => {
			jerry.id.should.be.equal(2);
		});

		it("2 animals have been created", () => {
			Animal.count.should.be.equal(2);
		});

	});
}