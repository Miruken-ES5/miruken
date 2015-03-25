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
        exports: "$bootstrap,$rootContext"
    });

    eval(this.imports);

    var $rootContext  = new Context,
        rootContainer = new IoContainer;

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
                var package  = _synthesizeModulePackage(name);
                module.constant('$rootContext', $rootContext)
                      .config(['$injector', '$controllerProvider',
                           function ($injector, $controllerProvider) {
                               _installPackage(package, module, $injector, $controllerProvider);
                           }])
                      .run(['$injector', '$q', '$log', function ($injector, $q, $log) {
                           var startupContext   = $rootContext.newChild(),
                               startupContainer = new IoContainer;
                           startupContext.addHandlers(startupContainer);
                           _provideInjector(rootContainer, $injector);
                           _startPackage(package, $q, $log, startupContext);
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
            $provide(childScope.context, "$scope", childScope);
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
     * Install the package with Installers and Controllers.
     * @param  {Package}   package              - module package
     * @param  {Module}    module               - angular module
     * @param  {Injector}  injector             - module injector
     * @param  {Provider}  $controllerProvider  - controller provider
     */
    function _installPackage(package, module, injector, $controllerProvider) {
        var container = Container($rootContext);
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
            } else if (clazz.prototype instanceof Installer) {
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
                    var installer = clazz.new.apply(clazz, args);
                    container.register(installer);
                });
                injector.invoke(deps);
            }
        });
        package.getPackages(function (member) {
            _installPackage(member.member, module, injector, $controllerProvider);
        });
    }

    /**
     * @function _startPackage
     * Start the package using the 'Starting' components.
     * @param  {Package}   package         - module package
     * @param  {Object}    $q              - $q service
     * @param  {Object}    $log            - $log service
     * @param  {Context}   startupContext  - isolated context
     */
    function _startPackage(package, $q, $log, startupContext) {
        Container(startupContext).register(
            $classes.fromPackage(package).basedOn(Starting)).then(function () {
            $q.when(Container(startupContext).resolveAll(Starting)).then(function (starters) {
                for (var i = 0; i < starters.length; ++i) {
                    starters[i].start();
                }
            }, function (error) {
                $log.error(lang.format("Startup for package %1 failed: %2", package, error.message));
            });
        });
        package.getPackages(function (member) {
            _startPackage(member.member, $q, $log, startupContext);
        });
    }

    /**
     * @function _controllerShim
     * Registers the controller from package into the container and module.
     * @param    {Function}  controller  - controller class
     * @param    {Array}     controller  - string dependencies
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
