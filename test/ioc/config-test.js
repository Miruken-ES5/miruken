var miruken  = require('../../lib/miruken.js'),
    config   = require('../../lib/ioc/config.js'),
    Q        = require('q'),
    chai     = require("chai"),
    expect   = chai.expect;
              
eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(miruken.validate.namespace);
eval(miruken.ioc.namespace);
eval(config.namespace);

new function () { // closure

    var ioc_config_test = new base2.Package(this, {
        name:    "ioc_config_test",
        exports: "Controller,Credentials,LoginController"
    });

    eval(this.imports);

    var Controller = Base.extend({
    });

    var Credentials = Base.extend({
        constructor: function (user, password) {
            this.extend({
                getUser: function () { return user; },
                getPassword: function () { return password; }
            });
        }
    });

    var LoginController = Controller.extend({
        login: function () {}
    });

    eval(this.exports);
};

eval(base2.ioc_config_test.namespace);

describe("$classes", function () {
    var context, container;
    beforeEach(function() {
        context   = new Context;
        container = Container(context);
        context.addHandlers(new IoContainer, new ValidationCallbackHandler);
    });

    describe("#fromPackage", function () {
        it("should select classes from package", function (done) {
            container.register($classes.fromPackage(ioc_config_test)).then(function () {
                done();
            });
        });

        it("should select classes from package using hint", function (done) {
            container.register($classes(ioc_config_test)).then(function () {
                done();
            });
        });

        it("should reject package if not a Package", function () {
            expect(function () { 
                container.register($classes.fromPackage(Controller));
                }).to.throw(TypeError, /[$]classes expected a Package, but received.*Controller.*instead./);
        });
    });
});
