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
        exports: ""
    });

    eval(this.imports);

    var Player = Base.extend({
        constructor: function (firstName, lastName, dob) {
            this.extend({
                getFirstName: function () { return firstName; },
                setFirstName: function (value) { firstName = value; },
                getLastName:  function () { return lastName; },
                setLastName:  function (value) { lastName = value; },
                getDOB:       function () { return dob; },
                setDOB:       function (value) { dob = value; }
            });
        }});
    
  eval(this.exports);
};

eval(base2.validatejs_test.namespace);

describe("ValidationJsCallbackHandler", function () {
    describe("#validate", function () {
        it("should get the validated object", function () {

        });
    });
});
