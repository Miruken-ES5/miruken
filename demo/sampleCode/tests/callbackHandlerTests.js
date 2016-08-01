describe("CallbackHandlers", () => {

    eval(base2.namespace);
    eval(miruken.namespace);
    eval(miruken.callback.namespace);
    eval(miruken.context.namespace);

    describe("Adopting Protocols", () => {

        let Logging = Protocol.extend({
                debug(message) {},
                error(message) {}
        });

        describe("explicitly", () => {

            let called = false;
            let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
                debug(message) {
                   called = true; 
                }
            });   

            it("debug is called base on the method name and Protocol", () => {
                Logging(new ObservableLoggingHandler()).debug("my message");
                called.should.be.true;   
            });

            it("the handler explictly adopts the Logging protocol", () => {
                Logging.adoptedBy(ObservableLoggingHandler).should.be.true;
                ObservableLoggingHandler.conformsTo(Logging).should.be.true;
            });

        });

        describe("implicitly", () => {

            let called = false;
            let ObservableLoggingHandler = CallbackHandler.extend({
                debug(message) {
                   called = true; 
                }
            });   

            it("debug is called base on the method name", () => {
                Logging(new ObservableLoggingHandler()).debug("my message");
                called.should.be.true;   
            });

            it("the handler does not explictly adopt the Logging protocol", () => {
                Logging.adoptedBy(ObservableLoggingHandler).should.be.false;
                ObservableLoggingHandler.conformsTo(Logging).should.be.false;
            });

        });

        describe("implicitly", () => {

            let ObservableLoggingHandler = CallbackHandler.extend({
            });   

            it("debug is called base on the method name", () => {
                Logging(new ObservableLoggingHandler()).debug("my message");
            });

        });

    });
});
