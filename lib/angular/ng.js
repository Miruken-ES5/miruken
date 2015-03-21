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
        imports: "miruken",
        exports: "bootstrapMiruken,createModulePackages,Controller"
    });

    eval(this.imports);

    /**
     * @class {Controller}
     */
    var Controller = Miruken.extend({
    });

    /**
     * @function bootstrapMiruken
     * Bootstraps angular with Miruekn by 
     *    - creating a context for every scope
     *    - installing a root context and container
     *    - forwarding all $injector get's to miruken
     * @param    {Scope}     $rootScope  - angular $rootScope
     * @param    {Injector}  $injector   - angular $injector
     * @param    {Object}    options     - bootstrap options
     */
    function bootstrapMiruken($rootScope, $injector, options)
    {
        var rootContext = new miruken.context.Context;
        rootContext.addHandlers(new miruken.ioc.IoContainer, 
                                new miruken.validate.ValidationCallbackHandler,
                                new miruken.error.ErrorCallbackHandler);
        $rootScope.rootContext = $rootScope.context = rootContext;
        
        var scopeProto   = $rootScope.constructor.prototype,
            newScope     = scopeProto.$new,
            destroyScope = scopeProto.$destroy;
        scopeProto.$new = function () {
            var childScope  = newScope.apply(this, Array.prototype.slice.call(arguments)),
            parentScope = childScope.$parent;
            childScope.context = parentScope && parentScope.context
                               ? parentScope.context.newChild()
                               : new miruken.context.Context;
            return childScope;
        };
        scopeProto.$destroy = function () {
            var context = this.context;
            if (context !== rootContext) {
                context.end();
            }
            destroyScope.apply(this, Array.prototype.slice.call(arguments));
        };
    }

    function createModulePackages() {
       var module = angular.module;
        angular.module = function (name, requires) {
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
                        parent = package;
                    }
                }
            }
            return module.apply(this, Array.prototype.slice.call(arguments));
       };
    }

    eval(this.exports);
}
