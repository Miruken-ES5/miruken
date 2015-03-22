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
        imports: "miruken,miruken.callback,miruken.context,miruken.ioc,miruken.mvc",
        exports: "bootstrap,rootContext"
    });

    eval(this.imports);

    var rootContext   = new Context,
        rootContainer = new IoContainer;

    /**
     * @function bootstrapMiruken
     * Bootstraps angular with Miruekn.
     * @param  {Object}  options  - bootstrap options
     */
    function bootstrap(options) {
        var ngModule = angular.module;
        ngModule('ng').config(_configureRootContext)
                      .run(['$rootScope', _instrumentScopes]);
        angular.module = function (name, requires) {
            var module = ngModule.apply(this, Array.prototype.slice.call(arguments));
            if (requires) {
                var package = _synthesizeModulePackage(name);
                module.config(['$controllerProvider', function ($controllerProvider) {
                    _registerControllers(package, $controllerProvider);
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
        rootContext.addHandlers(rootContainer, 
                                new miruken.validate.ValidationCallbackHandler,
                                new miruken.error.ErrorCallbackHandler);
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
                package = new base2.Package(null, {
                    name:   packageName,
                    parent: parent
                });
                parent.addName(packageName, package);
                if (parent === base2) {
                    global[packageName] = package;
                }
            }
            parent = package;
        }
        return package;
    }

    /**
     * @function _instrumentScopes
     * Instruments angular scopes with miruken contexts.
     * @param  {Scope}   $rootScope  - angular's root scope
     */
    function _instrumentScopes($rootScope)
    {
        var scopeProto   = $rootScope.constructor.prototype,
            newScope     = scopeProto.$new,
            destroyScope = scopeProto.$destroy;
        scopeProto.$new = function () {
            var childScope  = newScope.apply(this, Array.prototype.slice.call(arguments)),
                parentScope = childScope.$parent;
            childScope.context = parentScope && parentScope.context
                               ? parentScope.context.newChild()
                               : new Context;
            $provide(childScope.context, "$scope", childScope);
            return childScope;
        };
        scopeProto.$destroy = function () {
            var context = this.context;
            if (context !== rootContext) {
                delete this.context;
                context.end();
            }
            destroyScope.apply(this, Array.prototype.slice.call(arguments));
        };
        $rootScope.rootContext = $rootScope.context = rootContext;
    }

    /**
     * @function _registerControllers
     * Registers the controllers from package into the container and module.
     * @param  {Package}   package              - module package
     * @param  {Provider}  $controllerProvider  - controller provider
     */
    function _registerControllers(package, $controllerProvider) {
        var container = Container(rootContext);
        package.getClasses(function (member) {
            if (member.member.prototype instanceof Controller) {
                var controller = member.member;
                $controllerProvider.register(member.name, 
                    ['$scope', '$injector', _controllerShim(controller)]);
                container.register($component(controller).contextual());
            }
        });
        package.getPackages(function (member) {
            _registerControllers(member.member, $controllerProvider);
        });
    }

    /**
     * @function _controllerShim
     * Registers the controller from package into the container and module.
     * @param    {Function}  controller  - controller class
     * @returns  {Function}  controller constructor shim.  
     */
    function _controllerShim(controller) {
        return function($scope, $injector) {
            var context = $scope.context;
            $provide(context, null, function (resolution) {
                var key = Modifier.unwrap(resolution.getKey());
                if ($isString(key)) {
                    return $injector.get(key);
                }
            });
            var instance = context.resolve($instant(controller));
            if (instance) {
                instance.setContext(context);
            }
            return instance;
        };
    }

    eval(this.exports);
}
