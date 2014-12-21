var miruken = require('../miruken.js'),
    context = require('../context.js')
    error   = require('../error.js'),
    Q       = require('q'),
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(error.namespace);

describe("ErrorCallbackHandler", function () {
    describe("#handleError", function () {
        it("should handle errors", function () {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler(),
                error        = new Error('passwords do not match');
            context.addHandlers(errorHandler);
            Q.when(Errors(context).handleError(error), function () {
                done();
            }, function (error) { done(error); });
        });

        it("should be able to customize error handling", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler(),
                error        = new Error('Something bad happended');
            context.addHandlers(errorHandler);
            var customize    = context.newChildContext().extend({
                reportError: function (error, context) {
                    return Q('custom');
                }
            });
            Q.when(Errors(customize).handleError(error), function (result) {
                expect(result).to.equal('custom');
                done();
            }, function (error) { done(error); });
        });
    });

    describe("#handleException", function () {
        it("should handle exceptions", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler(),
                exception    = new TypeError('Expected a string argument');
            context.addHandlers(errorHandler);
            Q.when(Errors(context).handleException(exception), function () {
                done();
            }, function (error) { done(error); });
        });
    })
});

describe("CallbackHandler", function () {
    var Payments = Protocol.extend({
        validateCard: function (card) {},
        processPayment: function (payment) {}
    });

    var Paymentech = Base.extend({
        validateCard: function (card) {
            if (card.number.length < 10)
                throw new Error("Card number must have at least 10 digits");
        },
        processPayment: function (payment) {
            if (payment.amount > 500)
                return Q.reject(new Error("Amount exceeded limit"));
        }
    });

    describe("#recoverable", function () {
        it("should implicitly recover from errors synchronously", function () {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            Payments(context.recoverable()).validateCard({number:'1234'});
        });

        it("should implicitly recover from errors asynchronously", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler();
            context.addHandlers(new Paymentech(), errorHandler); 
            var pay = Payments(context.recoverable()).processPayment({amount:1000});
            Q.when(pay, function (result) {
                expect(result).to.be.undefined;
                done();
            }, function (error) { done(error); });
        });

        it("should be able to customize recovery from errors asynchronously", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var customize    = context.newChildContext().extend({
                reportError: function (error, context) {
                    return Q('custom');
                }
            });
            var pay = Payments(customize.recoverable()).processPayment({amount:1000});
            Q.when(pay, function (result) {
                expect(result).to.equal('custom');
                done();
            }, function (error) { done(error); });
        });

        it("should recover explicitly", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var pay = Payments(context).processPayment({amount:1000})
                .fail(context.recover());
            Q.when(pay, function (result) {
                expect(result).to.be.undefined;
                done();
            }, function (error) { done(error); });
        });

        it("should be able to customize recovery explicitly", function (done) {
            var context      = new Context(),
                errorHandler = new ErrorCallbackHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var customize    = context.newChildContext().extend({
                reportError: function (error, context) {
                    return Q('custom');
                }
            });
            var pay = Payments(context).processPayment({amount:1000})
                .fail(customize.recover());
            Q.when(pay, function (result) {
                expect(result).to.equal('custom');
                done();
            }, function (error) { done(error); });
        });
    });
});
