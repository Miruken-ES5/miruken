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

	base2.package(this, {
		name: "loggingTests",
		imports: "logging"
	});

	eval(this.imports);

	describe("NullLogger", () => {

		var logger = Logger.NullLogger;

		it("Logger should have an instance of NullLogger", () => {
			logger.should.not.be.nothing;
		});

		it("NullLogger should not throw exceptions", () => {
			logger.debug("some message");
			logger.error("some error");
		});
	});

	describe("Logger", () => {

		var logger = new Logger();

		it("Logger should write a debug message to the console", () => {
			logger.debug("my debug message");
		});

		it("Logger should write an error message to the console", () => {
			logger.error("my error message");
		});
	});

	eval(this.exports);

};