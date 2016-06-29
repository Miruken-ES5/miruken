/* 
 * The MIT License
 *
 * Copyright 2016 Craig Neuwirt, Michael Dudley.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

new function(){

	eval(base2.statics.namespace)
	eval(base2.person.namespace)

	describe("statics in the Animal class", () => {
		
		let tom   = new Animal('Tom');
		let jerry = new Animal('Jerry');

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

	describe("statics in the Person class", () => {

		let dors = new Person({
			firstName: "Dors",
			lastName : "Venabili",
			gender   : Person.itsComplicated
		});

		it("Dors was actually a robot", () => {
			dors.gender.should.be.equal(Person.itsComplicated);
		});

	});
}
