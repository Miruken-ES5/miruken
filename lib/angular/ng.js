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
        exports: "Runner,Directive,Filter,RegionDirective,PartialView,UseModelValidation,$rootContext"
    });

    eval(this.imports);

    var $rootContext  = new Context,
        rootContainer = new IoContainer;

    $rootContext.addHandlers(rootContainer, 
                             new miruken.validate.ValidationCallbackHandler,
                             new miruken.validate.ValidateJsCallbackHandler,
                             new miruken.error.ErrorCallbackHandler);

    angular.module('ng').run(['$rootElement', '$rootScope', '$injector',
                              '$templateRequest', '$controller', '$compile', '$q',
        function ($rootElement, $rootScope, $injector, $templates, $controller, $compile, $q) {
            _instrumentScopes($rootScope, $injector);
            var rootRegion = new PartialView($rootElement, $rootScope, $templates, $controller, $compile, $q);
            $rootContext.addHandlers(rootRegion, new BootstrapModal);
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
     * Represents an area of a view template.
     * @class PartialView
     * @constructor
     * @param {Element}  container    -   html container element
     * @param {Scope}    scope        -   partial scope
     * @param {Element}  content      -   initial html content
     * @param {Object}   $templates   -   angular $templateRequest service
     * @param {Object}   $controller  -   angular $controller service
     * @param {Object}   $compile     -   angular $compile service
     * @param {Object}   $q           -   angular $q service
     * @extends Base
     * @uses miruken.$inferProperties
     * @uses miruken.mvc.PartialRegion     
     */
    var PartialView = Base.extend(PartialRegion, $inferProperties, {
        constructor: function (container, scope, $templates, $controller, $compile, $q) {
            var _controller, _partialScope;

            this.extend({
                getContext: function () { return scope.context; },
                getController: function () { return _controller; },
                getControllerContext: function () { return _controller && _controller.context; },
                present: function (presentation) {
                    var composer = $composer,
                        template, templateUrl, controller;
                    
                    if ($isString(presentation)) {
                        templateUrl = presentation;
                    } else if (presentation) {
                        template    = presentation.template,
                        templateUrl = presentation.templateUrl,
                        controller  = presentation.controller;
                    }
                    
                    if (template) {
                        return replaceContent(template);
                    } else if (templateUrl) {
                        return $templates(templateUrl, true).then(function (template) {
                            return replaceContent(template);
                        });
                    } else {
                        return $q.reject(new Error('A template or templateUrl must be specified'));
                    }
                    
                    function replaceContent(template) {
                        var oldScope       = _partialScope,
                            modalPolicy    = new ModalPolicy,
                            isModal        = composer.handle(modalPolicy, true),
                            parentScope    = isModal ? composer.resolve('$scope') : scope;
                        _partialScope      = (parentScope || scope).$new();
                        var partialContext = _partialScope.context;
                        _controller        = null;
                        
                        if (controller) {
                            var parts   = controller.split(' ');
                            controller  = parts[0];
                            _controller = $controller(controller, { $scope: _partialScope });
                            var controllerAs = parts.length > 1 ?  parts[parts.length - 1] : 'ctrl';
                            _partialScope[controllerAs] = _controller;
                        }

                        var content = $compile(template)(_partialScope);

                        if (isModal) {
                            var provider = modalPolicy.style || ModalProviding;
                            partialContext = provider(composer).showModal(container, content, modalPolicy, partialContext);
                        } else {
                            var cancel = partialContext.onEnding(function (context) {
                                if (context === _partialScope.context) {
                                    container.html('');
                                    _controller = null;
                                }
                                cancel();
                            });

                            container.html(content);
                            
                            if (oldScope) {
                                oldScope.$destroy();
                            }
                        }
                        
                        return $q.when(partialContext);
                    }
                }
            });
        }
    });

    /**
     * Angular directive marking a view region.
     * @class RegionDirective
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var RegionDirective = Directive.extend({
        scope:      true,
        restrict:   'A',
        priority:   1200,
        $inject:    ['$templateRequest', '$controller', '$compile', '$q'],
        constructor: function ($templates, $controller, $compile, $q) {
            this.extend({
                link: function (scope, element, attr, ctrl, transclude) {
                    var name    = attr.region,
                        onload  = attr.onload,
                        partial = new PartialView(element, scope, $templates, $controller, $compile, $q);
                    scope.context.addHandlers(partial);
                    
                    if (name) {
                        name = scope.$eval(name) || name;
                        var owningController = scope.context.resolve(Controller);
                        if (owningController) {
                            owningController[name] = partial;
                        }
                    }
                    
                    if (onload) {
                        scope.$eval(onload);
                    }
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
                _registerContents(this, module, exports);
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
     * @param  {Scope}   $rootScope  -  angular's root scope
     * @param  {Scope}   $injector   -  angular's ng injector
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
            var cancel = childScope.context.onEnded(function (context) {
                childScope.$destroy();
                cancel();
            });
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
        $rootScope.rootContext = $rootScope.context = $rootContext;
        _provideInjector(rootContainer, $injector);
    }

    /**
     * @function _registerContents
     * Registers the package controllers, filters and directives.
     * @param  {Package}   package  - module package
     * @param  {Module}    module   - angular module
     * @param  {Array}     exports  - exported members
     */
    function _registerContents(package, module, exports) {
        var container = Container($rootContext);
        Array2.forEach(exports, function (name) {
            var member = package[name];
            if (!member) {
                return;
            }
            var memberProto = member.prototype;
            if (memberProto instanceof Directive) {
                var directive = new ComponentModel;
                directive.setKey(member);
                container.addComponent(directive);
                var deps = _ngDependencies(directive);
                deps.unshift('$rootScope');
                deps.push(Shim(member, deps.slice()));
                if (/Directive$/.test(name)) {
                    name = name.substring(0, name.length - 9);
                }
                name = name.charAt(0).toLowerCase() + name.slice(1);
                module.directive(name, deps);
            } else if (memberProto instanceof Controller) {
                var controller = new ComponentModel;
                controller.setKey(member);
                controller.setLifestyle(new ContextualLifestyle);
                container.addComponent(controller);
                var deps = _ngDependencies(controller);
                deps.unshift('$scope', '$injector');
                deps.push(Shim(member, deps.slice()));
                module.controller(name, deps);
            } else if (memberProto instanceof Filter) {
                var filter = new ComponentModel;
                filter.setKey(member);
                container.addComponent(filter);
                var deps = _ngDependencies(filter);
                deps.unshift('$rootScope');
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
            }
        });
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
            var key = Modifier.unwrap(resolution.getKey());
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
            var key = Modifier.unwrap(resolution.getKey());
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
