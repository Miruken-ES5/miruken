var miruken  = require('../miruken.js'),
    ioc      = require('../ioc.js'),
    Q        = require('q'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(miruken.validate.namespace);
eval(ioc.namespace);

new function () { // closure

    var ioc_test = new base2.Package(this, {
        name:    "ioc_test",
        exports: "Car,Engine,Diagnostics,V12,Ferarri,OBDII"
    });

    eval(this.imports);

    var Engine = Protocol.extend({
        getNumberOfCylinders: function () {},
        getHorsepower: function () {},
        getDisplacement: function () {}
    });

    var Car = Protocol.extend({
        getEngine: function () {}
    });

    var Diagnostics = Protocol.extend({
        getMPG: function () {}
    });

    var V12 = Base.extend(Engine, {
        constructor: function (horsepower, displacement, diagnostics) {
            this.extend({
                getHorsepower: function () { return horsepower; },
                getDisplacement: function () { return displacement; },
                getDiagnostics: function () { return diagnostics; }
            });
        },
        getNumberOfCylinders: function () { return 12; },
    });
          
    var Ferarri = Base.extend(Car, {
        $inject: [ Engine ],
        constructor: function (engine) {
            this.extend({
                getEngine: function () { return engine; }
            });
        }
    });

    var OBDII = Base.extend(Diagnostics, {
        $inject: [ Engine ],
        constructor: function (engine) {
            this.extend({
                getMPG: function () { return 22.0; }
            });
        }
    });

    eval(this.exports);
};

eval(base2.ioc_test.namespace);

describe("ComponentKeyPolicy", function () {
    describe("#setClass", function () {
        it("should reject invalid class", function () {
            var keyPolicy = new ComponentKeyPolicy;
            expect(function () {
                keyPolicy.setClass(1);
            }).to.throw(Error, "1 is not a class.");
        });
    });

    describe("#setService", function () {
        it("should reject service if not a protocol", function () {
            var keyPolicy = new ComponentKeyPolicy;
            expect(function () {
                keyPolicy.setService('logger');
            }).to.throw(Error, "logger is not a protocol.");
        });
    });

    describe("#setFactory", function () {
        it("should reject factory if not a function", function () {
            var keyPolicy = new ComponentKeyPolicy;
            expect(function () {
                keyPolicy.setFactory(true);
            }).to.throw(Error, "true is not a function.");
        });
    });

    describe("#setDependencies", function () {
        it("should reject dependencies if not an array", function () {
            var keyPolicy = new ComponentKeyPolicy;
            expect(function () {
                keyPolicy.setDependencies(Car);
            }).to.throw(Error, /is not an array/);
        });
    });

    describe("#effectiveKey", function () {
        it("should return class if no key", function () {
            var keyPolicy = new ComponentKeyPolicy;
            keyPolicy.setClass(Ferarri);
            expect(keyPolicy.effectiveKey()).to.equal(Ferarri);
        });
    });

    describe("#effectiveFactory", function () {
        it("should return default factory", function () {
            var keyPolicy = new ComponentKeyPolicy;
            keyPolicy.setClass(Ferarri);
            expect(keyPolicy.effectiveFactory()).to.be.a('function');
        });
    });

    describe("#collectDependencies", function () {
        it("should obtain dependencies from class if none specified", function () {
            var keyPolicy    = new ComponentKeyPolicy,
            dependencies = [];
            keyPolicy.setClass(Ferarri);
            keyPolicy.collectDependencies(dependencies);
            expect(dependencies).to.eql([Engine]);
        });
    });
});

describe("ComponentModel", function () {
    describe("#configure", function () {
        it("should configure model from class only", function () {
            var componentModel = new ComponentModel;
            componentModel.configure(Ferarri);
            expect(componentModel.effectiveKey()).to.equal(Ferarri);
        });

        it("should configure model from protocol and class", function () {
            var componentModel = new ComponentModel;
            componentModel.configure(Car, Ferarri);
            expect(componentModel.effectiveKey()).to.equal(Car);
        });

        it("should configure model from name and class", function () {
            var componentModel = new ComponentModel;
            componentModel.configure('car', Ferarri);
            expect(componentModel.effectiveKey()).to.equal('car');
        });

        it("should configure model with ComponentKeyPolicy", function () {
            var componentModel = new ComponentModel,
                keyPolicy      = new ComponentKeyPolicy;
            keyPolicy.setKey(Car);
            keyPolicy.setClass(Ferarri);
            componentModel.configure(keyPolicy);
            expect(componentModel.effectiveKey()).to.equal(Car);
        });

        it("should configure model from other component model", function () {
            var prototypeModel = new ComponentModel,
            componentModel = new ComponentModel;
            prototypeModel.configure(Car, Ferarri);
            componentModel.configure(prototypeModel);
            expect(componentModel.effectiveKey()).to.equal(Car);
        });

        it("should reject argument if not ComponentPolicy", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.configure(new Ferarri);
            }).to.throw(Error, /is not a ComponentPolicy/);
        });

        it("should reject more than one Lifestyle", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.configure(new TransientLifestyle, new SingletonLifestyle);
            }).to.throw(Error, "Only one LifeStyle policy is allowed.");
        });
    });
});

describe("IoContainer", function () {
    describe("#register", function () {
        var context   = new Context(),
            container = new IoContainer;
        context.addHandlers(container, new ValidationCallbackHandler);

        it("should register component", function (done) {
            Q.when(Container(context).register(Ferarri), function (registration) {
                expect(registration.componentModel.effectiveKey()).to.equal(Ferarri);
                done();
            }, function (error) { done(error); });
        });

        it("should unregister component", function (done) {
            Q.when(Container(context).register(V12), function (registration) {
                Q(Container(context).resolve(Engine)).then(function (engine) {
                    registration.unregister();
                    expect(engine).to.be.instanceOf(V12);
                    expect(Container(context).resolve(Engine)).to.be.undefined;
                    done();
                });
                }, function (error) { done(error); });
        });

        it("should reject registration if no key", function (done) {
            Q.when(Container(context).register(), undefined, function (error) {
                expect(error.getKeyErrors("Key")).to.eql([
                    new ValidationError("Key could not be determined for component.", {
                        key:  "Key",
                        code: ValidationErrorCode.Required
                    })
                ]);
                done();
            });
        });

        it("should reject registration if no factory", function (done) {
            Q.when(Container(context).register(), undefined, function (error) {
                expect(error.getKeyErrors("Factory")).to.eql([
                    new ValidationError("Factory could not be determined for component.", {
                        key:  "Factory",
                        code: ValidationErrorCode.Required
                    })
                ]);
                done();
            });
        });

        it("should reject registration if class does not conform to service", function (done) {
            var keyPolicy = new ComponentKeyPolicy;
            keyPolicy.setService(Car);
            keyPolicy.setClass(CallbackHandler);
            Q.when(Container(context).register(keyPolicy), undefined, function (error) {
                var keyPolicyError = error.getChildResults()[0].getKeyErrors("Class")[0];
                expect(keyPolicyError.userInfo.key).to.equal("Class");
                expect(keyPolicyError.userInfo.code).to.equal(ValidationErrorCode.TypeMismatch);
                done();
            });
        });
    });

    describe("#resolve", function () {
        it("should resolve class", function (done) {
            var context   = new Context(),
                container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(V12)]).then(function () {
                Q.when(Container(context).resolve(Car), function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                }, function (error) { done(error); });
            }, function (error) { done(error); });
        });

        it("should resolve same instance for SingletonLifestyle", function (done) {
            var context   = new Context(),
                keyPolicy = new ComponentKeyPolicy,
                policies  = [keyPolicy, new SingletonLifestyle],
                container = new IoContainer;
            keyPolicy.setClass(V12);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(policies)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.equal(engine2);
                    done();
                });
            });
        });

        it("should resolve diferent instance for TransientLifestyle", function (done) {
            var context   = new Context(),
                keyPolicy = new ComponentKeyPolicy,
                policies  = [keyPolicy, new TransientLifestyle],
                container = new IoContainer;
            keyPolicy.setClass(V12);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(policies)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.not.equal(engine2);
                    done();
                });
            });
        });

        it("should resolve diferent instance per context for ContextualLifestyle", function (done) {
            var context   = new Context(),
                keyPolicy = new ComponentKeyPolicy,
                policies  = [keyPolicy, new ContextualLifestyle],
                container = new IoContainer;
            keyPolicy.setClass(V12);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(policies)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.equal(engine2);
                    context.newChildContext(function (ctx) {
                        Q(Container(ctx).resolve(Engine)).then(function (engine3) {
                            expect(engine3).to.not.equal(engine1);
                            done();
                        });
                    })
                });
            });
        });

        it("should resolve nothing if context not available", function (done) {
            var keyPolicy = new ComponentKeyPolicy,
                policies  = [keyPolicy, new ContextualLifestyle],
                container = (new ValidationCallbackHandler).next(new IoContainer);
            keyPolicy.setClass(V12);
            Q(Container(container).register(policies)).then(function () {
                Q(Container(container).resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.undefined;
                    done();
                });
            });
        });

        it("should resolve instance with supplied dependencies", function (done) {
            var context   = new Context(),
                keyPolicy = new ComponentKeyPolicy,
                container = new IoContainer;
            keyPolicy.setClass(V12);
            keyPolicy.setDependencies([$use(917), $use(6.3)]);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(keyPolicy)).then(function () {
                Q(Container(context).resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(917);
                    expect(engine.getDisplacement()).to.equal(6.3);
                    done();
                });
            });
        });

        it("should return nothing if component not found", function (done) {
            var context   = new Context(),
                container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.when(Container(context).resolve(Car), function (car) {
                expect(car).to.be.undefined;
                done();
            }, function (error) { done(error); });
        });

        it("should fail resolve if missing dependencies", function (done) {
            var context   = new Context(),
                container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.when(Container(context).register(Ferarri), function (model) {
                Q.when(Container(context).resolve(Car), function (ferarri) {
                }, function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<=.*Car.*could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });

        it("should detect circular dependencies", function (done) {
            var context      = new Context(),
                enginePolicy = new ComponentKeyPolicy,
                container    = new IoContainer;
            enginePolicy.setClass(V12);
            enginePolicy.setDependencies([$use(917), $use(6.3), Engine]);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(enginePolicy)]).then(function () {
                Q.when(Container(context).resolve(Car), function (ferarri) {
                }, function (error) {
                        expect(error).to.be.instanceof(DependencyResolutionError);
                        expect(error.message).to.match(/Dependency cycle.*Engine.*<=.*Engine.*<=.*Car.*detected./);
                        expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });
    });
});
