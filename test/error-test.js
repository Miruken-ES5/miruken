var miruken  = require('../lib/miruken.js'),
    context  = require('../lib/context.js')
    error    = require('../lib/error.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(error.namespace);

describe("ErrorCallbackHandler", function () {
    describe("#handleError", function () {
        it("should handle errors", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                error        = new Error('passwords do not match');
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleError(error)).then(function () {
                done();
            });
        });

        it("should be able to customize error handling", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                error        = new Error('Something bad happended');
            context.addHandlers(errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            Promise.resolve(Errors(customize).handleError(error)).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });
    });

    describe("#handleException", function () {
        it("should handle exceptions", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                exception    = new TypeError('Expected a string argument');
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleException(exception)).then(function () {
                done();
            });
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
                return Promise.reject(new Error("Amount exceeded limit"));
        }
    });

    describe("#recoverable", function () {
        it("should implicitly recover from errors synchronously", function () {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            Payments(context.recover()).validateCard({number:'1234'});
        });

        it("should implicitly recover from errors asynchronously", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler); 
            var pay = Payments(context.recover()).processPayment({amount:1000});
            Promise.resolve(pay).then(function (result) {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery from errors asynchronously", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            var pay = Payments(customize.recover()).processPayment({amount:1000});
            Promise.resolve(pay).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });

        it("should recover explicitly", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var pay = Payments(context).processPayment({amount:1000})
                .catch(context.recoverError());
            Promise.resolve(pay).then(function (result) {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery explicitly", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            var pay = Payments(context).processPayment({amount:1000})
                .catch(customize.recoverError());
            Promise.resolve(pay).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });
    });
});
