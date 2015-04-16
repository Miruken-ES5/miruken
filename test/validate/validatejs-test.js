var miruken    = require('../../lib/miruken.js'),
    context    = require('../../lib/context.js')
    validate   = require('../../lib/validate'),
    validatejs = require("validate.js"),
    Promise    = require('bluebird'),
    chai       = require("chai"),
    expect     = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(validate.namespace);

validatejs.validators.throws = function () {
    throw new Error("Oh No!");
};

validatejs.validators.throwsAsync = function () {
    return Promise.reject(new Error("Oh No!"));
};

new function () { // closure

    var validatejs_test = new base2.Package(this, {
        name:    "validatejs_test",
        exports: "Address,LineItem,Order"
    });

    eval(this.imports);

    var Address = Base.extend({
        $properties: {
            line:    { validate: $required },
            city:    { validate: $required },
            state:   { validate: $required },
            zipcode: { validate: $required },
        }
    });

    var LineItem = Base.extend({
        $properties: {
           plu: { 
               validate: {
                   presence: true,
                   length: { is: 5 }
               }
           },
           quantity: {
               value: 0,
               validate: {
                   numericality: {
                       onlyInteger: true,
                       greaterThan: 0
                   }
               }
           }
        }
    });

    var Order = Base.extend({
        $properties: {
            address:   { map: Address,  validate: $nested },
            lineItems: { map: LineItem, validate: $nested }
        }
    });
        
    eval(this.exports);

};

eval(base2.validatejs_test.namespace);

describe("ValidateJsCallbackHandler", function () {
    var context;
    beforeEach(function() {
        context = new Context;
        context.addHandlers(new ValidationCallbackHandler, new ValidateJsCallbackHandler);
    });

    describe("#validate", function () {
        it("should validate simple objects", function () {
            var address = new Address,
                results = Validator(context).validate(address);
            expect(results.line.errors.presence).to.eql([{
                message: "Line can't be blank",
                value:   undefined
            }]);
            expect(results.city.errors.presence).to.eql([{
                message: "City can't be blank",
                value:   undefined
            }]);
            expect(results.state.errors.presence).to.eql([{
                message: "State can't be blank",
                value:   undefined
            }]);
            expect(results.zipcode.errors.presence).to.eql([{
                message: "Zipcode can't be blank",
                value:   undefined
            }]);
        });

        it("should validate complex objects", function () {
            var order       = new Order;
            order.address   = new Address({
                line:    "100 Tulip Ln",
                city:    "Wantaugh",
                state:   "NY",
                zipcode: 11580
            });
            var results = Validator(context).validate(order);
            expect(results.isValid()).to.be.true;
        });

        it("should invalidate complex objects", function () {
            var order       = new Order;
            order.address   = new Address;
            order.lineItems = [new LineItem];
            var results = Validator(context).validate(order);
            expect(results.address.line.errors.presence).to.eql([{
                message: "Line can't be blank",
                value:   undefined
            }]);
            expect(results.address.city.errors.presence).to.eql([{
                message: "City can't be blank",
                value:   undefined
            }]);
            expect(results.address.state.errors.presence).to.eql([{
                message: "State can't be blank",
                value:   undefined
            }]);
            expect(results.address.zipcode.errors.presence).to.eql([{
                message: "Zipcode can't be blank",
                value:   undefined
            }]);
            expect(results["lineItems.0"].plu.errors.presence).to.eql([{
                message: "Plu can't be blank",
                value:   undefined
            }]);
            expect(results["lineItems.0"].quantity.errors.numericality).to.eql([{
                message: "Quantity must be greater than 0",
                value:   0
            }]);
            expect(results.errors.presence).to.deep.include.members([{
                key:     "address.line",
                message: "Line can't be blank",
                value:   undefined
              }, {
                key:     "address.city",
                message: "City can't be blank",
                value:   undefined
              }, {
                key:     "address.state",
                message: "State can't be blank",
                value:   undefined
              }, {
                key:     "address.zipcode",
                message: "Zipcode can't be blank",
                value:   undefined
              }, {
                key:     "lineItems.0.plu",
                message: "Plu can't be blank",
                value:   undefined
              }
            ]);
            expect(results.errors.numericality).to.deep.include.members([{
                  key:     "lineItems.0.quantity",
                  message: "Quantity must be greater than 0",
                  value:   0
                }
            ]);
        });

        it("should pass exceptions through", function () {
            var ThrowOnValidation = Base.extend({
                $properties: {
                    bad:  { validate: { throws: true } }
                }
            });                
            expect(function () {
                Validator(context).validate(new ThrowOnValidation);
            }).to.throw(Error, "Oh No!");
        });

        it("should dynamically find validators", function () {
            var MissingValidator = Base.extend({
                $properties: {
                    code:  { validate: { uniqueCode: true } }
                }
            });
            context.addHandlers((new CallbackHandler).extend({
                $provide:[
                    "uniqueCode", function () { return this; }
                ],
                validate: function(value, options, key, attributes) {
                }
            }));
            expect(Validator(context).validate(new MissingValidator).isValid()).to.be.true;
        });
    });

    describe("#validateAsync", function () {
        it("should validate simple objects", function () {
             var address = new Address;
             Validator(context).validateAsync(address).then(function (results) {
                 expect(results.line.errors.presence).to.eql([{
                     message: "Line can't be blank",
                     value:   undefined
                 }]);
                 expect(results.city.errors.presence).to.eql([{
                     message: "City can't be blank",
                     value:   undefined
                 }]);
                 expect(results.state.errors.presence).to.eql([{
                     message: "State can't be blank",
                     value:   undefined
                 }]);
                 expect(results.zipcode.errors.presence).to.eql([{
                     message: "Zipcode can't be blank",
                     value:   undefined
                }]);
            });
        });

        it("should invalidate complex objects", function (done) {
            var order       = new Order;
            order.address   = new Address;
            order.lineItems = [new LineItem];
            Validator(context).validateAsync(order).then(function (results) {
                expect(results.address.line.errors.presence).to.eql([{
                    message: "Line can't be blank",
                    value:   undefined
                }]);
                expect(results.address.city.errors.presence).to.eql([{
                    message: "City can't be blank",
                    value:   undefined
                }]);
                expect(results.address.state.errors.presence).to.eql([{
                    message: "State can't be blank",
                    value:   undefined
                }]);
                expect(results.address.zipcode.errors.presence).to.eql([{
                    message: "Zipcode can't be blank",
                    value:   undefined
                }]);
                expect(results["lineItems.0"].plu.errors.presence).to.eql([{
                    message: "Plu can't be blank",
                    value:   undefined
                }]);
                expect(results["lineItems.0"].quantity.errors.numericality).to.eql([{
                    message: "Quantity must be greater than 0",
                    value:   0
                }]);
                expect(results.errors.presence).to.deep.include.members([{
                    key:     "address.line",
                    message: "Line can't be blank",
                    value:   undefined
                  }, {
                     key:     "address.city",
                    message: "City can't be blank",
                    value:   undefined
                  }, {
                    key:     "address.state",
                    message: "State can't be blank",
                    value:   undefined
                  }, {
                    key:     "address.zipcode",
                    message: "Zipcode can't be blank",
                    value:   undefined
                  }, {
                    key:     "lineItems.0.plu",
                    message: "Plu can't be blank",
                    value:   undefined
                  }
                ]);
                expect(results.errors.numericality).to.deep.include.members([{
                    key:     "lineItems.0.quantity",
                    message: "Quantity must be greater than 0",
                    value:   0
                  }
                ]);
                done();
            });
        });
           
        it("should pass exceptions through", function (done) {
            var ThrowOnValidation = Base.extend({
                $properties: {
                    bad:  { validate: { throwsAsync: true } }
                }
            });
            Validator(context).validateAsync(new ThrowOnValidation).catch(function (error) {
                expect(error.message).to.equal("Oh No!");
                done();
            });
        });
    });
});
