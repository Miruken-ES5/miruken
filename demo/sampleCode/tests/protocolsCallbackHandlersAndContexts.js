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

        describe("methods", () => {
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
            context.addHandlers(new ObservableLoggingHandler());

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

        describe("properties", () => {

            describe("with $properties", () => {
                let Logging  = Protocol.extend({
                    $properties: {
                        level: null
                    }
                });

                let LoggingHandler = CallbackHandler.extend(Logging, {
                    $properties: {
                        level: "debug" 
                    }
                });
                
                let context = new Context();
                context.addHandlers(new LoggingHandler());

                it("returns the property value", () => {
                    Logging(context).level
                        .should.equal("debug");
                });
    
                it("sets and returns values", () => {
                    Logging(context).level = "error";

                    Logging(context).level
                        .should.equal("error");
                });
            });

            describe("with getter and setter", () => {
                let Logging  = Protocol.extend({
                    get level() {},
                    set level(value) {}
                });

                let logLevel = "debug";
                let LoggingHandler = CallbackHandler.extend(Logging, {
                    get level() { return logLevel; },
                    set level(value) { logLevel = value; }
                });
                
                let context = new Context();
                context.addHandlers(new LoggingHandler());

                it("returns the property value", () => {
                    Logging(context).level
                        .should.equal("debug");
                });
    
                it("sets and returns values", () => {
                    Logging(context).level = "error";

                    Logging(context).level
                        .should.equal("error");
                });
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

    describe("Methods for working with protocols", () => {

        let Logging = Protocol.extend({
            debug(message) {}
        });
                
        let debugCalled = false;
        let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
            debug(message) {
                debugCalled = true;
            }
        });   

        let handler = new ObservableLoggingHandler();

        describe("$isProtocol", () => {
            it("Logging should be a protocol", () => {
                $isProtocol(Logging)
                    .should.be.true;
            });
        });

        describe("Protocol.isProtocol", () => {
            it("Logging should be a protocol", () => {
                Protocol.isProtocol(Logging)
                    .should.be.true;
            });
        });

        describe("adoptedBy from the perspective of a Protocol", () => {
            it("Logging should be adopted by the ObservableLoggingHandler", () => {
                Logging.adoptedBy(ObservableLoggingHandler)
                    .should.be.true;
            });
        });

        describe("conformsTo from the perspective of the CallbackHandler class", () => {
            it("ObservableLoggingHandler should conform to the Logging protocol", () => {
                ObservableLoggingHandler.conformsTo(Logging)
                    .should.be.true;
            });
        });

        describe("conformsTo from the perspective of a CallbackHandler instance", () => {
            it("handler should conform to the Logging protocol", () => {
                handler.conformsTo(Logging)
                    .should.be.true;
            });
        });

    });

    describe("CallbackHandler", () => {
        let Logging = StrictProtocol.extend({
            debug(message) {}
        });
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
