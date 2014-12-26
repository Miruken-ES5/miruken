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
        exports: "Car,Engine,Diagnostics,Junkyard,V12,RebuiltV12,Ferarri,OBDII,CraigsJunk"
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

    var Junkyard = Protocol.extend({
        decomission: function (part) {}
    });

    var V12 = Base.extend(Engine, {
    $inject: [,,$optional(Diagnostics)],
        constructor: function (horsepower, displacement, diagnostics) {
            this.extend({
                getHorsepower: function () { return horsepower; },
                getDisplacement: function () { return displacement; },
                getDiagnostics: function () { return diagnostics; }
            });
        },
        getNumberOfCylinders: function () { return 12; },
    });
 
    var RebuiltV12 = V12.extend(Engine, Disposing, {
        $inject: [,,,Junkyard],
        constructor: function (horsepower, displacement, diagnostics, junkyard) {
            this.base(horsepower, displacement, diagnostics, junkyard);
            this.extend({
                dispose: function () {
                    junkyard.decomission(this);
                }
            });
        }
    });

    var Ferarri = Base.extend(Car, {
        $inject: Engine,
        constructor: function (engine) {
            this.extend({
                getEngine: function () { return engine; }
            });
        }
    });

    var OBDII = Base.extend(Diagnostics, {
        constructor: function () {
            this.extend({
                getMPG: function () { return 22.0; }
            });
        }
    });

    var CraigsJunk = Base.extend(Junkyard, {
        constructor: function () {
            var _parts = [];
            this.extend({
                getParts: function () { return _parts.slice(0); },
                decomission: function (part) {
                    _parts.push(part);
                }
            });
        }
    });

    eval(this.exports);
};

eval(base2.ioc_test.namespace);

describe("ComponentModel", function () {
    describe("#getKey", function () {
        it("should return service if no key or class", function () {
            var componentModel = new ComponentModel;
            componentModel.setService(Engine);
            expect(componentModel.getKey()).to.equal(Engine);
        });

        it("should return class if no key", function () {
            var componentModel = new ComponentModel;
            componentModel.setClass(Ferarri);
            expect(componentModel.getKey()).to.equal(Ferarri);
        });
    });

    describe("#setClass", function () {
        it("should reject invalid class", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.setClass(1);
            }).to.throw(Error, "1 is not a class.");
        });
    });

    describe("#getService", function () {
        it("should return key if no service and key is protocol", function () {
            var componentModel = new ComponentModel;
            componentModel.setKey(Car);
            expect(componentModel.getService()).to.equal(Car);
        });
    });

    describe("#setService", function () {
        it("should reject service if not a protocol", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.setService('logger');
            }).to.throw(Error, "logger is not a protocol.");
        });
    });

    describe("#getFactory", function () {
        it("should return default factory", function () {
            var componentModel = new ComponentModel;
            componentModel.setClass(Ferarri);
            expect(componentModel.getFactory()).to.be.a('function');
        });
    });

    describe("#setFactory", function () {
        it("should reject factory if not a function", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.setFactory(true);
            }).to.throw(Error, "true is not a function.");
        });
    });

    describe("#manageDependencies", function () {
        it("should manage dependencies", function () {
            var componentModel = new ComponentModel;
                dependencies   = componentModel.manageDependencies(function (deps) {
                    deps.append(Car, 22);
                });
            expect(dependencies).to.eql([Car, 22]);
        });
    });

    describe("#configure", function () {
        it("should configure model from class only", function () {
            var componentModel = new ComponentModel;
            componentModel.configure(Ferarri);
            expect(componentModel.getKey()).to.equal(Ferarri);
        });

        it("should configure model from protocol and class", function () {
            var componentModel = new ComponentModel;
            componentModel.configure(Car, Ferarri);
            expect(componentModel.getKey()).to.equal(Car);
        });

        it("should configure model from name and class", function () {
            var componentModel = new ComponentModel;
            componentModel.configure('car', Ferarri);
            expect(componentModel.getKey()).to.equal('car');
        });

        it("should configure model from other component model", function () {
            var prototypeModel = new ComponentModel,
                componentModel = new ComponentModel;
            prototypeModel.configure(Car, Ferarri);
            componentModel.configure(prototypeModel);
            expect(componentModel.getKey()).to.equal(Car);
        });

        it("should reject argument if not ComponentPolicy", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.configure(new Ferarri);
            }).to.throw(Error, /is not a ComponentPolicy/);
        });
    });
});

describe("SingletonLifestyle", function () {
    describe("#resolve", function () {
        it("should resolve same instance for SingletonLifestyle", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container    = new IoContainer;
            componentModel.setClass(V12);
            componentModel.setLifestyle(new SingletonLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(componentModel)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.equal(engine2);
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose instance when unregistered", function (done) {
            var context   = new Context(),
                container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(RebuiltV12),
                   Container(context).register(CraigsJunk)]).spread(function (registration) {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Junkyard)]).spread(function (engine, junk) {
                    registration.unregister();
                    expect(junk.getParts()).to.eql([engine]);
                    done();
                });
            });
        });

        it("should not dispose instance when called directly", function (done) {
            var context   = new Context(),
                container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(RebuiltV12),
                   Container(context).register(CraigsJunk)]).spread(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Junkyard)]).spread(function (engine, junk) {
                    engine.dispose();
                    expect(junk.getParts()).to.eql([]);
                    done();
                });
            });
        });
    });
});

describe("TransientLifestyle", function () {
    describe("#resolve", function () {
        it("should resolve diferent instance for TransientLifestyle", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(V12);
            componentModel.setLifestyle(new TransientLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(componentModel)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.not.equal(engine2);
                    done();
                });
            });
        });
    });
});

describe("ContextualLifestyle", function () {
    var Controller = Base.extend({
            $inject: Context,
            constructor: function (context) {
                this.extend({
                    getContext: function () { return context; }
                });
            }
        });
    describe("#resolve", function () {
        it("should resolve diferent instance per context for ContextualLifestyle", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(V12);
            componentModel.setLifestyle(new ContextualLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(componentModel)).then(function () {
                Q.all([Container(context).resolve(Engine),
                       Container(context).resolve(Engine)]).spread(function (engine1, engine2) {
                    expect(engine1).to.equal(engine2);
                    var childContext = context.newChild();
                    $using(childContext, 
                        Q(Container(childContext).resolve(Engine)).then(function (engine3) {
                            expect(engine3).to.not.equal(engine1);
                            done();
                        })
                    );
                });
            });
        });

        it("should implicitly satisfy Context dependency", function (done) {
            var context        = new Context(),
                container      = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(Controller)).then(function () {
                Q(Container(context).resolve(Controller)).then(function (controller) {
                    expect(controller.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should fulfill child Context dependency", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(Controller);
            componentModel.setDependencies([$child(Context)]);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q(Container(context).register(componentModel)).then(function () {
                Q(Container(context).resolve(Controller)).then(function (controller) {
                    expect(controller.getContext().getParent()).to.equal(context);
                    done();
                });
            });
        });

        it("should resolve nothing if context not available", function (done) {
            var componentModel = new ComponentModel,
                container      = (new ValidationCallbackHandler).next(new IoContainer);
            componentModel.setClass(V12);
            componentModel.setLifestyle(new ContextualLifestyle);
            Q(Container(container).register(componentModel)).then(function () {
                Q(Container(container).resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.undefined;
                    done();
                });
            });
        });

        it("should reject Context dependency if context not available", function (done) {
            var componentModel = new ComponentModel,
                container      = (new ValidationCallbackHandler).next(new IoContainer);
            Q(Container(container).register(Controller)).then(function () {
                Q(Container(container).resolve(Controller)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.dependency.getKey()).to.equal(Context);
                    done();
                });
            });
        });

        it("should not fail if optional child Context and no context available", function (done) {
            var componentModel = new ComponentModel,
                container      = (new ValidationCallbackHandler).next(new IoContainer);
            componentModel.setClass(Controller);
            componentModel.setDependencies([$optional($child(Context))]);
            Q(Container(container).register(componentModel)).then(function () {
                Q(Container(container).resolve(Controller)).then(function (controller) {
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose unregistered components", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(RebuiltV12);
            componentModel.setLifestyle(new ContextualLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(componentModel),
                   Container(context).register(CraigsJunk)]).spread(function (registration) {
                       Q.all([Container(context).resolve(Engine),
                              Container(context).resolve(Junkyard)]).spread(function (engine, junk) {
                    registration.unregister();
                    expect(junk.getParts()).to.eql([engine]);
                    done();
                });
            });
        });

        it("should dispose components when context ended", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(RebuiltV12);
            componentModel.setLifestyle(new ContextualLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(componentModel),
                   Container(context).register(CraigsJunk)]).spread(function (registration) {
                var engine, junk,
                    childContext = context.newChild();
                $using(childContext, 
                       Q.all([Container(childContext).resolve(Engine),
                              Container(childContext).resolve(Junkyard)]).spread(function (e, j) {
                           engine = e, junk = j;
                       })
                ).fin(function() {
                    expect(junk.getParts()).to.eql([engine]);
                    done();
                });
            });
        });

        it("should not dispose instance when called directly", function (done) {
            var context        = new Context(),
                componentModel = new ComponentModel,
                container      = new IoContainer;
            componentModel.setClass(RebuiltV12);
            componentModel.setLifestyle(new ContextualLifestyle);
            context.addHandlers(container, new ValidationCallbackHandler);
            Q.all([Container(context).register(componentModel),
                   Container(context).register(CraigsJunk)]).spread(function (registration) {
                       Q.all([Container(context).resolve(Engine),
                              Container(context).resolve(Junkyard)]).spread(function (engine, junk) {
                    engine.dispose();
                    expect(junk.getParts()).to.eql([]);
                    done();
                });
            });
        });
    })
});

describe("IoContainer", function () {
    describe("#register", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context();
            container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
        });

        it("should register component", function (done) {
            Q.when(Container(context).register(Ferarri), function (registration) {
                expect(registration.componentModel.getKey()).to.equal(Ferarri);
                done();
            });
        });

        it("should unregister component", function (done) {
            Q.when(Container(context).register(V12), function (registration) {
                Q(Container(context).resolve(Engine)).then(function (engine) {
                    registration.unregister();
                    expect(engine).to.be.instanceOf(V12);
                    expect(Container(context).resolve(Engine)).to.be.undefined;
                    done();
                });
            });
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
            var carModel = new ComponentModel;
            carModel.setService(Car);
            carModel.setClass(CallbackHandler);
            Q(Container(context).register(carModel)).fail(function (error) {
                var carError = error.getKeyErrors("Class")[0];
                expect(carError.userInfo.key).to.equal("Class");
                expect(carError.userInfo.code).to.equal(ValidationErrorCode.TypeMismatch);
                done();
            });
        });
    });

    describe("#resolve", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context();
            container = new IoContainer;
            context.addHandlers(container, new ValidationCallbackHandler);
        });

        it("should resolve class", function (done) {
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(V12)]).then(function () {
                Q.when(Container(context).resolve(Car), function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                    });
            });
        });

        it("should resolve instance with supplied dependencies", function (done) {
            var engineModel = new ComponentModel;
            engineModel.setClass(V12);
            engineModel.setDependencies([$use(917), $use(6.3)]);
            Q(Container(context).register(engineModel)).then(function () {
                Q(Container(context).resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(917);
                    expect(engine.getDisplacement()).to.equal(6.3);
                    done();
                });
            });
        });

        it("should resolve instance with dependency promises", function (done) {
            var Order = Base.extend({
                    $inject: [$promise(Engine), $promise($use(19))],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
            Q.all([Container(context).register(Order),
                   Container(context).register(V12)]).then(function () {
                Q(Container(context).resolve(Order)).then(function (order) {
                    expect(Q.isPromiseAlike(order.getEngine())).to.be.true;
                    expect(Q.isPromiseAlike(order.getCount())).to.be.true;
                    Q.all([order.getEngine(), order.getCount()]).spread(function (engine, count) {
                        expect(engine).to.be.instanceOf(V12);
                        expect(count).to.equal(19);
                        done();
                    });
                });
            });
        });

        it("should override dependencies", function (done) {
            var carModel= new ComponentModel;
            carModel.setClass(Ferarri);
            carModel.setDependencies([$optional(Engine)]);
            Q.all([Container(context).register(carModel),
                   Container(context).register(V12)]).then(function () {
                Q(Container(context).resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should accept null dependnecies", function (done) {
            var carModel= new ComponentModel;
            carModel.setClass(Ferarri);
            carModel.setDependencies([null]);
            Q(Container(context).register(carModel)).then(function () {
                Q(Container(context).resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.null;
                    done();
                });
            });
        });

        it("should resolve instance with optional dependencies", function (done) {
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(V12),
                   Container(context).register(OBDII)]).then(function () {
                Q(Container(context).resolve(Car)).then(function (car) {
            var diagnostics = car.getEngine().getDiagnostics();
            expect(diagnostics).to.be.instanceOf(OBDII);
            expect(diagnostics.getMPG()).to.equal(22.0);
                    done();
                });
            });
        });

        it("should resolve instance with optional missing dependencies", function (done) {
            var carModel = new ComponentModel;
            carModel.setClass(Ferarri);
            carModel.setDependencies([$optional(Engine)]);
            Q(Container(context).register(carModel)).then(function () {
                Q(Container(context).resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.undefined;
                    done();
                });
            });
        });

        it("should resolve instance with lazy dependencies", function (done) {
            var Order = Base.extend({
                    $inject: [$lazy(Engine), $lazy($use(9))],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine(); },
                            getCount: function () { return count(); }
                        });
                    }
                });
            Q.all([Container(context).register(Order),
                   Container(context).register(V12)]).then(function () {
                Q(Container(context).resolve(Order)).then(function (order) {
                    Q.all([order.getEngine(), order.getCount()]).spread(function (engine, count) {
                        expect(engine).to.be.instanceOf(V12);
                        expect(count).to.equal(9);
                        done();
                    });
                });
            });
        });

        it("should not fail resolve when missing lazy dependencies", function (done) {
            var Order = Base.extend({
                    $inject: $lazy(Engine),
                    constructor: function (engine) {
                        this.extend({
                            getEngine: function () { return engine(); }
                        });
                    }
                });
            Q(Container(context).register(Order)).then(function () {
                Q(Container(context).resolve(Order)).then(function (order) {
                    expect(order).to.be.instanceOf(Order);
                    expect(order.getEngine()).to.be.undefined;
                    done();
                });
            });
        });

        it("should delay rejecting lazy dependency failures", function (done) {
            var Order = Base.extend({
                    $inject: $lazy(Car),
                    constructor: function (car) {
                        this.extend({
                            getCar: function () { return car(); }
                        });
                    }
                });
            Q.all([Container(context).register(Order),
                   Container(context).register(Ferarri)]).then(function () {
                Q(Container(context).resolve(Order)).then(function (order) {
                    expect(order).to.be.instanceOf(Order);
                    Q(order.getCar()).fail(function (error) {
                        expect(error).to.be.instanceof(DependencyResolutionError);
                        expect(error.message).to.match(/Dependency.*Engine.*<=.*Car.*could not be resolved./);
                        done();
                    });
                });
            });
        });

        it("should implicitly satisfy container dependency", function (done) {
            var Registry = Base.extend({
                    $inject: Container,
                    constructor: function (container) {
                        this.extend({
                            getContainer: function () { return container; },
                        });
                    }
                });
            Q(Container(context).register(Registry)).then(function () {
                Q(Container(context).resolve(Registry)).then(function (registry) {
                    expect(registry.getContainer()).to.be.instanceOf(Container);
                    done();
                });
            });
        });

        it("should implicitly satisfy composer dependency", function (done) {
            var Registry = Base.extend({
                    $inject: $$composer,
                    constructor: function (composer) {
                        this.extend({
                            getComposer: function () { return composer; },
                        });
                    }
                });
            Q(Container(context).register(Registry)).then(function () {
                Q(Container(context).resolve(Registry)).then(function (registry) {
                    expect(registry.getComposer()).to.equal(context);
                    Q(Validator(registry.getComposer()).validate(registry)).then(function (validation) {
                        expect(validation.isValid()).to.be.true;
                    });
                    done();
                });
            });
        });

        it("should return nothing if component not found", function (done) {
            Q.when(Container(context).resolve(Car), function (car) {
                expect(car).to.be.undefined;
                done();
            });
        });

        it("should have opportunity to resolve missing components", function (done) {
            $provide(container, True, function (resolution, composer) {
                return new Ferarri(new V12(917, 6.3));
            });
            Q.when(Container(context).resolve(Car), function (car) {
                expect(car).to.be.instanceOf(Ferarri);
                expect(car.getEngine()).to.be.instanceOf(V12);
                done();
            });
        });

        it("should use child contexts to manage child containers", function (done) {
            var Order = Base.extend({
                    $inject: Car,
                    constructor: function (car) {
                        this.extend({
                            getCar: function () { return car; }
                        });
                    }
                }),
                childContext = context.newChild();
            $using(childContext, 
                Q.all([Container(childContext).register(Order),
                       Container(childContext).register(RebuiltV12),
                       Container(context).register(Ferarri),
                       Container(context).register(OBDII),
		       Container(context).register(CraigsJunk)]).then(function () {
                    Q(Container(context).resolve(Order)).then(function (order) {
                        var car         = order.getCar(),
                            engine      = car.getEngine(),
                            diagnostics = engine.getDiagnostics();
                        expect(car).to.be.instanceOf(Ferarri);
                        expect(engine).to.be.instanceOf(RebuiltV12);
                        expect(diagnostics).to.be.instanceOf(OBDII);
                        done();
                    });
                })
            );
        });

        it("should fail resolve if missing dependencies", function (done) {
            Q.when(Container(context).register(Ferarri), function (model) {
                Q(Container(context).resolve(Car)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Car.*<-.*Ferarri.*)could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });

        it("should detect circular dependencies", function (done) {
            var engineModel = new ComponentModel;
            engineModel.setClass(V12);
            engineModel.setDependencies([$use(917), $use(6.3), Engine]);
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(engineModel)]).then(function () {
                Q.when(Container(context).resolve(Car), function (ferarri) {
                }, function (error) {
                        expect(error).to.be.instanceof(DependencyResolutionError);
                        expect(error.message).to.match(/Dependency cycle.*Engine.*<= (.*Engine.*<-.*V12.*) <= (.*Car.*<-.*Ferarri.*) detected./);
                        expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose all components", function (done) {
            Q.all([Container(context).register(Ferarri),
                   Container(context).register(V12)]).then(function () {
                Q.when(Container(context).resolve(Car), function (car) {
                    done();
                    container.dispose();
                });
            });
        });
    });
});
