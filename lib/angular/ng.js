var miruken = require('../miruken');
              require('../ioc');
              require('../mvc');
              require('../error');

new function () { // closure

    if (typeof angular === "undefined") {
        throw new Error("angular not found.  Did you forget to include angular.js first?");
    }

    /**
     * Package providing [Angular](https://angularjs.org) integration.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}},
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}},
     * {{#crossLinkModule "ioc"}}{{/crossLinkModule}} modules.
     * {{#crossLinkModule "error"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule ng
     * @namespace miruken.ng
     */
    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.callback,miruken.context," +
            	 "miruken.validate,miruken.ioc,miruken.mvc",
        exports: "Runner,Directive,Filter,DynamicControllerDirective," +
                 "UseModelValidation,DigitsOnly,InhibitFocus,TrustFilter," +
                 "$appContext,$envContext,$rootContext"
    });

    eval(this.imports);

    var $appContext   = new Context,
        $envContext   = $appContext.newChild(),
        $rootContext  = $envContext.newChild(),
        appContainer  = new IoContainer,
        mirukenModule = angular.module("miruken.ng", []);

    mirukenModule.constant("$appContext",  $appContext);
    mirukenModule.constant("$envContext",  $envContext);                
    mirukenModule.constant("$rootContext", $rootContext);
    Object.defineProperty(this.package, "ngModule", { value: mirukenModule });
    
    $appContext.addHandlers(appContainer,
                            new NavigateCallbackHandler(),
                            new miruken.validate.ValidationCallbackHandler,
                            new miruken.validate.ValidateJsCallbackHandler,
                            new miruken.error.ErrorCallbackHandler);
    
    angular.module("ng").run(["$rootElement", "$rootScope", "$injector",
                              "$templateRequest", "$compile", "$q", "$timeout",
        function ($rootElement, $rootScope, $injector, $templates, $compile, $q, $timeout) {
            _instrumentScopes($rootScope, $injector);
            var appRegion = new miruken.ng.PartialRegion(
                "app", $rootElement, $templates, $compile, $q, $timeout);
            $appContext.addHandlers(appRegion, new BootstrapProvider);
            _provideInjector(appContainer, $injector);
    }]);
    
    /**
     * Marks a class to be called during the run phase of an Angular module setup.<br/>
     * See [Angular Module Loading & Dependencies](https://docs.angularjs.org/guide/module)
     * @class Runner
     * @extends Base     
     */
    var Runner = Base.extend({
        /**
         * Executed during the run phase of an Angular module.
         * @method run
         */            
        run: function () {}
    });

    /**
     * Marks a class as an
     * [Angular Directive Definition Object] (https://docs.angularjs.org/guide/module)
     * @class Directive
     * @extends Base     
     */
    var Directive = Base.extend();

    /**
     * Marks a class as an
     * [Angular Filter] (https://docs.angularjs.org/guide/filter)
     * @class Filter
     * @extends Base     
     */
    var Filter = Base.extend({
        /**
         * Transforms input from one value to another.
         * @method filter
         * @param   {Any} input  -  any input
         * @returns {Any} transformed output.
         */
        filter: function (input) { return input; }
    });

    /**
     * Angular directive to allow controller expressions.
     * @class DynamicControllerDirective
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var DynamicControllerDirective = Directive.extend({
        restrict: "A",
        terminal: true,
        priority: 100000,
        $inject:  [ "$parse", "$compile" ],
        constructor: function ($parse, $compile) {
            this.extend({
                link: function (scope, elem, attrs) {
                    var name = $parse(elem.attr("dynamic-controller"))(scope);
                    if (scope.src) {
                        elem.attr("src", "'" + scope.src + "'");
                    }
                    elem.removeAttr("dynamic-controller");
                    elem.attr("ng-controller", name);
                    $compile(elem)(scope);
                }
            });
        }
    });
    
    /**
     * Angular directive enabling model validation.
     * @class UseModelValidation
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var UseModelValidation = Directive.extend({
        restrict: "A",
        require:  "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            var context = scope.context,
                model   = attrs["useModelValidation"] || undefined;
            ctrl.$validators.modelValidationHook = $debounce(function () {
                Validating(context).validateAsync(model).finally(function() {
                    scope.$evalAsync();
                });
                return true;
            }, 100, false, true);
        }
    });

    /**
     * Angular directive restricting digit input.
     * @class DigitsOnly
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var DigitsOnly = Directive.extend({
        restrict: "A",
        require:  "?ngModel",
        link: function (scope, elm, attrs, modelCtrl) {
            modelCtrl.$parsers.push(function (inputValue) {
                if (!modelCtrl) {
                    return;
                }
                if (inputValue == undefined) {
                    return "";
                }
                var strippedInput = inputValue.replace(/[^0-9]/g, "");
                if (strippedInput != inputValue) {
                    modelCtrl.$setViewValue(strippedInput);
                    modelCtrl.$render();
                }
                return strippedInput;
            });
        }
    });

    /**
     * Angular directive preventing an element from receiving focus.
     * @class InhibitFocus
     * @constructor
     * @extends miruken.ng.Directive     
     */    
    var InhibitFocus = Directive.extend({
        restrict: "A",
        link: function (scope, elm, attrs) {
            elm.bind("click", function () {
                elm.blur();
            });
        }
    });

    /**
     * Angular filter to trust content.<br/>
     * See [Angular String Contextual Escaping](https://docs.angularjs.org/api/ng/service/$sce)
     * 
     * @class TrustFilter
     * @constructor
     * @extends miruken.ng.Filter     
     */        
    var TrustFilter = Filter.extend({
        $inject: ["$sce"],
        constructor: function ($sce) {
            this.extend({
                filter: function (input) {
                    return $sce.trustAsHtml(input);
                }
            });
        }
    });
    
    Package.implement({
        init: function () {
            this.base();
            var parent = this.parent,
                module = this.ngModule;
            if (module) {
                var name = String2.slice(this, 7, -1),  // [base2.xyz]
                    exists;
                try {
                    angular.module(name);
                    exists = true;
                } catch (e) {
                    // doesn't exist
                }
                if (exists) {
                    throw new Error(format("The Angular module '%1' already exists.", name));
                }
                if (module.indexOf(mirukenModule.name) < 0) {
                    module = module.slice();
                    module.push(mirukenModule.name);
                }
                module = angular.module(name, module);
            } else if (parent) {
                module = parent.ngModule;
            }
            if (module) {
                Object.defineProperty(this, "ngModule", { value: module });
            }
            if ((parent === base2) && !(this.name in global)) {
                global[this.name] = this;
            }
        },
        exported: function (exports) {
            this.base(exports);
            var module = this.ngModule;
            if (module && $isFunction(module.config)) {
                var package   = this,
                    container = Container($appContext),
                    runners   = [], starters = [];
                _registerContents(this, module, exports);
                module.config(["$injector", function ($injector) {
                    _installPackage(package, module, exports, $injector, runners, starters);
                }]);
                module.run(["$rootScope", "$injector", "$q", "$log", function ($rootScope, $injector, $q, $log) {
                    if (package.parent === base2 && !(package.name in $rootScope)) {
                        $rootScope[package.name] = package;
                    }
                   _provideInjector(appContainer, $injector);
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

    CallbackHandler.implement({
        /**
         * Schedules the $digest to run after callback is handled.
         * @method $ngApply
         * @returns {miruken.callback.CallbackHandler}  $digest aspect.
         * @for miruken.callback.CallbackHandler
         */
        $ngApply: function() {
            return this.aspect(null, function(_, composer) {
                var scope = composer.resolve("$scope");
                if (scope && !scope.$root.$$phase) {
                    scope.$root.$apply();
                }
            });
        },
        /**
         * Schedules the $digest to run at some time in the future after callback is handled.
         * @method $ngApplyAsync
         * @param  {number}   [delay]  -  optional delay
         * @returns {miruken.callback.CallbackHandler}  $digest aspect.
         * @for miruken.callback.CallbackHandler
         */                                                                
        $ngApplyAsync: function(delay) {
            return this.aspect(null, function(_, composer) {
                var scope = composer.resolve("$scope");
                if (scope) {
                    var root = scope.$root;
                    if (delay) {
                        setTimeout(root.$evalAsync.bind(root), delay);
                    } else {
                        root.$evalAsync();
                    }
                }
            });
        }        
    });
    
    /**
     * @function _instrumentScopes
     * Instruments angular scopes with miruken contexts.
     * @param  {Scope}   $rootScope  -  angular's root scope
     */
    function _instrumentScopes($rootScope)
    {
        var scopeProto   = $rootScope.constructor.prototype,
            newScope     = scopeProto.$new,
            destroyScope = scopeProto.$destroy;
        scopeProto.$new = function (isolate, parent) {
            var childScope   = newScope.call(this, isolate, parent),
                parentScope  = childScope.$parent,
                childContext = parentScope && parentScope.context
                             ? parentScope.context.newChild()
                             : new Context;
            $provide(childContext, "$scope", childScope);
            childContext.onEnded(function (context) {
                childScope.$destroy();
            });
            childScope.context = childContext;            
            return childScope;
        };
        scopeProto.$destroy = function () {
            var context = this.context;
            if (context !== $rootContext) {
                context.end();
                delete this.context;
            }
            destroyScope.call(this);
        };
        // Fill in missing scopes (e.g. pushes)
        $provide(Context, "$scope", function () {
            var scope = this.parent.resolve("$scope");
            if (scope != null) {
                var childScope = newScope.call(scope);
                childScope.context = this;
                $provide(this, "$scope", childScope);
                return childScope;
            }
        });
        $rootScope.rootContext = $rootScope.context = $rootContext;
        $provide($rootContext, "$scope", $rootScope);        
    }

    var _controllerPolicies = [ ComponentModelAwarePolicy.Explicit ];
    
    /**
     * @function _registerContents
     * Registers the package controllers, filters, directives and any conforming
     * {{#crossLink "miruken.callback.Resolving"}}{{/crossLink}} comoponent.
     * @param  {Package}  package  - module package
     * @param  {Module}   module   - angular module
     * @param  {Array}    exports  - exported members
     */
    function _registerContents(package, module, exports) {
        var unknown   = exports.slice(),
            container = Container($appContext);
        Array2.forEach(exports, function (name) {
            var member = package[name];
            if (!member || !member.prototype || $isProtocol(member)) {
                return;
            }
            var memberProto = member.prototype;
            name = memberProto.$name || name;
            if (memberProto instanceof Directive) {
                var directive = new ComponentModel;
                directive.key = member;
                container.addComponent(directive);
                var deps = _ngDependencies(directive);
                deps.unshift("$rootScope", "$injector");
                deps.push(Shim(member, deps.slice()));
                if (/Directive$/.test(name)) {
                    name = name.substring(0, name.length - 9);
                }
                name = name.charAt(0).toLowerCase() + name.slice(1);
                module.directive(name, deps);
                Array2.remove(unknown, name);
            } else if (memberProto instanceof Controller) {
                var controller = new ComponentModel;
                controller.key = [member, name];
                controller.implementation = member;                
                controller.lifestyle = new ContextualLifestyle;
                container.addComponent(controller, _controllerPolicies);
                var deps = _ngDependencies(controller);
                deps.unshift("$scope", "$injector");
                deps.push(Shim(member, deps.slice()));
                module.controller(name, deps);
                Array2.remove(unknown, name);                
            } else if (memberProto instanceof Filter) {
                var filter = new ComponentModel;
                filter.key = member;
                container.addComponent(filter);
                var deps = _ngDependencies(filter);
                deps.unshift("$rootScope", "$injector");
                var shim = Shim(member, deps.slice());
                deps.push(function () {
                    var instance = shim.apply(null, arguments);
                    return instance.filter.bind(instance);
                });
                if (/Filter$/.test(name)) {
                    name = name.substring(0, name.length - 6);
                }
                name = name.charAt(0).toLowerCase() + name.slice(1);
                module.filter(name, deps);
                Array2.remove(unknown, name);                
            }
        });
        container.register(
            $classes.fromPackage(package, unknown).basedOn(Resolving)
                .withKeys.mostSpecificService()
        );             
    }

    /**
     * @function _installPackage
     * Registers the package Installers, Runners and Starters.
     * @param  {Package}   package   -  module package
     * @param  {Module}    module    -  angular module
     * @param  {Array}     exports   -  exported members
     * @param  {Injector}  injector  -  module injector
     * @param  {Array}     runners   -  collects runners
     * @param  {Array}     starters  -  collects starters
     */
    function _installPackage(package, module, exports, injector, runners, starters) {
        var container = Container($appContext);
        Array2.forEach(exports, function (name) {
            var member = package[name];
            if (!member) {
                return;
            }
            var memberProto = member.prototype;
            if (memberProto instanceof Installer || memberProto instanceof Runner) {
                var deps      = (memberProto.$inject || member.$inject || []).slice(),
                    moduleIdx = deps.indexOf("$module");
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
                if (memberProto instanceof Installer) {
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
     * @param    {Function}  component   -  component key
     * @param    {Array}     deps        -  angular dependency keys
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
     * @param  {Object}  owner    -  owning instance
     * @param  {Object}  literal  -  object literal
     */
    function _provideLiteral(owner, literal) {
        $provide(owner, null, function (resolution) {
            var key = Modifier.unwrap(resolution.key);
            return literal[key];
        });
    }

    /**
     * @function _provideInjector
     * Attaches the supplied injector to owners $providers.
     * @param  {Object}    owner     -  owning instance
     * @param  {Injector}  injector  -  angular injector
     */
    function _provideInjector(owner, injector) {
        $provide(owner, null, function (resolution) {
            var key = Modifier.unwrap(resolution.key);
            if ($isString(key) && injector.has(key)) {
                return injector.get(key);
            }
        });
    }

    /**
     * @function _ngDependencies
     * Extracts the string dependencies for the component.
     * @param    {Function}  controller  -  controller class
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
