describe("Protocol CallbackHandler and Context", () => {

	eval(miruken.namespace);
	eval(miruken.callback.namespace);
	eval(miruken.context.namespace);

	let Logging = Protocol.extend({
		debug(message) {}
	});

	let ConsoleLoggingHandler = CallbackHandler.extend(Logging, {
    	debug(message) {
    		console.log(`Debug: ${message}`);
    	}
    });   

	describe("Protocol", () => {
		let Logging = Protocol.extend({
			debug(message) {}
		});

		let debugCalled = false;
		let ObservableLoggingHandler = CallbackHandler.extend({
	    	debug(message) {
	    		debugCalled = true;
	    	}
	    });   

		let context = new Context();
		context.addHandlers([new ObservableLoggingHandler()]);

		describe("will match the first callback handler found with method name", () => {
			it("will be called", () => {
				Logging(context).debug("message");
				debugCalled.should.be.true;
			});
		});

		describe("parameter count is not taken into consideration", () => {
			it("will still be called", () => {
				Logging(context).debug("message", "something else");
				debugCalled.should.be.true;
			});
		});
	});

	describe("StrictProtocol", () => {
		
		let Logging = StrictProtocol.extend({
			debug(message) {}
		});

		describe("will only match methods on callback handlers that explicity handle the protocol", () => {

			let debugCalled = false;
			let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
		    	debug(message) {
		    		debugCalled = true;
		    	}
		    });   

			let context = new Context();
			context.addHandlers([new ObservableLoggingHandler()]);

			it("will be called", () => {
				Logging(context).debug("message");
				debugCalled.should.be.true;
			});
		});

		describe("will not match methods on this handler because it does not explicity handle the Logging protocol", () => {

			let debugCalled = false;
			let ObservableLoggingHandler = CallbackHandler.extend({
		    	debug(message) {
		    		debugCalled = true;
		    	}
		    });   

			let context = new Context();
			context.addHandlers([new ObservableLoggingHandler()]);

			it("handler will not be called and will throw and exception", () => {
				
				(() => {
					Logging(context).debug("message");
				}).should.throw(Error);
				
				debugCalled.should.be.false;
			});
		});

	})

	describe("CallbackHandler", () => {

	});

	describe("Context", () => {

		let context = new Context();
		context.addHandlers([new ConsoleLoggingHandler()]);

		it("$Strict requires the CallbackHandler to explicitly handle the protocol", () => {

			Logging(context.$strict()).debug("Foo bar baz");
		});
		
		it("$Strict requires the CallbackHandler to explicitly handle the protocol", () => {
			Logging(context.$strict()).debug("Foo bar baz");
		});
		
		//Protocols
			//match on name and number of parameters

		//StrictProtocols

		//$Composer

		//aspect
		//filter

	});

});