var miruken = require('../miruken');
              require('../ioc');
              require('../mvc');

new function () { // closure

    if (typeof angular === 'undefined') {
        throw new Error("angular not found.  Did you forget to include angular.js first?");
    }

    /**
     * Package providing [Angular](https://angularjs.org) integration.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}},
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}},
     * {{#crossLinkModule "error"}}{{/crossLinkModule}} and
     * {{#crossLinkModule "ioc"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule ng
     * @namespace miruken.ng
     */
    var ng = new base2.Package(this, {
        name:    "ng",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.validate,miruken.ioc,miruken.mvc",
        exports: "Runner,Directive,Region,UseModelValidation,$rootContext"
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
     * Marks a class to be called during the run phase of an Angular module setup.<br/>
     * See [Angular Module Loading & Dependencies](https://docs.angularjs.org/guide/module)
     * @class Runner
     * @constructor
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
     * @constructor
     * @extends Base     
     */
    var Directive = Base.extend(null, {
        /**
         * Gets the nearest {{#crossLink "miruken.mvc.Controller"}}{{/crossLink}} in the scope chain.
         * @method getNearestController
         * @static
         * @param   {Scope}    scope      -  angular scope
         * @returns {miruken.mvc.Controller} nearest controller.
         */                                
        getNearestController: function (scope) {
            while (scope) {
                for (var key in scope) {
                    var value = scope[key];
                    if (value instanceof Controller) {
                        return value;
                    }
                }
                scope = scope.$parent;
            }
        }
    });

    /**
     * Represents an area of a view template.
     * @class PartialView
     * @constructor
     * @param {Element}  container         -  html container element
     * @param {Scope}    scope             -  partial scope
     * @param {Element}  content           -  initial html content
     * @param {Object}   $templateRequest  -  angular $templateRequest service
     * @param {Object}   $controller       -  angular $controller service
     * @param {Object}   $compile          -  angular $compile service
     * @param {Object}   $q                -  angular $q service
     * @extends Base
     * @uses miruken.$inferProperties
     * @uses miruken.mvc.PartialRegion     
     */
    var PartialView = Base.extend(PartialRegion, $inferProperties, {
        constructor: function (container, content, scope, partialScope,
                               $templateRequest, $controller, $compile, $q) {
            var _controller;

            this.extend({
                getContext: function () { return scope.context; },
                getController: function () { return _controller; },
                getControllerContext: function () { return _controller && _controller.context; },
                present: function (presentation) {
                    var template, templateUrl, controller;
                    
                    if ($isString(presentation)) {
                        templateUrl = presentation;
                    } else if (presentation ) {
                        template    = presentation.template,
                        templateUrl = presentation.templateUrl,
                        controller  = presentation.controller;
                    }
                    
                    if (template) {
                        return replaceContent(template);
                    } else if (templateUrl) {
                        return $templateRequest(templateUrl, true).then(function (template) {
                            return replaceContent(template);
                        });
                    } else {
                        return $q.reject(new Error('A template or templateUrl must be specified'));
                    }
                    
                    function replaceContent(template) {
                        var oldScope = partialScope;
                        partialScope = scope.$new();
                        _controller  = null;
                        
                        if (controller) {
                            var parts   = controller.split(' ');
                            controller  = parts[0];
                            _controller = $controller(controller, { $scope: partialScope });
                            var controllerAs = parts.length > 1 ?  parts[parts.length - 1] : 'ctrl';
                            partialScope[controllerAs] = _controller;
                            var cancel = _controller.context.observe({
                                contextEnding: function (context) {
                                    if (_controller && (context === _controller.context)) {
                                        if (content) {
                                            content.remove();
                                            content = null;
                                        }
                                        _controller = null;
                                    }
                                    cancel();
                                }
                            });
                        }

                        var oldContent = content;
                        content = $compile(template)(partialScope);
                        if (oldContent) {
                            oldContent.remove();
                        }
                        container.after(content);
                        oldScope.$destroy();
                        
                        return $q.when(this.controllerContext);               
                    }
                }
            });
        }
    });

    /**
     * Angular directive marking a view region.
     * @class Region
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var Region = Directive.extend({
        scope:      true,
        restrict:   'A',
        priority:   1200,
        transclude: 'element',
        $inject:    ['$templateRequest', '$controller', '$compile', '$q'],
        constructor: function ($templateRequest, $controller, $compile, $q) {
            this.extend({
                link: function (scope, element, attr, ctrl, transclude) {
                    var partialScope = scope.$new(),
                        name         = scope.$eval(attr.region) || attr.region,
                        onload       = attr.onload || '';
                    
                    transclude(partialScope, function (content) {
                        var partial = new PartialView(
                            element, content, scope, partialScope,
                            $templateRequest, $controller, $compile, $q);
                        scope.context.addHandlers(partial);
                        
                        if (name) {
                            var owningController = Directive.getNearestController(scope);
                            if (owningController) {
                                owningController[name] = partial;
                            }
                        }

                        if (content) {
                            element.after(content);
                        }

                        if (onload) {
                            scope.$eval(onload);
                        }
                    });
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

    CallbackHandler.implement({
        /**
         * Schedules the $digest to run after callback is handled.
         * @method $ngApply
         * @returns {miruken.callback.CallbackHandler}  $digest aspect.
         * @for miruken.callback.CallbackHandler
         */                                                                
        $ngApply: function() {
            return this.aspect(null, function(_, composer) {
                var scope = composer.resolve('$scope');
                if (scope) {
                    scope.$apply();
                }
            });
        },
        /**
         * Schedules the $digest to run at some time in the future after callback is handled.
         * @method $ngApplyAsync
         * @returns {miruken.callback.CallbackHandler}  $digest aspect.
         * @for miruken.callback.CallbackHandler
         */                                                                
        $ngApplyAsync: function() {
            return this.aspect(null, function(_, composer) {
                var scope = composer.resolve('$scope');
                if (scope) {
                    scope.$applyAsync();
                }
            });
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
