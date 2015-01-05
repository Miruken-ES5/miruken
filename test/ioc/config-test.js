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

require('./ioc-test.js');
eval(base2.ioc_test.namespace);

describe("ComponentBuilder", function () {
    var context, container;
    beforeEach(function() {
        context   = new Context();
        container = Container(context);
        context.addHandlers(new IoContainer, new ValidationCallbackHandler);
    });

    describe("#constructor", function () {
        it("should configure component fluently", function (done) {
            Q(container.register($component(V12))).then(function () {
                Q(container.resolve(V12)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });

    describe("#boundTo", function () {
        it("should configure component implementation", function (done) {
            Q(container.register(
                $component(Engine).boundTo(V12)
            )).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should configure component name", function (done) {
            Q(container.register(
                $component('engine').boundTo(V12)
            )).then(function () {
                Q(container.resolve('engine')).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });

    describe("#dependsOn", function () {
        it("should configure component dependencies", function (done) {
            Q(container.register(
                $component(Engine).boundTo(V12)
                                  .dependsOn($use(255), $use(5.0))
            )).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });
    });
});
