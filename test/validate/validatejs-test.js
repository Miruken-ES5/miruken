var miruken  = require('../../lib/miruken.js'),
    context  = require('../../lib/context.js')
    validate = require('../../lib/validate'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(validate.namespace);

new function () { // closure

    var validatejs_test = new base2.Package(this, {
        name:    "validatejs_test",
        exports: "Address,LineItem,Order"
    });

    eval(this.imports);

    var Address = Base.extend({
        $properties: {
            line:    { validate: { presence: true } },
            city:    { validate: { presence: true } },
            state:   { validate: { presence: true } },
            zipcode: { validate: { presence: true } },
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
           quanity: {
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
            address:   { map: Address },
            lineItems: { map: LineItem }
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
        it("should validate simple object", function () {
            var address = new Address;
            Validator(context).validate(address);
        });
    });
});
