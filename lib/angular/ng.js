var miruken = require('../miruken.js');

new function () { // closure

    if (typeof angular === 'undefined') {
        throw new Error("angular not found.  Did you forget to include angular.js first?");
    }

    /**
     * @namespace miruken.ng
     */
    var ng = new base2.Package(this, {
        name:    "ng",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.ioc,miruken.ioc.config,miruken.mvc",
        exports: "$bootstrap,$rootContext,Runner"
    });

    eval(this.imports);

    var $rootContext  = new Context,
        rootContainer = new IoContainer;

    /**
     * Packagelifecycle enum
     * @enum {Number}
     */
    var PackageLifecycle = Enum({
        Created:   1,
        Installed: 2
        });

    /**
     * @class {Runner}
     */
    var Runner = Base.extend({
        run: function () {}
    });

    /**
     * @function $bootstrap
     * Bootstraps angular with Miruekn.
     * @param  {Object}  options  - bootstrap options
     */
    function $bootstrap(options) {
        _configureRootContext();
        var ngModule = angular.module;
        ngModule('ng').run(['$rootScope', '$injector', _instrumentScopes]);
        angular.module = function (name, requires, configFn) {
            var module = ngModule.call(this, name, requires, configFn);
            if (requires) {
                var runners   = [], starters  = [],
                    container = Container($rootContext),
                    package   = _synthesizeModulePackage(name);
                module.constant('$rootContext', $rootContext)
                      .config(['$injector', '$controllerProvider',
                           function ($injector, $controllerProvider) {
                               _installPackage(package, module, $injector, $controllerProvider, 
                                               runners, starters);
                           }])
                      .run(['$injector', '$q', '$log', function ($injector, $q, $log) {
                           _provideInjector(rootContainer, $injector);
                           Array2.forEach(runners, function (runner) {
                               $injector.invoke(runner);
                           });
                           container.register(starters).then(function () {
                               $q.when(container.resolveAll(Starting)).then(function (starters) {
                                   Array2.invoke(starters, "start");
                               }, function (error) {
                                   $log.error(lang.format("Startup for package %1 failed: %2", 
                                                          package, error.message));
                                   });
                               });
                       }]);
            }
            return module;
        };
    }

    /**
     * @function _configureRootContext
     * Configures the root context and installs root container.
     */
    function _configureRootContext() {
        $rootContext.addHandlers(rootContainer, 
                                 new miruken.validate.ValidationCallbackHandler,
                                 new miruken.error.ErrorCallbackHandler);
    }

    /**
     * @function _instrumentScopes
     * Instruments angular scopes with miruken contexts.
     * @param  {Scope}   $rootScope  - angular's root scope
     * @param  {Scope}   $injector   - angular's ng injector
     */
    function _instrumentScopes($rootScope, $injector)
    {
        var scopeProto   = $rootScope.constructor.prototype,
            newScope     = scopeProto.$new,
            destroyScope = scopeProto.$destroy;
        scopeProto.$new = function (isolate, parent) {
            var childScope  = newScope.call(this, isolate, parent),
                parentScope = childScope.$parent;
            childScope.context = parentScope && parentScope.context
                               ? parentScope.context.newChild()
                               : new Context;
            return childScope;
        };
        scopeProto.$destroy = function () {
            var context = this.context;
            if (context !== $rootContext) {
                delete this.context;
                context.end();
            }
            destroyScope.call(this);
        };
        $rootScope.rootContext = $rootScope.context = $rootContext;
        _provideInjector(rootContainer, $injector);
    }

    /**
     * @function _synthesizeModulePackage
     * Synthesizes Miruken packages from angular modules.
     * @param    {String}   moduleName  - module name
     * @returns  {Package}  the corresponding package.
     */
    function _synthesizeModulePackage(moduleName) {
        var parent = base2,
            names  = moduleName.split(".");
        for (var i = 0; i < names.length; ++i) {
            var packageName = names[i],
                package     = parent[packageName];
            if (!package) {
                package = parent.addPackage(packageName);
                package.lifecycle = PackageLifecycle.Created;
                if (parent === base2) {
                    global[packageName] = package;
                }
            }
            parent = package;
        }
        return package;
    }

    /**
     * @function _installPackage
     * Install the package Installers, Runners, Starters and Controllers.
     * @param  {Package}   package              - module package
     * @param  {Module}    module               - angular module
     * @param  {Injector}  injector             - module injector
     * @param  {Provider}  $controllerProvider  - controller provider
     * @param  {Array}     runners              - collects runners
     * @param  {Array}     starters             - collects starters
     */
    function _installPackage(package, module, injector, $controllerProvider, runners, starters) {
        var container = Container($rootContext),
            lifecycle = package.lifecycle || PackageLifecycle.Created;
        if (lifecycle === PackageLifecycle.Created) {
            package.getClasses(function (member) {
                var clazz = member.member;
                if (clazz.prototype instanceof Controller) {
                    var controller = new ComponentModel;
                    controller.setKey(clazz);
                    controller.setLifestyle(new ContextualLifestyle);
                    container.addComponent(controller).then(function () {
                        var deps = _angularDependencies(controller);
                        deps.unshift('$scope', '$injector');
                        deps.push(_controllerShim(clazz, deps.slice()));
                        $controllerProvider.register(member.name, deps);
                    });
                } else if (clazz.prototype instanceof Installer ||
                           clazz.prototype instanceof Runner) {
                    var deps      = (clazz.prototype.$inject || clazz.$inject || []).slice(),
                        moduleIdx = deps.indexOf('$module');
                    if (moduleIdx >= 0) {
                        deps.splice(moduleIdx, 1);
                    }
                    deps.push(function () {
                        var args = arguments;
                        if (moduleIdx >= 0) {
                            args = Array.prototype.slice.call(arguments, 0);
                            args.splice(moduleIdx, 0, module);
                        }
                       var component = clazz.new.apply(clazz, args);
                       if (component instanceof Installer) {
                           container.register(component);
                       } else {
                           component.run();
                       }
                    });
                    if (clazz.prototype instanceof Installer) {
                        injector.invoke(deps);
                    } else {
                        runners.push(deps);
                    }
                }
            });
            starters.push($classes.fromPackage(package).basedOn(Starting).withKeys.self());
            package.lifecycle = PackageLifecycle.Installed;
        }
        package.getPackages(function (member) {
            _installPackage(member.member, module, injector, $controllerProvider, runners, starters);
        });
    }

    /**
     * @function _controllerShim
     * Registers the controller from package into the container and module.
     * @param    {Function}  controller  - controller class
     * @param    {Array}     deps        - angular dependencies
     * @returns  {Function}  controller constructor shim.  
     */
    function _controllerShim(controller, deps) {
        return function($scope, $injector) {
            var context    = $scope.context,
                parameters = Array2.combine(deps, arguments);
            _provideLiteral(context, parameters);
            _provideInjector(context, $injector);
            return context.resolve($instant(controller));
        };
    }

    /**
     * @function _provideLiteral
     * Provides all keys from the object literal.
     * @param  {Object}  owner    - owning instance
     * @param  {Object}  literal  - object literal
     */
    function _provideLiteral(owner, literal) {
        $provide(owner, null, function (resolution) {
            var key = Modifier.unwrap(resolution.getKey());
            return literal[key];
        });
    }

    /**
     * @function _provideInjector
     * Attaches the supplied injector to owners $providers.
     * @param  {Object}     owner    - owning instance
     * @param  {Injector}  injector  - angular injector
     */
    function _provideInjector(owner, injector) {
        $provide(owner, null, function (resolution) {
            var key = Modifier.unwrap(resolution.getKey());
            if ($isString(key) && injector.has(key)) {
                return injector.get(key);
            }
        });
    }

    /**
     * @function _angularDependencies
     * Extracts the string dependencies for the component.
     * @param    {Function}  controller  - controller class
     * @returns  {Function}  controller constructor shim.  
     */
    function _angularDependencies(componentModel) {
        var deps = componentModel.getDependencies();
        return deps ? Array2.filter(Array2.map(deps,
                          function (dep) { return dep.getDependency(); }),
                          function (dep) { return $isString(dep); })
                    : [];
    }

    eval(this.exports);
}
