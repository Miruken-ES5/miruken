var miruken  = require('../../lib/miruken.js'),
    ioc      = require('../../lib/ioc/ioc.js'),
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

describe("DependencyModel", function () {
    describe("#getDependency", function () {
        it("should return actual dependency", function () {
            var dependency = new DependencyModel(22);
            expect(dependency.getDependency()).to.equal(22);
        });

        it("should coerce dependency", function () {
            var dependency = DependencyModel(Engine);
            expect(dependency.getDependency()).to.equal(Engine);
        });

        it("should not ceorce undefined dependency", function () {
            var dependency = DependencyModel();
            expect(dependency).to.be.undefined;
        });
    });

    describe("#test", function () {
        it("should test dependency modifier", function () {
            var dependency = new DependencyModel(22, DependencyModifiers.Use);
            expect(dependency.test(DependencyModifiers.Use)).to.be.true;
        });
    });
});

describe("ComponentModel", function () {
    describe("#getKey", function () {
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
            expect(dependencies).to.have.length(2);
            expect(dependencies[0].getDependency()).to.equal(Car);
            expect(dependencies[1].getDependency()).to.equal(22);
        });
    });

    var context, container;
    beforeEach(function() {
        context   = new Context;
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

    describe("#instance", function () {
        it("should use supplied instance", function (done) {
            var v12 = new V12(333, 4.2);
            Q(container.register($component(V12).instance(v12))).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.equal(v12);
                    done();
                });
            });
        });
    });

    describe("#singleton", function () {
        it("should configure singleton component", function (done) {
            Q(container.register($component(V12).singleton())).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.equal(engine1);
                    done();
                });
            });
        });
    });

    describe("#transient", function () {
        it("should configure transient component", function (done) {
            Q(container.register($component(V12).transient())).then(function () {
                Q.all([container.resolve(V12), container.resolve(V12)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.not.equal(engine1);
                    done();
                });
            });
        });
    });

    describe("#contextual", function () {
        it("should configure contextual component", function (done) {
            Q(container.register($component(V12).contextual())).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.equal(engine1);
                    var childContext = context.newChild();
                    $using(childContext, 
                           Q(Container(childContext).resolve(V12)).then(function (engine3) {
                               expect(engine3).to.not.equal(engine1);
                               done();
                           })
                    );
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

    describe("#usingFactory", function () {
        it("should create components with factory", function (done) {
             Q(container.register(
                 $component(Engine).usingFactory(function () {
                     return new V12(450, 6.2);
                 })
             )).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    expect(engine.getHorsepower()).to.equal(450);
                    expect(engine.getDisplacement()).to.equal(6.2);
                    done();
                });x
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

        it("should configure component dependencies with factory", function (done) {
             Q(container.register(
                 $component(Engine).dependsOn($use(1000), $use(7.7))
                                   .usingFactory(function (hp, dsp) {
                     return new V12(hp, dsp);
                 })
             )).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    expect(engine.getHorsepower()).to.equal(1000);
                    expect(engine.getDisplacement()).to.equal(7.7);
                    done();
                });
            });
        });
    });
});

describe("ComponentBuilder", function () {
    var context, container;
    beforeEach(function() {
        context   = new Context;
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
            Q(container.register($component(Engine).boundTo(V12))).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
            
        it("should configure component name", function (done) {
            Q(container.register($component('engine').boundTo(V12))).then(function () {
                Q(container.resolve('engine')).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });
    
    describe("#dependsOn", function () {
        it("should configure component dependencies", function (done) {
            Q(container.register($component(Engine).boundTo(V12)
                                     .dependsOn($use(255), $use(5.0)))).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });
    });
});

describe("SingletonLifestyle", function () {
    describe("#resolve", function () {
        it("should resolve same instance for SingletonLifestyle", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q((container).register($component(V12).singleton())).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                        expect(engine1).to.equal(engine2);
                        done();
                    });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose instance when unregistered", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q.all(container.register($component(RebuiltV12).singleton(),
                                     $component(CraigsJunk))).spread(function (unregister) {
                Q.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
                        unregister();
                        expect(junk.getParts()).to.eql([engine]);
                        done();
                    });
            });
        });

        it("should not dispose instance when called directly", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q.all(container.register($component(RebuiltV12),
                                     $component(CraigsJunk))).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
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
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q(container.register($component(V12).transient())).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                        expect(engine1).to.not.equal(engine2);
                        done();
                    });
            });
        });
    });
});

describe("ContextualLifestyle", function () {
    var Controller = Base.extend(Contextual, ContextualMixin, {
            $inject: $optional(Context),
            constructor: function (context) {
                this.setContext(context);
            }
        });
    describe("#resolve", function () {
        it("should resolve diferent instance per context for ContextualLifestyle", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q(container.register($component(V12).contextual())).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
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
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q(container.register($component(Controller))).then(function () {
                Q(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should setContext if contextual object", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q(container.register(
                $component(Controller).contextual().dependsOn([]))).then(function () {
                Q(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should fulfill child Context dependency", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q(container.register(
                $component(Controller).dependsOn($child(Context)))).then(function () {
                Q(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext().getParent()).to.equal(context);
                    done();
                });
            });
        });

        it("should resolve nothing if context not available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Q(Container(container).register($component(V12).contextual())).then(function () {
                Q(Container(container).resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.undefined;
                    done();
                });
            });
        });

        it("should reject Context dependency if context not available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Q(Container(container).register(
                $component(Controller).dependsOn(Context))).then(function () {
                Q(Container(container).resolve(Controller)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.dependency.getKey()).to.equal(Context);
                    done();
                });
            });
        });

        it("should not fail if optional child Context and no context available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Q(Container(container).register(
                $component(Controller).dependsOn($optional($child(Context))))).then(function () {
                Q(Container(container).resolve(Controller)).then(function (controller) {
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose unregistered components", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).spread(function (unregister) {
                    Q.all([container.resolve(Engine), container.resolve(Junkyard)])
                        .spread(function (engine, junk) {
                            unregister();
                            expect(junk.getParts()).to.eql([engine]);
                            done();
                        });
                });
        });

        it("should dispose components when context ended", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).then(function () {
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
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Q.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).then(function () {
                Q.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
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
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should register component from class", function (done) {
            Q(container.register($component(Ferarri))).then(function () {
                done();
            });
        });

        it("should register component from protocol and class", function (done) {
             Q(container.register($component(Car).boundTo(Ferarri))).then(function () {
                done();
            });
        });

        it("should register component from name and class", function (done) {
            Q(container.register($component('car').boundTo(Ferarri))).then(function () {
                done();
            });
        });

        it("should unregister component", function (done) {
            Q(container.register($component(V12))).spread(function (unregister) {
                Q(container.resolve(Engine)).then(function (engine) {
                    unregister();
                    expect(engine).to.be.instanceOf(V12);
                    expect(container.resolve(Engine)).to.be.undefined;
                    done();
                });
            });
        });

        it("should reject registration if no key", function (done) {
            Q(container.register($component())).fail(function (error) {
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
            Q(container.register($component('car'))).fail(function (error) {
                expect(error.getKeyErrors("Factory")).to.eql([
                    new ValidationError("Factory could not be determined for component.", {
                        key:  "Factory",
                        code: ValidationErrorCode.Required
                    })
                ]);
                done();
            });
        });
    });

    describe("#resolve", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should resolve class", function (done) {
            Q.all(container.register($component(Ferarri), $component(V12))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should resolve nothing if component not found", function (done) {
            Q(container.resolve(Car)).then(function (car) {
                expect(car).to.be.undefined;
                done();
            });
        });

        it("should resolve class invariantly", function (done) {
            Q.all(container.register($component(Ferarri), $component(V12))).then(function () {
                Q(container.resolve($eq(Car))).then(function (car) {
                    expect(car).to.be.undefined;
                    Q(container.resolve($eq(Ferarri))).then(function (car) {
                        expect(car).to.be.instanceOf(Ferarri);
                        expect(car.getEngine()).to.be.instanceOf(V12);
                        done();
                    });
                });
            });
        });

        it("should resolve instance with supplied dependencies", function (done) {
            Q(container.register(
                $component(V12).dependsOn($use(917), $use(6.3)))).then(function () {
                Q(container.resolve(Engine)).then(function (engine) {
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
            Q.all(container.register($component(Order), $component(V12))).then(function () {
                Q(container.resolve(Order)).then(function (order) {
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
            Q.all(container.register(
                      $component(Ferarri).dependsOn($optional(Engine)),
                      $component(V12))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should accept null dependnecies", function (done) {
            Q(container.register($component(Ferarri).dependsOn(null))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.be.null;
                    done();
                });
            });
        });

        it("should resolve instance with optional dependencies", function (done) {
            Q.all(container.register($component(Ferarri), $component(V12),
                                     $component(OBDII))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
                    var diagnostics = car.getEngine().getDiagnostics();
                    expect(diagnostics).to.be.instanceOf(OBDII);
                    expect(diagnostics.getMPG()).to.equal(22.0);
                    done();
                });
            });
        });

        it("should resolve instance with optional missing dependencies", function (done) {
            Q(container.register(
                  $component(Ferarri).dependsOn($optional(Engine)))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
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
                            getCount: function () { return count; }
                        });
                    }
                });
            Q.all(container.register($component(Order), $component(V12))).then(function () {
                Q(container.resolve(Order)).then(function (order) {
                    Q.all([order.getEngine(), order.getEngine()]).spread(function (engine1, engine2) {
                        expect(engine1).to.be.instanceOf(V12);
                        expect(engine1).to.equal(engine2);
                        expect(order.getCount()).to.equal(9);
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
            Q(container.register($component(Order))).then(function () {
                Q(container.resolve(Order)).then(function (order) {
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
            Q.all(container.register($component(Order), $component(Ferarri))).then(function () {
                Q(container.resolve(Order)).then(function (order) {
                    expect(order).to.be.instanceOf(Order);
                    Q(order.getCar()).fail(function (error) {
                        expect(error).to.be.instanceof(DependencyResolutionError);
                        expect(error.message).to.match(/Dependency.*Engine.*<=.*Car.*could not be resolved./);
                        done();
                    });
                });
            });
        });

        it("should resolve instance with invariant dependencies", function (done) {
            Q.all(container.register($component(Ferarri).dependsOn($eq(V12)),
                                     $component(Engine).boundTo(V12))).then(function () {
                Q(container.resolve(Car)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*`.*V12.*`.*<=.*Car.*could not be resolved./);
                    container.register($component(V12)).then(function () {
                        Q(container.resolve(Car)).then(function (car) {
                            expect(car).to.be.instanceOf(Ferarri);
                            expect(car.getEngine()).to.be.instanceOf(V12);
                            done();
                        });
                    });
                });
            });
        });

        it("should resolve instance with dynamic dependencies", function (done) {
            var count   = 0,
                counter = function () { return ++count; },
                Order = Base.extend({
                    $inject: [Engine, $eval(counter)],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
                Q.all(container.register($component(Order).transient(),
                                         $component(V12))).then(function (reg) {
                Q.all([container.resolve(Order), container.resolve(Order)])
                    .spread(function (order1, order2) {
                        expect(order1.getCount()).to.equal(1);
                        expect(order2.getCount()).to.equal(2);
                        done();
                    });
            });
        });

        it("should behave like $use if no function passed to $eval", function (done) {
            var  Order = Base.extend({
                    $inject: [Engine, $eval(5)],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
            Q.all(container.register($component(Order).transient(),
                                      $component(V12))).then(function (reg) {
                Q.all([container.resolve(Order), container.resolve(Order)])
                    .spread(function (order1, order2) {
                        expect(order1.getCount()).to.equal(5);
                        expect(order2.getCount()).to.equal(5);
                        done();
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
            Q(container.register($component(Registry))).then(function () {
                Q(container.resolve(Registry)).then(function (registry) {
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
            Q(container.register($component(Registry))).then(function () {
                Q(container.resolve(Registry)).then(function (registry) {
                    expect(registry.getComposer()).to.equal(context);
                    Q(Validator(registry.getComposer()).validate(registry)).then(function (validation) {
                        expect(validation.isValid()).to.be.true;
                    });
                    done();
                });
            });
        });

        it("should have opportunity to resolve missing components", function (done) {
            var context   = new Context;
                container = new IoContainer,
            context.addHandlers(container, new ValidationCallbackHandler);
            $provide(container, Car, function (resolution, composer) {
                return new Ferarri(new V12(917, 6.3));
            });
            Q(Container(context).resolve(Car)).then(function (car) {
                expect(car).to.be.instanceOf(Ferarri);
                expect(car.getEngine()).to.be.instanceOf(V12);
                done();
            });
        });

        it("should resolve external dependencies", function (done) {
            var engine = new V12;
            context.store(engine);
            Q(container.register($component(Ferarri))).then(function () {
                Q(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferarri);
                    expect(car.getEngine()).to.equal(engine);
                    done();
                });
            });
        });

        it("should resolve in new child context", function (done) {
            var Workflow = Base.extend(ContextualMixin);
            Q.all(container.register(
                    $component(Workflow).newInContext())).then(function () {
                Q(container.resolve(Workflow)).done(function (workflow) {
                    expect(workflow).to.be.instanceOf(Workflow);
                    expect(workflow.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should resolve in new child context", function (done) {
            var AssemblyLine = Base.extend({
                $inject: Engine,
                constructor: function (engine) {
                    this.extend({
                        getEngine: function () { return engine; }
                    });
                }    
            });
            Q.all(container.register(
                    $component(V12),
                    $component(AssemblyLine).newInChildContext())).then(function () {
                Q(container.resolve(AssemblyLine)).done(function (assembleEngine) {
                    expect(assembleEngine).to.be.instanceOf(AssemblyLine);
                    expect(assembleEngine.getEngine()).to.be.instanceOf(V12);
                    expect(assembleEngine.getContext().getParent()).to.equal(context);
                    done();
                });
            });
        });

        it("should ignore external dependencies for $container", function (done) {
            context.store(new V12);
            Q(container.register(
                $component(Ferarri).dependsOn($container(Engine)))).then(function () {
                Q(container.resolve(Car)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Car.*<-.*Ferarri.*)could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
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
                   Q.all([Container(childContext).register(
                              $component(Order), $component(RebuiltV12)),
                          container.register($component(Ferarri), $component(OBDII),
                                             $component(CraigsJunk))]).then(function () {
                    Q(container.resolve(Order)).then(function (order) {
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
                Q(container.register($component(Ferarri))).then(function (model) {
                Q(container.resolve(Car)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Car.*<-.*Ferarri.*)could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });

        it("should detect circular dependencies", function (done) {
            Q.all(container.register($component(Ferarri),
                     $component(V12).dependsOn($use(917), $use(6.3), Engine))).then(function () {
                Q(container.resolve(Car)).fail(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency cycle.*Engine.*<= (.*Engine.*<-.*V12.*) <= (.*Car.*<-.*Ferarri.*) detected./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should dispose all components", function (done) {
            Q.all(container.register($component(Ferarri), $component(V12))).then(function () {
                Q.when(container.resolve(Car), function (car) {
                    done();
                    container.dispose();
                });
            });
        });
    });
});
