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