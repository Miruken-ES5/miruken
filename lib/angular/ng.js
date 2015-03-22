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

    var _bootstrapped       = false,
        _instrumentedScopes = false;

    var rootContext   = new Context,
        rootContainer = new IoContainer;
    rootContext.addHandlers(rootContainer, 
                            new miruken.validate.ValidationCallbackHandler,
                            new miruken.error.ErrorCallbackHandler);

    /**
     * @function bootstrapMiruken
     * Bootstraps angular with Miruekn.
     * @param  {Object}  options  - bootstrap options
     */
    function bootstrap(options) {
        if (_bootstrapped) {
            return;
        }
        _bootstrapped = true;
        var ngModule = angular.module;
        angular.module = function (name, requires) {
            var module = ngModule.apply(this, Array.prototype.slice.call(arguments));
            if (requires) {
                var package = _synthesizePackage(name);
                module.config(['$controllerProvider', function ($controllerProvider) {
                    _registerControllers(package, $controllerProvider);
                }]);
                if (!_instrumentedScopes) {
                    module.run(['$rootScope', _instrumentScopes]);
                    _instrumentedScopes = true;
                }
            }
            return module;
       };
    }

    /**
     * @function _synthesizePackage
     * Synthesizes Miruken packages from angular modules.
     * @param    {String}   moduleName  - module name
     * @returns  {Package}  the corresponding package.
     */
    function _synthesizePackage(moduleName) {
        var parent = base2,
            names  = moduleName.split(".");
        for (var i = 0; i < names.length; ++i) {
            var packageName = names[i];
            if (!base2.hasOwnProperty(packageName)) {
                var package = new base2.Package(null, {
                    name:   packageName,
                    parent: parent
                });
                parent.addName(packageName, package);
                if (parent === base2) {
                    global[packageName] = package;
                }
                parent = package;
            }
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
     * Registers the controller from package into the container and module.
     * @param  {Package}   package              - module package
     * @param  {Provider}  $controllerProvider  - controller provider
     */
    function _registerControllers(package, $controllerProvider) {
        var container = Container(rootContext);
        package.getClasses(function (member) {
            if (member.member.prototype instanceof Controller) {
                var controller = member.member;
                $controllerProvider.register(member.name, ['$scope', _controllerShim(controller)]);
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
        return function($scope) {
            var context  = $scope.context,
                instance = context.resolve($instant(controller));
            instance.setContext(context);
            return instance;
        };
    }

    eval(this.exports);
}
