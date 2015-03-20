var miruken  = require('../../lib/miruken.js'),
    config   = require('../../lib/ioc/config.js'),
    Promise  = require('bluebird'),
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
        exports: "Service,Authentication,Controller,Credentials,LoginController,SomeService,InMemoryAuthenticator,PackageInstaller"
    });

    eval(this.imports);

    var Controller = Base.extend();

    var Credentials = Base.extend({
        constructor: function (user, password) {
            this.extend({
                getUser: function () { return user; },
                getPassword: function () { return password; }
            });
        }
    });

    var Service = Protocol.extend();

    var Authentication = Protocol.extend(Service, {
        authenticate: function (credentials) {}
    });

    var LoginController = Controller.extend({
        $inject: Authentication,
        constructor: function (authenticator) {
           this.extend({
               login: function (credentials) {
                   return authenticator.authenticate(credentials);
               }
           });
        }
    });

    var SomeService = Base.extend(Service);

    var InMemoryAuthenticator = Base.extend(Authentication, {
        authenticate: function (credentials) {
            return false;
        }
    });

    var PackageInstaller = Installer.extend({
        register: function(container, composer) {
            container.register(
                $classes.fromPackage(ioc_config_test).basedOn(Service)
                        .withKeys.mostSpecificService()
            );
        }
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
            container.register(
                $component(Authentication).boundTo(InMemoryAuthenticator),
                $classes.fromPackage(ioc_config_test).basedOn(Controller)).then(function () {
                Promise.resolve(container.resolve(LoginController)).then(function (loginController) {
                    expect(loginController).to.be.instanceOf(LoginController);
                    done();
                });
            });
        });

        it("should select classes from package using shortcut", function (done) {
            container.register(
                $component(Authentication).boundTo(InMemoryAuthenticator),
                $classes(ioc_config_test).basedOn(Controller)).then(function () {
                Promise.resolve(container.resolve(LoginController)).then(function (loginController) {
                    expect(loginController).to.be.instanceOf(LoginController);
                    done();
                });
            });
        });

        it("should register installers if no based on criteria", function (done) {
            container.register(
                $classes.fromPackage(ioc_config_test)).then(function () {
                    Promise.all([container.resolve($eq(Service)),
                                container.resolve($eq(Authentication)),
                           container.resolve($eq(InMemoryAuthenticator))])
                        .spread(function (service, authenticator, nothing) {
                        expect(service).to.be.instanceOf(SomeService);
                        expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                        expect(nothing).to.be.undefined;
                        done();
                    });
                });
        });

        it("should reject package if not a Package", function () {
            expect(function () { 
                container.register($classes.fromPackage(Controller));
            }).to.throw(TypeError, /[$]classes expected a Package, but received.*Controller.*instead./);
        });
    });

    describe("#withKeys", function () {
        describe("#self", function () {
            it("should select class as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.self()).then(function () {
                         Promise.all([container.resolve($eq(InMemoryAuthenticator)),
                                      container.resolve($eq(Authentication))])
                             .spread(function (authenticator, nothing) {
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#basedOn", function () {
            it("should select basedOn as keys", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.basedOn()).then(function () {
                        Promise.all([container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (authenticator, nothing) {
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#anyService", function () {
            it("should select any service as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.anyService()).then(function () {
                         Promise.all([container.resolve($eq(Service)),
                                      container.resolve($eq(SomeService))])
                             .spread(function (service, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#allServices", function () {
            it("should select all services as keys", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.allServices()).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (authenticator1, authenticator2, nothing) {
                            expect(authenticator1).to.be.instanceOf(InMemoryAuthenticator);
                            expect(authenticator2).to.equal(authenticator1);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#mostSpecificService", function () {
            it("should select most specific service as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.mostSpecificService(Service)).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (service, authenticator, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });

            it("should select most specific service form basedOn as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.mostSpecificService()).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (service, authenticator, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });

            it("should select basedOn as key if no services match", function (done) {
                container.register(
                    $component(Authentication).boundTo(InMemoryAuthenticator),
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.mostSpecificService()).then(function () {
                        Promise.all([container.resolve($eq(Controller)),
                                     container.resolve($eq(LoginController))])
                            .spread(function (controller, nothing) {
                            expect(controller).to.be.instanceOf(LoginController);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });
        });

        describe("#name", function () {
            it("should specify name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.name("Login")).then(function () {
                        Promise.resolve(container.resolve("Login")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });

            it("should infer name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.name()).then(function () {
                        Promise.resolve(container.resolve("LoginController")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });

            it("should evaluate name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                        .withKeys.name(function (name) { 
                            return name.replace("Controller", "");
                            })).then(function () {
                        Promise.resolve(container.resolve("Login")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });
        });
    });

    describe("#configure", function () {
        it("should customize component configuration", function (done) {
            container.register(
                $classes.fromPackage(ioc_config_test).basedOn(Service)
                        .withKeys.mostSpecificService()
                        .configure(function (component) {
                            component.transient();
                         })).then(function () {
                   Promise.all([container.resolve($eq(Authentication)),
                                container.resolve($eq(Authentication))])
                       .spread(function (authenticator1, authenticator2) {
                       expect(authenticator1).to.be.instanceOf(InMemoryAuthenticator);
                       expect(authenticator2).to.not.equal(authenticator1);
                       done();
                    });
                });
            });
        });

});
