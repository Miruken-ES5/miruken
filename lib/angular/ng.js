var miruken = require('../miruken');
              require('../mvc');

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
        imports: "miruken,miruken.callback,miruken.context,miruken.validate,miruken.ioc,miruken.mvc",
        exports: "Runner,Directive,UseModelValidation,$rootContext"
    });

    eval(this.imports);

    var $rootContext  = new Context,
        rootContainer = new IoContainer;

    $rootContext.addHandlers(rootContainer, 
                             new miruken.validate.ValidationCallbackHandler,
                             new miruken.validate.ValidateJsCallbackHandler,
                             new miruken.error.ErrorCallbackHandler);
    
    angular.module('ng').run(['$rootScope', '$injector', _instrumentScopes]);

    /**
     * Description goes here
     * @class Runner
     * @constructor
     * @extends Base     
     */
    var Runner = Base.extend({
        run: function () {}
    });

    /**
     * Description goes here
     * @class Directive
     * @constructor
     * @extends Base     
     */
    var Directive = Base.extend();

    /**
     * Description goes here
     * @class UseModelValidation
     * @constructor
     * @extends Directive     
     */
    var UseModelValidation = Directive.extend({
        restrict: 'A',
        require:  'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var context   = scope.context,
                modelExpr = attrs['useModelValidation'];
            ctrl.$validators.modelValidationHook = $debounce(function () {
                var model = modelExpr ? scope.$eval(modelExpr) : undefined;
                Validating(context).validateAsync(model)
                    .finally(scope.$apply.bind(scope));
                return true;
            }, 100, false, true);
        }
    });
    
    Package.implement({
        init: function () {
            this.base();
            var parent = this.parent,
                module = this.ngModule;
            if (module instanceof Array) {
                var name = String2.slice(this, 7, -1);  // [base2.xyz]
                module = angular.module(name, module);
                module.constant('$rootContext', $rootContext);
            } else if (parent) {
                module = parent.ngModule;
            }
            if (module) {
                Object.defineProperty(this, 'ngModule', { value: module });
            }
            if (parent === base2) {
                global[this.name] = this;
            }
        },
        exported: function (exports) {
            this.base(exports);
            var module = this.ngModule;
            if (module && $isFunction(module.config)) {
                var package   = this,
                    container = Container($rootContext),
                    runners   = [], starters = [];
                _registerControllersAndDirectives(this, module, exports);
                module.config(['$injector', function ($injector) {
                            _installPackage(package, module, exports, $injector, runners, starters);
                }]);
                module.run(['$injector', '$q', '$log', function ($injector, $q, $log) {
                   _provideInjector(rootContainer, $injector);
                   Array2.forEach(runners, function (runner) {
                       $injector.invoke(runner);
                   });
                   container.register(starters);
                   $q.when(container.resolveAll(Starting)).then(function (starters) {
                       Array2.invoke(starters, "start");
                   }, function (error) {
                       $log.error(format("Startup for package %1 failed: %2", package, error.message));
                   });
              }]);
            }
        }
    });

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
     * @function _registerControllersAndDirectives
     * Registers the package controllers and directives.
     * @param  {Package}   package  - module package
     * @param  {Module}    module   - angular module
     * @param  {Array}     exports  - exported members
     */
    function _registerControllersAndDirectives(package, module, exports) {
        var container = Container($rootContext);
        Array2.forEach(exports, function (name) {
            var member = package[name];
            if (!member) {
                return;
            }
            if (member.prototype instanceof Directive) {
                var directive = new ComponentModel;
                directive.setKey(member);
                container.addComponent(directive);
                var deps = _ngDependencies(directive);
                deps.unshift('$rootScope');
                deps.push(Shim(member, deps.slice()));
                name = name.charAt(0).toLowerCase() + name.slice(1);
                module.directive(name, deps);
            } else if (member.prototype instanceof Controller) {
                var controller = new ComponentModel;
                controller.setKey(member);
                controller.setLifestyle(new ContextualLifestyle);
                container.addComponent(controller);
                var deps = _ngDependencies(controller);
                deps.unshift('$scope', '$injector');
                deps.push(Shim(member, deps.slice()));
                module.controller(name, deps);
            }
        });
    }

    /**
     * @function _installPackage
     * Registers the package Installers, Runners and Starters.
     * @param  {Package}   package   - module package
     * @param  {Module}    module    - angular module
     * @param  {Array}     exports  - exported members
     * @param  {Injector}  injector  - module injector
     * @param  {Array}     runners   - collects runners
     * @param  {Array}     starters  - collects starters
     */
    function _installPackage(package, module, exports, injector, runners, starters) {
        var container = Container($rootContext);
        Array2.forEach(exports, function (name) {
            var member = package[name];
            if (!member) {
                return;
            }
            if (member.prototype instanceof Installer || member.prototype instanceof Runner) {
                var deps      = (member.prototype.$inject || member.$inject || []).slice(),
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
                    var component = member.new.apply(member, args);
                    if (component instanceof Installer) {
                        container.register(component);
                    } else {
                        component.run();
                    }
                });
                if (member.prototype instanceof Installer) {
                    injector.invoke(deps);
                } else {
                    runners.push(deps);
                }
            }
        });
        starters.push($classes.fromPackage(package).basedOn(Starting).withKeys.self());
    }

    /**
     * @function Shim
     * Resolves the component from the container.
     * @param    {Function}  component   - component key
     * @param    {Array}     deps        - angular dependency keys
     * @returns  {Function}  component constructor shim.  
     */
    function Shim(component, deps) {
        return function($scope, $injector) {
            var context    = $scope.context,
                parameters = Array2.combine(deps, arguments);
            _provideLiteral(context, parameters);
            if ($injector) {
                _provideInjector(context, $injector);
            }
            var instance = context.resolve($instant(component));
            for (var key in $scope) {
                if ($scope[key] === this) {
                    $scope[key] = instance;
                    break;
                }
            }
            return instance;
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
     * @function _ngDependencies
     * Extracts the string dependencies for the component.
     * @param    {Function}  controller  - controller class
     * @returns  {Array} angular dependencies
     */
    function _ngDependencies(componentModel) {
        var deps = componentModel.getDependencies();
        return deps ? Array2.filter(Array2.map(deps,
                          function (dep) { return dep.dependency; }),
                          function (dep) { return $isString(dep); })
                    : [];
    }

    eval(this.exports);
}
