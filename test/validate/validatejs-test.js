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

new function () { // closure

    var validatejs_test = new base2.Package(this, {
        name:    "validatejs_test",
        exports: "Address,LineItem,Order,User,Database,CustomValidators"
    });

    eval(this.imports);

    var Address = Base.extend({
        $properties: {
            line:    { validate: $required },
            city:    { validate: $required },
            state:   { 
               validate: {
                   presence: true,
                   length: { is: 2 }
               }
            },
            zipcode: { 
               validate: {
                   presence: true,
                   length: { is: 5 }
               }
            }
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
            address: {
                map: Address,  
                validate: {
                    presence: true,
                    nested: true
                }
            },
            lineItems: { 
                map: LineItem, 
                validate: {
                    presence: true,
                    nested: true
                }
            }
        }
    });

    var User = Base.extend({
        $properties: {
            userName: {
                validate: {
                   uniqueUserName: true
                }
            },
            orders: { map: Order }
        },
        constructor: function (userName) {
            this.userName = userName;
        }
    });      

    var Database = Base.extend({
        constructor: function (userNames) {
            this.extend({
                hasUserName: function (userName) {
                    return userNames.indexOf(userName) >= 0;
                }
            });
        }
    });

    var CustomValidators = ValidationRegistry.extend({
        mustBeUpperCase: function () {},
        uniqueUserName:  [Database, function (db, userName) {
            if (db.hasUserName(userName)) {
                return "UserName " + userName + " is already taken";
            }
        }]
    });

    eval(this.exports);

};

eval(base2.validatejs_test.namespace);

describe("ValidatorRegistry", function () {
    it("should not create instance", function () {
        expect(function () {
            new CustomValidators();
        }).to.throw(TypeError, "Abstract class cannot be instantiated.");
    });

    it("should register validators", function () {
        expect(validatejs.validators).to.have.property('mustBeUpperCase');
    });

    it("should register validators on demand", function () {
        CustomValidators.implement({
            uniqueLastName: function () {}
        });
        expect(validatejs.validators).to.have.property('uniqueLastName');
    });

    it("should register validators with dependencies", function () {
        expect(validatejs.validators).to.have.property('uniqueUserName');
    });
});

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
                zipcode: "11580"
            });
            order.lineItems = [new LineItem({plu: '12345', quantity: 2})];
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
            var ThrowValidators = ValidationRegistry.extend({
                throws:  function () {
                    throw new Error("Oh No!");
                }}),
                ThrowOnValidation = Base.extend({
                $properties: {
                    bad:  { validate: { throws: true } }
                }
            });                
            expect(function () {
                Validator(context).validate(new ThrowOnValidation);
            }).to.throw(Error, "Oh No!");
        });

        it("should validate with dependencies", function () {
            var user     = new User('neo'),
                database = new Database(['hellboy', 'razor']);
            context.addHandlers(new (CallbackHandler.extend(Invoking, {
                invoke: function (fn, dependencies) {
                    expect(dependencies[0]).to.equal(Database);
                    dependencies[0] = database;
                    for (var i = 1; i < dependencies.length; ++i) {
                        dependencies[i] = Modifier.unwrap(dependencies[i]);
                    }
                    return fn.apply(null, dependencies);
                }
            })));
            var results = Validator(context).validate(user);
            expect(results.valid).to.be.true;
            user.userName = 'razor';
            results = Validator(context).validate(user);
            expect(results.valid).to.be.false;
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
            var ThrowValidators = ValidationRegistry.extend({
                throwsAsync:  function () {
                    return Promise.reject(new Error("Oh No!"));
                }}),
                ThrowOnValidation = Base.extend({
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
