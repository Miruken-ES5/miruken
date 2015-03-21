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
        imports: "miruken,miruken.context",
        exports: "bootstrap,rootContext,Controller"
    });

    eval(this.imports);

    var _bootstrapped   = false,
        _decorateScopes = false;

    /**
     * @class {Controller}
     */
    var Controller = Miruken.extend(Contextual, ContextualMixin, {
    });

    var rootContext = new Context;
    rootContext.addHandlers(new miruken.ioc.IoContainer, 
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
                var parent = base2,
                    names  = name.split(".");
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
                module.config(registerPackageControllers.bind(package));
                if (!_decorateScopes) {
                    _decorateScopes = true;
                    module.run(['$rootScope', '$injector', synchronizeContexts]);
                }
            }
            return module;
       };
    }

    /**
     * @function synchronizeContexts
     * Synchronizes Miruken contexts with angular scopes.
     * @param  {Scope}   $rootScope  - angular's root scope
     */
    function synchronizeContexts($rootScope)
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
            return childScope;
        };
        scopeProto.$destroy = function () {
            var context = this.context;
            if (context !== rootContext) {
                context.end();
            }
            destroyScope.apply(this, Array.prototype.slice.call(arguments));
        };

        $rootScope.rootContext = $rootScope.context = rootContext;
        _bootstrapped          = true;
    }

    function registerPackageControllers() {
        this.getClasses(function (member) {

        });
    }

    eval(this.exports);
}
