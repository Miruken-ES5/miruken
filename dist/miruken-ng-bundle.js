(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./ng.js');
},{"./ng.js":2}],2:[function(require,module,exports){
(function (global){
var miruken = require('../miruken');
              require('../ioc');
              require('../mvc');

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
     * {{#crossLinkModule "error"}}{{/crossLinkModule}} and
     * {{#crossLinkModule "ioc"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule ng
     * @namespace miruken.ng
     */
    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.callback,miruken.context,miruken.validate,miruken.ioc,miruken.mvc",
        exports: "Runner,Directive,Filter,RegionDirective,DynamicControllerDirective," +
                 "PartialRegion,UseModelValidation,DigitsOnly,InhibitFocus,TrustFilter," +
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
                            new miruken.validate.ValidationCallbackHandler,
                            new miruken.validate.ValidateJsCallbackHandler,
                            new miruken.error.ErrorCallbackHandler);

    angular.module("ng").run(["$rootElement", "$rootScope", "$injector",
                              "$templateRequest", "$controller", "$compile", "$q",
        function ($rootElement, $rootScope, $injector, $templates, $controller, $compile, $q) {
            _instrumentScopes($rootScope, $injector);
            var appRegion = new PartialRegion("root", $rootElement, $rootScope, $templates, $controller, $compile, $q);
            $appContext.addHandlers(appRegion, new BootstrapProvider, new GreenSockFadeProvider);
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
     * Represents an area to render a view in.
     * @class PartialRegion
     * @constructor
     * @param {Element}  name         -  partial name
     * @param {Element}  container    -  html container element
     * @param {Scope}    scope        -  partial scope
     * @param {Element}  content      -  initial html content
     * @param {Object}   $templates   -  angular $templateRequest service
     * @param {Object}   $controller  -  angular $controller service
     * @param {Object}   $compile     -  angular $compile service
     * @param {Object}   $q           -  angular $q service
     * @extends Base
     * @uses miruken.mvc.ViewRegion
     * @uses miruken.context.$contextual
     */
    var PartialRegion = Base.extend(ViewRegion, $contextual, {
        constructor: function (name, container, scope, $templates, $controller, $compile, $q) {
            var _controller, _partialScope;
            this.extend({
                get name() { return name; },
                get container() { return container; },
                get controller() { return _controller; },
                get controllerContext() { return _controller && _controller.context; },
                present: function (presentation) {
                    var composer = $composer,
                        template,   templateUrl,
                        controller, controllerAs;
                    
                    if ($isString(presentation)) {
                        templateUrl = presentation;
                    } else if (presentation) {
                        template     = presentation.template,
                        templateUrl  = presentation.templateUrl,
                        controller   = presentation.controller;
                        controllerAs = presentation.controllerAs || "ctrl";
                    }
                    
                    if (template) {
                        return replaceContent(template);
                    } else if (templateUrl) {
                        return $templates(templateUrl, true).then(function (template) {
                            return replaceContent(template);
                        });
                    } else {
                        return $q.reject(new Error("A template or templateUrl must be specified"));
                    }
                    
                    function replaceContent(template) {
                        var oldScope       = _partialScope,
                            modalPolicy    = new ModalPolicy,
                            isModal        = composer.handle(modalPolicy, true),
                            parentScope    = isModal ? composer.resolve("$scope") : scope;
                        _partialScope      = (parentScope || scope).$new();
                        var partialContext = _partialScope.context;
                        _controller        = null;

                        if (controller) {
                            if ($isString(controller)) {
                                var parts   = controller.split(" ");
                                _controller = $controller(parts[0], { $scope: _partialScope });
                                if (parts.length > 1) {
                                    controllerAs = parts[parts.length - 1];
                                }
                            } else {
                                _controller = composer
                                    .$$provide(["$scope", _partialScope, Context, partialContext])
                                    .resolve(controller);
                            }

                            if ($isPromise(_controller)) {
                                return _controller.then(function (ctrl) {
                                    _controller = ctrl;
                                    return compile();
                                });
                            }
                        }

                        function compile() {
                            if (_controller) {
                                if (_controller.context !== partialContext) {
                                    _controller         = pcopy(_controller);
                                    _controller.context = partialContext;
                                }
                                _partialScope[controllerAs] = _controller;
                            }
                            
                            var content = $compile(template)(_partialScope);
                            
                            if (isModal) {
                                var provider = modalPolicy.style || ModalProviding;
                                return $q.when(provider(composer)
                                	.showModal(container, content, modalPolicy, partialContext))
                                	.then(function (ctx) {
                                        if (_controller && $isFunction(_controller.viewLoaded)) {
                                            _controller.viewLoaded();
                                        }
                                        return ctx;
                                    });
                            }
                            
                            partialContext.onEnding(function (context) {
                                if (context === _partialScope.context) {
                                    _controller = null;
                                }
                            });
                            
                            return animateContent(container, content, partialContext, $q).then(function (ctx) {
                                if (oldScope) {
                                    oldScope.$destroy();
                                }
                                if (_controller && $isFunction(_controller.viewLoaded)) {
                                    _controller.viewLoaded();
                                }
                                return ctx;
                            });                        
                        }
                        
                        return compile();
                    }
                    
                    function animateContent(container, content, partialContext, $q) {
                        var fadePolicy = new FadePolicy,
                            fade       = composer.handle(fadePolicy, true);

                        if (fade) {   
                            return FadeProviding(composer).handle(container, content, partialContext)
                                .then(function () { return partialContext; });
                        }

                        partialContext.onEnding(function (context) {
                            if (context === _partialScope.context) {
                                container.html("");
                            }
                        });
                        
                        container.html(content);
                        if (!_partialScope.$$phase) {
                            _partialScope.$digest();
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
        restrict:   "A",
        scope:      true,        
        priority:   -1000,
        $inject:    ["$templateRequest", "$controller", "$compile", "$q"],
        constructor: function ($templates, $controller, $compile, $q) {
            this.extend({
                link: function (scope, element, attr) {
                    var name    = attr.region,
                        context = scope.context,
                        owner   = context.resolve(Controller),
                        partial = new PartialRegion(name, element, scope, $templates, $controller, $compile, $q);
                    context.onEnded(function () {
                        scope.$destroy();
                        element.remove();
                        partial.context = null;
                    });
                    partial.context = context;                    
                    if (owner && $isFunction(owner.viewRegionCreated)) {
                        owner.viewRegionCreated(partial);
                    }                    
                }
            }); 
        }
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
                if (scope && !scope.$$phase) {
                    scope.$apply();
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
                    if (delay) {
                        setTimeout(scope.$evalAsync.bind(scope), delay);
                    } else {
                        scope.$evalAsync();
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
        $rootScope.rootContext = $rootScope.context = $rootContext;
        $provide($rootContext, "$scope", $rootScope);        
    }

    /**
     * @function _registerContents
     * Registers the package controllers, filters, directives and any conforming
     * {{#crossLink "miruken.callback.Resolving"}}{{/crossLink}} comoponent.
     * @param  {Package}  package  - module package
     * @param  {Module}   module   - angular module
     * @param  {Array}    exports  - exported members
     */
    function _registerContents(package, module, exports) {
        var container = Container($appContext);
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
            } else if (memberProto instanceof Controller) {
                var controller = new ComponentModel;
                controller.key = member;
                controller.lifestyle = new ContextualLifestyle;
                container.addComponent(controller);
                var deps = _ngDependencies(controller);
                deps.unshift("$scope", "$injector");
                deps.push(Shim(member, deps.slice()));
                module.controller(name, deps);
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
            }
        });
        container.register(
            $classes.fromPackage(package, exports).basedOn(Resolving)
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../ioc":10,"../miruken":12,"../mvc":17}],3:[function(require,module,exports){
/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

// timestamp: Wed, 23 Sep 2009 19:38:55

base2 = {
  name:    "base2",
  version: "1.1 (alpha1)",
  exports:
    "Base,Package,Abstract,Module,Enumerable," +
    "Undefined,Null,This,True,False,assignID,global",
  namespace: ""
};

new function(_no_shrink_) { ///////////////  BEGIN: CLOSURE  ///////////////

// =========================================================================
// base2/header.js
// =========================================================================

/*@cc_on @*/

var Undefined = K(), Null = K(null), True = K(true), False = K(false), This = function(){return this};

var global = This(), base2 = global.base2;
   
// private
var _IGNORE  = K(),
    _FORMAT  = /%([1-9])/g,
    _LTRIM   = /^\s\s*/,
    _RTRIM   = /\s\s*$/,
    _RESCAPE = /([\/()[\]{}|*+-.,^$?\\])/g,     // safe regular expressions
    _BASE    = /\bbase\b/,
    _HIDDEN  = ["constructor", "toString"],     // only override these when prototyping
    _counter = 1,
    _slice   = Array.prototype.slice;

_Function_forEach(); // make sure this is initialised

function assignID(object, name) {
  // Assign a unique ID to an object.
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object[name]) object[name] = "b2_" + _counter++;
  return object[name];
};

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

var _subclass = function(_instance, _static) {
  // Build the prototype.
  base2.__prototyping = this.prototype;
  var _prototype = new this;
  if (_instance) extend(_prototype, _instance);
  _prototype.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
  delete base2.__prototyping;
  
  // Create the wrapper for the constructor function.
  var _constructor = _prototype.constructor;
  function _class() {
    // Don't call the constructor function when prototyping.
    if (!base2.__prototyping) {
      if (this.constructor == _class || this.__constructing) {
        // Instantiation.
        this.__constructing = true;
        var instance = _constructor.apply(this, arguments);
        delete this.__constructing;
        if (instance) return instance;
      } else {
        // Casting.
	    var target = arguments[0];
	    if (target instanceof _class) return target;
        var cls = _class;
        do {
          if (cls.coerce) {
	        var cast = cls.coerce.apply(_class, arguments);
            if (cast) return cast;
          }
        } while ((cls = cls.ancestor) && (cls != Base));
        return extend(target, _prototype);
      }
    }
    return this;
  };
  _prototype.constructor = _class;
  
  // Build the static interface.
  for (var i in Base) _class[i] = this[i];
  if (_static) extend(_class, _static);
  _class.ancestor = this;
  _class.ancestorOf = Base.ancestorOf;
  _class.base = _prototype.base;
  _class.prototype = _prototype;
  if (_class.init) _class.init();
  
  // introspection (removed when packed)
  ;;; _class["#implements"] = [];
  ;;; _class["#implemented_by"] = [];
  
  return _class;
};

var Base = _subclass.call(Object, {
  constructor: function() {
    if (arguments.length > 0) {
      this.extend(arguments[0]);
    }
  },
  
  extend: delegate(extend),
  
  toString: function() {
    if (this.constructor.toString == Function.prototype.toString) {
      return "[object base2.Base]";
    } else {
      return "[object " + String2.slice(this.constructor, 1, -1) + "]";
    }
  }
}, Base = {
  ancestorOf: function(klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  forEach: function(object, block, context) {
    _Function_forEach(this, object, block, context);
  },

  implement: function(source) {
    if (typeof source == "function") {
      ;;; if (_ancestorOf(Base, source)) {
        // introspection (removed when packed)
        ;;; this["#implements"].push(source);
        ;;; source["#implemented_by"].push(this);
      ;;; }
      source = source.prototype;
    }
    // Add the interface using the extend() function.
    extend(this.prototype, source);
    return this;
  }
});

// =========================================================================
// base2/Package.js
// =========================================================================

var Package = Base.extend({
  constructor: function(_private, _public) {
    var pkg = this, openPkg;
    
    pkg.extend(_public);

    if (pkg.name && pkg.name != "base2") {
      if (_public.parent === undefined) pkg.parent = base2;
      openPkg = pkg.parent && pkg.parent[pkg.name];
      if (openPkg) {
        if (!(openPkg instanceof Package)) {
          throw new Error(format("'%1' is reserved and cannot be used as a package name", pkg.name));
        }
        pkg.namespace = openPkg.namespace;
      } else {
          if (pkg.parent) {
             pkg.version = pkg.version || pkg.parent.version;
             pkg.parent.addName(pkg.name, pkg);
          }
        pkg.namespace = format("var %1=%2;", pkg.name, String2.slice(pkg, 1, -1));
      }
    }
    
    if (_private) {
      _private.__package = this;
      _private.package = openPkg || this;
      // This next line gets round a bug in old Mozilla browsers
      var jsNamespace = base2.js ? base2.js.namespace : "";
      
      // This string should be evaluated immediately after creating a Package object.
      var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace + jsNamespace;
      var imports = csv(pkg.imports), name;
      for (var i = 0; name = imports[i]; i++) {
        var ns = lookup(name) || lookup("js." + name);
        if (!ns) throw new ReferenceError(format("Object not found: '%1'.", name));
        namespace += ns.namespace;
      }
      if (openPkg) namespace += openPkg.namespace;

      _private.init = function() {
        if (pkg.init) pkg.init();
      };
      _private.imports = namespace + lang.namespace + "this.init();";
      
      // This string should be evaluated after you have created all of the objects
      // that are being exported.
      namespace = "";
      var nsPkg = openPkg || pkg;
      var exports = csv(pkg.exports);
      for (var i = 0; name = exports[i]; i++) {
        var fullName = pkg.name + "." + name;
        nsPkg.namespace += "var " + name + "=" + fullName + ";";
        namespace += "if(!" + fullName + ")" + fullName + "=" + name + ";";
      }
      _private.exported = function() {
        if (nsPkg.exported) nsPkg.exported(exports);
      };
      _private.exports = "if(!" + pkg.name +")var " + pkg.name + "=this.__package;" + namespace + "this._label_" + pkg.name + "();this.exported();";
      
      // give objects and classes pretty toString methods
      var packageName = String2.slice(pkg, 1, -1);
      _private["_label_" + pkg.name] = function() {
        for (var name in nsPkg) {
          var object = nsPkg[name];
          if (object && object.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
            object.toString = K("[" + packageName + "." + name + "]");
          }
        }
      };
    }

    if (openPkg) return openPkg;

    function lookup(names) {
      names = names.split(".");
      var value = base2, i = 0;
      while (value && names[i] != null) {
        value = value[names[i++]];
      }
      return value;
    };
  },

  exports: "",
  imports: "",
  name: "",
  namespace: "",
  parent: null,

  open: function(_private, _public) {
    _public.name   = this.name;
    _public.parent = this.parent;
    return new Package(_private, _public);
  },  

  addName: function(name, value) {
    if (!this[name]) {
      this[name] = value;
      this.exports += "," + name;
      this.namespace += format("var %1=%2.%1;", name, this.name);
      if (value && value.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
        value.toString = K("[" + String2.slice(this, 1, -1) + "." + name + "]");
      }
      if (this.exported) this.exported([name]);
    }
  },

  addPackage: function(name) {
    var package = new Package(null, {name: name, parent: this});
    this.addName(name, package);
    return package;
  },

  package: function(_private, _public) {
    _public.parent = this;
    return new Package(_private, _public);
  },
    
  toString: function() {
    return format("[%1]", this.parent ? String2.slice(this.parent, 1, -1) + "." + this.name : this.name);
  }
});

// =========================================================================
// base2/Abstract.js
// =========================================================================

// Not very exciting this.

var Abstract = Base.extend({
  constructor: function() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

var Module = Abstract.extend(null, {
  namespace: "",

  extend: function(_interface, _static) {
    // Extend a module to create a new module.
    var module = this.base();
    var index = _moduleCount++;
    module.namespace = "";
    module.partial = this.partial;
    module.toString = K("[base2.Module[" + index + "]]");
    Module[index] = module;
    // Inherit class methods.
    module.implement(this);
    // Implement module (instance AND static) methods.
    if (_interface) module.implement(_interface);
    // Implement static properties and methods.
    if (_static) {
      extend(module, _static);
      if (module.init) module.init();
    }
    return module;
  },

  forEach: function(block, context) {
    _Function_forEach (Module, this.prototype, function(method, name) {
      if (typeOf(method) == "function") {
        block.call(context, this[name], name, this);
      }
    }, this);
  },

  implement: function(_interface) {
    var module = this;
    var id = module.toString().slice(1, -1);
    if (typeof _interface == "function") {
      if (!_ancestorOf(_interface, module)) {
        this.base(_interface);
      }
      if (_ancestorOf(Module, _interface)) {
        // Implement static methods.
        for (var name in _interface) {
          if (typeof module[name] == "undefined") {
            var property = _interface[name];
            if (typeof property == "function" && property.call && _interface.prototype[name]) {
              property = _createStaticModuleMethod(_interface, name);
            }
            module[name] = property;
          }
        }
        module.namespace += _interface.namespace.replace(/base2\.Module\[\d+\]/g, id);
      }
    } else {
      // Add static interface.
      extend(module, _interface);
      // Add instance interface.
      _extendModule(module, _interface);
    }
    return module;
  },

  partial: function() {
    var module = Module.extend();
    var id = module.toString().slice(1, -1);
    // partial methods are already bound so remove the binding to speed things up
    module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
    this.forEach(function(method, name) {
      module[name] = partial(bind(method, module));
    });
    return module;
  }
});


Module.prototype.base =
Module.prototype.extend = _IGNORE;

function _extendModule(module, _interface) {
  var proto = module.prototype;
  var id = module.toString().slice(1, -1);
  for (var name in _interface) {
    var property = _interface[name], namespace = "";
    if (!proto[name]) {
      if (name == name.toUpperCase()) {
        namespace = "var " + name + "=" + id + "." + name + ";";
      } else if (typeof property == "function" && property.call) {
        namespace = "var " + name + "=base2.lang.bind('" + name + "'," + id + ");";
        proto[name] = _createModuleMethod(module, name);
        ;;; proto[name]._module = module; // introspection
      }
      if (module.namespace.indexOf(namespace) == -1) {
        module.namespace += namespace;
      }
    }
  }
};

function _createStaticModuleMethod(module, name) {
  return function() {
    return module[name].apply(module, arguments);
  };
};

function _createModuleMethod(module, name) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
};

// =========================================================================
// base2/Enumerable.js
// =========================================================================

var Enumerable = Module.extend({
  every: function(object, test, context) {
    var result = true;
    try {
      forEach (object, function(value, key) {
        result = test.call(context, value, key, object);
        if (!result) throw StopIteration;
      });
    } catch (error) {
      if (error != StopIteration) throw error;
    }
    return !!result; // cast to boolean
  },
  
  filter: function(object, test, context) {
    var i = 0;
    return this.reduce(object, function(result, value, key) {
      if (test.call(context, value, key, object)) {
        result[i++] = value;
      }
      return result;
    }, []);
  },
  
  invoke: function(object, method) {
    // Apply a method to each item in the enumerated object.
    var args = _slice.call(arguments, 2);
    return this.map(object, typeof method == "function" ? function(item) {
      return item == null ? undefined : method.apply(item, args);
    } : function(item) {
      return item == null ? undefined : item[method].apply(item, args);
    });
  },
  
  map: function(object, block, context) {
    var result = [], i = 0;
    forEach (object, function(value, key) {
      result[i++] = block.call(context, value, key, object);
    });
    return result;
  },
  
  pluck: function(object, key) {
    return this.map(object, function(item) {
      return item == null ? undefined : item[key];
    });
  },
  
  reduce: function(object, block, result, context) {
    var initialised = arguments.length > 2;
    forEach (object, function(value, key) {
      if (initialised) { 
        result = block.call(context, result, value, key, object);
      } else { 
        result = value;
        initialised = true;
      }
    });
    return result;
  },
  
  some: function(object, test, context) {
    return !this.every(object, not(test), context);
  }
});

// =========================================================================
// lang/package.js
// =========================================================================

var lang = {
  name:      "lang",
  version:   base2.version,
  exports:   "assert,assertArity,assertType,bind,copy,extend,forEach,format,instanceOf,match,pcopy,rescape,trim,typeOf",
  namespace: "" // Fixed later.
};

// =========================================================================
// lang/assert.js
// =========================================================================

function assert(condition, message, ErrorClass) {
  if (!condition) {
    throw new (ErrorClass || Error)(message || "Assertion failed.");
  }
};

function assertArity(args, arity, message) {
  if (arity == null) arity = args.callee.length; //-@DRE
  if (args.length < arity) {
    throw new SyntaxError(message || "Not enough arguments.");
  }
};

function assertType(object, type, message) {
  if (type && (typeof type == "function" ? !instanceOf(object, type) : typeOf(object) != type)) {
    throw new TypeError(message || "Invalid type.");
  }
};

// =========================================================================
// lang/copy.js
// =========================================================================

function copy(object) { // A quick copy.
  var copy = {};
  for (var i in object) {
    copy[i] = object[i];
  }
  return copy;
};

function pcopy(object) { // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy;
};

function _dummy(){};

// =========================================================================
// lang/extend.js
// =========================================================================

function extend(object, source) { // or extend(object, key, value)
  if (object && source) {
    var useProto = base2.__prototyping;
    if (arguments.length > 2) { // Extending with a key/value pair.
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    //var proto = (typeof source == "function" ? Function : Object).prototype;
    var proto = global[(typeof source == "function" ? "Function" : "Object")].prototype;
    // Add constructor, toString etc
    if (useProto) {
      var i = _HIDDEN.length, key;
      while ((key = _HIDDEN[--i])) {
        var desc = _getPropertyDescriptor(source, key);
        if (desc.value != proto[key]) {
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
      }
    }
    // Copy each of the source object's properties to the target object.
    for (key in source) {
      if (typeof proto[key] == "undefined" && key !== "base") {
        var desc = _getPropertyDescriptor(source, key);
        desc = _override(object, key, desc);
        if (desc) Object.defineProperty(object, key, desc);
      }
    }
  }
  return object;
};

function _ancestorOf(ancestor, fn) {
  // Check if a function is in another function's inheritance chain.
  while (fn) {
    if (!fn.ancestor) return false;
    fn = fn.ancestor;
    if (fn == ancestor) return true;
  }
  return false;
};

function _override(object, name, desc) {
  var value = desc.value;
  if (value === _IGNORE) return;
  if ((typeof value !== "function") && ("value" in desc)) {
    return desc;
  }
  var ancestor = _getPropertyDescriptor(object, name);
  if (!ancestor) return desc;
  var superObject = base2.__prototyping; // late binding for prototypes;
  if (superObject) {
    var sprop = _getPropertyDescriptor(superObject, name);
    if (sprop && (sprop.value != ancestor.value ||
                  sprop.get   != ancestor.get ||
                  sprop.set   != ancestor.set)) {
        superObject = null;
    }
  }
  if (value) {
    var avalue = ancestor.value;
    if (avalue && _BASE.test(value)) {
      desc.value = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              method = (superObject && superObject[name]) || avalue;
          this.base = Undefined;  // method overriden in ctor
          var ret = method.apply(this, arguments);
          this.base = b;
          return ret;
        };
        var ret = value.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
    return desc;
  }
  var get = desc.get, aget = ancestor.get;        
  if (get) {
    if (aget && _BASE.test(get)) {
      desc.get = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              get = (superObject && _getPropertyDescriptor(superObject, name).get) || aget;
          this.base = Undefined;  // getter overriden in ctor            
          var ret = get.apply(this, arguments);
          this.base = b;
          return ret;
        }
        var ret = get.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
  } else if (superObject) {
    desc.get = function () {
      var get = _getPropertyDescriptor(superObject, name).get;
      return get.apply(this, arguments);
    };
  } else {
      desc.get = aget;
  }
  var set = desc.set, aset = ancestor.set;        
  if (set) {
    if (aset && _BASE.test(set)) {
      desc.set = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              set = (superObject && _getPropertyDescriptor(superObject, name).set) || aset;
          this.base = Undefined;  // setter overriden in ctor            
          var ret = set.apply(this, arguments);
          this.base = b;
          return ret;
        }
        var ret = set.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
  } else if (superObject) {
    desc.set = function () {
      var set = _getPropertyDescriptor(superObject, name).set;
      return set.apply(this, arguments);
    };      
  } else {
    desc.set = aset;
  }
  return desc;
};
    
function _getPropertyDescriptor(object, key) {
    var source = object, descriptor;
    while (source && !(
        descriptor = Object.getOwnPropertyDescriptor(source, key))
        ) source = Object.getPrototypeOf(source);
    return descriptor;
}

// =========================================================================
// lang/forEach.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/07/enum/

if (typeof StopIteration == "undefined") {
  StopIteration = new Error("StopIteration");
}

function forEach(object, block, context, fn) {
  if (object == null) return;
  if (!fn) {
    if (typeof object == "function" && object.call) {
      // Functions are a special case.
      fn = Function;
    } else if (typeof object.forEach == "function" && object.forEach != forEach) {
      // The object implements a custom forEach method.
      object.forEach(block, context);
      return;
    } else if (typeof object.length == "number") {
      // The object is array-like.
      _Array_forEach(object, block, context);
      return;
    }
  }
  _Function_forEach(fn || Object, object, block, context);
};

forEach.csv = function(string, block, context) {
  forEach (csv(string), block, context);
};

// These are the two core enumeration methods. All other forEach methods
//  eventually call one of these two.

function _Array_forEach(array, block, context) {
  if (array == null) array = global;
  var length = array.length || 0, i; // preserve length
  if (typeof array == "string") {
    for (i = 0; i < length; i++) {
      block.call(context, array.charAt(i), i, array);
    }
  } else { // Cater for sparse arrays.
    for (i = 0; i < length; i++) {
    /*@if (@_jscript_version < 5.2)
      if (array[i] !== undefined && $Legacy.has(array, i))
    @else @*/
      if (i in array)
    /*@end @*/
        block.call(context, array[i], i, array);
    }
  }
};

function _Function_forEach(fn, object, block, context) {
  // http://code.google.com/p/base2/issues/detail?id=10
  // Run the test for Safari's buggy enumeration.
  var Temp = function(){this.i=1};
  Temp.prototype = {i:1};
  var count = 0;
  for (var i in new Temp) count++;

  // Overwrite the main function the first time it is called.
  _Function_forEach = count > 1 ? function(fn, object, block, context) {
    // Safari fix (pre version 3)
    var processed = {};
    for (var key in object) {
      if (!processed[key] && fn.prototype[key] === undefined) {
        processed[key] = true;
        block.call(context, object[key], key, object);
      }
    }
  } : function(fn, object, block, context) {
    // Enumerate an object and compare its keys with fn's prototype.
    for (var key in object) {
      if (typeof fn.prototype[key] == "undefined") {
        block.call(context, object[key], key, object);
      }
    }
  };

  _Function_forEach(fn, object, block, context);
};

// =========================================================================
// lang/instanceOf.js
// =========================================================================

function instanceOf(object, klass) {
  // Handle exceptions where the target object originates from another frame.
  // This is handy for JSON parsing (amongst other things).
  
  if (typeof klass != "function") {
    throw new TypeError("Invalid 'instanceOf' operand.");
  }

  if (object == null) return false;
   
  if (object.constructor == klass) return true;
  if (klass.ancestorOf) return klass.ancestorOf(object.constructor);
  /*@if (@_jscript_version < 5.1)
    // do nothing
  @else @*/
    if (object instanceof klass) return true;
  /*@end @*/

  // If the class is a base2 class then it would have passed the test above.
  if (Base.ancestorOf == klass.ancestorOf) return false;
  
  // base2 objects can only be instances of Object.
  if (Base.ancestorOf == object.constructor.ancestorOf) return klass == Object;
  
  switch (klass) {
    case Array:
      return _toString.call(object) == "[object Array]";
    case Date:
      return _toString.call(object) == "[object Date]";
    case RegExp:
      return _toString.call(object) == "[object RegExp]";
    case Function:
      return typeOf(object) == "function";
    case String:
    case Number:
    case Boolean:
      return typeOf(object) == typeof klass.prototype.valueOf();
    case Object:
      return true;
  }
  
  return false;
};

var _toString = Object.prototype.toString;

// =========================================================================
// lang/typeOf.js
// =========================================================================

// http://wiki.ecmascript.org/doku.php?id=proposals:typeof

function typeOf(object) {
  var type = typeof object;
  switch (type) {
    case "object":
      return object == null
        ? "null"
        : typeof object.constructor == "function"
          && _toString.call(object) != "[object Date]"
             ? typeof object.constructor.prototype.valueOf() // underlying type
             : type;
    case "function":
      return typeof object.call == "function" ? type : "object";
    default:
      return type;
  }
};

// =========================================================================
// js/package.js
// =========================================================================

var js = {
  name:      "js",
  version:   base2.version,
  exports:   "Array2,Date2,Function2,String2",
  namespace: "", // fixed later
  
  bind: function(host) {
    var top = global;
    global = host;
    forEach.csv(this.exports, function(name2) {
      var name = name2.slice(0, -1);
      extend(host[name], this[name2]);
      this[name2](host[name].prototype); // cast
    }, this);
    global = top;
    return host;
  }
};

function _createObject2(Native, constructor, generics, extensions) {
  // Clone native objects and extend them.

  // Create a Module that will contain all the new methods.
  var INative = Module.extend();
  var id = INative.toString().slice(1, -1);
  // http://developer.mozilla.org/en/docs/New_in_JavaScript_1.6#Array_and_String_generics
  forEach.csv(generics, function(name) {
    INative[name] = unbind(Native.prototype[name]);
    INative.namespace += format("var %1=%2.%1;", name, id);
  });
  forEach (_slice.call(arguments, 3), INative.implement, INative);

  // create a faux constructor that augments the native object
  var Native2 = function() {
    return INative(this.constructor == INative ? constructor.apply(null, arguments) : arguments[0]);
  };
  Native2.prototype = INative.prototype;

  // Remove methods that are already implemented.
  for (var name in INative) {
    var method = Native[name];
    if (method && name != "prototype" && name != "toString" && method != Function.prototype[name]) {
      INative[name] = method;
      delete INative.prototype[name];
    }
    Native2[name] = INative[name];
  }
  Native2.ancestor = Object;
  delete Native2.extend;
  
  // remove "lang.bind.."
  Native2.namespace = Native2.namespace.replace(/(var (\w+)=)[^,;]+,([^\)]+)\)/g, "$1$3.$2");
  
  return Native2;
};

// =========================================================================
// js/~/Date.js
// =========================================================================

// Fix Date.get/setYear() (IE5-7)

if ((new Date).getYear() > 1900) {
  Date.prototype.getYear = function() {
    return this.getFullYear() - 1900;
  };
  Date.prototype.setYear = function(year) {
    return this.setFullYear(year + 1900);
  };
}

// https://bugs.webkit.org/show_bug.cgi?id=9532

var _testDate = new Date(Date.UTC(2006, 1, 20));
_testDate.setUTCDate(15);
if (_testDate.getUTCHours() != 0) {
  forEach.csv("FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds", function(type) {
    extend(Date.prototype, "setUTC" + type, function() {
      var value = this.base.apply(this, arguments);
      if (value >= 57722401000) {
        value -= 3600000;
        this.setTime(value);
      }
      return value;
    });
  });
}

// =========================================================================
// js/~/Function.js
// =========================================================================

// Some browsers don't define this.
Function.prototype.prototype = {};

// =========================================================================
// js/~/String.js
// =========================================================================

// A KHTML bug.
if ("".replace(/^/, K("$$")) == "$") {
  extend(String.prototype, "replace", function(expression, replacement) {
    if (typeof replacement == "function") {
      var fn = replacement;
      replacement = function() {
        return String(fn.apply(null, arguments)).split("$").join("$$");
      };
    }
    return this.base(expression, replacement);
  });
}

// =========================================================================
// js/Array2.js
// =========================================================================

var Array2 = _createObject2(
  Array,
  Array,
  "concat,join,pop,push,reverse,shift,slice,sort,splice,unshift", // generics
  Enumerable, {
    batch: function(array, block, timeout, oncomplete, context) {
      var index = 0,
          length = array.length;
      var batch = function() {
        var now = Date2.now(), start = now, k = 0;
        while (index < length && (now - start < timeout)) {
          block.call(context, array[index], index++, array);
          if (k++ < 5 || k % 50 == 0) now = Date2.now();
        }
        if (index < length) {
          setTimeout(batch, 10);
        } else {
          if (oncomplete) oncomplete.call(context);
        }
      };
      setTimeout(batch, 1);
    },

    combine: function(keys, values) {
      // Combine two arrays to make a hash.
      if (!values) values = keys;
      return Array2.reduce(keys, function(hash, key, index) {
        hash[key] = values[index];
        return hash;
      }, {});
    },

    contains: function(array, item) {
      return Array2.indexOf(array, item) != -1;
    },

    copy: function(array) {
      var copy = _slice.call(array);
      if (!copy.swap) Array2(copy); // cast to Array2
      return copy;
    },

    flatten: function(array) {
      var i = 0;
      var flatten = function(result, item) {
        if (Array2.like(item)) {
          Array2.reduce(item, flatten, result);
        } else {
          result[i++] = item;
        }
        return result;
      };
      return Array2.reduce(array, flatten, []);
    },
    
    forEach: _Array_forEach,
    
    indexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = 0;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i < length; i++) {
        if (array[i] === item) return i;
      }
      return -1;
    },
    
    insertAt: function(array, index, item) {
      Array2.splice(array, index, 0, item);
    },
    
    item: function(array, index) {
      if (index < 0) index += array.length; // starting from the end
      return array[index];
    },
    
    lastIndexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = length - 1;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i >= 0; i--) {
        if (array[i] === item) return i;
      }
      return -1;
    },
  
    map: function(array, block, context) {
      var result = [];
      _Array_forEach (array, function(item, index) {
        result[index] = block.call(context, item, index, array);
      });
      return result;
    },

    remove: function(array, item) {
      var index = Array2.indexOf(array, item);
      if (index != -1) Array2.removeAt(array, index);
    },

    removeAt: function(array, index) {
      Array2.splice(array, index, 1);
    },

    swap: function(array, index1, index2) {
      if (index1 < 0) index1 += array.length; // starting from the end
      if (index2 < 0) index2 += array.length;
      var temp = array[index1];
      array[index1] = array[index2];
      array[index2] = temp;
      return array;
    }
  }
);

Array2.forEach = _Array_forEach;
Array2.reduce = Enumerable.reduce; // Mozilla does not implement the thisObj argument

Array2.like = function(object) {
  // is the object like an array?
  return typeOf(object) == "object" && typeof object.length == "number";
};

// introspection (removed when packed)
;;; Enumerable["#implemented_by"].pop();
;;; Enumerable["#implemented_by"].push(Array2);

// =========================================================================
// js/Date2.js
// =========================================================================

// http://developer.mozilla.org/es4/proposals/date_and_time.html

// big, ugly, regular expression
var _DATE_PATTERN = /^((-\d+|\d{4,})(-(\d{2})(-(\d{2}))?)?)?T((\d{2})(:(\d{2})(:(\d{2})(\.(\d{1,3})(\d)?\d*)?)?)?)?(([+-])(\d{2})(:(\d{2}))?|Z)?$/;
var _DATE_PARTS = { // indexes to the sub-expressions of the RegExp above
  FullYear: 2,
  Month: 4,
  Date: 6,
  Hours: 8,
  Minutes: 10,
  Seconds: 12,
  Milliseconds: 14
};
var _TIMEZONE_PARTS = { // idem, but without the getter/setter usage on Date object
  Hectomicroseconds: 15, // :-P
  UTC: 16,
  Sign: 17,
  Hours: 18,
  Minutes: 20
};

//var _TRIM_ZEROES   = /(((00)?:0+)?:0+)?\.0+$/;
//var _TRIM_TIMEZONE = /(T[0-9:.]+)$/;

var Date2 = _createObject2(
  Date, 
  function(yy, mm, dd, h, m, s, ms) {
    switch (arguments.length) {
      case 0: return new Date;
      case 1: return typeof yy == "string" ? new Date(Date2.parse(yy)) : new Date(yy.valueOf());
      default: return new Date(yy, mm, arguments.length == 2 ? 1 : dd, h || 0, m || 0, s || 0, ms || 0);
    }
  }, "", {
    toISOString: function(date) {
      var string = "####-##-##T##:##:##.###";
      for (var part in _DATE_PARTS) {
        string = string.replace(/#+/, function(digits) {
          var value = date["getUTC" + part]();
          if (part == "Month") value++; // js month starts at zero
          return ("000" + value).slice(-digits.length); // pad
        });
      }
      //// remove trailing zeroes, and remove UTC timezone, when time's absent
      //return string.replace(_TRIM_ZEROES, "").replace(_TRIM_TIMEZONE, "$1Z");
      return string + "Z";
    }
  }
);

delete Date2.forEach;

Date2.now = function() {
  return (new Date).valueOf(); // milliseconds since the epoch
};

Date2.parse = function(string, defaultDate) {
  if (arguments.length > 1) {
    assertType(defaultDate, "number", "Default date should be of type 'number'.")
  }
  // parse ISO date
  var parts = match(string, _DATE_PATTERN);
  if (parts.length) {
    var month = parts[_DATE_PARTS.Month];
    if (month) parts[_DATE_PARTS.Month] = String(month - 1); // js months start at zero
    // round milliseconds on 3 digits
    if (parts[_TIMEZONE_PARTS.Hectomicroseconds] >= 5) parts[_DATE_PARTS.Milliseconds]++;
    var utc = parts[_TIMEZONE_PARTS.UTC] || parts[_TIMEZONE_PARTS.Hours] ? "UTC" : "";
    var date = new Date(defaultDate || 0);
    if (parts[_DATE_PARTS.Date]) date["set" + utc + "Date"](14);
    for (var part in _DATE_PARTS) {
      var value = parts[_DATE_PARTS[part]];
      if (value) {
        // set a date part
        date["set" + utc + part](value);
        // make sure that this setting does not overflow
        if (date["get" + utc + part]() != parts[_DATE_PARTS[part]]) {
          return NaN;
        }
      }
    }
    // timezone can be set, without time being available
    // without a timezone, local timezone is respected
    if (parts[_TIMEZONE_PARTS.Hours]) {
      var hours = Number(parts[_TIMEZONE_PARTS.Sign] + parts[_TIMEZONE_PARTS.Hours]);
      var minutes = Number(parts[_TIMEZONE_PARTS.Sign] + (parts[_TIMEZONE_PARTS.Minutes] || 0));
      date.setUTCMinutes(date.getUTCMinutes() + (hours * 60) + minutes);
    }
    return date.valueOf();
  } else {
    return Date.parse(string);
  }
};

// =========================================================================
// js/String2.js
// =========================================================================

var String2 = _createObject2(
  String, 
  function(string) {
    return new String(arguments.length == 0 ? "" : string);
  },
  "charAt,charCodeAt,concat,indexOf,lastIndexOf,match,replace,search,slice,split,substr,substring,toLowerCase,toUpperCase",
  {
    csv: csv,
    format: format,
    rescape: rescape,
    trim: trim
  }
);

delete String2.forEach;

// http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim(string) {
  return String(string).replace(_LTRIM, "").replace(_RTRIM, "");
};

function csv(string) {
  return string ? (string + "").split(/\s*,\s*/) : [];
};

function format(string) {
  // Replace %n with arguments[n].
  // e.g. format("%1 %2%3 %2a %1%3", "she", "se", "lls");
  // ==> "she sells sea shells"
  // Only %1 - %9 supported.
  var args = arguments;
  var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
  return (string + "").replace(pattern, function(match, index) {
    return args[index];
  });
};

function match(string, expression) {
  // Same as String.match() except that this function will return an
  // empty array if there is no match.
  return (string + "").match(expression) || [];
};

function rescape(string) {
  // Make a string safe for creating a RegExp.
  return (string + "").replace(_RESCAPE, "\\$1");
};

// =========================================================================
// js/Function2.js
// =========================================================================

var Function2 = _createObject2(
  Function,
  Function,
  "", {
    I: I,
    II: II,
    K: K,
    bind: bind,
    compose: compose,
    delegate: delegate,
    flip: flip,
    not: not,
    partial: partial,
    unbind: unbind
  }
);

function I(i) { // Return first argument.
  return i;
};

function II(i, ii) { // Return second argument.
  return ii;
};

function K(k) {
  return function() {
    return k;
  };
};

function bind(fn, context) {
  var lateBound = typeof fn != "function";
  if (arguments.length > 2) {
    var args = _slice.call(arguments, 2);
    return function() {
      return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
    };
  } else { // Faster if there are no additional arguments.
    return function() {
      return (lateBound ? context[fn] : fn).apply(context, arguments);
    };
  }
};

function compose() {
  var fns = _slice.call(arguments);
  return function() {
    var i = fns.length, result = fns[--i].apply(this, arguments);
    while (i--) result = fns[i].call(this, result);
    return result;
  };
};

function delegate(fn, context) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return fn.apply(context, args);
  };
};

function flip(fn) {
  return function() {
    return fn.apply(this, Array2.swap(arguments, 0, 1));
  };
};

function not(fn) {
  return function() {
    return !fn.apply(this, arguments);
  };
};

function partial(fn) { // Based on Oliver Steele's version.
  var args = _slice.call(arguments, 1);
  return function() {
    var specialised = args.concat(), i = 0, j = 0;
    while (i < args.length && j < arguments.length) {
      if (specialised[i] === undefined) specialised[i] = arguments[j++];
      i++;
    }
    while (j < arguments.length) {
      specialised[i++] = arguments[j++];
    }
    if (Array2.contains(specialised, undefined)) {
      specialised.unshift(fn);
      return partial.apply(null, specialised);
    }
    return fn.apply(this, specialised);
  };
};

function unbind(fn) {
  return function(context) {
    return fn.apply(context, _slice.call(arguments, 1));
  };
};

// =========================================================================
// base2/init.js
// =========================================================================

base2 = global.base2 = new Package(this, base2);
base2.toString = K("[base2]"); // hide private data here

var _exports = this.exports;

lang = new Package(this, lang);
_exports += this.exports;

js = new Package(this, js);
eval(_exports + this.exports);

lang.extend = extend;

// legacy support
base2.JavaScript = pcopy(js);
base2.JavaScript.namespace += "var JavaScript=js;";

// Node.js support
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = base2;
  }
  exports.base2 = base2;
} 

}; ////////////////////  END: CLOSURE  /////////////////////////////////////

},{}],4:[function(require,module,exports){
(function (global){
var miruken = require('./miruken.js'),
    Promise = require('bluebird');

new function () { // closure

    /**
     * Package providing message handling support.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}} module.
     * @module miruken
     * @submodule callback
     * @namespace miruken.callback
     * @class $
     */
     miruken.package(this, {
        name:    "callback",
        imports: "miruken",
        exports: "CallbackHandler,CascadeCallbackHandler,CompositeCallbackHandler," +
                 "InvocationOptions,Batching,Batcher,Resolution,Composition,HandleMethod," +
                 "ResolveMethod,RejectedError,TimeoutError,$handle,$callbacks,$define," +
                 "$provide,$lookup,$NOT_HANDLED"
    });

    eval(this.imports);

    Promise.onPossiblyUnhandledRejection(Undefined);

    var _definitions = {},
        /**
         * Definition for handling callbacks contravariantly.
         * @method $handle
         * @for miruken.callback.$
         */
        $handle = $define('$handle',  Variance.Contravariant),
        /**
         * Definition for providing callbacks covariantly.
         * @method $provide  
         * @for miruken.callback.$
         */        
        $provide = $define('$provide', Variance.Covariant),
        /**
         * Definition for matching callbacks invariantly.
         * @method $lookup  
         * @for miruken.callback.$
         */                
        $lookup = $define('$lookup' , Variance.Invariant),
        /**
         * return value to indicate a callback was not handled.
         * @property {Object} $NOT_HANDLED
         * @for miruken.callback.$
         */                
        $NOT_HANDLED = Object.freeze({});

    /**
     * Metamacro to process callback handler definitions.
     * <pre>
     *    var Bank = Base.extend(**$callbacks**, {
     *        $handle: [
     *            Deposit, function (deposit, composer) {
     *                // perform the deposit
     *            }
     *        ]
     *    })
     * </pre>
     * would register a handler in the Bank class for Deposit callbacks.
     * @class $callbacks
     * @extends miruken.MetaMacro
     */
    var $callbacks = MetaMacro.extend({
        execute: function (step, metadata, target, definition) {
            if ($isNothing(definition)) {
                return;
            }
            var source = target,
                clazz  = metadata.getClass();
            if (target === clazz.prototype) {
                target = clazz;
            }
            for (var tag in _definitions) {
                var list = this.extractProperty(tag, source, definition);
                if (!list || list.length == 0) {
                    continue;
                }
                var define = _definitions[tag];
                for (var idx = 0; idx < list.length; ++idx) {
                    var constraint = list[idx];
                    if (++idx >= list.length) {
                        throw new Error(format(
                            "Incomplete '%1' definition: missing handler for constraint %2.",
                            tag, constraint));
                        }
                    define(target, constraint, list[idx]);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */ 
        isActive: True
    });

    /**
     * Captures the invocation of a method.
     * @class HandleMethod
     * @constructor
     * @param  {number}            type        -  get, set or invoke
     * @param  {miruken.Protocol}  protocol    -  initiating protocol
     * @param  {string}            methodName  -  method name
     * @param  {Array}             [...args]   -  method arguments
     * @param  {boolean}           strict      -  true if strict, false otherwise
     * @extends Base
     */
    var HandleMethod = Base.extend({
        constructor: function (type, protocol, methodName, args, strict) {
            if (protocol && !$isProtocol(protocol)) {
                throw new TypeError("Invalid protocol supplied.");
            }
            var _returnValue, _exception;
            this.extend({
                /**
                 * Gets the type of method.
                 * @property {number} type
                 * @readOnly
                 */
                get type() { return type; },
                /**
                 * Gets the Protocol the method belongs to.
                 * @property {miruken.Protocol} protocol
                 * @readOnly
                 */
                get protocol() { return protocol; },
                /**
                 * Gets the name of the method.
                 * @property {string} methodName
                 * @readOnly
                 */
                get methodName() { return methodName; },
                /**
                 * Gets the arguments of the method.
                 * @property {Array} arguments
                 * @readOnly
                 */
                get arguments() { return args; },
                /**
                 * Get/sets the return value of the method.
                 * @property {Any} returnValue.
                 */
                get returnValue() { return _returnValue; },
                set returnValue(value) { _returnValue = value; },
                /**
                 * Gets/sets the execption raised by the method.
                 * @property {Any} method exception.
                 */
                get exception() { return _exception; },
                set exception(exception) { _exception = exception; },
                /**
                 * Gets/sets the effective callback result.
                 * @property {Any} callback result
                 */                
                get callbackResult() { return _returnValue; },
                set callbackResult(value) { _returnValue = value; },
                /**
                 * Attempts to invoke the method on the target.<br/>
                 * During invocation, the receiver will have access to a global **$composer** property
                 * representing the initiating {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}.
                 * @method invokeOn
                 * @param   {Object}                            target  - method receiver
                 * @param   {miruken.callback.CallbackHandler}  composer  - composition handler
                 * @returns {boolean} true if the method was accepted.
                 */
                invokeOn: function (target, composer) {
                    if (!target || (strict && protocol && !protocol.adoptedBy(target))) {
                        return false;
                    }
                    var method, result;
                    if (type === HandleMethod.Invoke) {
                        method = target[methodName];
                        if (!$isFunction(method)) {
                            return false;
                        }                    
                    }
                    try {
                        var oldComposer = global.$composer;
                        global.$composer = composer;
                        switch (type) {
                            case HandleMethod.Get:
                                result = target[methodName];
                                break;
                            case HandleMethod.Set:
                                result = target[methodName] = args;
                                break;
                            case HandleMethod.Invoke:
                                result = method.apply(target, args);
                                break;
                        }
                        if (result === $NOT_HANDLED) {
                            return false;
                        }
                        _returnValue = result;
                    } catch (exception) {
                        _exception = exception;
                        throw exception;
                    } finally {
                        if (oldComposer) {
                            global.$composer = oldComposer;
                        } else {
                            delete global.$composer;
                        }
                    }
                    return true;
                }
            });
        }
    }, {
        /**
         * Identifies a property get.
         * @property {number} Get
         * @static
         */
        Get: 1,
        /**
         * Identifies a property set.
         * @property {number} Set
         * @static
         */
        Set: 2,
        /**
         * Identifies a method invocation.
         * @property {number} Invoke
         * @static
         */
        Invoke: 3
    });

    /**
     * Captures the invocation of a method using resolution to determine the targets.
     * @class ResolveMethod
     * @constructor
     * @param  {number}            type        -  get, set or invoke
     * @param  {miruken.Protocol}  protocol    -  initiating protocol
     * @param  {string}            methodName  -  method name
     * @param  {Array}             [...args]   -  method arguments
     * @param  {boolean}           strict      -  true if strict, false otherwise
     * @param  {boolean}           all         -  true if invoke all targets
     * @param  {boolean}           required    -  true if at least one target accepts
     * @extends HandleMethod
     */
    var ResolveMethod = HandleMethod.extend({
        constructor: function (type, protocol, methodName, args, strict, all, required) {
            this.base(type, protocol, methodName, args, strict);
            this.extend({
                /**
                 * Attempts to invoke the method on resolved targets.
                 * @method invokeResolve
                 * @param   {miruken.callback.CallbackHandler}  composer  - composition handler
                 * @returns {boolean} true if the method was accepted.
                 */
                invokeResolve: function (composer) {
                    var handled = false,
                        targets = composer.resolveAll(protocol);
                    
                    if ($isPromise(targets)) {
                        var that = this;
                        this.returnValue = new Promise(function (resolve, reject) {
                            targets.then(function (targets) {
                                invokeTargets.call(that, targets);
                                if (that.execption) {
                                    reject(that.exeception);
                                } else if (handled) {
                                    resolve(that.returnValue);
                                } else if (required) {
                                    reject(new TypeError(format("Object %1 has no method '%2'", composer, methodName)));
                                } else {
                                    resolve();
                                }
                            }, reject);
                        });
                        return true;
                    }
                    
                    invokeTargets.call(this, targets);

                    function invokeTargets(targets) {
                        for (var i = 0; i < targets.length; ++i) {
                            handled = handled | this.invokeOn(targets[i], composer);
                            if (handled && !all) {
                                break;
                            }
                        }
                    }
                                        
                    return handled;
                }
            });
        }
    });
    
    /**
     * Callback representing the invariant lookup of a key.
     * @class Lookup
     * @constructor
     * @param   {Any}      key   -  lookup key
     * @param   {boolean}  many  -  lookup cardinality
     * @extends Base
     */
    var Lookup = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _results = [], _result,
                _instant = $instant.test(key);
            this.extend({
                /**
                 * Gets the lookup key.
                 * @property {Any} key
                 * @readOnly
                 */
                get key() { return key; },
                /**
                 * true if lookup all, false otherwise.
                 * @property {boolean} many
                 * @readOnly
                 */
                get isMany() { return many; },
                /**
                 * Gets the matching results.
                 * @property {Array} results
                 * @readOnly
                 */
                get results() { return _results; },
                /**
                 * Gets/sets the effective callback result.
                 * @property {Any} callback result
                 */                
                get callbackResult() {
                    if (_result === undefined) {
                        if (!many) {
                            if (_results.length > 0) {
                                _result = _results[0];
                            }
                        } else if (_instant) {
                            _result = Array2.flatten(_results);
                        } else {
                            _result = Promise.all(_results).then(Array2.flatten);
                        }
                    }
                    return _result;
                },
                set callbackResult(value) { _result = value; },
                /**
                 * Adds a lookup result.
                 * @param  {Any}  reault - lookup result
                 */
                addResult: function (result) {
                    if ((many || _results.length === 0) &&
                        !(_instant && $isPromise(result))) {
                        _results.push(result);
                        _result = undefined;
                    }
                }
            });
        }
    });

    /**
     * Callback representing the deferred handling of another callback.
     * @class Deferred
     * @constructor
     * @param   {Object}   callback  -  callback
     * @param   {boolean}  many      -  deferred cardinality
     * @extends Base
     */
    var Deferred = Base.extend({
        constructor: function (callback, many) {
            if ($isNothing(callback)) {
                throw new TypeError("The callback is required.");
            }
            many = !!many;
            var _pending = [],
                _tracked, _result;
            this.extend({
                /**
                 * true if handle all, false otherwise.
                 * @property {boolean} many
                 * @readOnly
                 */
                get isMany() { return many; },
                /**
                 * Gets the callback.
                 * @property {Object} callback
                 * @readOnly
                 */
                get callback() { return callback; },
                /**
                 * Gets the pending promises.
                 * @property {Array} pending
                 * @readOnly
                 */
                get pending() { return _pending; },
                /**
                 * Gets/sets the effective callback result.
                 * @property {Any} callback result
                 */                
                get callbackResult() {
                    if (_result === undefined) {
                        if (_pending.length === 1) {
                            _result = Promise.resolve(_pending[0]).then(True);
                        } else if (_pending.length > 1) {
                            _result = Promise.all(_pending).then(True);
                        } else {
                            _result = Promise.resolve(_tracked);
                        }
                    }
                    return _result;
                },
                set callbackResult(value) { _result = value; },
                /**
                 * Tracks a pending promise.
                 * @param {Promise}  promise - handle promise
                 */
                track: function (promise) {
                    if ((many || _pending.length === 0) && $isPromise(promise)) {
                        _pending.push(promise);
                        _result = undefined;
                    }
                    if (!_tracked) {
                        _tracked = true;
                        _result  = undefined;                        
                    }
                }
            });
        }
    });
    
    /**
     * Callback representing the covariant resolution of a key.
     * @class Resolution
     * @constructor
     * @param   {any}   key      -  resolution key
     * @param   {boolean}  many  -  resolution cardinality
     * @extends Base
     */
    var Resolution = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [],
                _promised    = false, _result,
                _instant     = $instant.test(key);
            this.extend({
                /**
                 * Gets the key.
                 * @property {Any} key
                 * @readOnly
                 */                
                get key() { return key; },
                /**
                 * true if resolve all, false otherwise.
                 * @property {boolean} isMany
                 * @readOnly
                 */                
                get isMany() { return many; },
                /**
                 * true if resolve all is instant.  Otherwise a promise.
                 * @property {boolean} instant
                 * @readOnly
                 */
                get instant() { return !_promised; },
                /**
                 * Gets the resolutions.
                 * @property {Array} resolutions
                 * @readOnly
                 */                
                get resolutions() { return _resolutions; },
                /**
                 * Gets/sets the effective callback result.
                 * @property {Any} callback result
                 */
                get callbackResult() {
                    if (_result === undefined) {
                        if (!many) {
                            if (_resolutions.length > 0) {
                                _result = _resolutions[0];
                            }
                        } else {
                            _result = this.instant
                                  ? _flattenPrune(_resolutions)
                                  : Promise.all(_resolutions).then(_flattenPrune);
                        }
                    }
                    return _result;
                },
                set callbackResult(value) { _result = value; },
                /**
                 * Adds a resolution.
                 * @param {Any} resolution  -  resolution
                 */
                resolve: function (resolution) {
                    if (!many && _resolutions.length > 0) {
                        return;
                    }
                    var promised = $isPromise(resolution);
                    if (!_instant || !promised) {
                        _promised = _promised || promised;
                        if (promised && many) {
                            resolution = resolution.catch(Undefined);
                        }
                        _resolutions.push(resolution);
                        _result   = undefined;
                    }
                }
            });
        }
    });

    /**
     * Marks a callback as composed.
     * @class Composition
     * @constructor
     * @param   {Object}  callback  -  callback to compose
     * @extends Base
     */
    var Composition = Base.extend({
        constructor: function (callback) {
            if (callback) {
                this.extend({
                    /**
                     * Gets the callback.
                     * @property {Object} callback
                     * @readOnly
                     */
                    get callback() { return callback; },
                    /**
                     * Gets/sets the effective callback result.
                     * @property {Any} callback result
                     */                
                    get callbackResult() {
                        return callback.callbackResult;
                    },
                    set callbackResult(value) {
                        callback.callbackResult = value;
                    }
                });
            }
        }
    });

    var compositionScope = $decorator({
        handleCallback: function (callback, greedy, composer) {
            if ($classOf(callback) !== Composition) {
                callback = new Composition(callback);
            }
            return this.base(callback, greedy, composer);
        }
    });
    
    /**
     * Base class for handling arbitrary callbacks.<br/>
     * See {{#crossLink "miruken.callback.$callbacks"}}{{/crossLink}}
     * @class CallbackHandler
     * @constructor
     * @param  {Object}  [delegate]  -  delegate
     * @extends Base
     */
    var CallbackHandler = Base.extend($callbacks, {
        constructor: function (delegate) {
            this.extend({
                /**
                 * Gets the delegate.
                 * @property {Object} delegate
                 * @readOnly
                 */            
                get delegate() { return delegate; }
            });
        },
        /**
         * Handles the callback.
         * @method handle
         * @param   {Object}                           callback        -  any callback
         * @param   {boolean}                          [greedy=false]  -  true if handle greedily
         * @param   {miruken.callback.CallbackHandler} [composer]      -  composition handler
         * @returns {boolean} true if the callback was handled, false otherwise.
         */
        handle: function (callback, greedy, composer) {
            if ($isNothing(callback)) {
                return false;
            }
            if ($isNothing(composer)) {
                composer = compositionScope(this);
            }
            return !!this.handleCallback(callback, !!greedy, composer);
        },
        /**
         * Handles the callback with all arguments populated.
         * @method handleCallback
         * @param   {Object}                           callback    -  any callback
         * @param   {boolean}                          greedy      -  true if handle greedily
         * @param   {miruken.callback.CallbackHandler} [composer]  -  composition handler
         * @returns {boolean} true if the callback was handled, false otherwise.
         */
        handleCallback: function (callback, greedy, composer) {
            return callback instanceof ResolveMethod
                ? callback.invokeResolve(composer)
                : $handle.dispatch(this, callback, null, composer, greedy);
        },
        $handle:[
            Lookup, function (lookup, composer) {
                return $lookup.dispatch(this, lookup,lookup.key, composer, lookup.isMany, lookup.addResult);
            },
            Deferred, function (deferred, composer) {
                return $handle.dispatch(this, deferred.callback, null, composer, deferred.isMany, deferred.track);
            },
            Resolution, function (resolution, composer) {
                var key      = resolution.key,
                    many     = resolution.isMany,
                    resolved = $provide.dispatch(this, resolution, key, composer, many, resolution.resolve);
                if (!resolved) { // check if delegate or handler implicitly satisfy key
                    var implied  = new _Node(key),
                        delegate = this.delegate;
                    if (delegate && implied.match($classOf(delegate), Variance.Contravariant)) {
                        resolution.resolve($decorated(delegate, true));
                        resolved = true;
                    }
                    if ((!resolved || many) && implied.match($classOf(this), Variance.Contravariant)) {
                        resolution.resolve($decorated(this, true));
                        resolved = true;
                    }
                }
                return resolved;
            },
            HandleMethod, function (method, composer) {
                return method.invokeOn(this.delegate, composer) || method.invokeOn(this, composer);
            },
            ResolveMethod, function (method, composer) {
                return method.invokeResolve(composer);
            },            
            Composition, function (composable, composer) {
                var callback = composable.callback;
                return callback && $handle.dispatch(this, callback, null, composer);
            }
        ],
        /**
         * Converts the callback handler to a {{#crossLink "miruken.Delegate"}}{{/crossLink}}.
         * @method toDelegate
         * @returns {miruken.callback.InvocationDelegate}  delegate for this callback handler.
         */            
        toDelegate: function () { return new InvocationDelegate(this); }
    }, {
        coerce: function (object) { return new this(object); }
    });

    Base.implement({
        toCallbackHandler: function () { return CallbackHandler(this); }
    });

    /**
     * Identifies a rejected callback.  This usually occurs from aspect processing.
     * @class RejectedError
     * @constructor
     * @param {Object}  callback  -  rejected callback
     * @extends Error
     */
    function RejectedError(callback) {
        /**
         * Gets the rejected callback.
         * @property {Object} callback
         */         
        this.callback = callback;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    RejectedError.prototype             = new Error;
    RejectedError.prototype.constructor = RejectedError;

    /**
     * Identifies a timeout error.
     * @class TimeoutError
     * @constructor
     * @param {Object}  callback  -  timed out callback
     * @param {string}  message   -  timeout message
     * @extends Error
     */
    function TimeoutError(callback, message) {
        /**
         * Gets the rejected callback.
         * @property {Object} callback
         */         
        this.callback = callback;
        
        this.message = message || "Timeout occurred";
                    
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    TimeoutError.prototype             = new Error;
    TimeoutError.prototype.constructor = TimeoutError;
    
    /**
     * Represents a two-way {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}} path.
     * @class CascadeCallbackHandler
     * @constructor
     * @param  {miruken.callback.CallbackHandler}  handler           -  primary handler
     * @param  {miruken.callback.CallbackHandler}  cascadeToHandler  -  secondary handler
     * @extends miruken.callback.CallbackHandler
     */
    var CascadeCallbackHandler = CallbackHandler.extend({
        constructor: function (handler, cascadeToHandler) {
            if ($isNothing(handler)) {
                throw new TypeError("No handler specified.");
            } else if ($isNothing(cascadeToHandler)) {
                throw new TypeError("No cascadeToHandler specified.");
            }
            handler          = handler.toCallbackHandler();
            cascadeToHandler = cascadeToHandler.toCallbackHandler();
            this.extend({
                /**
                 * Gets the primary handler.
                 * @property {miruken.callback.CallbackHandler} handler
                 * @readOnly
                 */
                get handler() { return handler; },
                /**
                 * Gets the secondary handler.
                 * @property {miruken.callback.CallbackHandler} cascadeToHandler
                 * @readOnly
                 */
                get cascadeToHandler() { return cascadeToHandler; }                
            });
        },
        handleCallback: function (callback, greedy, composer) {
            var handled = greedy
                ? (this.handler.handleCallback(callback, true, composer)
                   | this.cascadeToHandler.handleCallback(callback, true, composer))
                : (this.handler.handleCallback(callback, false, composer)
                   || this.cascadeToHandler.handleCallback(callback, false, composer));
            if (!handled || greedy) {
                handled = this.base(callback, greedy, composer) || handled;
            }
            return !!handled;
        }
    });

    /**
     * Encapsulates zero or more {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}.<br/>
     * See [Composite Pattern](http://en.wikipedia.org/wiki/Composite_pattern)
     * @class CompositeCallbackHandler
     * @constructor
     * @param  {Arguments}  arguments  -  callback handlers
     * @extends miruken.callback.CallbackHandler
     */
    var CompositeCallbackHandler = CallbackHandler.extend({
        constructor: function () {
            var _handlers = new Array2;
            this.extend({
                /**
                 * Gets all participating callback handlers.
                 * @method getHandlers
                 * @returns {Array} participating callback handlers.
                 */
                getHandlers: function () { return _handlers.copy(); },
                /**
                 * Adds the callback handlers to the composite.
                 * @method addHandlers
                 * @returns {miruken.callback.CompositeCallbackHandler}  composite
                 * @chainable
                 */
                addHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (handler) {
                            _handlers.push(handler.toCallbackHandler());
                        }
                    });
                    return this;
                },
                /**
                 * Removes callback handlers from the composite.
                 * @method removeHandlers
                 * @returns {miruken.callback.CompositeCallbackHandler}  composite
                 * @chainable
                 */
                removeHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (!handler) {
                            return;
                        }
                        var count = _handlers.length;
                        for (var idx = 0; idx < count; ++idx) {
                            var testHandler = _handlers[idx];
                            if (testHandler == handler || testHandler.delegate == handler) {
                                _handlers.removeAt(idx);
                                return;
                            }
                        }
                    });
                    return this;
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = false,
                        count   = _handlers.length;
                    for (var idx = 0; idx < count; ++idx) {
                        var handler = _handlers[idx];
                        if (handler.handleCallback(callback, greedy, composer)) {
                            if (!greedy) {
                                return true;
                            }
                            handled = true;
                        }
                    }
                    if (!handled || greedy) {
                        handled = this.base(callback, greedy, composer) || handled;
                    }
                    return handled;
                }
            });
            this.addHandlers(arguments);
        }
    });

    /**
     * Shortcut for handling a callback.
     * @method
     * @static
     * @param   {Function}  handler     -  handles callbacks
     * @param   {Any}       constraint  -  callback constraint
     * @returns {miruken.callback.CallbackHandler} callback handler.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.accepting = function (handler, constraint) {
        var accepting = new CallbackHandler;
        $handle(accepting, constraint, handler);
        return accepting;
    };

    /**
     * Shortcut for providing a callback.
     * @method
     * @static
     * @param  {Function}  provider    -  provides callbacks
     * @param  {Any}       constraint  -  callback constraint
     * @returns {miruken.callback.CallbackHandler} callback provider.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.providing = function (provider, constraint) {
        var providing = new CallbackHandler;
        $provide(providing, constraint, provider);
        return providing;
    };

    /**
     * Shortcut for handling a 
     * {{#crossLink "miruken.callback.HandleMethod"}}{{/crossLink}} callback.
     * @method
     * @static
     * @param  {string}    methodName  -  method name
     * @param  {Function}  method      -  method function
     * @returns {miruken.callback.CallbackHandler} method handler.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.implementing = function (methodName, method) {
        if (!$isString(methodName) || methodName.length === 0 || !methodName.trim()) {
            throw new TypeError("No methodName specified.");
        } else if (!$isFunction(method)) {
            throw new TypeError(format("Invalid method: %1 is not a function.", method));
        }
        return (new CallbackHandler).extend({
            handleCallback: function (callback, greedy, composer) {
                if (callback instanceof HandleMethod) {
                    var target = new Object;
                    target[methodName] = method;
                    return callback.invokeOn(target);
                }
                return false;
            }
        });
    };
    
    /**
     * InvocationOptions flags enum
     * @class InvocationOptions
     * @extends miruken.Flags
     */
    var InvocationOptions = Flags({
        /**
         * @property {number} None
         */
        None: 0,
        /**
         * Delivers invocation to all handlers.  At least one must recognize it.
         * @property {number} Broadcast
         */
        Broadcast: 1 << 0,
        /**
         * Marks invocation as optional.
         * @property {number} BestEffort
         */        
        BestEffort: 1 << 1,
        /**
         * Requires invocation to match conforming protocol.
         * @property {number} Strict
         */                
        Strict: 1 << 2,
        /**
         * Uses Resolve to determine instances to invoke.
         * @property {number} Resolve
         */                
        Resolve: 1 << 3,
        /**
         * Publishes invocation to all handlers.
         * @property {number} Notify
         */                
        Notify: (1 << 0) | (1 << 1)
    });

    /**
     * Captures invocation semantics.
     * @class InvocationSemantics
     * @constructor
     * @param  {miruken.callback.InvocationOptions}  options  -  invocation options.
     * @extends Base
     */
    var InvocationSemantics = Composition.extend({
        constructor: function (options) {
            var _options   = InvocationOptions.None.addFlag(options),
                _specified = _options;
            this.extend({
                /**
                 * Gets the invocation option.
                 * @method getOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to test
                 * @returns {boolean} true if invocation option enabled, false otherwise.
                 */
                getOption: function (option) {
                    return _options.hasFlag(option);
                },
                /**
                 * Sets the invocation option.
                 * @method setOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to set
                 * @param   {boolean}  enabled  -  true if enable option, false to clear.
                 */                
                setOption: function (option, enabled) {
                    if (enabled) {
                        _options = _options.addFlag(option);
                    } else {
                        _options = _options.removeFlag(option);
                    }
                    _specified = _specified.addFlag(option);
                },
                /**
                 * Determines if the invocation option was specified.
                 * @method getOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to test
                 * @returns {boolean} true if invocation option specified, false otherwise.
                 */                
                isSpecified: function (option) {
                    return _specified.hasFlag(option);
                }
            });
        },
        /**
         * Merges invocation options into the supplied constraints. 
         * @method mergeInto
         * @param   {miruken.callback.InvocationSemantics}  semantics  -  receives invocation semantics
         */                
        mergeInto: function _(semantics) {
            var items = InvocationOptions.items;
            for (var i = 0; i < items.length; ++i) {
                var option = +items[i];
                if (this.isSpecified(option) && !semantics.isSpecified(option)) {
                    semantics.setOption(option, this.getOption(option));
                }
            }
        }
    });

    /**
     * Protocol to participate in batched operations.
     * @class Batching
     * @extends miruken.StrictProtocol
     */
    var Batching = StrictProtocol.extend({
        /**
         * Completes the batching operation.
         * @method complete
         * @param   {miruken.callback.CallbackHandler}  composer  - composition handler
         * @returns {Any} the batching result.
         */                
        complete: function (composer) {}
    });
    
    /**
     * Coordinates batching operations through the protocol
     * {{#crossLink "miruken.callback.Batching"}}{{/crossLink}}.
     * @class Batcher
     * @constructor
     * @param   {miruken.Protocol}  [...protocols]  -  protocols to batch
     * @extends miruken.callback.CompositeCallbackHandler
     * @uses miruken.callback.Batching
     */
    var BatchingComplete = Batching.extend();
    var Batcher = CompositeCallbackHandler.extend(BatchingComplete, {
        constructor: function (protocols) {
            this.base();
            if (protocols && !$isArray(protocols)) {
                protocols = Array.prototype.slice.call(arguments);
            }
            this.extend({
                shouldBatch: function (protocol) {
                    return !protocols || (protocol && protocols.indexOf(protocol) >= 0); 
                }
            });
        },
        complete: function (composer) {
            var promise = false,
                results = Array2.reduce(this.getHandlers(), function (res, handler) {
                    var result = Batching(handler).complete(composer);
                    if (result) {
                        promise = promise || $isPromise(result);
                        res.push(result);
                        return res;
                    }
                }, []);
            return promise ? Promise.all(results) : results;
        }
    });
    
    /**
     * Delegates properties and methods to a callback handler using 
     * {{#crossLink "miruken.callback.HandleMethod"}}{{/crossLink}}.
     * @class InvocationDelegate
     * @constructor
     * @param   {miruken.callback.CallbackHandler}  handler  -  forwarding handler 
     * @extends miruken.Delegate
     */
    var InvocationDelegate = Delegate.extend({
        constructor: function (handler) {
            this.extend({
                get handler() { return handler; }
            });
        },
        get: function (protocol, propertyName, strict) {
            return _delegateInvocation(this, HandleMethod.Get, protocol, propertyName, null, strict);
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            return _delegateInvocation(this, HandleMethod.Set, protocol, propertyName, propertyValue, strict);
        },
        invoke: function (protocol, methodName, args, strict) {
            return _delegateInvocation(this, HandleMethod.Invoke, protocol, methodName, args, strict);
        }
    });

    function _delegateInvocation(delegate, type, protocol, methodName, args, strict) {
        var handler   = delegate.handler,
            semantics = new InvocationSemantics;
        handler.handle(semantics, true);
        strict = !!(strict | semantics.getOption(InvocationOptions.Strict));
        var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
            bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
            useResolve   = semantics.getOption(InvocationOptions.Resolve)
                        || protocol.conformsTo(Resolving),
            handleMethod = useResolve
                         ? new ResolveMethod(type, protocol, methodName, args, strict, broadcast, !bestEffort)
                         : new HandleMethod(type, protocol, methodName, args, strict);
        if (!handler.handle(handleMethod, broadcast && !useResolve) && !bestEffort) {
            throw new TypeError(format("Object %1 has no method '%2'", handler, methodName));
        }
        return handleMethod.returnValue;
    }

    CallbackHandler.implement({
        /**
         * Establishes strict invocation semantics.
         * @method $strict
         * @returns {miruken.callback.CallbackHandler} strict semantics.
         * @for miruken.callback.CallbackHandler
         */
        $strict: function () { return this.$callOptions(InvocationOptions.Strict); },
        /**
         * Establishes broadcast invocation semantics.
         * @method $broadcast
         * @returns {miruken.callback.CallbackHandler} broadcast semanics.
         * @for miruken.callback.CallbackHandler
         */        
        $broadcast: function () { return this.$callOptions(InvocationOptions.Broadcast); },
        /**
         * Establishes best-effort invocation semantics.
         * @method $bestEffort
         * @returns {miruken.callback.CallbackHandler} best-effort semanics.
         * @for miruken.callback.CallbackHandler
         */                
        $bestEffort: function () { return this.$callOptions(InvocationOptions.BestEffort); },
        /**
         * Establishes notification invocation semantics.
         * @method $notify
         * @returns {miruken.callback.InvocationOptionsHandler} notification semanics.
         * @for miruken.callback.CallbackHandler
         */
        $notify: function () { return this.$callOptions(InvocationOptions.Notify); },
        /**
         * Establishes resolve invocation semantics.
         * @method $resolve
         * @returns {miruken.callback.CallbackHandler} resolved semantics.
         * @for miruken.callback.CallbackHandler
         */
        $resolve: function () { return this.$callOptions(InvocationOptions.Resolve); },        
        /**
         * Establishes custom invocation semantics.
         * @method $callOptions
         * @param  {miruken.callback.InvocationOptions}  options  -  invocation semantics
         * @returns {miruken.callback.CallbackHandler} custom invocation semanics.
         * @for miruken.callback.CallbackHandler
         */                        
        $callOptions: function (options) {
            var semantics = new InvocationSemantics(options);
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    var handled = false;
                    if (callback instanceof InvocationSemantics) {
                        semantics.mergeInto(callback);
                        handled = true;
                    }
                    if (greedy || !handled) {
                        handled = handled | this.base(callback, greedy, composer);
                    }
                    return !!handled;
                }
            });
        }
    });

    CallbackHandler.implement({
        /**
         * Asynchronusly handles the callback.
         * @method defer
         * @param   {Object}  callback  -  callback
         * @returns {Promise} promise to handled callback.
         * @for miruken.callback.CallbackHandler
         * @async
         */                        
        defer: function (callback) {
            var deferred = new Deferred(callback);
            this.handle(deferred, false, global.$composer);
            return deferred.callbackResult;            
        },
        /**
         * Asynchronusly handles the callback greedily.
         * @method deferAll
         * @param   {Object}  callback  -  callback
         * @returns {Promise} promise to handled callback.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                
        deferAll: function (callback) {
            var deferred = new Deferred(callback, true);
            this.handle(deferred, true, global.$composer);
            return deferred.callbackResult;
        },
        /**
         * Resolves the key.
         * @method resolve
         * @param   {Any}  key  -  key
         * @returns {Any}  resolved key.  Could be a promise.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                
        resolve: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key);
            if (this.handle(resolution, false, global.$composer)) {
                return resolution.callbackResult;
            }
        },
        /**
         * Resolves the key greedily.
         * @method resolveAll
         * @param   {Any}   key  -  key
         * @returns {Array} resolved key.  Could be a promise.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                        
        resolveAll: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key, true);
            return this.handle(resolution, true, global.$composer)
                 ? resolution.callbackResult
                 : [];
        },
        /**
         * Looks up the key.
         * @method lookup
         * @param   {Any}  key  -  key
         * @returns {Any}  value of key.
         * @for miruken.callback.CallbackHandler
         */                                        
        lookup: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key);
            if (this.handle(lookup, false, global.$composer)) {
                return lookup.callbackResult;
            }
        },
        /**
         * Looks up the key greedily.
         * @method lookupAll
         * @param   {Any}  key  -  key
         * @returns {Array}  value(s) of key.
         * @for miruken.callback.CallbackHandler
         */                                                
        lookupAll: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key, true);
            return this.handle(lookup, true, global.$composer)
                 ?  lookup.callbackResult
                 : [];
        },
        /**
         * Decorates the handler.
         * @method decorate
         * @param   {Object}  decorations  -  decorations
         * @returns {miruken.callback.CallbackHandler} decorated callback handler.
         * @for miruken.callback.CallbackHandler
         */        
        decorate: function (decorations) {
            return $decorate(this, decorations);
        },
        /**
         * Decorates the handler for filtering callbacks.
         * @method filter
         * @param   {Function}  filter     -  filter
         * @param   {boolean}   reentrant  -  true if reentrant, false otherwise
         * @returns {miruken.callback.CallbackHandler} filtered callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                        
        filter: function (filter, reentrant) {
            if (!$isFunction(filter)) {
                throw new TypeError(format("Invalid filter: %1 is not a function.", filter));
            }
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    if (!reentrant && (callback instanceof Composition)) {
                        return this.base(callback, greedy, composer);
                    }
                    var that = this, base = this.base;
                    return filter(callback, composer, function () {
                        return base.call(that, callback, greedy, composer);
                    });
                }
            });
        },
        /**
         * Decorates the handler for applying aspects to callbacks.
         * @method aspect
         * @param   {Function}  before     -  before action.  Return false to reject
         * @param   {Function}  action     -  after action
         * @param   {boolean}   reentrant  -  true if reentrant, false otherwise
         * @returns {miruken.callback.CallbackHandler}  callback handler aspect.
         * @throws  {RejectedError} An error if before returns an unaccepted promise.
         * @for miruken.callback.CallbackHandler
         */                                                                
        aspect: function (before, after, reentrant) {
            return this.filter(function (callback, composer, proceed) {
                if ($isFunction(before)) {
                    var test = before(callback, composer);
                    if ($isPromise(test)) {
                        var hasResult = "callbackResult" in callback,
                            accept    = test.then(function (accepted) {
                            if (accepted !== false) {
                                _aspectProceed(callback, composer, proceed, after, accepted);
                                return hasResult ? callback.callbackResult : true;
                            }
                            return Promise.reject(new RejectedError(callback));
                        });
                        if (hasResult) {
                            callback.callbackResult = accept;                            
                        }
                        return true;
                    } else if (test === false) {
                        return true;
                    }
                }
                return _aspectProceed(callback, composer, proceed, after, test);
            }, reentrant);
        },
        /**
         * Decorates the handler to handle definitions.
         * @method $handle
         * @param   {Array}  [definitions]  -  handler overrides
         * @returns {miruken.callback.CallbackHandler}  decorated callback handler.
         * @for miruken.callback.CallbackHandler
         */
        $$handle: function (definitions) {
            return this.decorate({$handle: definitions});
        },
        /**
         * Decorates the handler to provide definitions.
         * @method $handle
         * @param   {Array}  [definitions]  -  provider overrides
         * @returns {miruken.callback.CallbackHandler}  decorated callback handler.
         * @for miruken.callback.CallbackHandler
         */
        $$provide: function (definitions) {
            return this.decorate({$provide: definitions});
        },
        /**
         * Decorates the handler to conditionally handle callbacks.
         * @method when
         * @param   {Any}  constraint  -  matching constraint
         * @returns {miruken.callback.ConditionalCallbackHandler}  conditional callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                                        
        when: function (constraint) {
            var when = new _Node(constraint),
                condition = function (callback) {
                    if (callback instanceof Deferred) {
                        return when.match($classOf(callback.callback), Variance.Contravariant);
                    } else if (callback instanceof Resolution) {
                        return when.match(callback.key, Variance.Covariant);
                    } else {
                        return when.match($classOf(callback), Variance.Contravariant);
                    }
                };
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    return condition(callback) && this.base(callback, greedy, composer);
                }
            });
        },
        /**
         * Builds a handler chain.
         * @method next
         * @param   {Arguments}  arguments  -  handler chain members
         * @returns {miruken.callback.CallbackHandler}  chaining callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                                                
        next: function () {
            switch(arguments.length) {
            case 0:  return this;
            case 1:  return new CascadeCallbackHandler(this, arguments[0])
            default: return new CompositeCallbackHandler((Array2.unshift(arguments, this), arguments));
            }
        },
        /**
         * Prevents continuous or concurrent handling on a target.
         * @method $guard
         * @param   {Object}  target              -  target to guard
         * @param   {string}  [property='guard']  -  property for guard state
         * @returns {miruken.callback.CallbackHandler}  guarding callback handler.
         * @for miruken.callback.CallbackHandler
         */        
        $guard: function(target, property) {
            if (target) {
                var guarded = false;
                property = property || "guarded";
                var propExists = property in target;
                return this.aspect(function () {
                    if ((guarded = target[property])) {
                        return false;
                    }
                    target[property] = true;
                    return true;
                }, function () {
                    if (!guarded) {
                        target[property] = undefined;
                        if (!propExists) {
                            delete target[property];
                        }
                    }
                });
            }
            return this;
        },
        /**
         * Tracks the activity counts associated with a target. 
         * @method $activity
         * @param   {Object}  target                 -  target to track
         * @param   {Object}  [ms=50]                -  delay to wait before tracking
         * @param   {string}  [property='activity']  -  property for activity state
         * @returns {miruken.callback.CallbackHandler}  activity callback handler.
         * @for miruken.callback.CallbackHandler
         */                
        $activity: function (target, ms, property) {
            property = property || "$$activity";
            var propExists = property in target;            
            return this.aspect(function () {
                var state = { enabled: false };
                setTimeout(function () {
                    if ("enabled" in state) {
                        state.enabled = true;
                        var activity = target[property] || 0;
                        target[property] = ++activity;
                    }
                }, $isSomething(ms) ? ms : 50);
                return state;
            }, function (_, composer, state) {
                if (state.enabled) {
                    var activity = target[property];
                    if (!activity || activity === 1) {
                        target[property] = undefined;
                        if (!propExists) {
                            delete target[property];
                        }
                    } else {
                        target[property] = --activity;
                    }
                }
                delete state.enabled;
            });
        },
        /**
         * Ensures all return values are promises..
         * @method $promises
         * @returns {miruken.callback.CallbackHandler}  promising callback handler.
         * @for miruken.callback.CallbackHandler
         */                
        $promise: function() {
            return this.filter(function(callback, composer, proceed) {
                try {                
                    var handled = proceed();
                    if (handled) {
                        var result = callback.callbackResult;                    
                        callback.callbackResult = $isPromise(result)
                            ? result : Promise.resolve(result);
                    }
                    return handled;
                } catch (ex) {
                    callback.callbackResult = Promise.reject(ex);
                    return true;
                }
            });
        },        
        /**
         * Configures the receiver to set timeouts on all promises.
         * @method $timeout
         * @param   {number}             ms       -  duration before promise times out
         * @param   {Function | Error}   [error]  -  error instance or custom error class
         * @returns {miruken.callback.CallbackHandler}  timeout callback handler.
         * @for miruken.callback.CallbackHandler
         */        
        $timeout: function(ms, error) {
            return this.filter(function(callback, composer, proceed) {
                var handled = proceed();
                if (handled) {
                    var result = callback.callbackResult;
                    if ($isPromise(result)) {
                        callback.callbackResult = new Promise(function (resolve, reject) {
                            var timeout;
                            result.then(function (res) {
                                if (timeout) {
                                    clearTimeout(timeout);
                                }
                                resolve(res);
                            }, function (err) {
                                if (timeout) {
                                    clearTimeout(timeout);
                                }
                                reject(err);                                
                            });
                            timeout = setTimeout(function () {
                                if (!error) {
                                    error = new TimeoutError(callback);
                                } else if ($isFunction(error)) {
                                    error = error.new(callback);
                                }
                                if ($isFunction(result.reject)) {
                                    result.reject(error);  // TODO: cancel
                                }
                                reject(error);
                            }, ms);
                        });
                    }
                }
                return handled;
            });
        },
        /**
         * Prepares the CallbackHandler for batching.
         * @method $batch
         * @param   {miruken.Protocol}  [...protocols]  -  protocols to batch
         * @returns {miruken.callback.CallbackHandler}  batching callback handler.
         * @for miruken.callback.CallbackHandler
         */
        $batch: function(protocols) {
            var _batcher  = new Batcher(protocols),
                _complete = false,
                _promises = [];
            return this.decorate({
                $provide: [Batcher, function () { return _batcher; }],
                handleCallback: function (callback, greedy, composer) {
                    var handled = false;
                    if (_batcher) {
                        var b = _batcher;
                        if (_complete && !(callback instanceof Composition)) {
                            _batcher = null;
                        }
                        if ((handled = b.handleCallback(callback, greedy, composer)) && !greedy) {
                            if (_batcher) {
                                var result = callback.callbackResult;
                                if ($isPromise(result)) {
                                    _promises.push(result);
                                }
                            }
                            return true;
                        }
                    }
                    return this.base(callback, greedy, composer) || handled;
                },
                dispose: function () {
                    _complete = true;
                    var results = BatchingComplete(this).complete(this);
                    return _promises.length > 0
                         ? Promise.all(_promises).then(function () { return results; })
                         : results;
                }
            });            
        },
        getBatcher: function (protocol) {
            var batcher = this.resolve(Batcher);
            if (batcher && (!protocol || batcher.shouldBatch(protocol))) {
                return batcher;
            }
        }
    });

    function _aspectProceed(callback, composer, proceed, after, state) {
        var promise;
        try {
            var handled = proceed();
            if (handled) {
                var result = callback.callbackResult;
                if ($isPromise(result)) {
                    promise = result;
                    // Use 'fulfilled' or 'rejected' handlers instead of 'finally' to ensure
                    // aspect boundary is consistent with synchronous invocations and avoid
                    // reentrancy issues.
                    if ($isFunction(after))
                        promise.then(function (result) {
                            after(callback, composer, state);
                        }).catch(function (error) {
                            after(callback, composer, state);
                        });
                }
            }
            return handled;
        } finally {
            if (!promise && $isFunction(after)) {
                after(callback, composer, state);
            }
        }
    }

    /**
     * Defines a new handler grouping.  This is the main extensibility point for handling callbacks.
     * @method $define
     * @param   {string}           tag       - group tag
     * @param   {miruken.Variance} variance  - group variance
     * @return  {Function} function to add to a group.
     * @throws  {TypeError} if group already defined.
     * @for $
     */
    function $define(tag, variance) {
        if (!$isString(tag) || tag.length === 0 || /\s/.test(tag)) {
            throw new TypeError("The tag must be a non-empty string with no whitespace.");
        } else if (_definitions[tag]) {
            throw new TypeError(format("'%1' is already defined.", tag));
        }

        var handled, comparer;
        variance = variance || Variance.Contravariant;
        if (!(variance instanceof Variance)) {
            throw new TypeError("Invalid variance type supplied");
        }        
        switch (variance) {
            case Variance.Covariant:
                handled  = _requiresResult;
                comparer = _compareCovariant; 
                break;
            case Variance.Contravariant:
                handled  = _impliesSuccess;
                comparer = _compareContravariant; 
                break;
            case Variance.Invariant:
                handled  = _requiresResult;
                comparer = _compareInvariant; 
                break;
        }

        function definition(owner, constraint, handler, removed) {
            if ($isArray(constraint)) {
                return Array2.reduce(constraint, function (result, c) {
                    var undefine = _definition(owner, c, handler, removed);
                    return function (notifyRemoved) {
                        result(notifyRemoved);
                        undefine(notifyRemoved);
                    };
                }, Undefined);
            }
            return _definition(owner, constraint, handler, removed);
        }
        function _definition(owner, constraint, handler, removed) {
            if ($isNothing(owner)) {
                throw new TypeError("Definitions must have an owner.");
            } else if ($isNothing(handler)) {
                handler    = constraint;
                constraint = $classOf(Modifier.unwrap(constraint));
            }
            if ($isNothing(handler)) {
                throw new TypeError(format(
                    "Incomplete '%1' definition: missing handler for constraint %2.",
                    tag, constraint));
            } else if (removed && !$isFunction(removed)) {
                throw new TypeError("The removed argument is not a function.");
            }
            if (!$isFunction(handler)) {
                if ($copy.test(handler)) {
                    var source = Modifier.unwrap(handler);
                    if (!$isFunction(source.copy)) {
                        throw new Error("$copy requires the target to have a copy method.");
                    }
                    handler = source.copy.bind(source);
                } else {
                    var source = $use.test(handler) ? Modifier.unwrap(handler) : handler;
                    handler    = $lift(source);
                }
            }
            var meta  = owner.$meta,
                node  = new _Node(constraint, handler, removed),
                index = _createIndex(node.constraint),
                list  = meta[tag] || (meta[tag] = new IndexedList(comparer));
            list.insert(node, index);
            return function (notifyRemoved) {
                list.remove(node);
                if (list.isEmpty()) {
                    delete meta[tag];
                }
                if (node.removed && (notifyRemoved !== false)) {
                    node.removed(owner);
                }
            };
        };
        definition.removeAll = function (owner) {
            var meta = owner.$meta;
            var list = meta[tag],
                head = list.head;
            while (head) {
                if (head.removed) {
                    head.removed(owner);
                }
                head = head.next;
            }
            delete meta[tag];
        };
        definition.dispatch = function (handler, callback, constraint, composer, all, results) {
            var v        = variance,
                delegate = handler.delegate;
            constraint = constraint || callback;
            if (constraint) {
                if ($eq.test(constraint)) {
                    v = Variance.Invariant;
                }
                constraint = Modifier.unwrap(constraint);
                if (typeOf(constraint) === 'object') {
                    constraint = $classOf(constraint);
                }
            }
            var ok = delegate && _dispatch(delegate, delegate.$meta, callback, constraint, v, composer, all, results);
            if (!ok || all) {
                ok = ok || _dispatch(handler, handler.$meta, callback, constraint, v, composer, all, results);
            }
            return ok;
        };
        function _dispatch(target, meta, callback, constraint, v, composer, all, results) {
            var dispatched = false,
                invariant  = (v === Variance.Invariant),
                index      = meta && _createIndex(constraint);
            while (meta) {
                var list = meta[tag];
                if (list && (!invariant || index)) {
                    var node = list.getIndex(index) || list.head;
                    while (node) {
                        if (node.match(constraint, v)) {
                            var base       = target.base,
                                baseCalled = false;
                            target.base    = function () {
                                var baseResult;
                                baseCalled = true;
                                _dispatch(target, meta.getParent(), callback, constraint, v, composer, false,
                                          function (result) { baseResult = result; });
                                return baseResult;
                            };
                            try {
                                var result = node.handler.call(target, callback, composer);
                                if (handled(result)) {
                                    if (results) {
                                        results.call(callback, result);
                                    }
                                    if (!all) {
                                        return true;
                                    }
                                    dispatched = true;
                                } else if (baseCalled) {
                                    if (!all) {
                                        return false;
                                    }
                                }
                            } finally {
                                target.base = base;
                            }
                        } else if (invariant) {
                            break;  // stop matching if invariant not satisifed
                        }
                        node = node.next;
                    }
                }
                meta = meta.getParent();
            }
            return dispatched;
        }
        _definitions[tag] = definition;
        return definition;
    }

    function _Node(constraint, handler, removed) {
        var invariant   = $eq.test(constraint);
        constraint      = Modifier.unwrap(constraint);
        this.constraint = constraint;
        this.handler    = handler;
        if ($isNothing(constraint)) {
            this.match = invariant ? False : _matchEverything;
        } else if ($isProtocol(constraint)) {
            this.match = invariant ? _matchInvariant : _matchProtocol;
        } else if ($isClass(constraint)) {
            this.match = invariant ? _matchInvariant : _matchClass;
        } else if ($isString(constraint)) {
            this.match = _matchString;
        } else if (instanceOf(constraint, RegExp)) {
            this.match = invariant ? False : _matchRegExp;
        } else if ($isFunction(constraint)) {
            this.match = constraint;
        } else {
            this.match = False;
        }
        if (removed) {
            this.removed = removed;
        }
    }

    function _createIndex(constraint) {
        if (constraint) {
            if ($isString(constraint)) {
                return constraint;
            } else if ($isFunction(constraint)) {
                return assignID(constraint);
            }
        }
    }

    function _matchInvariant(match) {
        return this.constraint === match;
    }

    function _matchEverything(match, variance) {
        return variance !== Variance.Invariant;
    }

    function _matchProtocol(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Covariant) {
            return constraint.conformsTo(match);
        } else if (variance === Variance.Contravariant) {
            return match.conformsTo && match.conformsTo(constraint);
        }
        return false;
    }

    function _matchClass(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Contravariant) {
            return match.prototype instanceof constraint;
        }
        else if (variance === Variance.Covariant) {
            return match.prototype &&
                (constraint.prototype instanceof match
                 || ($isProtocol(match) && match.adoptedBy(constraint)));
        }
        return false;
    }

    function _matchString(match) {
        return $isString(match) && this.constraint == match;
    }

    function _matchRegExp(match, variance) {
        return (variance !== Variance.Invariant) && this.constraint.test(match);
    }

    function _compareCovariant(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Covariant)) {
            return -1;
        }
        return 1;
    }
    
    function _compareContravariant(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Contravariant)) {
            return -1;
        }
        return 1;
    }

    function _compareInvariant(node, insert) {
        return insert.match(node.constraint, Variance.Invariant) ? 0 : -1;
    }

    function _requiresResult(result) {
        return ((result !== null) && (result !== undefined) && (result !== $NOT_HANDLED));
    }

    function _impliesSuccess(result) {
        return result ? (result !== $NOT_HANDLED) : (result === undefined);
    }

    function _flattenPrune(array) {
       var i       = 0,
           flatten = function (result, item) {
               if (Array2.like(item)) {
                   Array2.reduce(item, flatten, result);
               } else if (item != null) {
                   result[i++] = item;
               }
               return result;
           };
      return Array2.reduce(array, flatten, []);
    }

    /**
     * Marks the callback handler for validation.
     * @method $valid
     * @param   {Object}  target  -  object to validate
     * @param   {Any}     scope   -  scope of validation
     * @returns {miruken.callback.CallbackHandlerAspect} validation semantics.
     * @for miruken.callback.CallbackHandler
     */                

    /**
     * Marks the callback handler for asynchronous validation.
     * @method $validAsync
     * @param   {Object}  target  -  object to validate
     * @param   {Any}     scope   -  scope of validation
     * @returns {miruken.callback.CallbackHandlerAspect} validation semantics.
     * @for miruken.callback.CallbackHandler
     */                        

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./miruken.js":12,"bluebird":23}],5:[function(require,module,exports){
var miruken = require('./miruken.js');
              require('./graph.js');
              require('./callback.js');

new function () { // closure

    /**
     * Package providing contextual support.<br />
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "graph"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule context
     * @namespace miruken.context
     */
    miruken.package(this, {
        name:    "context",
        imports: "miruken,miruken.graph,miruken.callback",
        exports: "ContextState,ContextObserver,Context,ContextualHelper,$contextual"
    });

    eval(this.imports);

    /**
     * Represents the state of a {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextState
     * @extends miruken.Enum
     */
    var ContextState = Enum({
        /**
         * Context is active.
         * @property {number} Active
         */
        Active: 1,
        /**
         * Context is in the process of ending.
         * @property {number} Ending
         */        
        Ending: 2,
        /**
         * Context has ended.
         * @property {number} Ended
         */                
        Ended:  3 
    });

    /**
     * Protocol for observing the lifecycle of
     * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextObserver
     * @extends miruken.Protocol
     */
    var ContextObserver = Protocol.extend({
        /**
         * Called when a context is in the process of ending.
         * @method contextEnding
         * @param   {miruken.context.Context}  context
         */
        contextEnding: function (context) {},
        /**
         * Called when a context has ended.
         * @method contextEnded
         * @param   {miruken.context.Context}  context
         */        
        contextEnded: function (context) {},
        /**
         * Called when a child context is in the process of ending.
         * @method childContextEnding
         * @param   {miruken.context.Context}  childContext
         */
        childContextEnding: function (childContext) {},
        /**
         * Called when a child context has ended.
         * @method childContextEnded
         * @param   {miruken.context.Context}  childContext
         */        
        childContextEnded: function (context) {}
    });

    /**
     * A Context represents the scope at a give point in time.<br/>
     * It has a beginning and an end and can handle callbacks as well as notify observers of lifecycle changes.<br/>
     * In addition, it maintains parent-child relationships and thus can participate in a hierarchy.
     * @class Context
     * @constructor
     * @param   {miruken.context.Context}  [parent]  -  parent context
     * @extends miruken.callback.CompositeCallbackHandler
     * @uses miruken.Parenting
     * @uses miruken.graph.Traversing
     * @uses miruken.graph.TraversingMixin
     * @uses miruken.Disposing
     */    
    var Context = CompositeCallbackHandler.extend(
        Parenting, Traversing, Disposing, TraversingMixin, {
        constructor: function (parent) {
            this.base();

            var _id         = assignID(this),
                _state      = ContextState.Active,
                _parent     = parent,
                _children   = new Array2,
                _observers;

            this.extend({
                /**
                 * Gets the unique id of this context.
                 * @property {string} id
                 * @readOnly
                 */
                get id() { return _id },
                /**
                 * Gets the context state.
                 * @property {miruken.context.ContextState} state
                 * @readOnly
                 */
                get state() { return _state; },
                /**
                 * Gets the parent context.
                 * @property {miruken.context.Context} parent
                 * @readOnly
                 */                
                get parent() { return _parent; },
                /**
                 * Gets the context children.
                 * @property {Array} children
                 * @readOnly
                 */                                
                get children() { return _children.copy(); },
                /**
                 * Determines if the context has children.
                 * @property {boolean} hasChildren
                 * @readOnly
                 */                                                
                get hasChildren() { return _children.length > 0; },
                /**
                 * Gets the root context.
                 * @property {miruken.context.Context} root
                 * @readOnly
                 */                                
                get root() {
                    var root = this, parent;    
                    while (root && (parent = root.parent)) {
                        root = parent;
                    }
                    return root;
                },
                newChild: function () {
                    ensureActive();
                    var childContext = new ($classOf(this))(this).extend({
                        end: function () {
                            var notifier = makeNotifier();
                            notifier.childContextEnding(childContext);
                            _children.remove(childContext);
                            this.base();
                            notifier.childContextEnded(childContext);                            
                        }
                    });
                    _children.push(childContext);
                    return childContext;
                },
                /**
                 * Stores the object in the context.
                 * @method store
                 * @param  {Object} object  -  object to store
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                store: function (object) {
                    if ($isSomething(object)) {
                        $provide(this, object);
                    }
                    return this;
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = false,
                        axis    = this.__axis;
                    if (!axis) {
                        handled = this.base(callback, greedy, composer);
                        if (handled && !greedy) {
                            return handled;
                        }
                        if (_parent) {
                            handled = handled | _parent.handle(callback, greedy, composer);
                        }
                        return !!handled;                        
                    }
                    delete this.__axis;
                    if (axis === TraversingAxis.Self) {
                        return this.base(callback, greedy, composer);
                    } else {
                        this.traverse(axis, function (node) {
                            handled = handled | ($equals(node, this)
                                    ? this.base(callback, greedy, composer)
                                    : node.handleAxis(TraversingAxis.Self, callback, greedy, composer));
                            return handled && !greedy;
                        }, this);
                    }
                    return !!handled;
                },
                /**
                 * Handles the callback using the traversing axis.
                 * @method handleAxis
                 * @param   {miruken.graph.TraversingAxis}     axis            -  any callback
                 * @param   {Object}                           callback        -  any callback
                 * @param   {boolean}                          [greedy=false]  -  true if handle greedily
                 * @param   {miruken.callback.CallbackHandler} [composer]      -  composition handler
                 * @returns {boolean} true if the callback was handled, false otherwise.
                 */                
                handleAxis: function (axis, callback, greedy, composer) {
                    if (!(axis instanceof TraversingAxis)) {
                        throw new TypeError("Invalid axis type supplied");
                    }        
                    this.__axis = axis;
                    return this.handle(callback, greedy, composer);
                },
                /**
                 * Subscribes to the context notifications.
                 * @method observe
                 * @param   {miruken.context.ContextObserver}  observer  -  receives notifications
                 * @returns {Function} unsubscribes from context notifications.
                 */                                
                observe: function (observer) {
                    ensureActive();
                    if (observer === null || observer === undefined) {
                        return;
                    }
                    (_observers || (_observers = new Array2)).push(observer);
                    return function () { _observers.remove(observer); };
                },
                /**
                 * Unwinds to the root context.
                 * @method unwindToRootContext
                 * @param   {miruken.context.ContextObserver}  observer  -  receives notifications
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                unwindToRootContext: function () {
                    var current = this;
                    while (current) {
                        var parent = current.parent;
                        if (parent == null) {
                            current.unwind();
                            return current;
                        }
                        current = parent;
                    }
                    return this;
                },
                /**
                 * Unwinds to the context by ending all children.
                 * @method unwind
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                unwind: function () {
                    this.children.invoke('end');
                    return this;
                },
                /**
                 * Ends the context.
                 * @method end
                 */                                                                
                end: function () { 
                    if (_state == ContextState.Active) {
                        var notifier = makeNotifier();
                        _state = ContextState.Ending;
                        notifier.contextEnding(this);
                        this.unwind();
                        _state = ContextState.Ended;
                        notifier.contextEnded(this);                        
                        _observers = null;
                    }
                },
                dispose: function () { this.end(); }
            });

            function ensureActive() {
                if (_state != ContextState.Active) {
                    throw new Error("The context has already ended.");
                }
            }

            function makeNotifier() {
                return new ContextObserver(_observers ? _observers.copy() : null);
            }
        }
    });

    /**
     * Mixin to provide the minimal functionality to support contextual based operations.<br/>
     * This is an alternatve to the delegate model of communication, but with less coupling 
     * and ceremony.
     * @class ContextualMixin
     * @private
     */
    var ContextualMixin = Object.freeze({
        /**
         * The context associated with the receiver.
         * @property {miruken.context.Context} context
         */        
        get context() { return this.__context; },
        set context(context) {
            if (this.__context === context) {
                return;
            }
            if (this.__context)
                this.__context.removeHandlers(this);
            if (context) {
                this.__context = context;
                context.addHandlers(this);
            } else {
                delete this.__context;
            }
        },
        /**
         * Determines if the receivers context is active.
         * @property {boolean} isActiveContext
         * @readOnly
         */        
        get isActiveContext() {
            return this.__context && (this.__context.state === ContextState.Active);
        },
        /**
         * Ends the receivers context.
         * @method endContext
         */                
        endContext: function () {
            if (this.__context) {
                this.__context.end();
            }
        }
    });

    /**
     * Metamacro to make classes contextual.<br/>
     * <pre>
     *    var Controller = Base.extend($contextual, {
     *       action: function () {}
     *    })
     * </pre>
     * would give the Controller class contextual support.
     * @class $contextual
     * @constructor
     * @extends miruken.MetaMacro
     */    
    var $contextual = MetaMacro.extend({
        execute: function (step, metadata) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();
                clazz.implement(ContextualMixin);
            }
        }
    });

    /**
     * Mixin for {{#crossLink "miruken.context.Contextual"}}{{/crossLink}} helper support.
     * @class ContextualHelper
     * @extends Module
     */    
    var ContextualHelper = Module.extend({
        /**
         * Resolves the receivers context.
         * @method resolveContext
         * @returns {miruken.context.Context} receiver if a context or the receiver context. 
         */                
        resolveContext: function (contextual) {
            return $isNothing(contextual) || (contextual instanceof Context)
                 ? contextual
                 : contextual.context;
        },
        /**
         * Ensure the receiver is associated with a context.
         * @method requireContext
         * @throws {Error} an error if a context could not be resolved.
         */                        
        requireContext: function (contextual) {
            var context = ContextualHelper.resolveContext(contextual);
            if (!(context instanceof Context))
                throw new Error("The supplied object is not a Context or Contextual object.");
            return context;
        },
        /**
         * Clears and ends the receivers associated context.
         * @method clearContext
         */                                
        clearContext: function (contextual) {
            var context = contextual.context;
            if (context) {
                try {
                    context.end();
                }
                finally {
                    contextual.context = null;
                }
            }
        },
        /**
         * Attaches the context to the receiver.
         * @method bindContext
         * @param  {miruken.context.Context}  context  -  context
         * @param  {boolean}                  replace  -  true if replace existing context
         * @returns {miruken.context.Context} effective context.
         * @throws {Error} an error if the context could be attached.
         */                                        
        bindContext: function (contextual, context, replace) {
            if (contextual && (replace || !contextual.context)) {
                contextual.context = ContextualHelper.resolveContext(context);
            }
            return contextual;
        },
        /**
         * Attaches a child context of the receiver to the contextual child.
         * @method bindChildContext
         * @param  {miruken.context.Context}  child    -  contextual child
         * @param  {boolean}                  replace  -  true if replace existing context
         * @returns {miruken.context.Context} effective child context.
         * @throws {Error} an error if the child context could be attached.
         */                                                
        bindChildContext: function (contextual, child, replace) {
            var childContext;
            if (child) {
                if (!replace) {
                    childContext = child.context;
                    if (childContext && childContext.state === ContextState.Active) {
                        return childContext;
                    }
                }
                var context = ContextualHelper.requireContext(contextual);
                while (context && context.state !== ContextState.Active) {
                    context = context.parent;
                }
                if (context) {
                    childContext = context.newChild();
                    ContextualHelper.bindContext(child, childContext, true);
                }
            }
            return childContext;
        }
    });

    Context.implement({
        /**
         * Observes 'contextEnding' notification.
         * @method onEnding
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'contextEnding' notification.
         * @for miruken.context.Context
         */
        onEnding: function (observer) {
            return this.observe({contextEnding: observer});
        },
        /**
         * Observes 'contextEnded' notification.
         * @method onEnded
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'contextEnded' notification.
         * @for miruken.context.Context
         * @chainable
         */        
        onEnded: function (observer) {
            return this.observe({contextEnded: observer});
        },
        /**
         * Observes 'childContextEnding' notification.
         * @method onChildEnding
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'childContextEnding' notification.
         * @for miruken.context.Context
         * @chainable
         */                
        onChildEnding: function (observer) {
            return this.observe({childContextEnding: observer});
        },
        /**
         * Observes 'childContextEnded' notification.
         * @method onChildEnded
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'childContextEnded' notification.
         * @for miruken.context.Context
         * @chainable
         */                        
        onChildEnded: function (observer) {
            return this.observe({childContextEnded: observer});            
        }        
    });
    
   /**
     * Context traversal
     */
    var axisControl = {
        /**
         * Changes the default traversal axis.
         * @method axis
         * @param   {miruken.graph.TraversingAxis}  axis  -  axis
         * @returns {miruken.context.Context} callback handler axis.
         * @for miruken.context.Context
         */
        axis: function (axis) {
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    if (!(callback instanceof Composition)) {
                        this.__axis = axis;                        
                    }
                    return this.base(callback, greedy, composer);
                },
                equals: function (other) {
                    return (this === other) || ($decorated(this) === $decorated(other));
                }
            });
        }},
        applyAxis = axisControl.axis;

    Array2.forEach(TraversingAxis.names, function (name) {
        var key = '$' + name.charAt(0).toLowerCase() + name.slice(1);
        axisControl[key] = Function2.partial(applyAxis, TraversingAxis[name]);
    });

    CallbackHandler.implement({
        /**
         * Establishes publish invocation semantics.
         * @method $publish
         * @returns {miruken.callback.CallbackHandler} publish semantics.
         * @for miruken.callback.CallbackHandler
         */
        $publish: function () {
            var composer = this;
            var context = ContextualHelper.resolveContext(composer);
            if (context) {
                composer = context.$descendantOrSelf();
            }
            return composer.$notify();
        },
        $publishFromRoot: function () {
            var composer = this;
            var context = ContextualHelper.resolveContext(composer);
            if (context) {
                composer = context.root.$descendantOrSelf();
            }
            return composer.$notify();
        }
    });
    
    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Self:property"}}{{/crossLink}}.
     * @method $self
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Root:property"}}{{/crossLink}}.
     * @method $root
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Child:property"}}{{/crossLink}}.
     * @method $child
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Sibling:property"}}{{/crossLink}}.
     * @method $sibling
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Ancestor:property"}}{{/crossLink}}.
     * @method $ancestor
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Descendant:property"}}{{/crossLink}}.
     * @method $descendant
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantReverse:property"}}{{/crossLink}}.
     * @method $descendantReverse
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */        

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/ChildOrSelf:property"}}{{/crossLink}}.
     * @method $childOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/SiblingOrSelf:property"}}{{/crossLink}}.
     * @method $siblingOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/AncestorOrSelf:property"}}{{/crossLink}}.
     * @method $ancestorOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */        

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantOrSelf:property"}}{{/crossLink}}.
     * @method $descendantOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantOrSelfReverse:property"}}{{/crossLink}}.
     * @method $descendantOrSelfReverse
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/AncestorSiblingOrSelf:property"}}{{/crossLink}}.
     * @method $ancestorSiblingOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    Context.implement(axisControl);

    /**
     * Enhances Functions to create instances in a context.
     * @method newInContext
     * @for Function
     */
    if (Function.prototype.newInContext === undefined)
        Function.prototype.newInContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindContext(object, context);
            return object;
        };

    /**
     * Enhances Functions to create instances in a child context.
     * @method newInChildContext
     * @for Function
     */
    if (Function.prototype.newInChildContext === undefined)
        Function.prototype.newInChildContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindChildContext(context, object);
            return object;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}

},{"./callback.js":4,"./graph.js":7,"./miruken.js":12}],6:[function(require,module,exports){
var miruken = require('./miruken.js'),
    Promise = require('bluebird');
              require('./callback.js');

new function() { // closure

    /**
     * Package providing generalized error support.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}} and
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule error
     * @namespace miruken.error
     */
    miruken.package(this, {
        name:    "error",
        imports: "miruken,miruken.callback",
        exports: "Errors,ErrorCallbackHandler"
    });

    eval(this.imports);

    /**
     * Protocol for handling and reporting errors.
     * @class Errors
     * @extends miruken.Protocol
     */    
    var Errors = Protocol.extend({
        /**
         * Handles an error.
         * @method handlerError
         * @param   {Any}          error      - error (usually Error)
         * @param   {Any}          [context]  - scope of error
         * @returns {Promise} promise of handled error.
         */        
        handleError: function (error, context) {},
        /**
         * Handles an exception.
         * @method handlerException
         * @param   {Exception}    excption   - exception
         * @param   {Any}          [context]  - scope of error
         * @returns {Promise} of handled error.
         */        
        handleException: function (exception, context) {},
        /**
         * Reports an error.
         * @method reportError
         * @param   {Any}          error      - error (usually Error)
         * @param   {Any}          [context]  - scope of error
         * @returns {Promise} of reported error.
         */        
        reportError: function (error, context) {},
        /**
         * Reports an excepion.
         * @method reportException
         * @param   {Exception}    exception  - exception
         * @param   {Any}          [context]  - scope of exception
         * @returns {Promise} of reported exception.
         */        
        reportException: function (exception, context) {},
        /**
         * Clears any errors for the associated context.
         * @method clearErrors
         * @param   {Any}          [context]  - scope of errors
         */
        clearErrors: function (context) {}
    });

    /**
     * CallbackHandler for handling errors.
     * @class ErrorCallbackHandler
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.error.Errors
     */    
    var ErrorCallbackHandler = CallbackHandler.extend(Errors, {
        handleError: function (error, context) {
            var reportError = Errors($composer).reportError(error, context);
            return reportError === undefined
                 ? Promise.reject(error)
                 : Promise.resolve(reportError);
        },
        handleException: function (exception, context) {
            var reportException = Errors($composer).reportException(exception, context);
            return reportException === undefined
                 ? Promise.reject(exception)
                 : Promise.resolve(reportException);
        },                                                      
        reportError: function (error, context) {
            console.error(error);
            return Promise.resolve();
        },
        reportException: function (exception, context) {
            console.error(exception);
            return Promise.resolve();
        },
        clearErrors: function (context) {} 
    });

    CallbackHandler.implement({
        /**
         * Marks the callback handler for recovery.
         * @method $recover
         * @returns {miruken.callback.CallbackHandlerFilter} recovery semantics.
         * @for miruken.callback.CallbackHandler
         */        
        $recover: function (context) {
            return this.filter(function(callback, composer, proceed) {
                try {
                    handled = proceed();
                    if (handled) {
                        var result = callback.callbackResult;
                        if ($isPromise(result)) {
                            callback.callbackResult = result.catch(function (err) {
                                return Errors(composer).handleError(err, context);
                            });
                        }
                    }
                    return handled;
                } catch (ex) {
                    Errors(composer).handleException(ex, context);
                    return true;
                }
            });
        },
        /**
         * Creates a function to pass error promises to Errors feature.
         * @method $recoverError
         * @returns {Function} function to pass error promises to Errors feature. 
         * @for miruken.callback.CallbackHandler
         */        
        $recoverError: function (context) {
            return function (error) {
                return Errors(this).handleError(error, context);
            }.bind(this);
        }
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}

},{"./callback.js":4,"./miruken.js":12,"bluebird":23}],7:[function(require,module,exports){
var miruken = require('./miruken.js');

new function () { // closure

    /**
     * Package containing graph traversal support.
     * @module miruken
     * @submodule graph
     * @namespace miruken.graph
     */
     miruken.package(this, {
        name:    "graph",
        imports: "miruken",
        exports: "TraversingAxis,Traversing,TraversingMixin,Traversal"
    });

    eval(this.imports);

    /**
     * TraversingAxis enum
     * @class TraversingAxis
     * @extends miruken.Enum
     */
    var TraversingAxis = Enum({
        /**
         * Traverse only current node.
         * @property {number} Self
         */
        Self: 1,
        /**
         * Traverse only current node root.
         * @property {number} Root
         */
        Root: 2,
        /**
         * Traverse current node children.
         * @property {number} Child
         */
        Child: 3,
        /**
         * Traverse current node siblings.
         * @property {number} Sibling
         */
        Sibling: 4,
        /**
         * Traverse current node ancestors.
         * @property {number} Ancestor
         */
        Ancestor: 5,
        /**
         * Traverse current node descendants.
         * @property {number} Descendant
         */
        Descendant: 6,
        /**
         * Traverse current node descendants in reverse.
         * @property {number} DescendantReverse
         */
        DescendantReverse: 7,
        /**
         * Traverse current node and children.
         * @property {number} ChildOrSelf
         */
        ChildOrSelf: 8,
        /**
         * Traverse current node and siblings.
         * @property {number} SiblingOrSelf
         */
        SiblingOrSelf: 9,
        /**
         * Traverse current node and ancestors.
         * @property {number} AncestorOrSelf
         */
        AncestorOrSelf: 10,
        /**
         * Traverse current node and descendents.
         * @property {number} DescendantOrSelf
         */
        DescendantOrSelf: 11,
        /**
         * Traverse current node and descendents in reverse.
         * @property {number} DescendantOrSelfReverse
         */
        DescendantOrSelfReverse: 12,
        /**
         * Traverse current node, ancestors and siblings.
         * @property {number} AncestorSiblingOrSelf 
         */
        AncestorSiblingOrSelf: 13
    });

    /**
     * Protocol for traversing an abitrary graph of objects.
     * @class Traversing
     * @extends miruken.Protocol
     */
    var Traversing = Protocol.extend({
        /**
         * Traverse a graph of objects.
         * @method traverse
         * @param {miruken.graph.TraversingAxis} axis        -  axis of traversal
         * @param {Function}                     visitor     -  receives visited nodes
         * @param {Object}                       [context]   -  visitor callback context
         */
        traverse: function (axis, visitor, context) {}
    });

    /**
     * Mixin for Traversing functionality.
     * @class TraversingMixin
     * @uses miruken.graph.Traversing
     * @extends Module
     */
    var TraversingMixin = Module.extend({
        traverse: function (object, axis, visitor, context) {
            if ($isFunction(axis)) {
                context = visitor;
                visitor = axis;
                axis    = TraversingAxis.Child;
            }
            if (!$isFunction(visitor)) return;
            switch (axis) {
            case TraversingAxis.Self:
                _traverseSelf.call(object, visitor, context);
                break;
                
            case TraversingAxis.Root:
                _traverseRoot.call(object, visitor, context);
                break;
                
            case TraversingAxis.Child:
                _traverseChildren.call(object, visitor, false, context);
                break;

            case TraversingAxis.Sibling:
                _traverseAncestorSiblingOrSelf.call(object, visitor, false, false, context);
                break;
                
            case TraversingAxis.ChildOrSelf:
                _traverseChildren.call(object, visitor, true, context);
                break;

            case TraversingAxis.SiblingOrSelf:
                _traverseAncestorSiblingOrSelf.call(object, visitor, true, false, context);
                break;
                
            case TraversingAxis.Ancestor:
                _traverseAncestors.call(object, visitor, false, context);
                break;
                
            case TraversingAxis.AncestorOrSelf:
                _traverseAncestors.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.Descendant:
                _traverseDescendants.call(object, visitor, false, context);
                break;
  
            case TraversingAxis.DescendantReverse:
                _traverseDescendantsReverse.call(object, visitor, false, context);
                break;
              
            case TraversingAxis.DescendantOrSelf:
                _traverseDescendants.call(object, visitor, true, context);
                break;

            case TraversingAxis.DescendantOrSelfReverse:
                _traverseDescendantsReverse.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.AncestorSiblingOrSelf:
                _traverseAncestorSiblingOrSelf.call(object, visitor, true, true, context);
                break;

            default:
                throw new Error(format("Unrecognized TraversingAxis %1.", axis));
            }
        }
    });

    function checkCircularity(visited, node) {
        if (visited.indexOf(node) !== -1) {
            throw new Error(format("Circularity detected for node %1", node));
        }
        visited.push(node);
        return node;
    }

    function _traverseSelf(visitor, context) {
        visitor.call(context, this);
    }

    function _traverseRoot(visitor, context) {
        var parent, root = this, visited = [this];
        while (parent = root.parent) {
            checkCircularity(visited, parent);
            root = parent;   
        }
        visitor.call(context, root);
    }

    function _traverseChildren(visitor, withSelf, context) {
        if ((withSelf && visitor.call(context, this))) {
            return;
        }
        var children = this.children;
        for (var i = 0; i < children.length; ++i) {
            if (visitor.call(context, children[i])) {
                return;
            }
        }
    }

    function _traverseAncestors(visitor, withSelf, context) {
        var parent = this, visited = [this];
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        while ((parent = parent.parent) && !visitor.call(context, parent)) {
            checkCircularity(visited, parent);
        }
    }

    function _traverseDescendants(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.levelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.levelOrder(this, function (node) {
                if (!$equals(self, node)) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseDescendantsReverse(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.reverseLevelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.reverseLevelOrder(this, function (node) {
                if (!$equals(self, node)) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        var self = this, parent = this.parent;
        if (parent) {
            var children = parent.children;
            for (var i = 0; i < children.length; ++i) {
                var sibling = children[i];
                if (!$equals(self, sibling) && visitor.call(context, sibling)) {
                    return;
                }
            }
            if (withAncestor) {
                _traverseAncestors.call(parent, visitor, true, context);
            }
        }
    }
    
    /**
     * Helper class for traversing a graph.
     * @static
     * @class Traversal
     * @extends Abstract
     */
    var Traversal = Abstract.extend({}, {
        /**
         * Performs a pre-order graph traversal.
         * @static
         * @method preOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        preOrder: function (node, visitor, context) {
            return _preOrder(node, visitor, context, []);
        },
        /**
         * Performs a post-order graph traversal.
         * @static
         * @method postOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        postOrder: function (node, visitor, context) {
            return _postOrder(node, visitor, context, []);
        },
        /**
         * Performs a level-order graph traversal.
         * @static
         * @method levelOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        levelOrder: function (node, visitor, context) {
            return _levelOrder(node, visitor, context, []);
        },
        /**
         * Performs a reverse level-order graph traversal.
         * @static
         * @method levelOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        reverseLevelOrder: function (node, visitor, context) {
            return _reverseLevelOrder(node, visitor, context, []);
        }
    });

    function _preOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.preOrder(child, visitor, context);
            });
        return false;
    }

    function _postOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.postOrder(child, visitor, context);
            });
        return visitor.call(context, node);
    }

    function _levelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            if (visitor.call(context, next)) {
                return;
            }
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) queue.push(child);
                });
        }
    }

    function _reverseLevelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node],
            stack = [];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            stack.push(next);
            var level = [];
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) level.unshift(child);
                });
            queue.push.apply(queue, level);
        }
        while (stack.length > 0) {
            if (visitor.call(context, stack.pop())) {
                return;
            }
        }
    }

    eval(this.exports);

}

},{"./miruken.js":12}],8:[function(require,module,exports){
module.exports = require('./miruken.js');
require('./graph.js');
require('./callback.js');
require('./context.js');
require('./error.js');
require('./validate');
require('./ioc');

},{"./callback.js":4,"./context.js":5,"./error.js":6,"./graph.js":7,"./ioc":10,"./miruken.js":12,"./validate":20}],9:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('./ioc.js');

new function () { // closure

    /**
     * @module miruken
     * @submodule ioc
     * @namespace miruken.ioc
     * @Class $
     */            
    miruken.package(this, {
        name:    "ioc",
        imports: "miruken,miruken.ioc",
        exports: "Installer,FromBuilder,FromPackageBuilder,BasedOnBuilder,KeyBuilder,$classes"
    });

    eval(this.imports);

    /**
     * Base class for installing one or more components into a 
     * {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class Installer
     * @extends Base
     * @uses miruken.ioc.Registration
     */        
    var Installer = Base.extend(Registration, {
        register: function (container, composer) {}
    });

    /**
     * Fluent builder for specifying source of components.
     * @class FromBuilder
     * @constructor
     * @extends Base
     * @uses miruken.ioc.Registration
     */    
    var FromBuilder = Base.extend(Registration, {
        constructor: function () {
            var _basedOn;
            this.extend({
                /**
                 * Gets the classes represented by this source.
                 * @method getClasses
                 * @returns {Array} classes from this source.
                 */        
                getClasses: function () { return []; },
                /**
                 * Gets the builder for filtering classes from this source.
                 * @method basedOn
                 * @returns {miruken.ioc.BasedOnBuilder} fluent class filter.
                 */        
                basedOn: function (/*constraints*/) {
                    _basedOn = new BasedOnBuilder(this, Array2.flatten(arguments));
                    return _basedOn;
                },
                register: function(container, composer) {
                    var registrations,
                        classes = this.getClasses();
                    if (_basedOn) {  // try based on
                        registrations = Array2.filter(
                            Array2.map(classes, function (member) {
                                return _basedOn.builderForClass(member);
                            }), function (component) {
                            return component;
                        });
                    } else { // try installers
                        registrations = Array2.map(
                            Array2.filter(classes, function (member) {
                                var clazz = member.member || member;
                                return clazz.prototype instanceof Installer;
                            }), function (installer) {
                                installer = installer.member || installer;
                                return new installer;
                            });
                    }
                    return Promise.all(container.register(registrations))
                        .then(function (registrations) {
                            return _unregisterBatch(registrations);
                        });
                }
            });
        }
    });

    /**
     * Fluent builder for specifying a Package as a source of components.
     * @class FromPackageBuilder
     * @constructor
     * @param {Package} package     -  package containing components
     * @param {Array}   [...names]  -  optional member name filter
     * @extends miruken.ioc.FromBuilder
     */        
    var FromPackageBuilder = FromBuilder.extend({
        constructor: function (package, names) {
            this.base();
            this.extend({
                getClasses: function () {
                    var classes = [];
                    package.getClasses(names, function (clazz) {
                        classes.push(clazz);
                    });
                    return classes;
                }
            });
        }
    });

    /**
     * Fluent builder for filtering a source of components.
     * @class BasedOnBuilder
     * @constructor
     * @param  {miruken.ioc.FromBuilder}  from            -  source of components
     * @param  {Array}                    ...constraints  -  initial constraints
     * @extends Base
     * @uses miruken.ioc.Registration
     */        
    var BasedOnBuilder = Base.extend(Registration, {
        constructor: function (from, constraints) {
            var _if, _unless, _configuration;
            this.withKeys = new KeyBuilder(this);
            this.extend({
                /**
                 * Adds a predicate for including a component.
                 * @method if
                 * @param   {Function}  condition  -  predicate to include component
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */        
                if: function (condition) {
                    if (_if) {
                        var cond = _if;
                        _if = function (clazz) {
                            return cond(clazz) && condition(clazz);
                        };
                    } else {
                        _if = condition;
                    }
                    return this;
                },
                /**
                 * Adds a predicate for excluding a component.
                 * @method unless
                 * @param   {Function}  condition  -  predicate to exclude component
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */                        
                unless: function (condition) {
                    if (_unless) {
                        var cond = _unless;
                        _unless = function (clazz) {
                            return cond(clazz) || condition(clazz);
                        };
                    } else {
                        _unless = condition;
                    }
                    return this;
                },
                /**
                 * Adds a custom component configuration.
                 * @method configure
                 * @param   {Function}  configuration  -  receives
                 * {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} for configuration
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */                                        
                configure: function (configuration) {
                    if (_configuration) {
                        var configure  = _configuration;
                        _configuration = function (component) {
                            configure(component);
                            configuration(component);
                        };
                    } else {
                        _configuration = configuration;
                    }
                    return this;
                },
                builderForClass: function (member) {
                    var basedOn = [],
                        clazz   = member.member || member,
                        name    = member.name;
                    if ((_if && !_if(clazz)) || (_unless && _unless(clazz))) {
                        return;
                    }
                    for (var i = 0; i < constraints.length; ++i) {
                        var constraint = constraints[i];
                        if ($isProtocol(constraint)) {
                            if (!constraint.adoptedBy(clazz)) {
                                continue;
                            }
                        } else if ($isClass(constraint)) {
                            if (!(clazz.prototype instanceof constraint)) {
                                continue;
                            }
                        }
                        if (basedOn.indexOf(constraint) < 0) {
                            basedOn.push(constraint);
                        }
                    }
                    if (basedOn.length > 0 || constraints.length === 0) {
                        var keys      = this.withKeys.getKeys(clazz, basedOn, name),
                            component = $component(keys).boundTo(clazz);
                        if (_configuration) {
                            _configuration(component);
                        }
                        return component;
                    }
                },
                register: function(container, composer) {
                    return from.register(container, composer);
                }
            });
        }
    });

    /**
     * Fluent builder for identifying component key(s).
     * @class KeyBuilder
     * @constructor
     * @param  {miruken.ioc.BasedOnBuilder}  basedOn  -  based on builder
     * @extends Base
     */            
    var KeyBuilder = Base.extend({
        constructor: function (basedOn) {
            var _keySelector;
            this.extend({
                /**
                 * Uses the component class as the key.
                 * @method self
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                self: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push(clazz);
                    });
                },
                /**
                 * Uses the based on contraints as the keys.
                 * @method basedOn
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                basedOn: function () {
                    return selectKeys(function (keys, clazz, constraints) {
                        keys.push.apply(keys, constraints);
                    });
                },
                /**
                 * Uses any class {{#crossLink "miruken.Protocol"}}{{/crossLink}} as the key.
                 * @method anyService
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                anyService: function () {
                    return selectKeys(function (keys, clazz) {
                        var services = clazz.$meta.getAllProtocols();
                        if (services.length > 0) {
                            keys.push(services[0]);
                        }
                    });
                },
                /**
                 * Uses all class {{#crossLink "miruken.Protocol"}}{{/crossLink}} as the keys.
                 * @method allServices
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                allServices: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push.apply(keys, clazz.$meta.getAllProtocols());
                    });
                },
                /**
                 * Uses the most specific {{#crossLink "miruken.Protocol"}}{{/crossLink}} 
                 * in the class hierarchy as the key.
                 * @method mostSpecificService
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                mostSpecificService: function (service) {
                    return selectKeys(function (keys, clazz, constraints) {
                        if ($isProtocol(service)) {
                            _addMatchingProtocols(clazz, service, keys);
                        } else {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if ($isFunction(constraint)) {
                                    _addMatchingProtocols(clazz, constraint, keys);
                                }
                            }
                        }
                        if (keys.length === 0) {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if (constraint !== Base && constraint !== Object) {
                                    if ($isProtocol(constraint)) {
                                        if (constraint.adoptedBy(clazz)) {
                                            keys.push(constraint);
                                            break;
                                        }
                                    } else if (clazz === constraint ||
                                               clazz.prototype instanceof constraint) {
                                        keys.push(constraint);
                                        break;
                                    }
                                }
                            }
                        }
                    });
                },
                /**
                 * Uses a string as the component name.  
                 * If no name is provided, the default name will be used.
                 * @method name
                 * @param {string | Function}  [n]  -  name or function receiving default name
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */                
                name: function (n) {
                    return selectKeys(function (keys, clazz, constraints, name) {
                        if ($isNothing(n)) {
                            if (name) {
                                keys.push(name);
                            }
                        } else if ($isFunction(n)) {
                            if (name = n(name)) {
                                keys.push(String(name));
                            }
                        } else {
                            keys.push(String(n));
                        }
                    });
                },
                /**
                 * Gets the component keys to be registered as.
                 * @method getKeys
                 * @param {Function}  clazz           -  component class
                 * @param {Array}     ...constraints  -  initial constraints
                 * @param {string}    name            -  default name
                 * @returns {Array} component keys.
                 */                                
                getKeys: function (clazz, constraints, name) {
                    var keys = [];
                    if (_keySelector) {
                        _keySelector(keys, clazz, constraints, name);
                    }
                    if (keys.length > 0) {
                        return keys;
                    }
                }
            });

            function selectKeys(selector) {
                if (_keySelector) { 
                    var select   = _keySelector;
                    _keySelector = function (keys, clazz, constraints, name) {
                        select(keys, clazz, constraints, name);
                        selector(keys, clazz, constraints, name);
                    };
                } else {
                    _keySelector = selector;
                }
                return basedOn;
            }
        }
    });

    /**
     * Shortcut for creating a {{#crossLink "miruken.ioc.FromBuilder"}}{{/crossLink}}.
     * @method $classes
     * @param  {Any}    from        -  any source of classes.  Only Package is currently supported.
     * @param  {Array}  [...names]  -  optional member name filter
     * @return {miruken.ioc.FromBuilder} from builder.
     * @for miruken.ioc.$
     */        
    function $classes(from, names) {
        if (from instanceof Package) {
            return new FromPackageBuilder(from, names);
        }
        throw new TypeError(format("Unrecognized $classes from %1.", hint));
    }

    /**
     * Creates a {{#crossLink "miruken.ioc.FromBuilder"}}{{/crossLink}} using a Package source.
     * @method $classes.fromPackage
     * @param  {Package}  package
     * @param  {Array}    [...names]  -  optional member name filter
     * @for miruken.ioc.$
     */    
    $classes.fromPackage = function (package, names) {
        if (!(package instanceof Package)) {
            throw new TypeError(
                format("$classes expected a Package, but received %1 instead.", package));
        }
        return new FromPackageBuilder(package, names);
    };

    function _unregisterBatch(registrations) {
        return function () {
            for (var i = 0; i < registrations.length; ++i) {
                registrations[i]();
            }
        };
    }

    function _addMatchingProtocols(clazz, preference, matches) {
        var toplevel = _toplevelProtocols(clazz);
        for (var i = 0; i < toplevel.length; ++i) {
            var protocol = toplevel[i];
            if (protocol.$meta.getAllProtocols().indexOf(preference) >= 0) {
                matches.push(protocol);
            }
        }
    }

    function _toplevelProtocols(type) {
        var protocols = type.$meta.getAllProtocols(),
            toplevel  = protocols.slice(0);
        for (var i = 0; i < protocols.length; ++i) {
            var parents = protocols[i].$meta.getAllProtocols();
            for (var ii = 0; ii < parents.length; ++ii) {
                Array2.remove(toplevel, parents[ii]);
            }
        }
        return toplevel;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);
}

},{"../miruken.js":12,"./ioc.js":11,"bluebird":23}],10:[function(require,module,exports){
module.exports = require('./ioc.js');
require('./fluent.js');


},{"./fluent.js":9,"./ioc.js":11}],11:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../callback.js'),
              require('../context.js'),
              require('../validate');

new function () { // closure

    /**
     * Package providing dependency injection and inversion-of-control.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule ioc
     * @namespace miruken.ioc
     * @Class $
     */        
    miruken.package(this, {
        name:    "ioc",
        imports: "miruken,miruken.graph,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,Lifestyle,TransientLifestyle," +
                 "SingletonLifestyle,ContextualLifestyle,DependencyModifier,DependencyModel," +
                 "DependencyManager,DependencyPolicy,ComponentModel,ComponentBuilder," +
                 "ComponentModelError,IoContainer,DependencyResolution,DependencyResolutionError," +
                 "$component,$$composer,$container"
    });

    eval(this.imports);

    /**
     * Symbol for injecting composer dependency.<br/>
     * See {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}
     * @property {Object} $$composer
     * @for miruken.ioc.$
     */    
    var $$composer = {};
    
    /**
     * Modifier to request container dependency.<br/>
     * See {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}
     * @class $container
     * @extend miruken.Modifier
     */            
    var $container = $createModifier();
    
    /**
     * Shared proxy builder
     * @property {miruken.ProxyBuilder} proxyBuilder
     * @for miruken.ioc.$
     */            
    var $proxyBuilder = new ProxyBuilder;

    /**
     * Protocol for exposing container capabilities.
     * @class Container
     * @extends miruken.StrictProtocol
     * @uses miruken.Invoking
     * @uses miruken.Disposing
     */            
    var Container = StrictProtocol.extend(Invoking, Disposing, {
        /**
         * Registers on or more components in the container.
         * @method register
         * @param   {Arguments}  [...registrations]  -  registrations
         * @return {Function} function to unregister components.
         */
        register: function (/*registrations*/) {},
        /**
         * Adds a configured component to the container with policies.
         * @method addComponent
         * @param   {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param   {Array}                      [...policies]   -  component policies
         * @return {Function} function to remove component.
         */
        addComponent: function (componentModel, policies) {},
        /**
         * Resolves the component for the key.
         * @method resolve
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Object | Promise}  component satisfying the key.
         * @async
         */
        resolve: function (key) {},
        /**
         * Resolves all the components for the key.
         * @method resolveAll
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Array} components or promises satisfying the key.
         * @async
         */
        resolveAll: function (key) {}
    });

    /**
     * Protocol for registering components in a {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class Registration
     * @extends miruken.Protocol
     */                
    var Registration = Protocol.extend({
        /**
         * Encapsulates the regisration of one or more components in a container.
         * @method register
         * @param {miruken.ioc.Container}            container  -  container to register components
         * @param {miruken.callback.CallbackHandler} composer   -  composition handler
         * @return {Function} function to unregister components.
         */
         register: function (container, composer) {}
    });

     /**
     * Protocol for defining policies for a {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}}
     * @class ComponentPolicy
     * @extends miruken.Protocol
     */                
    var ComponentPolicy = Protocol.extend({
        /**
         * Applies the policy to the component model.
         * @method applyPolicy
         * @param  {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param  {Array}                      [...policies]   -  all known policies
         */
        applyPolicy: function (componentModel, policies) {},
        /**
         * Notifies the creation of a component.
         * @method componentCreated
         * @param  {Object} component     -  component instance
         * @param  {Object} dependencies  -  all resolved dependencies
         */        
        componentCreated: function (component, dependencies) {}
    });

    /**
     * DependencyModifier flags enum
     * @class DependencyModifier
     * @extends miruken.Enum
     */    
    var DependencyModifier = Enum({
        /**
         * No dependency modifiers.
         * @property {number} None
         */
        None: 0,
        /**
         * See {{#crossLink "miruken.Modifier/$use:attribute"}}{{/crossLink}}
         * @property {number} Use
         */
        Use: 1 << 0,
        /**
         * See {{#crossLink "miruken.Modifier/$lazy:attribute"}}{{/crossLink}}
         * @property {number} Lazy
         */
        Lazy: 1 << 1,
        /**
         * See {{#crossLink "miruken.Modifier/$every:attribute"}}{{/crossLink}}
         * @property {number} Every
         */
        Every: 1 << 2,
        /**
         * See {{#crossLink "miruken.Modifier/$eval:attribute"}}{{/crossLink}}
         * @property {number} Dynamic
         */
        Dynamic: 1 << 3,
        /**
         * See {{#crossLink "miruken.Modifier/$optional:attribute"}}{{/crossLink}}
         * @property {number} Optional
         */
        Optional: 1 << 4,
        /**
         * See {{#crossLink "miruken.Modifier/$promise:attribute"}}{{/crossLink}}
         * @property {number} Promise
         */
        Promise: 1 << 5,
        /**
         * See {{#crossLink "miruken.Modifier/$eq:attribute"}}{{/crossLink}}
         * @property {number} Invariant
         */
        Invariant: 1 << 6,
        /**
         * See {{#crossLink "miruken.ioc.$container"}}{{/crossLink}}
         * @property {number} Container
         */
        Container: 1 << 7,
        /**
         * See {{#crossLink "miruken.Modifier/$child:attribute"}}{{/crossLink}}
         * @property {number} Child
         */        
        Child: 1 << 8
        });

    /**
     * Describes a component dependency.
     * @class DependencyModel
     * @constructor
     * @param {Any} dependency  -  annotated dependency
     * @param {miruken.ioc.DependencyModifier} modifiers  -  dependency annotations
     * @extends Base
     */
    var DependencyModel = Base.extend({
        constructor: function (dependency, modifiers) {
            modifiers = +(modifiers || DependencyModifier.None);
            if (dependency instanceof Modifier) {
                if ($use.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Use;
                }
                if ($lazy.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Lazy;
                }
                if ($every.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Every;
                }
                if ($eval.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Dynamic;
                }
                if ($child.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Child;
                }
                if ($optional.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Optional;
                }
                if ($promise.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Promise;
                }
                if ($container.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Container;
                }
                if ($eq.test(dependency)) {
                    modifiers = modifiers | DependencyModifier.Invariant;
                }
                dependency = Modifier.unwrap(dependency);
            }
            this.extend({
                /**
                 * Gets the dependency.
                 * @property {Any} dependency
                 * @readOnly
                 */                            
                get dependency() { return dependency; },
                /**
                 * Gets the dependency flags.
                 * @property {miruken.ioc.DependencyModifier} modifiers
                 * @readOnly
                 */                        
                get modifiers() { return modifiers; }
            });
        },
        /**
         * Tests if the receiving dependency is annotated with the modifier.
         * @method test
         * @param   {miruken.ioc.DependencyModifier}  modifier  -  modifier flags
         * @returns {boolean} true if the dependency is annotated with modifier(s).
         */        
        test: function (modifier) {
            return (this.modifiers & modifier) === +modifier;
        }
    }, {
        coerce: function (object) {
           return (object === undefined) ? undefined : new DependencyModel(object);
        }
    });

    /**
     * Manages an array of dependencies.
     * @class DependencyManager
     * @constructor
     * @param {Array} dependencies  -  dependencies
     * @extends miruken.ArrayManager
     */
    var DependencyManager = ArrayManager.extend({
        constructor: function (dependencies) {
            this.base(dependencies);
        },
        mapItem: function (item) {
            return !(item !== undefined && item instanceof DependencyModel) 
                 ? DependencyModel(item) 
                 : item;
        }                         
    });

    /**
     * Policy for extracting dependencies from a component model.
     * @class DependencyPolicy
     * @uses miruken.ioc.ComponentPolicy
     * @extends Base
     */
    var DependencyPolicy = Base.extend(ComponentPolicy, {
        applyPolicy: function (componentModel, policies) {
            // Dependencies will be merged from inject definitions
            // starting from most derived unitl no more remain or the
            // current definition is fully specified (no undefined).
            var dependencies = componentModel.getDependencies();
            if (dependencies && !Array2.contains(dependencies, undefined)) {
                return;
            }
            var clazz = componentModel.implementation;
            componentModel.manageDependencies(function (manager) {
                while (clazz && (clazz !== Base)) {
                    var injects = [clazz.prototype.$inject, clazz.prototype.inject,
                                   clazz.$inject, clazz.inject];
                    for (var i = 0; i < injects.length; ++i) {
                        var inject = injects[i];
                        if (inject !== undefined) {
                            if ($isFunction(inject)) {
                                inject = inject();
                            }
                            manager.merge(inject);
                            if (!Array2.contains(inject, undefined)) {
                                return;
                            }
                        }
                    }
                    clazz = $ancestorOf(clazz);
                }
            });
        }
    });

    /**
     * Describes a component to be managed by a {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class ComponentModel
     * @constructor
     * @extends Base
     */
    var ComponentModel = Base.extend($validateThat, {
        constructor: function () {
            var _key, _implementation, _lifestyle, _factory,
                _invariant = false, _burden = {};
            this.extend({
                /**
                 * Gets/sets the component key.
                 * @property {Any} key
                 */
                get key() { return _key || _implementation },
                set key(value) { _key = value; },
                /**
                 * Gets/sets the component class.
                 * @property {Functon} implementation
                 */
                get implementation() {
                    var impl = _implementation;
                    if (!impl && $isClass(_key)) {
                        impl = _key;
                    }
                    return impl;
                },
                set implementation(value) {
                    if ($isSomething(value) && !$isClass(value)) {
                        throw new TypeError(format("%1 is not a class.", value));
                    }
                    _implementation = value;
                },
                /**
                 * Gets/sets if component is invariant.
                 * @property {boolean} invariant
                 */                                                
                get invariant () { return _invariant; },
                set invariant(value) { _invariant = !!value; },
                /**
                 * Gets/sets the component lifestyle.
                 * @property {miruken.ioc.Lifestyle} lifestyle
                 */
                get lifestyle() { return _lifestyle; },
                set lifestyle(value) {
                    if (!$isSomething(value) && !(value instanceof Lifestyle)) {
                        throw new TypeError(format("%1 is not a Lifestyle.", value));
                    }
                    _lifestyle = value; 
                },
                /**
                 * Gets/sets the component factory.
                 * @property {Function} factory
                 */
                get factory() {
                    var factory = _factory,
                        clazz   = this.implementation;
                    if (!factory) {
                        var interceptors = _burden[Facet.Interceptors];
                        if (interceptors && interceptors.length > 0) {
                            var types = [];
                            if (clazz) {
                                types.push(clazz);
                            }
                            if ($isProtocol(_key)) {
                                types.push(_key);
                            }
                            return _makeProxyFactory(types);
                        } else if (clazz) {
                            return _makeClassFactory(clazz);
                        }
                    }
                    return factory;
                },
                set factory(value) {
                    if ($isSomething(value) && !$isFunction(value)) {
                        throw new TypeError(format("%1 is not a function.", value));
                    }
                    _factory = value;
                },
                /**
                 * Gets the component dependency group.
                 * @method getDependencies
                 * @param   {string} [key=Facet.Parameters]  -  dependency group  
                 * @returns {Array}  group dependencies.
                 */                
                getDependencies: function (key) { 
                    return _burden[key || Facet.Parameters];
                },
                /**
                 * Sets the component dependency group.
                 * @method setDependencies
                 * @param {string} [key=Facet.Parameters]  -  dependency group  
                 * @param {Array}  value                   -  group dependenies.
                 */                
                setDependencies: function (key, value) {
                    if (arguments.length === 1) {
                        value = key, key = Facet.Parameters;
                    }
                    if ($isSomething(value) && !$isArray(value)) {
                        throw new TypeError(format("%1 is not an array.", value));
                    }
                    _burden[key] = Array2.map(value, DependencyModel);
                },
                /**
                 * Manages the component dependency group.
                 * @method manageDependencies
                 * @param  {string}   [key=Facet.Parameters]  -  dependency group  
                 * @param  {Function} actions  -  function accepting miruken.ioc.DependencyManager
                 * @return {Array} dependency group.
                 */                                
                manageDependencies: function (key, actions) {
                    if (arguments.length === 1) {
                        actions = key, key = Facet.Parameters;
                    }
                    if ($isFunction(actions)) {
                        var dependencies = _burden[key],
                            manager      = new DependencyManager(dependencies);
                        actions(manager);
                        var dependencies = manager.getItems();
                        if (dependencies.length > 0) {
                            _burden[key] = dependencies;
                        }
                    }
                    return dependencies;
                },
                /**
                 * Gets the component dependency burden.
                 * @property {Object} burden
                 * @readOnly
                 */                                
                get burden() { return _burden; }
            });
        },
        $validateThat: {
            keyCanBeDetermined: function (validation) {
                if (!this.key) {
                    validation.results.addKey('key').addError('required', { 
                        message: 'Key could not be determined for component.' 
                    });
                }
            },
            factoryCanBeDetermined: function (validation) {
                if (!this.factory) {
                    validation.results.addKey('factory').addError('required', { 
                        message: 'Factory could not be determined for component.' 
                    });
                }
            }
        }
    });

    function _makeClassFactory(clazz) {
        return function (burden) {
            return clazz.new.apply(clazz, burden[Facet.Parameters]);
        }
    }

    function _makeProxyFactory(types) {
        var proxy = $proxyBuilder.buildProxy(types);
        return function (burden) {
            return proxy.new.call(proxy, burden);
        }
    }

    /**
     * Manages the creation and destruction of components.
     * @class Lifestyle
     * @extends Base
     * @uses miruken.ioc.ComponentPolicy
     * @uses miruken.DisposingMixin
     * @uses miruken.Disposing
     */
    var Lifestyle = Base.extend(ComponentPolicy, Disposing, DisposingMixin, {
        /**
         * Obtains the component instance.
         * @method resolve
         * @returns {Object} component instance.
         */
        resolve: function (factory) {
            var instance = factory();
            if ($isPromise(instance)) {
                return instance.then(function (instance) {
                    if ($isFunction(instance.initialize)) {
                        var init = instance.initialize();
                        if ($isPromise(init)) {
                            return init.then(function () {
                                return instance;
                            });
                        }
                    }
                    return instance;
                });                
            } else if ($isFunction(instance.initialize)) {
                var init = instance.initialize();
                if ($isPromise(init)) {
                    return init.then(function () {
                        return instance;
                    });
                }
            }
            return instance;            
        },
        /**
         * Tracks the component instance for disposal.
         * @method trackInstance
         * @param {Object} instance  -  component instance.
         */        
        trackInstance: function (instance) {
            if (instance && $isFunction(instance.dispose)) {
                var _this = this;
                instance.extend({
                    dispose: function (disposing) {
                        if (disposing || _this.disposeInstance(instance, true)) {
                            this.base();
                            this.dispose = this.base;
                        }
                    }
                });
            }
        },
        /**
         * Disposes the component instance.
         * @method disposeInstance
         * @param {Object}  instance   -  component instance.
         * @param {boolean} disposing  -  true if being disposed.  
         */                
        disposeInstance: function (instance, disposing) {
            if (!disposing && instance && $isFunction(instance.dispose)) {
                instance.dispose(true);
            }
            return !disposing;
        },
        applyPolicy: function (componentModel, policies) {
            componentModel.lifestyle = this;
        }
    });

   /**
     * Lifestyle for creating new untracked component instances.
     * @class TransientLifestyle
     * @extends miruken.ioc.Lifestyle
     */
    var TransientLifestyle = Lifestyle.extend();

   /**
     * Lifestyle for managing a single instance of a component.
     * @class SingletonLifestyle
     * @constructor
     * @param {Object} [instance]  -  existing component instance
     * @extends miruken.ioc.Lifestyle
     */
    var SingletonLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
                resolve: function (factory) {
                    if (!instance) {
                        var object = this.base(factory);
                        if ($isPromise(object)) {
                            var _this = this;
                            return object.then(function (object) {
                                // Only cache fulfilled instances
                                if (!instance && object) {
                                    instance = object;
                                    _this.trackInstance(instance);
                                }
                                return instance;
                            });
                        } else if (object) {
                            instance = object;
                            this.trackInstance(instance)
                        }
                    }
                    return instance;
                },
                disposeInstance: function (obj, disposing) {
                    // Singletons cannot be disposed directly
                    if (!disposing && (obj === instance)) {
                        if (this.base(obj, disposing)) {
                           instance = undefined;
                           return true;
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    this.disposeInstance(instance);
                }
            });
        }
    });

   /**
     * Lifestyle for managing instances scoped to a {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextualLifestyle
     * @constructor
     * @extends miruken.ioc.Lifestyle
     */
    var ContextualLifestyle = Lifestyle.extend({
        constructor: function () {
            var _cache = {};
            this.extend({
                resolve: function (factory, composer) {
                    var context = composer.resolve(Context);
                    if (context) {
                        var id       = context.id,
                            instance = _cache[id];
                        if (!instance) {
                            var object = factory();
                            if ($isPromise(object)) {
                                var _this = this;
                                return object.then(function (object) {
                                    // Only cache fulfilled instances
                                    if (object && !(instance = _cache[id])) {
                                        instance = object;
                                        return _this._recordInstance(id, instance, context);
                                    }
                                    return instance;
                                });
                            } else if (object) {
                                instance = object;
                                return this._recordInstance(id, instance, context);
                            }
                        }
                        return instance;
                    }
                },
                _recordInstance: function (id, instance, context) {
                    var _this      = this;
                        init       = instance,
                        _cache[id] = instance;
                    ContextualHelper.bindContext(instance, context);
                    if ($isFunction(instance.initialize)) {
                        init = instance.initialize();
                        init = $isPromise(init)
                             ? init.then(function () { return instance; })
                             : instance;
                    }                                        
                    this.trackInstance(instance);
                    context.onEnded(function () {
                        instance.context = null;
                        _this.disposeInstance(instance);
                        delete _cache[id];
                    });
                    return init;
                },
                disposeInstance: function (instance, disposing) {
                    if (!disposing) {  // Cannot be disposed directly
                        for (contextId in _cache) {
                            if (_cache[contextId] === instance) {
                                this.base(instance, disposing);
                                delete _cache[contextId];
                                return true;
                            } 
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    for (contextId in _cache) {
                        this.disposeInstance(_cache[contextId]);
                    }
                    _cache = {};
                }
            });
        }
    });

    /**
     * Builds {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} using fluent api.
     * @class ComponentBuilder
     * @constructor
     * @extends Base
     * @uses miruken.ioc.Registration
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel,
                _newInContext, _newInChildContext,
                _policies = [];
            _componentModel.key = key;
            this.extend({
                /**
                 * Marks the component as invariant.
                 * @method invariant
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */
                invariant: function () {
                    _componentModel.setInvariant();
                    return this;
                },
                /**
                 * Specifies the component class.
                 * @method boundTo
                 * @param {Function} value  - component class
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                
                boundTo: function (clazz) {
                    _componentModel.implementation = clazz;
                    return this;
                },
                /**
                 * Specifies component dependencies.
                 * @method dependsOn
                 * @param  {Argument} arguments  -  dependencies
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                dependsOn: function (/* dependencies */) {
                    var dependencies;
                    if (arguments.length === 1 && $isArray(arguments[0])) {
                        dependencies = arguments[0];
                    } else if (arguments.length > 0) {
                        dependencies = Array.prototype.slice.call(arguments);
                    }
                    _componentModel.setDependencies(dependencies);
                    return this;
                },
                /**
                 * Specifies the component factory.
                 * @method usingFactory
                 * @param {Function} value  - component factory
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                usingFactory: function (factory) {
                    _componentModel.factory = factory;
                    return this;
                },
                /**
                 * Uses the supplied component instance.
                 * @method instance
                 * @param {Object} instance  - component instance
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                instance: function (instance) {
                    _componentModel.lifestyle = new SingletonLifestyle(instance);
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.SingletonLifestyle"}}{{/crossLink}}.
                 * @method singleon
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */
                singleton: function () {
                    _componentModel.lifestyle = new SingletonLifestyle;
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.TransientLifestyle"}}{{/crossLink}}.
                 * @method transient
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                
                transient: function () {
                    _componentModel.lifestyle = new TransientLifestyle;
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.ContextualLifestyle"}}{{/crossLink}}.
                 * @method contextual
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                contextual: function () {
                    _componentModel.lifestyle = new ContextualLifestyle;
                    return this;
                },
                /**
                 * Binds the component to the current 
                 * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
                 * @method newInContext
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                newInContext: function () {
                    _newInContext = true;
                    return this;
                },
                /**
                 * Binds the component to a child of the current 
                 * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
                 * @method newInContext
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                                
                newInChildContext: function () {
                    _newInChildContext = true;
                    return this;
                },
                /**
                 * Attaches component interceptors.
                 * @method interceptors
                 * @param  {Argument} arguments  -  interceptors
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                interceptors: function (/* interceptors */) {
                    var interceptors = (arguments.length === 1 && $isArray(arguments[0]))
                                     ? arguments[0]
                                     : Array.prototype.slice.call(arguments);
                    return new InterceptorBuilder(this, _componentModel, interceptors);
                },
                /**
                 * Gets the {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}} of type policyClass.
                 * @method getPolicy
                 * @param   {Function}  policyClass  -  type of policy to get
                 * @returns {miruken.ioc.ComponentPolicy} policy of type PolicyClass
                 */            
                getPolicy: function (policyClass) {
                    for (var i = 0; i < _policies.length; ++i) {
                        var policy = _policies[i];
                        if (policy instanceof policyClass) {
                            return policy;
                        }
                    }
                },
                /**
                 * Attaches a {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}} to the model.
                 * @method addPolicy
                 * @param   {miruken.ioc.ComponentPolicy}  policy  -  policy
                 * @returns {boolean} true if policy was added, false if policy type already attached.
                 */            
                addPolicy: function (policy) {
                    if (this.getPolicy($classOf(policy))) {
                        return false;
                    }
                    _policies.push(policy);
                    return true;
                },
                register: function (container) {
                    if ( _newInContext || _newInChildContext) {
                        var factory = _componentModel.factory;
                        _componentModel.factory = function (dependencies) {
                            var object  = factory(dependencies),
                                context = this.resolve(Context);
                            if (_newInContext) {
                                ContextualHelper.bindContext(object, context);
                            } else {
                                ContextualHelper.bindChildContext(context, object);
                            }
                            return object;
                        };
                    }
                    return container.addComponent(_componentModel, _policies);
                }
            });
        }
    });

    /**
     * Builds {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} interceptors using fluent api.
     * @class InterceptorBuilder
     * @constructor
     * @param {miruken.ioc.ComponentBuilder}  component       -  component builder
     * @param {miruken.ioc.ComponentModel}    componentModel  -  component model
     * @param {Array}                         interceptors    -  component interceptors
     * @extends Base
     * @uses miruken.ioc.Registration
     */
    var InterceptorBuilder = Base.extend(Registration, {
        constructor: function (component, componentModel, interceptors) {
            this.extend({
                selectWith: function (selectors) {
                    componentModel.manageDependencies(Facet.InterceptorSelectors, function (manager) {
                        Array2.forEach(selectors, function (selector) {
                            if (selector instanceof InterceptorSelector) {
                                selecter = $use(selector);
                            }
                            manager.append(selector);
                        });
                    });
                    return this;
                },
                /**
                 * Marks interceptors to be added to the front of the list.
                 * @method toFront
                 * @returns {miruken.ioc.InterceptorBuilder} builder
                 * @chainable
                 */            
                toFront: function () {
                    return this.atIndex(0);
                },
                /**
                 * Marks interceptors to be added at the supplied index.
                 * @method atIndex
                 * @param {number}  index  -  index to add interceptors at
                 * @returns {miruken.ioc.InterceptorBuilder} builder
                 * @chainable
                 */            
                atIndex: function (index) {
                    componentModel.manageDependencies(Facet.Interceptors, function (manager) {
                        Array2.forEach(interceptors, function (interceptor) {
                            manager.insertIndex(index, interceptor);
                        });
                    });
                    return componentModel;
                },
                register: function(container, composer) {
                    componentModel.manageDependencies(Facet.Interceptors, function (manager) {
                        manager.append(interceptors);
                    });
                    return component.register(container, composer);
                }
            });
        }
    });

    /**
     * Shortcut for creating a {{#crossLink "miruken.ioc.ComponentBuilder"}}{{/crossLink}}.
     * @method $component
     * @param   {Any} key - component key
     * @return  {miruken.ioc.ComponentBuilder} component builder.
     * @for miruken.ioc.$
     */    
    function $component(key) {
        return new ComponentBuilder(key);
    }

    /**
     * Specialized {{#crossLink "miruken.callback.Resolution"}}{{/crossLink}}
     * that maintains a parent relationship for representing resolution chains.
     * @class DependencyResolution
     * @constructor
     * @param   {string}                             key     -  resolution key
     * @param   {miruken.ioc.DependencyResolution}   parent  -  parent resolution
     * @param   {boolean}                            many    -  resolution cardinality
     * @extends miruken.callback.Resolution
     */
    var DependencyResolution = Resolution.extend({
        constructor: function (key, parent, many) {
            var _class, _handler;
            this.base(key, many);
            this.extend({
                claim: function (handler, clazz) { 
                    if (this.isResolvingDependency(handler)) {
                        return false;
                    }
                    _handler = handler;
                    _class   = clazz;
                    return true;
                },
                /**
                 * Determines if the handler is in the process of resolving a dependency.
                 * @method isResolvingDependency
                 * @param   {Function}  handler  -  dependency handler
                 * @returns {boolean} true if resolving a dependency, false otherwise.
                 */                
                isResolvingDependency: function (handler) {
                    return (handler === _handler)
                        || (parent && parent.isResolvingDependency(handler))
                },
                /**
                 * Formats the dependency resolution chain for display.
                 * @method formattedDependencyChain
                 * @returns {string} formatted dependency resolution chain.
                 */                
                formattedDependencyChain: function () {
                    var invariant  = $eq.test(key),
                        rawKey     = Modifier.unwrap(key),
                        keyDisplay = invariant ? ('`' + rawKey + '`') : rawKey,
                        display    = _class ? ("(" + keyDisplay + " <- " + _class + ")") : keyDisplay;
                    return parent 
                         ? (display + " <= " + parent.formattedDependencyChain())
                         : display;
                }
            });
        }
    });

    /**
     * Records a dependency resolution failure.
     * @class DependencyResolutionError
     * @constructor
     * @param {miruken.ioc.DependencyResolution} dependency  -  failing dependency
     * @param {string}                           message     -  error message
     * @extends Error
     */
    function DependencyResolutionError(dependency, message) {
        /**
         * Gets the error message.
         * @property {string} message
         */
        this.message = message;
        /**
         * Gets the failing dependency resolution.
         * @property {miruken.ioc.DependencyResolution} dependency
         */
        this.dependency = dependency;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    DependencyResolutionError.prototype             = new Error;
    DependencyResolutionError.prototype.constructor = DependencyResolutionError;

    /**
     * Identifies an invalid {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}}.
     * @class ComponentModelError
     * @constructor
     * @param {miruken.ioc.ComponentModel}        componentModel     -  invalid component model
     * @param {miruken.validate.ValidationResult} validationResults  -  validation results
     * @param {string}                            message            -  error message
     * @extends Error
     */
    function ComponentModelError(componentModel, validationResults, message) {
        /**
         * Gets the error message.
         * @property {string} message
         */
        this.message = message || "The component model contains one or more errors";
        /**
         * Gets the invalid component model.
         * @property {miruken.ioc.ComponentModel} componentModel
         */         
        this.componentModel = componentModel;
        /**
         * Gets the failing validation results.
         * @property {miruken.validate.ValidationResult} validationResults
         */         
        this.validationResults = validationResults;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    ComponentModelError.prototype             = new Error;
    ComponentModelError.prototype.constructor = ComponentModelError;

    var DEFAULT_POLICIES = [ new DependencyPolicy ];
    
    /**
     * Default Inversion of Control {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class IoContainer
     * @constructor
     * @extends CallbackHandler
     * @uses miruken.ioc.Container
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            this.extend({
                addComponent: function (componentModel, policies) {
                    policies  = DEFAULT_POLICIES.concat(policies || []);
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.applyPolicy)) {
                            policy.applyPolicy(componentModel, policies);
                        }
                    }
                    var validation = Validator($composer).validate(componentModel);
                    if (!validation.valid) {
                        throw new ComponentModelError(componentModel, validation);
                    }
                    return this.registerHandler(componentModel, policies); 
                }
            })
        },
        register: function (/*registrations*/) {
            return Array2.flatten(arguments).map(function (registration) {
                return registration.register(this, $composer);
            }.bind(this));
        },
        registerHandler: function (componentModel, policies) {
            var key       = componentModel.key,
                clazz     = componentModel.implementation,
                lifestyle = componentModel.lifestyle || new SingletonLifestyle,
                factory   = componentModel.factory,
                burden    = componentModel.burden;
            key = componentModel.invariant ? $eq(key) : key;
            return _registerHandler(this, key, clazz, lifestyle, factory, burden, policies); 
        },
        invoke: function (fn, dependencies, ctx) {
            var inject  = fn.$inject,
                manager = new DependencyManager(dependencies);
            if (inject) {
                if ($isFunction(inject)) {
                    inject = inject();
                }
                manager.merge(inject);
            }
            dependencies = manager.getItems();
            if (dependencies.length > 0) {
                var burden = { d:  dependencies };
                deps = _resolveBurden(burden, true, null, $composer);
                return fn.apply(ctx, deps.d);
            }
            return fn();
        },
        dispose: function () {
            $provide.removeAll(this);
        }
    });

    function _registerHandler(container, key, clazz, lifestyle, factory, burden, policies) {
        return $provide(container, key, function handler(resolution, composer) {
            if (!(resolution instanceof DependencyResolution)) {
                resolution = new DependencyResolution(resolution.key);
            }
            if (!resolution.claim(handler, clazz)) {  // cycle detected
                return $NOT_HANDLED;
            }
            return lifestyle.resolve(function () {
                var instant      = $instant.test(resolution.key),
                    dependencies = _resolveBurden(burden, instant, resolution, composer);
                return $isPromise(dependencies)
                     ? dependencies.then(createComponent)
                     : createComponent();
                function createComponent() {
                    var component = factory.call(composer, dependencies);
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.componentCreated)) {
                            policy.componentCreated(component, dependencies);
                        }
                    }                    
                    return component;
                }
            }, composer);
        }, lifestyle.dispose.bind(lifestyle));
    }

    function _resolveBurden(burden, instant, resolution, composer) {
        var promises     = [],
            dependencies = {},
            containerDep = Container(composer);
        for (var key in burden) {
            var group = burden[key];
            if ($isNothing(group)) {
                continue;
            }
            var resolved = group.slice(0);
            for (var index = 0; index < resolved.length; ++index) {
                var dep = resolved[index];
                if (dep === undefined) {
                    continue;
                }
                var use        = dep.test(DependencyModifier.Use),
                    lazy       = dep.test(DependencyModifier.Lazy),
                    promise    = dep.test(DependencyModifier.Promise),
                    child      = dep.test(DependencyModifier.Child),
                    dynamic    = dep.test(DependencyModifier.Dynamic),
                    dependency = dep.dependency;
                if (use || dynamic || $isNothing(dependency)) {
                    if (dynamic && $isFunction(dependency)) {
                        dependency = dependency(containerDep);
                    }
                    if (child) {
                        dependency = _createChild(dependency);
                    }
                    if (promise) {
                        dependency = Promise.resolve(dependency);
                    }
                } else if (dependency === $$composer) {
                    dependency = composer;
                } else if (dependency === Container) {
                    dependency = containerDep;
                } else {
                    var all           = dep.test(DependencyModifier.Every),
                        optional      = dep.test(DependencyModifier.Optional),
                        invariant     = dep.test(DependencyModifier.Invariant),
                        fromContainer = dep.test(DependencyModifier.Container);
                    if (invariant) {
                        dependency = $eq(dependency);
                    }
                    if (instant) {
                        dependency = $instant(dependency);
                    }
                    if (lazy) {
                        dependency = (function (paramDep, created, param) {
                            return function () {
                                if (!created) {
                                    created = true;
                                    var container = fromContainer ? containerDep : composer;
                                    param = _resolveDependency(paramDep, false, promise, child, all, container);
                                }
                                return param;
                            };
                        })(dependency);
                    } else {
                        var paramDep  = new DependencyResolution(dependency, resolution, all),
                            container = fromContainer ? containerDep : composer;
                        dependency = _resolveDependency(paramDep, !optional, promise, child, all, container);
                        if (!promise && $isPromise(dependency)) {
                            promises.push(dependency);
                            (function (paramPromise, paramSet, paramIndex) {
                                paramPromise.then(function (param) {
                                    paramSet[paramIndex] = param;
                                });
                            })(dependency, resolved, index);
                        }
                    }
                }
                resolved[index] = dependency;
            }
            dependencies[key] = resolved;
        }
        if (promises.length === 1) {
            return promises[0].then(function () {
                return dependencies;
            });
        } else if (promises.length > 1) {
            return Promise.all(promises).then(function () {
                return dependencies;
            });
        }
        return dependencies;
    }
    
    function _resolveDependency(dependency, required, promise, child, all, composer) {
        var result = all ? composer.resolveAll(dependency) : composer.resolve(dependency);
        if (result === undefined) {
            if (required) {
                var error = new DependencyResolutionError(dependency,
                       format("Dependency %1 could not be resolved.",
                              dependency.formattedDependencyChain()));
                if ($instant.test(dependency.key)) {
                    throw error;
                }
                return Promise.reject(error);
            }
            return result;
        } else if (child && !all) {
            result = $isPromise(result) 
                 ? result.then(function (parent) { return _createChild(parent); })
                 : _createChild(result)
        }
        return promise ? Promise.resolve(result) : result;
    }

    function _createChild(parent) {
        if (!(parent && $isFunction(parent.newChild))) {
            throw new Error(format(
                "Child dependency requested, but %1 is not a parent.", parent));
        }
        return parent.newChild();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}

},{"../callback.js":4,"../context.js":5,"../miruken.js":12,"../validate":20,"bluebird":23}],12:[function(require,module,exports){
(function (global){
require('./base2.js');

new function () { // closure

    /**
     * Package containing enhancements to the javascript language.
     * @module miruken
     * @namespace miruken
     * @main miruken
     * @class $
     */
    base2.package(this, {
        name:    "miruken",
        version: "0.0.81",
        exports: "Enum,Flags,Variance,Protocol,StrictProtocol,Delegate,Miruken,MetaStep,MetaMacro," +
                 "Initializing,Disposing,DisposingMixin,Resolving,Invoking,Parenting,Starting,Startup," +
                 "Facet,Interceptor,InterceptorSelector,ProxyBuilder,Modifier,ArrayManager,IndexedList," +
                 "$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isArray," +
                 "$isPromise,$isNothing,$isSomething,$using,$lift,$equals,$decorator,$decorate,$decorated," +
                 "$debounce,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant," +
                 "$createModifier,$properties,$inferProperties,$inheritStatic"
    });

    eval(this.imports);

    /**
     * Annotates invariance.
     * @attribute $eq
     * @for miruken.Modifier
     */
    var $eq = $createModifier();
    /**
     * Annotates use value as is.
     * @attribute $use
     * @for miruken.Modifier
     */    
    var $use = $createModifier();
    /**
     * Annotates copy semantics.
     * @attribute $copy
     * @for miruken.Modifier
     */        
    var $copy = $createModifier();
    /**
     * Annotates lazy semantics.
     * @attribute $lazy
     * @for miruken.Modifier
     */            
    var $lazy = $createModifier();
    /**
     * Annotates function to be evaluated.
     * @attribute $eval
     * @for miruken.Modifier
     */                
    var $eval = $createModifier();
    /**
     * Annotates zero or more semantics.
     * @attribute $every
     * @for miruken.Modifier
     */                    
    var $every = $createModifier();
    /**
     * Annotates 
     * @attribute use {{#crossLink "miruken.Parenting"}}{{/crossLink}} protocol.
     * @attribute $child
     * @for miruken.Modifier
     */                        
    var $child  = $createModifier();
    /**
     * Annotates optional semantics.
     * @attribute $optional
     * @for miruken.Modifier
     */                        
    var $optional = $createModifier();
    /**
     * Annotates Promise expectation.
     * @attribute $promise
     * @for miruken.Modifier
     */                            
    var $promise = $createModifier();
    /**
     * Annotates synchronous.
     * @attribute $instant
     * @for miruken.Modifier
     */                                
    var $instant = $createModifier();
    
    /**
     * Defines an enumeration.
     * <pre>
     *    var Color = Enum({
     *        red:   1,
     *        green: 2,
     *        blue:  3
     *    })
     * </pre>
     * @class Enum
     * @constructor
     * @param  {Any}     value    -  enum value
     * @param  {string}  name     -  enum name
     * @param  {number}  ordinal  -  enum position
     */
    var Enum = Base.extend({
        constructor: function (value, name, ordinal) {
            this.constructing(value, name);
            Object.defineProperties(this, {
                "value": {
                    value:        value,
                    writable:     false,
                    configurable: false
                },
                "name": {
                    value:        name,
                    writable:     false,
                    configurable: false
                },
                "ordinal": {
                    value:        ordinal,
                    writable:     false,
                    configurable: false
                },
                
            });
        },
        toString: function () { return this.name; },
        constructing: function (value, name) {
            if (!this.constructor.__defining) {
                throw new TypeError("Enums cannot be instantiated.");
            }            
        }
    }, {
        coerce: function _(choices, behavior) {
            if (this !== Enum && this !== Flags) {
                return;
            }
            var en = this.extend(behavior, {
                coerce: function _(value) {
                    return this.fromValue(value);
                }
            });
            en.__defining = true;
            var items     = [], ordinal = 0;
            en.names      = Object.freeze(Object.keys(choices));
            for (var choice in choices) {
                var item = en[choice] = new en(choices[choice], choice, ordinal++);
                items.push(item);
            }
            en.items     = Object.freeze(items);
            en.fromValue = this.fromValue;
            delete en.__defining;
            return Object.freeze(en);
        },
        fromValue: function (value) {
            var names = this.names;
            for (var i = 0; i < names.length; ++i) {
                var e = this[names[i]];
                if (e.value == value) {
                    return e;
                }
            }
            throw new TypeError(format("%1 is not a valid value for this Enum.", value));
        }
    });
    Enum.prototype.valueOf = function () {
        var value = +this.value;
        return isNaN(value) ? this.ordinal : value;
    }

    /**
     * Defines a flags enumeration.
     * <pre>
     *    var DayOfWeek = Flags({
     *        Monday:     1 << 0,
     *        Tuesday:    1 << 1,
     *        Wednesday:  1 << 2,
     *        Thursday:   1 << 3,
     *        Friday:     1 << 4,
     *        Saturday:   1 << 5,
     *        Sunday:     1 << 6
     *    })
     * </pre>
     * @class Enum
     * @constructor
     * @param  {Any} value     -  flag value
     * @param  {string} value  -  flag name
     */    
    var Flags = Enum.extend({
        hasFlag: function (flag) {
            flag = +flag;
            return (this & flag) === flag;
        },
        addFlag: function (flag) {
            return $isSomething(flag)
                 ? this.constructor.fromValue(this | flag)
                 : this;
        },
        removeFlag: function (flag) {
            return $isSomething(flag)
                 ? this.constructor.fromValue(this & (~flag))
                 : this;
        },
        constructing: function (value, name) {}        
    }, {
        fromValue: function (value) {
            value = +value;
            var name, names = this.names;
            for (var i = 0; i < names.length; ++i) {
                var flag = this[names[i]];
                if (flag.value === value) {
                    return flag;
                }
                if ((value & flag.value) === flag.value) {
                    name = name ? (name + "," + flag.name) : flag.name;
                }
            }
            return new this(value, name);
        }
    });
                            
    /**
     * Variance enum
     * @class Variance
     * @extends miruken.Enum
     */
    var Variance = Enum({
        /**
         * Matches a more specific type than originally specified.
         * @property {number} Covariant
         */
        Covariant: 1,
        /**
         * Matches a more generic (less derived) type than originally specified.
         * @property {number} Contravariant
         */        
        Contravariant: 2,
        /**
         * Matches only the type originally specified.
         * @property {number} Invariant
         */        
        Invariant: 3
        });
    
    /**
     * Declares methods and properties independent of a class.
     * <pre>
     *    var Auditing = Protocol.extend({
     *        $properties: {
     *            level: undefined
     *        },
     *        record: function (activity) {}
     *    })
     * </pre>
     * @class Protocol
     * @constructor
     * @param   {miruken.Delegate}  delegate        -  delegate
     * @param   {boolean}           [strict=false]  -  true if strict, false otherwise
     * @extends Base
     */
    var Protocol = Base.extend({
        constructor: function (delegate, strict) {
            if ($isNothing(delegate)) {
                delegate = new Delegate;
            } else if ((delegate instanceof Delegate) === false) {
                if ($isFunction(delegate.toDelegate)) {
                    delegate = delegate.toDelegate();
                    if ((delegate instanceof Delegate) === false) {
                        throw new TypeError(format(
                            "Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one.", delegate));
                    }
                } else if ($isArray(delegate)) {
                    delegate = new ArrayDelegate(delegate);
                } else {
                    delegate = new ObjectDelegate(delegate);
                }
            }
            Object.defineProperty(this, 'delegate', { value: delegate });
            Object.defineProperty(this, 'strict', { value: !!strict });
        },
        __get: function (propertyName) {
            var delegate = this.delegate;
            return delegate && delegate.get(this.constructor, propertyName, this.strict);
        },
        __set: function (propertyName, propertyValue) {
            var delegate = this.delegate;            
            return delegate && delegate.set(this.constructor, propertyName, propertyValue, this.strict);
        },
        __invoke: function (methodName, args) {
            var delegate = this.delegate;                        
            return delegate && delegate.invoke(this.constructor, methodName, args, this.strict);
        }
    }, {
        conformsTo: False,        
        /**
         * Determines if the target is a {{#crossLink "miruken.Protocol"}}{{/crossLink}}.
         * @static
         * @method isProtocol
         * @param   {Any}      target    -  target to test
         * @returns {boolean}  true if the target is a Protocol.
         */
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        /**
         * Determines if the target conforms to this protocol.
         * @static
         * @method conformsTo
         * @param   {Any}      target    -  target to test
         * @returns {boolean}  true if the target conforms to this protocol.
         */
        adoptedBy: function (target) {
            return target && $isFunction(target.conformsTo)
                 ? target.conformsTo(this)
                 : false;
        },
        /**
         * Creates a protocol binding over the object.
         * @static
         * @method coerce
         * @param   {Object} object  -  object delegate
         * @returns {Object} protocol instance delegating to object. 
         */
        coerce: function (object, strict) { return new this(object, strict); }
    });

    /**
     * MetaStep enum
     * @class MetaStep
     * @extends Enum
     */
    var MetaStep = Enum({
        /**
         * Triggered when a new class is derived
         * @property {number} Subclass
         */
        Subclass: 1,
        /**
         * Triggered when an existing class is extended
         * @property {number} Implement
         */
        Implement: 2,
        /**
         * Triggered when an instance is extended
         * @property {number} Extend
         */
        Extend: 3
    });

    /**
     * Provides a method to modify a class definition at runtime.
     * @class MetaMacro
     * @extends Base
     */
    var MetaMacro = Base.extend({
        /**
         * Inflates the macro for the given step.
         * @method inflate
         * @param  {miruken.MetaStep}  step        -  meta step
         * @param  {miruken.MetaBase}  metadata    -  source metadata
         * @param  {Object}            target      -  target macro applied to
         * @param  {Object}            definition  -  updates to apply
         * @param  {Function}          expand      -  expanded definition
         */
        inflate: function (step, metadata, target, definition, expand) {},
        /**
         * Execite the macro for the given step.
         * @method execute
         * @param  {miruken.MetaStep}  step        -  meta step
         * @param  {miruken.MetaBase}  metadata    -  effective metadata
         * @param  {Object}            target      -  target macro applied to
         * @param  {Object}            definition  -  source to apply
         */
        execute: function (step, metadata, target, definition) {},
        /**
         * Triggered when a protocol is added to metadata.
         * @method protocolAdded
         * @param {miruken.MetaBase}  metadata  -  effective metadata
         * @param {miruken.Protocol}  protocol  -  protocol added
         */
        protocolAdded: function (metadata, protocol) {},
        /**
         * Extracts the property and evaluate it if a function.
         * @method extractProperty
         * @param    {string}  property  -  property name
         * @param    {Object}  target    -  owning target
         * @param    {Object}  source    -  definition source
         * @returns  {Any} property value.
         */                
        extractProperty: function (property, target, source) {
            var value = source[property];
            if ($isFunction(value)) {
                value = value();
            }
            delete target[property];            
            return value;
        },        
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} false
         */
        shouldInherit: False,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} false
         */
        isActive: False
    }, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Base class for all metadata.
     * @class MetaBase
     * @constructor
     * @param  {miruken.MetaBase}  [parent]  - parent meta-data
     * @extends miruken.MetaMacro
     */
    var MetaBase = MetaMacro.extend({
        constructor: function (parent)  {
            var _protocols = [], _descriptors;
            this.extend({
                /**
                 * Gets the parent metadata.
                 * @method getParent
                 * @returns {miruken.MetaBase} parent metadata if present.
                 */
                getParent: function () { return parent; },
                /**
                 * Gets the declared protocols.
                 * @method getProtocols
                 * @returns {Array} declared protocols.
                 */
                getProtocols: function () { return _protocols.slice(0) },
                /**
                 * Gets all conforming protocools.
                 * @method getAllProtocols
                 * @returns {Array} conforming protocols.
                 */
                getAllProtocols: function () {
                    var protocols = this.getProtocols(),
                        inner     = protocols.slice(0);
                    for (var i = 0; i < inner.length; ++i) {
                        var innerProtocols = inner[i].$meta.getAllProtocols();
                        for (var ii = 0; ii < innerProtocols.length; ++ii) {
                            var protocol = innerProtocols[ii];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        } 
                    }
                    return protocols;
                },
                /**
                 * Adds one or more protocols to the metadata.
                 * @method addProtocol
                 * @param  {Array}  protocols  -  protocols to add
                 */
                addProtocol: function (protocols) {
                    if ($isNothing(protocols)) {
                        return;
                    }
                    if (!$isArray(protocols)) {
                        protocols = Array.prototype.slice.call(arguments);
                    }
                    for (var i = 0; i < protocols.length; ++i) {
                        var protocol = protocols[i];
                        if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                            _protocols.push(protocol);
                            this.protocolAdded(this, protocol);
                        }
                    }
                },
                protocolAdded: function (metadata, protocol) {
                    if (parent) {
                        parent.protocolAdded(metadata, protocol);
                    }
                },
                /**
                 * Determines if the metadata conforms to the protocol.
                 * @method conformsTo
                 * @param  {miruken.Protocol}   protocol -  protocols to test
                 * @returns {boolean}  true if the metadata includes the protocol.
                 */
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    }
                    for (var index = 0; index < _protocols.length; ++index) {
                        var proto = _protocols[index];
                        if (protocol === proto || proto.conformsTo(protocol)) {
                            return true;
                        }
                    }
                    return false;
                },
                inflate: function (step, metadata, target, definition, expand) {
                    if (parent) {
                        parent.inflate(step, metadata, target, definition, expand);
                    } else if ($properties) {
                        $properties.shared.inflate(step, metadata, target, definition, expand)
                    }
                },
                execute: function (step, metadata, target, definition) {
                    if (parent) {
                        parent.execute(step, metadata, target, definition);
                    } else if ($properties) {
                        $properties.shared.execute(step, metadata, target, definition);
                    }
                },
                /**
                 * Defines a property on the metadata.
                 * @method defineProperty
                 * @param  {Object}   target        -  target receiving property
                 * @param  {string}   name          -  name of the property
                 * @param  {Object}   spec          -  property specification
                 * @param  {Object}   [descriptor]  -  property descriptor
                 */
                defineProperty: function(target, name, spec, descriptor) {
                    if (descriptor) {
                        descriptor = copy(descriptor);
                    }
                    if (target) {
                        Object.defineProperty(target, name, spec);
                    }
                    if (descriptor) {
                        this.addDescriptor(name, descriptor);
                    }
                },
                /**
                 * Gets the descriptor for one or more properties.
                 * @method getDescriptor
                 * @param    {Object|string}  filter  -  property selector
                 * @returns  {Object} aggregated property descriptor.
                 */
                getDescriptor: function (filter) {
                    var descriptors;
                    if ($isNothing(filter)) {
                        if (parent) {
                            descriptors = parent.getDescriptor(filter);
                        }
                        if (_descriptors) {
                            descriptors = extend(descriptors || {}, _descriptors);
                        }
                    } else if ($isString(filter)) {
                        return (_descriptors && _descriptors[filter])
                            || (parent && parent.getDescriptor(filter));
                    } else {
                        if (parent) {
                            descriptors = parent.getDescriptor(filter);
                        }
                        for (var key in _descriptors) {
                            var descriptor = _descriptors[key];
                            if (this.matchDescriptor(descriptor, filter)) {
                                descriptors = extend(descriptors || {}, key, descriptor);
                            }
                        }
                    }
                    return descriptors;
                },
                /**
                 * Sets the descriptor for a property.
                 * @method addDescriptor
                 * @param    {string}   name        -  property name
                 * @param    {Object}   descriptor  -  property descriptor
                 * @returns  {miruken.MetaBase} current metadata.
                 * @chainable
                 */
                addDescriptor: function (name, descriptor) {
                    _descriptors = extend(_descriptors || {}, name, descriptor);
                    return this;
                },
                /**
                 * Determines if the property descriptor matches the filter.
                 * @method matchDescriptor
                 * @param    {Object}   descriptor  -  property descriptor
                 * @param    {Object}   filter      -  matching filter
                 * @returns  {boolean} true if the descriptor matches, false otherwise.
                 */
                matchDescriptor: function (descriptor, filter) {
                    if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                        return false;
                    }
                    for (var key in filter) {
                        var match = filter[key];
                        if (match === undefined) {
                            if (!(key in descriptor)) {
                                return false;
                            }
                        } else {
                            var value = descriptor[key];
                            if ($isArray(match)) {
                                if (!($isArray(value))) {
                                    return false;
                                }
                                for (var i = 0; i < match.length; ++i) {
                                    if (value.indexOf(match[i]) < 0) {
                                        return false;
                                    }
                                }
                            } else if (!(value === match || this.matchDescriptor(value, match))) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                /**
                 * Binds a method to the parent if not present.
                 * @method linkBase
                 * @param    {Function}  method  -  method name
                 * @returns  {miruken.MetaBase} current metadata.
                 * @chainable
                 */
                linkBase: function (method) {
                    if (!this[method]) {
                        this.extend(method, function () {
                            var baseMethod = parent && parent[method];
                            if (baseMethod) {
                                return baseMethod.apply(parent, arguments);
                            }
                        });
                    }
                    return this;
                }
            });
        }
    });

    /**
     * Represents metadata describing a class.
     * @class ClassMeta
     * @constructor
     * @param   {miruken.MetaBase}  baseMeta   -  base meta data
     * @param   {Function}          subClass   -  associated class
     * @param   {Array}             protocols  -  conforming protocols
     * @param   {Array}             macros     -  class macros
     * @extends miruken.MetaBase
     */
    var ClassMeta = MetaBase.extend({
        constructor: function(baseMeta, subClass, protocols, macros)  {
            var _macros     = macros && macros.slice(0),
                _isProtocol = (subClass === Protocol)
                           || (subClass.prototype instanceof Protocol);
            this.base(baseMeta);
            this.extend({
                /**
                 * Gets the associated class.
                 * @method getClass
                 * @returns  {Function} class.
                 */                                
                getClass: function () { return subClass; },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                
                isProtocol: function () { return _isProtocol; },
                getAllProtocols: function () {
                    var protocols = this.base();
                    if (!_isProtocol && baseMeta) {
                        var baseProtocols = baseMeta.getAllProtocols();
                        for (var i = 0; i < baseProtocols.length; ++i) {
                            var protocol = baseProtocols[i];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        }
                    }
                    return protocols;
                },
                protocolAdded: function (metadata, protocol) {
                    this.base(metadata, protocol);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    for (var i = 0; i < _macros.length; ++i) {
                        macro = _macros[i];
                        if ($isFunction(macro.protocolAdded)) {
                            macro.protocolAdded(metadata, protocol);
                        }
                    }
                },
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    } else if ((protocol === subClass) || (subClass.prototype instanceof protocol)) {
                        return true;
                    }
                    return this.base(protocol) ||
                        !!(baseMeta && baseMeta.conformsTo(protocol));
                },
                inflate: function (step, metadata, target, definition, expand) {
                    this.base(step, metadata, target, definition, expand);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    var active = (step !== MetaStep.Subclass);
                    for (var i = 0; i < _macros.length; ++i) {
                        var macro = _macros[i];
                        if ($isFunction(macro.inflate) &&
                            (!active || macro.isActive()) && macro.shouldInherit()) {
                            macro.inflate(step, metadata, target, definition, expand);
                        }
                    }                    
                },
                execute: function (step, metadata, target, definition) {
                    this.base(step, metadata, target, definition);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    var inherit = (this !== metadata),
                        active  = (step !== MetaStep.Subclass);
                    for (var i = 0; i < _macros.length; ++i) {
                        var macro = _macros[i];
                        if ((!active  || macro.isActive()) &&
                            (!inherit || macro.shouldInherit())) {
                            macro.execute(step, metadata, target, definition);
                        }
                    }
                },
                /**
                 * Creates a sub-class from the current class metadata.
                 * @method createSubclass
                 * @returns  {Function} the newly created class function.
                 */                                                                
                createSubclass: function _() {
                    var args = Array.prototype.slice.call(arguments),
                        constraints = args, protocols, mixins, macros;
                    if (subClass.prototype instanceof Protocol) {
                        (protocols = []).push(subClass);
                    }
                    if (args.length > 0 && $isArray(args[0])) {
                        constraints = args.shift();
                    }
                    while (constraints.length > 0) {
                        var constraint = constraints[0];
                        if (!constraint) {
                            break;
                        } else if (constraint.prototype instanceof Protocol) {
                            (protocols || (protocols = [])).push(constraint);
                        } else if (constraint instanceof MetaMacro) {
                            (macros || (macros = [])).push(constraint);
                        } else if ($isFunction(constraint) && constraint.prototype instanceof MetaMacro) {
                            (macros || (macros = [])).push(new constraint);
                        } else if (constraint.prototype) {
                            (mixins || (mixins = [])).push(constraint);
                        } else {
                            break;
                        }
                        constraints.shift();
                    }
                    var empty        = _.u  || (_.u = {}),
                        classSpec    = _.cm || (_.cm = {
                            enumerable:   false,
                            configurable: false,
                            writable:     false,
                        }),
                        instanceSpec = _.im || (_.im = {
                            enumerable:   false,
                            configurable: false,
                            get:          ClassMeta.createInstanceMeta
                        }),
                        instanceDef  = args.shift() || empty,
                        staticDef    = args.shift() || empty;
                    this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                    if (macros) {
                        for (var i = 0; i < macros.length; ++i) {
                            macros[i].inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                        }
                    }
                    instanceDef  = expand.x || instanceDef;
                    var derived  = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                        metadata = new ClassMeta(this, derived, protocols, macros);
                    classSpec.value = metadata;
                    Object.defineProperty(derived, '$meta', classSpec);
                    Object.defineProperty(derived.prototype, '$meta', instanceSpec);
                    delete classSpec.value;
                    derived.conformsTo = metadata.conformsTo.bind(metadata);
                    metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                    if (mixins) {
                        Array2.forEach(mixins, derived.implement, derived);
                    }
                    function expand() {
                        return expand.x || (expand.x = Object.create(instanceDef));
                    }   
                    return derived;                    
                },
                /**
                 * Embellishes the class represented by this metadata.
                 * @method embellishClass
                 * @param   {Any} source  -  class function or object literal
                 * @returns {Function} the underlying class.
                 */
                embellishClass: function (source) {
                    if ($isFunction(source)) {
                        source = source.prototype; 
                    }
                    if ($isSomething(source)) {
                        this.inflate(MetaStep.Implement, this, subClass.prototype, source, expand);
                        source = expand.x || source;
                        ClassMeta.baseImplement.call(subClass, source);
                        this.execute(MetaStep.Implement, this, subClass.prototype, source);
                        function expand() {
                            return expand.x || (expand.x = Object.create(source));
                        };                    
                    }
                    return subClass;
                }
            });
            this.addProtocol(protocols);
        }
    }, {
        init: function () {
            this.baseExtend    = Base.extend;
            this.baseImplement = Base.implement;
            Base.$meta         = new this(undefined, Base);
            Abstract.$meta     = new this(Base.$meta, Abstract);            
            Base.extend = Abstract.extend = function () {
                return this.$meta.createSubclass.apply(this.$meta, arguments);
            };
            Base.implement = Abstract.implement = function () {
                return this.$meta.embellishClass.apply(this.$meta, arguments);                
            }
            Base.prototype.conformsTo = function (protocol) {
                return this.constructor.$meta.conformsTo(protocol);
            };
        },
        createInstanceMeta: function _(parent) {
            var spec = _.spec || (_.spec = {
                enumerable:   false,
                configurable: true,
                writable:     false
            });
            var metadata = new InstanceMeta(parent || this.constructor.$meta);
            spec.value = metadata;
            Object.defineProperty(this, '$meta', spec);
            delete spec.value;
            return metadata;            
        }
    });

    /**
     * Represents metadata describing an instance.
     * @class InstanceMeta
     * @constructor
     * @param   {miruken.ClassMeta}  classMeta  -  class meta-data
     * @extends miruken.MetaBase
     */
    var InstanceMeta = MetaBase.extend({
        constructor: function (classMeta) {
            this.base(classMeta);
            this.extend({
                /**
                 * Gets the associated class.
                 * @method getClass
                 * @returns  {Function} class.
                 */                                              
                getClass: function () { return classMeta.getClass(); },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                                
                isProtocol: function () { return classMeta.isProtocol(); }
            });
        }
    }, {
        init: function () {
            var baseExtend = Base.prototype.extend;
            Base.prototype.extend = function (key, value) {
                var numArgs    = arguments.length,
                    definition = (numArgs === 1) ? key : {};
                if (numArgs >= 2) {
                    definition[key] = value;
                } else if (numArgs === 0) {
                    return this;
                }
                var metadata = this.$meta;
                if (metadata) {
                    metadata.inflate(MetaStep.Extend, metadata, this, definition, expand);
                    definition = expand.x || definition;
                    function expand() {
                        return expand.x || (expand.x = Object.create(definition));
                    };                    
                }
                baseExtend.call(this, definition);                
                if (metadata) {
                    metadata.execute(MetaStep.Extend, metadata, this, definition);
                }
                return this;
            }
        }
    });

    Enum.$meta      = new ClassMeta(Base.$meta, Enum);
    Enum.extend     = Base.extend
    Enum.implement  = Base.implement;
    
    /**
     * Metamacro to proxy protocol members through a delegate.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class $proxyProtocol
     * @extends miruken.MetaMacro
     */
    var $proxyProtocol = MetaMacro.extend({
        inflate: function (step, metadata, target, definition, expand) {
            var protocolProto = Protocol.prototype, expanded;
            for (var key in definition) {
                if (key in protocolProto) {
                    continue;
                }
                expanded = expanded || expand();
                var member = _getPropertyDescriptor(definition, key);
                if ($isFunction(member.value)) {
                    (function (method) {
                        member.value = function () {
                            var args = Array.prototype.slice.call(arguments);
                            return this.__invoke(method, args);
                        };
                    })(key);
                } else if (member.get || member.set) {
                    if (member.get) {
                        (function (get) {
                            member.get = function () {
                                return this.__get(get);
                            };
                        })(key);
                    }
                    if (member.set) {
                        (function (set) {                        
                            member.set = function (value) {
                                return this.__set(set, value);
                            }
                        })(key);
                    }
                } else {
                    continue;
                }
                Object.defineProperty(expanded, key, member);                
            }            
        },
        execute: function (step, metadata, target, definition) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();                
                clazz.adoptedBy = Protocol.adoptedBy;
            }
        },
        protocolAdded: function (metadata, protocol) {
            var source        = protocol.prototype,
                target        = metadata.getClass().prototype,
                protocolProto = Protocol.prototype;
            for (var key in source) {
                if (!((key in protocolProto) && (key in this))) {
                    var descriptor = _getPropertyDescriptor(source, key);
                    Object.defineProperty(target, key, descriptor);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */        
        isActive: True
    });
    Protocol.extend    = Base.extend
    Protocol.implement = Base.implement;
    Protocol.$meta     = new ClassMeta(Base.$meta, Protocol, null, [new $proxyProtocol]);

    /**
     * Protocol base requiring conformance to match methods.
     * @class StrictProtocol
     * @constructor
     * @param   {miruken.Delegate}  delegate       -  delegate
     * @param   {boolean}           [strict=true]  -  true ifstrict, false otherwise
     * @extends miruekn.Protocol     
     */
    var StrictProtocol = Protocol.extend({
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        }
    });

    var GETTER_CONVENTIONS = ['get', 'is'];
    
    /**
     * Metamacro to define class properties.  This macro is automatically applied.
     * <pre>
     *    var Person = Base.extend({
     *        $properties: {
     *            firstName: '',
     *            lastNane:  '',
     *            fullName:  {
     *                get: function () {
     *                   return this.firstName + ' ' + this.lastName;
     *                },
     *                set: function (value) {
     *                    var parts = value.split(' ');
     *                    if (parts.length > 0) {
     *                        this.firstName = parts[0];
     *                    }
     *                    if (parts.length > 1) {
     *                        this.lastName = parts[1];
     *                    }
     *                }
     *            }
     *        }
     *    })
     * </pre>
     * would give the Person class a firstName and lastName property and a computed fullName.
     * @class $properties
     * @constructor
     * @param   {string}  [tag='$properties']  - properties tag
     * @extends miruken.MetaMacro
     */
    var $properties = MetaMacro.extend({
        constructor: function _(tag) {
            if ($isNothing(tag)) {
                throw new Error("$properties requires a tag name");
            }
            Object.defineProperty(this, 'tag', { value: tag });
        },
        execute: function _(step, metadata, target, definition) {
            var properties = this.extractProperty(this.tag, target, definition); 
            if (!properties) {
                return;
            }
            var expanded = {}, source;
            for (var name in properties) {
                source = expanded;
                var property = properties[name],
                    spec = _.spec || (_.spec = {
                        configurable: true,
                        enumerable:   true
                    });
                if ($isNothing(property) || $isString(property) ||
                    typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                    property = { value: property };
                }
                if (name in definition) {
                    source = null;  // don't replace standard property
                } else if (property.get || property.set) {
                    spec.get = property.get;
                    spec.set = property.set;
                } else if (target instanceof Protocol) {
                    // $proxyProtocol will do the real work
                    spec.get = spec.set = Undefined;
                } else if ("auto" in property) {
                    var field = property.auto;
                    if (!(field && $isString(field))) {
                        field = "_" + name;
                    }
                    spec.get = function () { return this[field]; };
                    spec.set = function (value) { this[field] = value; };
                } else {
                    spec.writable = true;
                    spec.value    = property.value;
                }
                _cleanDescriptor(property);
                this.defineProperty(metadata, source, name, spec, property);                
                _cleanDescriptor(spec);
            }
            if (step == MetaStep.Extend) {
                target.extend(expanded);
            } else {
                metadata.getClass().implement(expanded);
            }
        },
        defineProperty: function(metadata, target, name, spec, descriptor) {
            metadata.defineProperty(target, name, spec, descriptor);
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */                
        isActive: True
    }, {
        init: function () {
            Object.defineProperty(this, 'shared', {
                enumerable:   false,
                configurable: false,
                writable:     false,
                value:        Object.freeze(new this("$properties"))
            });
        }
    });

    /**
     * Metamacro to derive class properties from existng methods.
     * <p>Currently getFoo, isFoo and setFoo conventions are recognized.</p>
     * <pre>
     *    var Person = Base.extend(**$inferProperties**, {
     *        getName: function () { return this._name; },
     *        setName: function (value) { this._name = value; },
     *    })
     * </pre>
     * would create a Person.name property bound to getName and setName 
     * @class $inferProperties
     * @constructor
     * @extends miruken.MetaMacro
     */
    var $inferProperties = MetaMacro.extend({
        inflate: function _(step, metadata, target, definition, expand) {
            var expanded;
            for (var key in definition) {
                var member = _getPropertyDescriptor(definition, key);
                if ($isFunction(member.value)) {
                    var spec = _.spec || (_.spec = {
                        configurable: true,
                        enumerable:   true
                    });
                    var name = this.inferProperty(key, member.value, definition, spec);
                    if (name) {
                        expanded = expanded || expand();
                        Object.defineProperty(expanded, name, spec);
                        _cleanDescriptor(spec);                        
                    }
                }
            }            
        },
        inferProperty: function (key, method, definition, spec) {
            for (var i = 0; i < GETTER_CONVENTIONS.length; ++i) {
                var prefix = GETTER_CONVENTIONS[i];
                if (key.lastIndexOf(prefix, 0) == 0) {
                    if (method.length === 0) {  // no arguments
                        spec.get   = method;                        
                        var name   = key.substring(prefix.length),
                            setter = definition['set' + name];
                        if ($isFunction(setter)) {
                            spec.set = setter;
                        }
                        return name.charAt(0).toLowerCase() + name.slice(1);
                    }
                }
            }
            if (key.lastIndexOf('set', 0) == 0) {
                if (method.length === 1) {  // 1 argument
                    spec.set   = method;                    
                    var name   = key.substring(3),
                        getter = definition['get' + name];
                    if ($isFunction(getter)) {
                        spec.get = getter;
                    }
                    return name.charAt(0).toLowerCase() + name.slice(1);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */               
        isActive: True
    });

    function _cleanDescriptor(descriptor) {
        delete descriptor.writable;
        delete descriptor.value;
        delete descriptor.get;
        delete descriptor.set;
    }
    
    /**
     * Metamacro to inherit static members in subclasses.
     * <pre>
     * var Math = Base.extend(
     *     **$inheritStatic**, null, {
     *         PI:  3.14159265359,
     *         add: function (a, b) {
     *             return a + b;
     *          }
     *     }),
     *     Geometry = Math.extend(null, {
     *         area: function(length, width) {
     *             return length * width;
     *         }
     *     });
     * </pre>
     * would make Math.PI and Math.add available on the Geometry class.
     * @class $inhertStatic
     * @constructor
     * @param  {string}  [...members]  -  members to inherit
     * @extends miruken.MetaMacro
     */
    var $inheritStatic = MetaMacro.extend({
        constructor: function _(/*members*/) {
            var spec = _.spec || (_.spec = {});
            spec.value = Array.prototype.slice.call(arguments);
            Object.defineProperty(this, 'members', spec);
            delete spec.value;
        },
        execute: function (step, metadata, target) {
            if (step === MetaStep.Subclass) {
                var members  = this.members,
                    clazz    = metadata.getClass(),
                    ancestor = $ancestorOf(clazz);
                if (members.length > 0) {
                    for (var i = 0; i < members.length; ++i) {
                        var member = members[i];
                        if (!(member in clazz)) {
                            clazz[member] = ancestor[member];
                        }
                    }
                } else if (ancestor !== Base && ancestor !== Object) {
                    for (var key in ancestor) {
                        if (ancestor.hasOwnProperty(key) && !(key in clazz)) {
                            clazz[key] = ancestor[key];
                        }
                    }
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True
    });

    /**
     * Delegates properties and methods to another object.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class Delegate
     * @extends Base
     */
    var Delegate = Base.extend({
        /**
         * Delegates the property get on the protocol.
         * @method get
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         * @returns {Any} result of the proxied get.
         */
        get: function (protocol, propertyName, strict) {},
        /**
         * Delegates the property set on the protocol.
         * @method set
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {Object}           propertyValue - value of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         */
        set: function (protocol, propertyName, propertyValue, strict) {},
        /**
         * Delegates the method invocation on the protocol.
         * @method invoke
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           methodName  - name of the method
         * @param   {Array}            args        - method arguments
         * @param   {boolean}          strict      - true if target must adopt protocol
         * @returns {Any} result of the proxied invocation.
         */
         invoke: function (protocol, methodName, args, strict) {}
    });

    /**
     * Delegates properties and methods to an object.
     * @class ObjectDelegate
     * @constructor
     * @param   {Object}  object  - receiving object
     * @extends miruken.Delegate
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            Object.defineProperty(this, 'object', { value: object });
        },
        get: function (protocol, propertyName, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                return object[propertyName];
            }
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                return object[propertyName] = propertyValue;
            }
        },
        invoke: function (protocol, methodName, args, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                method = object[methodName];                
                return method && method.apply(object, args);
            }
        }
    });

    /**
     * Delegates properties and methods to an array.
     * @class ArrayDelegate
     * @constructor
     * @param   {Array}  array  - receiving array
     * @extends miruken.Delegate
     */
    var ArrayDelegate = Delegate.extend({
        constructor: function (array) {
            Object.defineProperty(this, 'array', { value: array });
        },
        get: function (protocol, propertyName, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                return !strict || protocol.adoptedBy(object)
                     ? object[propertyName]
                     : result;
            }, undefined);  
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                return !strict || protocol.adoptedBy(object)
                     ? object[propertyName] = propertyValue
                     : result;
            }, undefined);  
        },
        invoke: function (protocol, methodName, args, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                var method = object[methodName];
                return method && (!strict || protocol.adoptedBy(object))
                     ? method.apply(object, args)
                     : result;
            }, undefined);
        }
    });
    
    /**
     * Base class to prefer coercion over casting.
     * By default, Type(target) will cast target to the type.
     * @class Miruken
     * @extends Base
     */
    var Miruken = Base.extend(null, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Protocol for targets that manage initialization.
     * @class Initializing
     * @extends miruken.Protocol
     */
    var Initializing = Protocol.extend({
        /**
         * Perform any initialization after construction..
         */
        initialize: function () {}
    });
    
    /**
     * Protocol for targets that manage disposal lifecycle.
     * @class Disposing
     * @extends miruken.Protocol
     */
    var Disposing = Protocol.extend({
        /**
         * Releases any resources managed by the receiver.
         * @method dispose
         */
        dispose: function () {}
    });

    /**
     * Mixin for {{#crossLink "miruken.Disposing"}}{{/crossLink}} implementation.
     * @class DisposingMixin
     * @uses miruken.Disposing
     * @extends Module
     */
    var DisposingMixin = Module.extend({
        dispose: function (object) {
            if ($isFunction(object._dispose)) {
                var result = object._dispose();
                object.dispose = Undefined;  // dispose once
                return result;
            }
        }
    });

    /**
     * Protocol marking resolve semantics.
     * @class Resolving
     * @extends miruken.Protocol
     */
    var Resolving = Protocol.extend();

    /**
     * Protocol for targets that can execute functions.
     * @class Invoking
     * @extends miruken.StrictProtocol
     */
    var Invoking = StrictProtocol.extend({
        /**
         * Invokes the function with dependencies.
         * @method invoke
         * @param    {Function} fn           - function to invoke
         * @param    {Array}    dependencies - function dependencies
         * @param    {Object}   [ctx]        - function context
         * @returns  {Any}      result of the function.
         */
        invoke: function (fn, dependencies, ctx) {}
    });

    /**
     * Protocol for targets that have parent/child relationships.
     * @class Parenting
     * @extends miruken.Protocol
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @method newChild
         * @returns  {Object} the new child.
         */
        newChild: function () {}
    });

    /**
     * Protocol for targets that can be started.
     * @class Starting
     * @extends miruken.Protocol
     */
    var Starting = Protocol.extend({
        /**
         * Starts the reciever.
         * @method start
         */
        start: function () {}
    });

    /**
     * Base class for startable targets.
     * @class Startup
     * @uses miruken.Starting
     * @extends Base
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
    });

    /**
     * Convenience function for disposing resources.
     * @for miruken.$
     * @method $using
     * @param    {miruken.Disposing}   disposing  - object to dispose
     * @param    {Function | Promise}  action     - block or Promise
     * @param    {Object}              [context]  - block context
     * @returns  {Any} result of executing the action in context.
     */
    function $using(disposing, action, context) {
        if (disposing && $isFunction(disposing.dispose)) {
            if (!$isPromise(action)) {
                var result;
                try {
                    result = $isFunction(action)
                           ? action.call(context, disposing)
                           : action;
                    if (!$isPromise(result)) {
                        return result;
                    }
                } finally {
                    if ($isPromise(result)) {
                        action = result;
                    } else {
                        var dresult = disposing.dispose();
                        if (dresult !== undefined) {
                            return dresult;
                        }
                    }
                }
            }
            return action.then(function (res) {
                var dres = disposing.dispose();
                return dres !== undefined ? dres : res;
            }, function (err) {
                var dres = disposing.dispose();
                return dres !== undefined ? dres : Promise.reject(err);
            });
        }
    }

    /**
     * Class for annotating targets.
     * @class Modifier
     * @param  {Object}  source  -  source to annotate
     */
    function Modifier() {}
    Modifier.isModified = function (source) {
        return source instanceof Modifier;
    };
    Modifier.unwrap = function (source) {
        return (source instanceof Modifier) 
             ? Modifier.unwrap(source.getSource())
             : source;
    };
    function $createModifier() {
        var allowNew;
        function modifier(source) {
            if (this === global) {
                if (modifier.test(source)) {
                    return source;
                }
                allowNew = true;
                var wrapped = new modifier(source);
                allowNew = false;
                return wrapped;
            } else {
                if (!allowNew) {
                    throw new Error("Modifiers should not be called with the new operator.");
                }
                this.getSource = function () {
                    return source;
                }
            }
        }
        modifier.prototype = new Modifier();
        modifier.test      = function (source) {
            if (source instanceof modifier) {
                return true;
            } else if (source instanceof Modifier) {
                return modifier.test(source.getSource());
            }
            return false;
        }
        return modifier;
    }

    /**
     * Helper class to simplify array manipulation.
     * @class ArrayManager
     * @constructor
     * @param  {Array}  [...items]  -  initial items
     * @extends Base
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            var _items = [];
            this.extend({
                /** 
                 * Gets the array.
                 * @method getItems
                 * @returns  {Array} array.
                 */
                getItems: function () { return _items; },
                /** 
                 * Gets the item at array index.
                 * @method getIndex
                 * @param    {number}  index - index of item
                 * @returns  {Any} item at index.
                 */
                getIndex: function (index) {
                    if (_items.length > index) {
                        return _items[index];
                    }
                },
                /** 
                 * Sets the item at array index if empty.
                 * @method setIndex
                 * @param    {number}  index - index of item
                 * @param    {Any}     item  - item to set
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                setIndex: function (index, item) {
                    if ((_items.length <= index) ||
                        (_items[index] === undefined)) {
                        _items[index] = this.mapItem(item);
                    }
                    return this;
                },
                /** 
                 * Inserts the item at array index.
                 * @method insertIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to insert
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                insertIndex: function (index, item) {
                    _items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                /** 
                 * Replaces the item at array index.
                 * @method replaceIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to replace
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                replaceIndex: function (index, item) {
                    _items[index] = this.mapItem(item);
                    return this;
                },
                /** 
                 * Removes the item at array index.
                 * @method removeIndex
                 * @param    {number}   index - index of item
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                removeIndex: function (index) {
                    if (_items.length > index) {
                        _items.splice(index, 1);
                    }
                    return this;
                },
                /** 
                 * Appends one or more items to the end of the array.
                 * @method append
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                append: function (/* items */) {
                    var newItems;
                    if (arguments.length === 1 && $isArray(arguments[0])) {
                        newItems = arguments[0];
                    } else if (arguments.length > 0) {
                        newItems = arguments;
                    }
                    if (newItems) {
                        for (var i = 0; i < newItems.length; ++i) {
                            _items.push(this.mapItem(newItems[i]));
                        }
                    }
                    return this;
                },
                /** 
                 * Merges the items into the array.
                 * @method merge
                 * @param    {Array}  items - items to merge from
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                merge: function (items) {
                    for (var index = 0; index < items.length; ++index) {
                        var item = items[index];
                        if (item !== undefined) {
                            this.setIndex(index, item);
                        }
                    }
                    return this;
                }
            });
            if (items) {
                this.append(items);
            }
        },
        /** 
         * Optional mapping for items before adding to the array.
         * @method mapItem
         * @param    {Any}  item  -  item to map
         * @returns  {Any}  mapped item.
         */
        mapItem: function (item) { return item; }
    });

    /**
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     * @class IndexedList
     * @constructor
     * @param  {Function}  order  -  orders items
     * @extends Base
     */
    var IndexedList = Base.extend({
        constructor: function (order) {
            var _index = {};
            this.extend({
                /** 
                 * Determines if list is empty.
                 * @method isEmpty
                 * @returns  {boolean}  true if list is empty, false otherwise.
                 */
                isEmpty: function () {
                    return !this.head;
                },
                /** 
                 * Gets the node at an index.
                 * @method getIndex
                 * @param    {number} index - index of node
                 * @returns  {Any}  the node at index.
                 */
                getIndex: function (index) {
                    return index && _index[index];
                },
                /** 
                 * Inserts the node at an index.
                 * @method insert
                 * @param  {Any}     node   - node to insert
                 * @param  {number}  index  - index to insert at
                 */
                insert: function (node, index) {
                    var indexedNode = this.getIndex(index),
                        insert      = indexedNode;
                    if (index) {
                        insert = insert || this.head;
                        while (insert && order(node, insert) >= 0) {
                            insert = insert.next;
                        }
                    }
                    if (insert) {
                        var prev    = insert.prev;
                        node.next   = insert;
                        node.prev   = prev;
                        insert.prev = node;
                        if (prev) {
                            prev.next = node;
                        }
                        if (this.head === insert) {
                            this.head = node;
                        }
                    } else {
                        delete node.next;
                        var tail = this.tail;
                        if (tail) {
                            node.prev = tail;
                            tail.next = node;
                        } else {
                            this.head = node;
                            delete node.prev;
                        }
                        this.tail = node;
                    }
                    if (index) {
                        node.index = index;
                        if (!indexedNode) {
                            _index[index] = node;
                        }
                    }
                },
                /** 
                 * Removes the node from the list.
                 * @method remove
                 * @param  {Any}  node  - node to remove
                 */
                remove: function (node) {
                    var prev = node.prev,
                        next = node.next;
                    if (prev) {
                        if (next) {
                            prev.next = next;
                            next.prev = prev;
                        } else {
                            this.tail = prev;
                            delete prev.next;
                        }
                    } else if (next) {
                        this.head = next;
                        delete next.prev;
                    } else {
                        delete this.head;
                        delete this.tail;
                    }
                    var index = node.index;
                    if (this.getIndex(index) === node) {
                        if (next && next.index === index) {
                            _index[index] = next;
                        } else {
                            delete _index[index];
                        }
                    }
                }
            });
        }
    });

    /**
     * Facet choices for proxies.
     * @class Facet
     */
    var Facet = Object.freeze({
        /**
         * @property {string} Parameters
         */
        Parameters: 'parameters',
        /**
         * @property {string} Interceptors
         */        
        Interceptors: 'interceptors',
        /**
         * @property {string} InterceptorSelectors
         */                
        InterceptorSelectors: 'interceptorSelectors',
        /**
         * @property {string} Delegate
         */                        
        Delegate: 'delegate'
    });


    /**
     * Base class for method interception.
     * @class Interceptor
     * @extends Base
     */
    var Interceptor = Base.extend({
        /**
         * @method intercept
         * @param    {Object} invocation  - invocation
         * @returns  {Any} invocation result
         */
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * Responsible for selecting which interceptors to apply to a method.
     * @class InterceptorSelector
     * @extends Base
     */
    var InterceptorSelector = Base.extend({
        /**
         * Description goes here
         * @method selectInterceptors
         * @param    {Type}    type         - type being intercepted
         * @param    {string}  method       - method name
         * @param    {Array}   interceptors - available interceptors
         * @returns  {Array} effective interceptors
         */
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * Builds proxy classes for interception.
     * @class ProxyBuilder
     * @extends Base
     */
    var ProxyBuilder = Base.extend({
        /**
         * Builds a proxy class for the supplied types.
         * @method buildProxy
         * @param    {Array}     ...types    - classes and protocols
         * @param    {Object}    options     - literal options
         * @returns  {Function}  proxy class.
         */
        buildProxy: function(types, options) {
            if (!$isArray(types)) {
                throw new TypeError("ProxyBuilder requires an array of types to proxy.");
            }
            var classes   = Array2.filter(types, $isClass),
                protocols = Array2.filter(types, $isProtocol);
            return _buildProxy(classes, protocols, options || {});
        }
    });

    function _buildProxy(classes, protocols, options) {
        var base  = options.baseType || classes.shift() || Base,
            proxy = base.extend(protocols.concat(classes), {
            constructor: function _(facets) {
                var spec = _.spec || (_.spec = {});
                spec.value = facets[Facet.InterceptorSelectors]
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'selectors', spec);
                }
                spec.value = facets[Facet.Interceptors];
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'interceptors', spec);
                }
                spec.value = facets[Facet.Delegate];
                if (spec.value) {
                    spec.writable = true;
                    Object.defineProperty(this, 'delegate', spec);
                }
                ctor = _proxyMethod('constructor', this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors: function (source, method) {
                var selectors = this.selectors;
                return selectors 
                     ? Array2.reduce(selectors, function (interceptors, selector) {
                           return selector.selectInterceptors(source, method, interceptors);
                       }, this.interceptors)
                     : this.interceptors;
            },
            extend: _extendProxy
        }, {
            shouldProxy: options.shouldProxy
        });
        _proxyClass(proxy, protocols);
        proxy.extend = proxy.implement = _throwProxiesSealedExeception;
        return proxy;
    }

    function _throwProxiesSealedExeception()
    {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
    }

    function _proxyClass(proxy, protocols) {
        var sources    = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied    = {};
        for (var i = 0; i < sources.length; ++i) {
            var source      = sources[i],
                sourceProto = source.prototype,
                isProtocol  = $isProtocol(source);
            for (key in sourceProto) {
                if (!((key in proxied) || (key in _noProxyMethods))
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var descriptor = _getPropertyDescriptor(sourceProto, key);
                    if ('value' in descriptor) {
                        var member = isProtocol ? undefined : descriptor.value;
                        if ($isNothing(member) || $isFunction(member)) {
                            proxyProto[key] = _proxyMethod(key, member, proxy);
                        }
                        proxied[key] = true;
                    } else if (isProtocol) {
                        var cname = key.charAt(0).toUpperCase() + key.slice(1),
                            get   = 'get' + cname,
                            set   = 'set' + cname,
                            spec  = _proxyClass.spec || (_proxyClass.spec = {
                                enumerable: true
                            });
                        spec.get = function (get) {
                            var proxyGet;
                            return function () {
                                if (get in this) {
                                    return (this[get]).call(this);
                                }
                                if (!proxyGet) {
                                    proxyGet = _proxyMethod(get, undefined, proxy);
                                }
                                return proxyGet.call(this);
                            }
                        }(get);
                        spec.set = function (set) {
                            var proxySet;
                            return function (value) {
                                if (set in this) {
                                    return (this[set]).call(this, value);
                                }
                                if (!proxySet) {
                                    proxySet = _proxyMethod(set, undefined, proxy);
                                }
                                return proxySet.call(this, value);
                            }
                        }(set);
                        Object.defineProperty(proxy.prototype, key, spec);
                        proxied[key] = true;
                    }
                }
            }
        }
    }
    
    function _proxyMethod(key, method, source) {
        var spec = _proxyMethod.spec || (_proxyMethod.spec = {}),
            interceptors;
        function methodProxy() {
            var _this    = this,
                delegate = this.delegate,
                idx      = -1;
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                args: Array.prototype.slice.call(arguments),
                useDelegate: function (value) {
                    delegate = value; 
                },
                replaceDelegate: function (value) {
                    _this.delegate = delegate = value;
                },
                proceed: function () {
                    ++idx;
                    if (interceptors && idx < interceptors.length) {
                        var interceptor = interceptors[idx];
                        return interceptor.intercept(invocation);
                    }
                    if (delegate) {
                        var delegateMethod = delegate[key];
                        if ($isFunction(delegateMethod)) {
                            return delegateMethod.apply(delegate, this.args);
                        }
                    } else if (method) {
                        return method.apply(_this, this.args);
                    }
                    throw new Error(format(
                        "Interceptor cannot proceed without a class or delegate method '%1'.", key));
                }
            };
            spec.value = key;
            Object.defineProperty(invocation, 'method', spec);
            spec.value = source;
            Object.defineProperty(invocation, 'source', spec);
            delete spec.value;
            spec.get = function () {
                if (interceptors && (idx + 1 < interceptors.length)) {
                    return true;
                }
                if (delegate) {
                    return $isFunction(delegate(key));
                }
                return !!method;
            };
            Object.defineProperty(invocation, 'canProceed', spec);
            delete spec.get;
            return invocation.proceed();
        }
        methodProxy.baseMethod = method;
        return methodProxy;
    }
    
    function _extendProxy() {
        var proxy     = this.constructor,
            clazz     = proxy.prototype,
            overrides = (arguments.length === 1) ? arguments[0] : {};
        if (arguments.length >= 2) {
            overrides[arguments[0]] = arguments[1];
        }
        for (methodName in overrides) {
            if (!(methodName in _noProxyMethods) && 
                (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
                var method = this[methodName];
                if (method && method.baseMethod) {
                    this[methodName] = method.baseMethod;
                }
                this.base(methodName, overrides[methodName]);
                this[methodName] = _proxyMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    var _noProxyMethods = {
        base: true, extend: true, constructor: true, conformsTo: true,
        getInterceptors: true, getDelegate: true, setDelegate: true
    };

    Package.implement({
        export: function (name, member) {
            this.addName(name, member);
        },
        getProtocols: function () {
            _listContents(this, arguments, $isProtocol);
        },
        getClasses: function () {
            _listContents(this, arguments, function (member, memberName) {
                return $isClass(member) && (memberName != "constructor");
            });
        },
        getPackages: function () {
            _listContents(this, arguments, function (member, memberName) {
                return (member instanceof Package) && (memberName != "parent");
            });
        }
    });

    function _listContents(package, args, filter) {
        var cb  = Array.prototype.pop.call(args);
        if ($isFunction(cb)) {
            var names = Array.prototype.pop.call(args) || Object.keys(package);
            for (var i = 0; i < names.length; ++i) {
                var name   = names[i],
                    member = package[name];
                if (member && (!filter || filter(member, name))) {
                    cb({ member: member, name: name});
                }
            }
        }
    }

    /**
     * Determines if target is a protocol.
     * @method $isProtocol
     * @param    {Any}     protocol  - target to test
     * @returns  {boolean} true if a protocol.
     * @for miruken.$
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * Determines if target is a class.
     * @method $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * Gets the class the instance belongs to.
     * @method $classOf
     * @param    {Object}  instance  - object
     * @returns  {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * Gets the classes superclass.
     * @method $ancestorOf
     * @param    {Function} clazz  - class
     * @returns  {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * Determines if target is a string.
     * @method $isString
     * @param    {Any}     str  - string to test
     * @returns  {boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * Determines if the target is a function.
     * @method $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * Determines if target is an object.
     * @method $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * Determines if target is an array.
     * @method $isArray
     * @param    {Any}     obj  - array to test
     * @returns  {boolean} true if an array. 
     */    
    function $isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    
    /**
     * Determines if target is a promise.
     * @method $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }
    
    /**
     * Determines if value is null or undefined.
     * @method $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return value == null;
    }

    /**
     * Description goes here
     * @method $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return value != null;
    }

    /**
     * Returns a function that returns value.
     * @method $lift
     * @param    {Any}      value  - any value
     * @returns  {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    /**
     * Determines whether the objects are considered equal.
     * <p>
     * Objects are considered equal if the objects are strictly equal (===) or
     * either object has an equals method accepting other object that returns true.
     * </p>
     * @method $equals
     * @param    {Any}     obj1  - first object
     * @param    {Any}     obj2  - second object
     * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
     */
    function $equals(obj1, obj2) {
        if (obj1 === obj2) {
            return true;
        }
        if ($isFunction(obj1.equals)) {
            return obj1.equals(obj2);
        } else if ($isFunction(obj2.equals)) {
            return obj2.equals(obj1);
        }
        return false;
    }

    /**
     * Creates a decorator builder.<br/>
     * See [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern)
     * @method
     * @param   {Object}   decorations  -  object defining decorations
     * @erturns {Function} function to build decorators.
     */
    function $decorator(decorations) {
        return function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            var decorator = Object.create(decoratee),
                spec      = $decorator.spec || ($decorator.spec = {});
            spec.value = decoratee;
            Object.defineProperty(decorator, 'decoratee', spec);
            ClassMeta.createInstanceMeta.call(decorator, decoratee.$meta);
            if (decorations) {
                decorator.extend(decorations);
            }
            delete spec.value;
            return decorator;
        }
    }

    /**
     * Decorates an instance using the 
     * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
     * @method
     * @param   {Object}   decoratee    -  decoratee
     * @param   {Object}   decorations  -  object defining decorations
     * @erturns {Function} function to build decorators.
     */
    function $decorate(decoratee, decorations) {
        return $decorator(decorations)(decoratee);
    }

    /**
     * Gets the decoratee used in the  
     * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
     * @method
     * @param   {Object}   decorator  -  possible decorator
     * @param   {boolean}  deepest    -  true if deepest decoratee, false if nearest.
     * @erturns {Object}   decoratee if present, otherwise decorator.
     */
    function $decorated(decorator, deepest) {
        var decoratee;
        while (decorator && (decoratee = decorator.decoratee)) {
            if (!deepest) {
                return decoratee;
            }
            decorator = decoratee;
        }
        return decorator;
    }

    /**
     * Throttles a function over a time period.
     * @method $debounce
     * @param    {Function} func                - function to throttle
     * @param    {int}      wait                - time (ms) to throttle func
     * @param    {boolean}  immediate           - if true, trigger func early
     * @param    {Any}      defaultReturnValue  - value to return when throttled
     * @returns  {Function} throttled function
     */
    function $debounce(func, wait, immediate, defaultReturnValue) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    return func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                return func.apply(context, args);
            }
            return defaultReturnValue;
        };
    };

    function _getPropertyDescriptor(object, key, own) {
        var source = object, descriptor;
        while (source && !(
            descriptor = Object.getOwnPropertyDescriptor(source, key))
              ) source = own ? null : Object.getPrototypeOf(source);
        return descriptor;
    }

    /**
     * Enhances Functions to create instances.
     * @method new
     * @for Function
     */
    if (Function.prototype.new === undefined)
        Function.prototype.new = function () {
            var args        = arguments,
                constructor = this;
            function Wrapper () { constructor.apply(this, args); }
            Wrapper.prototype  = constructor.prototype;
            return new Wrapper;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    global.miruken = this.package;
    global.Miruken = Miruken;

    eval(this.exports);

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./base2.js":3}],13:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../mvc/view.js');

new function () { // closure

    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.mvc",
        exports: "Bootstrap,BootstrapProvider"
    });

    eval(this.imports);

    /**
     * Marker for Bootstrap providers.
     * @class Bootstrap
     * @extends miruken.mvc.ModalProviding
     */    
    var Bootstrap = ModalProviding.extend(TabProviding);
    
    /**
     * Bootstrap provider.
     * @class BootstrapProvider
     * @extends Base
     * @uses miruken.mvc.Bootstrap
     */    
    var BootstrapProvider = Base.extend(Bootstrap, {
        tabContent: function () {
            return "<div>Hello</div>";
        },
        showModal: function (container, content, policy, context) {
            var promise = new Promise(function (resolve, reject) {
                if (policy.chrome) {    
                    $('body').append(_buildChrome(policy));
                    $('.modal-body').append(content);
                } else {
                    $('body').append(content);
                }
                
                function close(result) {
                    if (resolve) {
                        resolve(result);
                        resolve = null;
                        modal.modal('hide');
                    }
                }
                
                if (context) {
                    context.onEnding(close);
                }
                
                var modal = $('.modal').modal()
                    .on('hidden.bs.modal', function (e) {
                        modal.remove();
                        $('.modal-backdrop').remove();
                        $('body').removeClass('modal-open');
                        context.end();
                    });
                
                $('.modal .js-close').click(function (e) {
                    var result;
                    if (e.target.innerText != '\u00d7') {
                        var index = $(e.target).index();
                        if (policy.buttons && policy.buttons.length > index) {
                            result = new ButtonClicked(policy.buttons[index], index);
                        }
                    }
                    close(result)
                });
            });
            return context.decorate({
                get modalResult() { return promise; }
            });
        }
    });

    function _buildChrome(policy) {
        var chrome = ''; 
        chrome += format('<div class="modal fade" role="dialog" %1>', policy.forceClose ? 'data-backdrop="static"' : '');
        chrome +=     '<div class="modal-dialog" role="document">';
        chrome +=         '<div class="modal-content">';
        
        chrome = _buildHeader(chrome, policy);
        
        chrome +=             '<div class="modal-body">';
        chrome +=             '</div>';
        
        chrome = _buildFooter(chrome, policy);
        
        chrome +=         '</div>';
        chrome +=     '</div>';
        chrome += '</div>';
        
        return chrome;
    }

    function _buildHeader(chrome, policy) {
        if (policy.header || policy.title) {
            chrome += '<div class="modal-header">';
            
            if (!policy.forceClose) {
                chrome += '<button type="button" class="close js-close">&times;</button>';
            }
            
            chrome += format('<h4 class="modal-title"> %1 &nbsp</h4>', policy.title);
            chrome += '</div>';
        }
        return chrome;
    }

    function _buildFooter(chrome, policy) {
        if (policy.footer || policy.buttons) {
            chrome += '<div class="modal-footer text-right">';
            if (policy.buttons) {
                Array2.forEach(policy.buttons, function (button) {
                    if ($isString(button)) {
                        chrome += format('<button class="btn btn-default btn-sm js-close">%1</button>', button);
                    } else if ($isObject(button)) {
                        chrome += format('<button class="btn js-close %1">%2</button>', button.css, button.text);
                    }
                });
            } else {
                chrome += '<button class="btn btn-primary btn-sm js-close">Close</button>';
            }
            chrome += '</div>';
        }
        return chrome;
    }

    eval(this.exports);
    
}

},{"../miruken.js":12,"../mvc/view.js":19,"bluebird":23}],14:[function(require,module,exports){
var miruken = require('../miruken.js');
              require('../mvc/controller.js');

new function () { // closure

    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.callback",
        exports: "TabProviding,TabController,ModalPolicy,ModalProviding,FadePolicy,FadeProviding"
    });

    eval(this.imports);

    /**
     * Protocol for interacting with a tab provider.
     * @class TabProviding
     * @extends StrictProtocol
     */    
    var TabProviding = StrictProtocol.extend({
        /**
         * Creates the DOM container for the tabs.
         * @method tabContainer
         * @returns {Element} DOM element representing the tab container.
         */        
        tabContainer: function () {}
    });

    /**
     * Controller for managing a set of named tabs.
     * @class TabController
     * @extends miruken.mvc.Controller
     */    
    var TabController = Controller.extend({
        getTab: function (name) {
        },
        addTab: function (name) {
        }
    });

    /**
     * Policy for describing modal presentation.
     * @class ModalPolicy
     * @extends miruken.mvc.PresentationPolicy
     */
    var ModalPolicy = PresentationPolicy.extend({
        $properties: {
            title:      '',
            style:      null,
            chrome:     true,
            header:     false,
            footer:     false,
            forceClose: false,
            buttons:    null
        }
    });

    /**
     * Protocol for interacting with a modal provider.
     * @class ModalProviding
     * @extends StrictProtocol
     */
    var ModalProviding = StrictProtocol.extend({
        /**
         * Presents the content in a modal dialog.
         * @method showModal
         * @param   {Element}                  container  -  element modal bound to
         * @param   {Element}                  content    -  modal content element
         * @param   {miruken.mvc.ModalPolicy}  policy     -  modal policy options
         * @param   {miruken.context.Context}  context    -  modal context
         * @returns {Promise} promise representing the modal result.
         */
        showModal: function (container, content, policy, context) {}
    });

    var FadePolicy = PresentationPolicy.extend();

    var FadeProviding = StrictProtocol.extend({
        handle: function (container, content, context) {}
    });

    CallbackHandler.implement({
        /**
         * Configures modal presentation options.
         * @method modal
         * @param {Object}  options  -  modal options
         * @returns {miruken.callback.CallbackHandler} modal handler.
         * @for miruken.callback.CallbackHandler
         */                                                                
        modal: function (options) {
            return this.presenting(new ModalPolicy(options));
        },

        fade: function (options) {
            return this.presenting(new FadePolicy(options));
        }
    });
    
    eval(this.exports);

}

},{"../miruken.js":12,"../mvc/controller.js":15}],15:[function(require,module,exports){
var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Controller,MasterDetail,MasterDetailAware"
    });

    eval(this.imports);
    
    /**
     * Base class for controllers.
     * @class Controller
     * @constructor
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.context.$contextual
     * @uses miruken.validate.$validateThat
     * @uses miruken.validate.Validating
     */
    var Controller = CallbackHandler.extend(
        $contextual, $validateThat, Validating, {
        validate: function (target, scope) {
            return _validateController(this, target, 'validate', scope);
        },
        validateAsync: function (target, scope) {
            return _validateController(this, target, 'validateAsync', scope);
        }
    });

    function _validateController(controller, target, method, scope) {
        var context = controller.context;
        if (!context) {
            throw new Error("Validation requires a context to be available.");
        }
        var validator = Validator(context);
        return validator[method].call(validator, target || controller, scope);
    }

    /**
     * Protocol for managing master-detail relationships.
     * @class MasterDetail
     * @extends miruken.Protocol     
     */    
    var MasterDetail = Protocol.extend({
        /**
         * Gets the selected detail.
         * @method getSelectedDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object} selected detail.  Could be a Promise.
         */
        getSelectedDetail: function (detailClass) {},
        /**
         * Gets the selected details.
         * @method getSelectedDetails
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  selected details.  Could be a Promise.
         */
        getSelectedDetails: function (detailClass) {},
        /**
         * Selects the detail
         * @method selectDetail
         * @param   {Object} detail  -  selected detail
         */
        selectDetail: function (detail) {},
        /**
         * Unselects the detail
         * @method deselectDetail
         * @param   {Object} detail  -  unselected detail
         */
        deselectDetail: function (detail) {},
        /**
         * Determines if a previous detail exists.
         * @method hasPreviousDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {boolean} true if a previous detail exists.
         */
        hasPreviousDetail: function (detailClass) {},
        /**
         * Determines if a next detail exists.
         * @method hasNextDetail.
         * @param   {Function} detailClass  -  type of detail
         * @returns {boolean} true if a next detail exists.
         */
        hasNextDetail: function (detailClass) {},
        /**
         * Gets the previous detail.
         * @method getPreviousDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  previous detail or undefined..
         */
        getPreviousDetail: function (detailClass) {},
        /**
         * Gets the next detail.
         * @method getNextDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  next detail or undefined.
         */
        getNextDetail: function (detailClass) {},
        /**
         * Adds the detail to the master.
         * @method addDetail
         * @param   {Object} detail  -  added detail
         */
        addDetail: function (detail) {},
        /**
         * Updates the detail in the master.
         * @method updateDetail
         * @param   {Object} detail  -  updated detail
         */
        updateDetail: function (detail) {},
        /**
         * Removes the detail from the master.
         * @method removeDetail
         * @param   {Object}  detail   -  removed detail
         * @param   {boolean} deleteIt -  true to delete it
         */
        removeDetail: function (detail, deleteIt) {}
    });
    
    /**
     * Protocol for receiving master-detail notifications.
     * @class MasterDetailAware
     * @extends miruken.Protocol     
     */    
    var MasterDetailAware = Protocol.extend({
        /**
         * Informs the master has changed.
         * @method masterChanged
         * @param  {Object}  master  -  master
         */
        masterChanged: function (master) {},
        /**
         * Informs a detail was selected.
         * @method detailSelected
         * @param  {Object}  detail  -  selected detail
         * @param  {Object}  master  -  master
         */
        detailSelected: function (detail, master) {},
        /**
         * Informs a detail was unselected.
         * @method detailUnselected
         * @param  {Object} detail  -  unselected detail
         * @param  {Object} master  -  master
         */
        detailUnselected: function (detail, master) {},
        /**
         * Informs a detail was added to the master.
         * @method detailAdded
         * @param  {Object} detail  -  added detail
         * @param  {Object} master  -  master
         */
        detailAdded: function (detail, master) {},
        /**
         * Informs a detail was updated in the master.
         * @method detailUpdated
         * @param  {Object} detail  -  updated detail
         * @param  {Object} master  -  master
         */
        detailUpdated: function (detail, master) {},
        /**
         * Informs a detail was removed from the master.
         * @method detailRemoved
         * @param  {Object} detail  -  removed detail
         * @param  {Object} master  -  master
         */
        detailRemoved: function (detail, master) {}
    });

    eval(this.exports);
    
}

},{"../callback.js":4,"../context.js":5,"../miruken.js":12,"../validate":20}],16:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');

new function () {

	miruken.package(this, {
		name:   'mvc',
		imports: 'miruken',
		exports: 'GreenSockFadeProvider'
	});

	eval(this.imports);

	var outTime = .4,
		inTime  = .8;

	var BaseAnimationProvider = Base.extend(FadeProviding, {
		handle: function(container, content, context){
				
			var _current = container.children(),
			    _removed = false;

				if (context) {
                	context.onEnding(function(_context){
                		if(context === _context && !_removed){
                			_removed = true;
                			this.animateOut(content, container).then(function(){
                				content.remove();
                			});
                		}
            		}.bind(this));
				}

			    if(!container.__miruken_animate_out){
			    	if(_current.length){
			    		return this.animateOut(_current, container).then(function(){
				    		return this.animateIn(content, container);
				    	}.bind(this));	
			    	} else {
			    		return this.animateIn(content, container);
			    	}
			    } else {
			    	return container.__miruken_animate_out(content, container).then(function(){
			    		_removed = true;
			    		return this.animateIn(content, container).then(function(){
			    			return container.__miruken_animate_out = function(){
			    				this.animateOut(content, container);
			    			}	
			    		}.bind(this));
			    	}.bind(this));
			    }
		}
	});

	var GreenSockFadeProvider = BaseAnimationProvider.extend(FadeProviding, {
		animateIn: function(content, container){
			return new Promise(function(resolve){
	    		content.css('opacity', 0);
    			container.html(content);
			    TweenMax.to(content, inTime, {
                	opacity: 1,
                	onComplete: resolve
            	})
	    	});
		},
		animateOut: function(content, container){
			return new Promise(function(resolve){
	    		TweenMax.to(content, outTime, {
	    			opacity: 0,
	    			onComplete: resolve
	    		});
	    	});
		}
	});

	eval(this.exports);

}

},{"../miruken.js":12,"bluebird":23}],17:[function(require,module,exports){
module.exports = require('./model.js');
require('./view.js');
require('./controller.js');
require('./components.js');
require('./bootstrap.js');
require('./greenSock.js');


},{"./bootstrap.js":13,"./components.js":14,"./controller.js":15,"./greenSock.js":16,"./model.js":18,"./view.js":19}],18:[function(require,module,exports){
var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.validate",
        exports: "Model"
    });

    eval(this.imports);

    /**
     * Base class for modelling concepts using one or more 
     * {{#crossLink "miruken.$properties"}}{{/crossLink}}
     * <pre>
     *    var Child = Model.extend({
     *       $properties: {
     *           firstName: { validate: { presence: true } },
     *           lastNane:  { validate: { presence: true } },
     *           sibling:   { map: Child },
     *           age:       { validate {
     *                            numericality: {
     *                                onlyInteger:       true,
     *                                lessThanOrEqualTo: 12
     *                            }
     *                      }}
     *       }
     *    })
     * </pre>
     * @class Model
     * @constructor
     * @param  {Object}  [data]   -  json structured data
     * @param  {Object}  options  -  mapping options
     * @extends Base
     */
    var Model = Base.extend(
        $inferProperties, $validateThat, {
        constructor: function (data, options) {
            this.fromData(data, options);
        },
        /**
         * Maps json structured data into the model.
         * @method fromData
         * @param   {Object}  data     -  json structured data
         * @param   {Object}  options  -  mapping options
         */
        fromData: function (data, options) {
            if ($isNothing(data)) {
                return;
            }
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor(),
                dynamic     = options && options.dynamic;
            if (descriptors) {
                for (var key in descriptors) {
                    var descriptor = descriptors[key];
                    if (descriptor && descriptor.root && descriptor.map) {
                        this[key] = descriptor.map(data); 
                    }
                }
            }
            for (var key in data) {
                var descriptor = descriptors && descriptors[key],
                    mapper     = descriptor  && descriptor.map;
                if ((mapper && descriptor.root) || (descriptor && descriptor.ignore)) {
                    continue;  // ignore or already rooted
                }
                var value = data[key];
                if (value === undefined) {
                    continue;
                }
                if (key in this) {
                    this[key] = Model.map(value, mapper, options);
                } else {
                    var lkey  = key.toLowerCase(),
                        found = false;
                    for (var k in this) {
                        if (k.toLowerCase() === lkey) {
                            descriptor = descriptors && descriptors[k];
                            mapper     = descriptor  && descriptor.map;                            
                            this[k]    = Model.map(value, mapper, options);
                            found      = true;
                            break;
                        }
                    }
                    if (!found && dynamic) {
                        this[key] = value;
                    }
                }
            }
            return this;
        },
        /**
         * Maps the model into json structured data.
         * @method toData
         * @param   {Object}  spec    -  filters data to map
         * @param   {Object}  [data]  -  receives mapped data
         * @returns {Object} json structured data.
         */                        
        toData: function (spec, data) {
            data = data || {};
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            if (descriptors) {
                var all = $isNothing(spec);
                for (var key in descriptors) {
                    if (all || (key in spec)) {
                        var keyValue   = this[key];
                        if (keyValue === undefined) {
                            continue;
                        }
                        var descriptor = descriptors[key],
                            keySpec    = all ? spec : spec[key];
                        if (!(all || keySpec) || descriptor.ignore) {
                            continue;
                        }
                        if (descriptor.root) {
                            if (keyValue && $isFunction(keyValue.toData)) {
                                keyValue.toData(keySpec, data);
                            }
                        } else if ($isArray(keyValue)) {
                            data[key] = Array2.map(keyValue, function (elem) {
                                return elem && $isFunction(elem.toData)
                                     ? elem.toData(keySpec)
                                     : elem;
                            });
                        } else if (keyValue && $isFunction(keyValue.toData)) {
                            data[key] = keyValue.toData(keySpec);
                        } else {
                            data[key] = keyValue;
                        }
                    }
                }
            }            
            return data;
        },
        /**
         * Merges specified data into another model.
         * @method mergeInto
         * @param   {miruken.mvc.Model}  model  -  model to receive data
         * @returns {boolean} true if model could be merged into. 
         */            
        mergeInto: function (model) {
            if (!(model instanceof this.constructor)) {
                return false;
            }
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            for (var key in descriptors) {
                var keyValue = this[key];
                if (keyValue !== undefined && this.hasOwnProperty(key)) {
                    var modelValue = model[key];
                    if (modelValue === undefined || !model.hasOwnProperty(key)) {
                        model[key] = keyValue;
                    } else if ($isFunction(keyValue.mergeInto)) {
                        keyValue.mergeInto(modelValue);
                    }
                }
            }
            return true;
        }
    }, {
        /**
         * Maps the model value into json using a mapper function.
         * @method map
         * @static
         * @param   {Any}      value      -  model value
         * @param   {Fnction}  mapper     -  mapping function or class
         * @param   {Object}   [options]  -  mapping options
         * @returns {Object} json structured data.
         */                                
        map: function (value, mapper, options) {
            return $isArray(value)
                ? Array2.map(value, function (elem) {
                    return Model.map(elem, mapper, options)
                })
            : (mapper ? mapper(value, options) : value);
        },
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });
    
    eval(this.exports);
    
}

},{"../callback.js":4,"../context.js":5,"../miruken.js":12,"../validate":20}],19:[function(require,module,exports){
var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');
              require('./model.js');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.callback",
        exports: "ViewRegion,ViewRegionAware,PresentationPolicy,ButtonClicked"
    });

    eval(this.imports);

    /**
     * Protocol for rendering a view on the screen.
     * @class ViewRegion
     * @extends StrictProtocol
     */
    var ViewRegion = StrictProtocol.extend({
        /**
         * Gets the regions name.
         * @property {string} name
         */
        get name() {},
        /**
         * Gets the regions context.
         * @property {miruken.context.Context} context
         */
        get context() {},        
        /**
         * Gets the regions container element.
         * @property {DOMElement} container
         */
        get container() {},        
        /**
         * Gets the regions controller.
         * @property {miruken.mvc.Controller} controller
         */            
        get controller() {},
        /**
         * Gets the regions controller context.
         * @property {miruken.context.Context} controllerContext
         */            
        get controllerContext() {},        
        /**
         * Renders new presentation in the region.
         * @method present
         * @param    {Any}      presentation  -  presentation options
         * @returns  {Promise}  promise for the rendering.
         */                                        
        present: function (presentation) {}
    });

    /**
     * Protocol for communicating
     * {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}} lifecycle.
     * @class ViewRegionAware
     * @extends Protocol
     */
    var ViewRegionAware = Protocol.extend({
        viewRegionCreated: function (viewRegion) {}
    });
    
    /**
     * Base class for presentation policies.
     * @class PresentationPolicy
     * @extends miruken.mvc.Model
     */
    var PresentationPolicy = Model.extend();

    /**
     * Represents the clicking of a button.
     * @class ButtonClicked
     * @constructor
     * @param  {Any}     button       -  clicked button
     * @param  {number}  buttonIndex  -  index of clicked button 
     * @extends Base
     */
    var ButtonClicked = Base.extend({
        constructor: function (button, buttonIndex) {
            this.extend({
                /**
                 * Gets the clicked button.
                 * @property {Any} button
                 */                                
                get button() { return button; },
                /**
                 * Gets the clicked button index.
                 * @property {number} button index
                 */                                
                get buttonIndex() { return buttonIndex; }
            });
        }
    });

    CallbackHandler.implement({
        /**
         * Applies the presentation policy to the handler.
         * @method presenting
         * @returns {miruken.callback.CallbackHandler} presenting handler.
         * @for miruken.callback.CallbackHandler
         */
        presenting: function (policy) {
            return policy ? this.decorate({
                $handle: [PresentationPolicy, function (presenting) {
                    return policy.mergeInto(presenting);
                }]
            }) : this;
        }
    });
    
    eval(this.exports);
    
}

},{"../callback.js":4,"../context.js":5,"../miruken.js":12,"../validate":20,"./model.js":18}],20:[function(require,module,exports){
module.exports = require('./validate.js');
require('./validatejs.js');


},{"./validate.js":21,"./validatejs.js":22}],21:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../callback.js');

new function () { // closure

    /**
     * Package providing validation support.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}} and
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule validate
     * @namespace miruken.validate
     * @class $
     */    
    miruken.package(this, {
        name:    "validate",
        imports: "miruken,miruken.callback",
        exports: "Validating,Validator,Validation,ValidationResult,ValidationCallbackHandler,$validate,$validateThat"
    });

    eval(this.imports);

    /**
     * Validation definition group.
     * @property {Function} $validate
     * @for miruken.validate.$
     */
    var $validate = $define('$validate');

    /**
     * Protocol for validating objects.
     * @class Validating
     * @extends miruken.Protocol
     */        
    var Validating = Protocol.extend({
        /**
         * Validates the object in the scope.
         * @method validate 
         * @param   {Object} object     -  object to validate
         * @param   {Object} scope      -  scope of validation
         * @param   {Object} [results]  -  validation results
         * @returns {miruken.validate.ValidationResult}  validation results.
         */
        validate: function (object, scope, results) {},
        /**
         * Validates the object asynchronously in the scope.
         * @method validateAsync
         * @param   {Object} object     - object to validate
         * @param   {Object} scope      - scope of validation
         * @param   {Object} [results]  - validation results
         * @returns {Promise} promise of validation results.
         * @async
         */
        validateAsync: function (object, scope, results) {}
    });

    /**
     * Protocol for validating objects strictly.
     * @class Validator
     * @extends miruken.StrictProtocol
     * @uses miruken.validate.Validating
     */        
    var Validator = StrictProtocol.extend(Validating);
    
    /**
     * Callback representing the validation of an object.
     * @class Validation
     * @constructor
     * @param   {Object}    object  -  object to validate
     * @param   {boolean}   async   -  true if validate asynchronously
     * @param   {Any}       scope   -  scope of validation
     * @param   {miruken.validate.ValidationResult} results  -  results to validate to
     * @extends Base
     */
    var Validation = Base.extend({
        constructor: function (object, async, scope, results) {
            var _asyncResults;
            async   = !!async;
            results = results || new ValidationResult;
            this.extend({
                /**
                 * true if asynchronous, false if synchronous.
                 * @property {boolean} async
                 * @readOnly
                 */                
                get isAsync() { return async; },
                /**
                 * Gets the target object to validate.
                 * @property {Object} object
                 * @readOnly
                 */                                
                get object() { return object; },
                /**
                 * Gets the scope of validation.
                 * @property {Any} scope
                 * @readOnly
                 */                                                
                get scope() { return scope; },
                /**
                 * Gets the validation results.
                 * @property {miruken.validate.ValidationResult} results
                 * @readOnly
                 */                                                                
                get results() { return results; },
                /**
                 * Gets the async validation results.
                 * @property {miruken.validate.ValidationResult} results
                 * @readOnly
                 */                                                                                
                get asyncResults() { return _asyncResults; },
                /**
                 * Adds an async validation result. (internal)
                 * @method addAsyncResult
                 */                        
                addAsyncResult: function (result) {
                    if ($isPromise(result)) {
                        (_asyncResults || (_asyncResults = [])).push(result);
                    }
                }
            });
        }
    });
    
    var IGNORE = ['valid', 'errors', 'addKey', 'addError'];

    /**
     * Captures structured validation errors.
     * @class ValidationResult
     * @constructor
     * @extends Base
     */    
    var ValidationResult = Base.extend({
        constructor: function () {
            var _errors, _summary;
            this.extend({
                /**
                 * true if object is valid, false otherwisw.
                 * @property {boolean} valid
                 * @readOnly
                 */                
                get valid() {
                    if (_errors || _summary) {
                        return false;
                    }
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key];
                        if ((result instanceof ValidationResult) && !result.valid) {
                            return false;
                        }
                    }
                    return true;
                },
                /**
                 * Gets aggregated validation errors.
                 * @property {Object} errors
                 * @readOnly
                 */                                
                get errors() {
                    if (_summary) {
                        return _summary;
                    }
                    if (_errors) {
                        _summary = {};
                        for (var name in _errors) {
                            _summary[name] = _errors[name].slice(0);
                        }
                    }
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key],
                            errors = (result instanceof ValidationResult) && result.errors;
                        if (errors) {
                            _summary = _summary || {};
                            for (name in errors) {
                                var named    = errors[name],
                                    existing = _summary[name];
                                for (var ii = 0; ii < named.length; ++ii) {
                                    var error = pcopy(named[ii]);
                                    error.key = error.key ? (key + "." + error.key) : key;
                                    if (existing) {
                                        existing.push(error);
                                    } else {
                                        _summary[name] = existing = [error];
                                    }
                                }
                            }
                        }
                    }
                    return _summary;
                },
               /**
                * Gets or adds validation results for the key.
                * @method addKey
                * @param  {string} key  -  property name
                * @results {miruken.validate.ValidationResult} named validation results.
                */                
                addKey: function (key) {
                    return this[key] || (this[key] = new ValidationResult);
                },
               /**
                * Adds a named validation error.
                * @method addError
                * @param  {string}  name   -  validator name
                * @param  {Object}  error  -  literal error details
                * @example
                *     Standard Keys:
                *        key      => contains the invalid key
                *        message  => contains the error message
                *        value    => contains the invalid valid
                */
                addError: function (name, error) {
                    var errors = (_errors || (_errors = {})),
                        named  = errors[name];
                    if (named) {
                        named.push(error);
                    } else {
                        errors[name] = [error];
                    }
                    _summary = null;
                    return this;
                },
                /**
                 * Clears all validation results.
                 * @method reset
                 * @returns {miruken.validate.ValidationResult} receiving results
                 * @chainable
                 */
                reset: function () { 
                    _errors = _summary = undefined;
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key];
                        if ((result instanceof ValidationResult)) {
                            delete this[key];
                        }
                    }
                    return this;
                }
            });
        }
    });

    /**
     * CallbackHandler for performing validation.
     * <p>
     * Once an object is validated, it will receive a **$validation** property containing the validation results.
     * </p>
     * @class ValidationCallbackHandler
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.validate.Validator
     * @uses miruken.validate.Validating
     */        
    var ValidationCallbackHandler = CallbackHandler.extend(Validator, {
        validate: function (object, scope, results) {
            if ($isNothing(object)) {
                throw new TypeError("Missing object to validate.");
            }
            var validation = new Validation(object, false, scope, results);
            $composer.handle(validation, true);
            results = validation.results;
            _bindValidationResults(object, results);
            _validateThat(validation, null, $composer);
            return results;
        },
        validateAsync: function (object, scope, results) {
            if ($isNothing(object)) {
                throw new TypeError("Missing object to validate.");
            }            
            var validation = new Validation(object, true, scope, results),
                composer   = $composer;
            return composer.deferAll(validation).then(function () {
                results = validation.results;
                _bindValidationResults(object, results);
                var asyncResults = [];
                _validateThat(validation, asyncResults, composer);
                return asyncResults.length > 0
                     ? Promise.all(asyncResults).return(results)
                     : results;
            });
        }
    });

    $handle(CallbackHandler, Validation, function (validation, composer) {
        var target = validation.object,
            source = $classOf(target);
        if (source) {
            $validate.dispatch(this, validation, source, composer, true, validation.addAsyncResult);
            var asyncResults = validation.asyncResults;
            if (asyncResults) {
                return Promise.all(asyncResults);
            }
        }
    });

    /**
     * Metamacro for class-based validation.
     * @class $validateThat
     * @extends miruken.MetaMacro
     */    
    var $validateThat = MetaMacro.extend({
        execute: function _(step, metadata, target, definition) {
            var validateThat = this.extractProperty('$validateThat', target, definition);
            if (!validateThat) {
                return;
            }
            var validators = {};
            for (var name in validateThat) {
                var validator = validateThat[name];
                if ($isArray(validator)) {
                    var dependencies = validator.slice(0);
                    validator = dependencies.pop();
                    if (!$isFunction(validator)) {
                        continue;
                    }
                    if (dependencies.length > 0) {
                        validator = (function (nm, val, deps) {
                            return function (validation, composer) {
                                var d = Array2.concat(deps, Array2.map(arguments, $use));
                                return Invoking(composer).invoke(val, d, this);
                            }
                        })(name, validator, dependencies);
                    }
                }
                if ($isFunction(validator)) {
                    name = 'validateThat' + name.charAt(0).toUpperCase() + name.slice(1);
                    validators[name] = validator;
                }
                if (step == MetaStep.Extend) {
                    target.extend(validators);
                } else {
                    metadata.getClass().implement(validators);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */         
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */
        isActive: True
    });

    function _validateThat(validation, asyncResults, composer) {
        var object = validation.object;
        for (var key in object) {
            if (key.lastIndexOf('validateThat', 0) == 0) {
                var validator   = object[key],
                    returnValue = validator.call(object, validation, composer);
                if (asyncResults && $isPromise(returnValue)) {
                    asyncResults.push(returnValue);
                }
            }
        }
    }

    function _bindValidationResults(object, results) {
        var spec = _bindValidationResults.spec || 
            (_bindValidationResults.spec = {
                enumerable:   false,
                configurable: true,
                writable:     false
        });
        spec.value = results;
        Object.defineProperty(object, '$validation', spec);
        delete spec.value;
    }

    CallbackHandler.implement({
        $valid: function (target, scope) {
            return this.aspect(function (_, composer) {
                return Validator(composer).validate(target, scope).valid;
            });
        },
        $validAsync: function (target, scope) {
            return this.aspect(function (_, composer) {
                return Validator(composer).validateAsync(target, scope).then(function (results) {
                    return results.valid;
                });
            });
        }        
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}

},{"../callback.js":4,"../miruken.js":12,"bluebird":23}],22:[function(require,module,exports){
var miruken    = require('../miruken.js'),
    validate   = require('./validate.js'),
    validatejs = require("validate.js"),
    Promise    = require('bluebird');
                 require('../callback.js');

new function () { // closure

    /**
     * @module miruken
     * @submodule validate
     * @namespace miruken.validate
     * @class $
     */    
    miruken.package(this, {
        name:    "validate",
        imports: "miruken,miruken.callback,miruken.validate",
        exports: "ValidationRegistry,ValidateJsCallbackHandler,$required,$nested"
    });

    eval(this.imports);

    validatejs.Promise = Promise;

    var DETAILED    = { format: "detailed" },
        VALIDATABLE = { validate: undefined },
        /**
         * Shortcut to indicate required property.
         * @property {Object} $required
         * @readOnly
         * @for miruken.validate.$ 
         */
        $required = Object.freeze({ presence: true }),
        /**
         * Shortcut to indicate nested validation.
         * @property {Object} $nested
         * @readOnly
         * @for miruken.validate.$ 
         */
        $nested = Object.freeze({ nested: true });

    validatejs.validators.nested = Undefined;

    /**
     * Metamacro to register custom validators with [validate.js](http://validatejs.org).
     * <pre>
     *    var CustomValidators = Base.extend($registerValidators, {
     *        uniqueUserName: [Database, function (db, userName) {
     *            if (db.hasUserName(userName)) {
     *               return "UserName " + userName + " is already taken";
     *            }
     *        }]
     *    })
     * </pre>
     * would register a uniqueUserName validator with a Database dependency.
     * @class $registerValidators
     * @extends miruken.MetaMacro
     */    
    var $registerValidators = MetaMacro.extend({
        execute: function (step, metadata, target, definition) {
            if (step === MetaStep.Subclass || step === MetaStep.Implement) {
                for (var name in definition) {
                    var validator = definition[name];
                    if ($isArray(validator)) {
                        var dependencies = validator.slice(0);
                        validator = dependencies.pop();
                        if (!$isFunction(validator)) {
                            continue;
                        }
                        if (dependencies.length > 0) {
                            validator = (function (nm, val, deps) {
                                return function () {
                                    if (!$composer) {
                                        throw new Error("Unable to invoke validator '" + nm + "'.");
                                    }
                                    var d = Array2.concat(deps, Array2.map(arguments, $use));
                                    return Invoking($composer).invoke(val, d);
                                }
                            })(name, validator, dependencies);
                        }
                    }
                    if ($isFunction(validator)) {
                        validatejs.validators[name] = validator;
                    }
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */        
        isActive: True
    });

    /**
     * Base class to define custom validators using
     * {{#crossLink "miruken.validate.$registerValidators"}}{{/crossLink}}.
     * <pre>
     *    var CustomValidators = ValidationRegistry.extend({
     *        creditCardNumber: function (cardNumber, options, key, attributes) {
     *           // do the check...
     *        }
     *    })
     * </pre>
     * would register a creditCardNumber validator function.
     * @class ValidationRegistry
     * @constructor
     * @extends Abstract
     */        
    var ValidationRegistry = Abstract.extend($registerValidators);

    /**
     * CallbackHandler for performing validation using [validate.js](http://validatejs.org)
     * <p>
     * Classes participate in validation by declaring **validate** constraints on properties.
     * </p>
     * <pre>
     * var Address = Base.extend({
     *     $properties: {
     *         line:    { <b>validate</b>: { presence: true } },
     *         city:    { <b>validate</b>: { presence: true } },
     *         state:   { 
     *             <b>validate</b>: {
     *                 presence: true,
     *                 length: { is: 2 }
     *             }
     *         },
     *         zipcode: { 
     *             <b>validate</b>: {
     *                 presence: true,
     *                 length: { is: 5 }
     *         }
     *     }
     * })
     * </pre>
     * @class ValidateJsCallbackHandler
     * @extends miruken.callback.CallbackHandler
     */            
    var ValidateJsCallbackHandler = CallbackHandler.extend({
        $validate: [
            null,  function (validation, composer) {
                var target      = validation.object,
                    nested      = {},
                    constraints = _buildConstraints(target, nested);
                if (constraints) {
                    var scope     = validation.scope,
                        results   = validation.results,
                        validator = Validator(composer); 
                    if (validation.isAsync) {
                        return validatejs.async(target, constraints, DETAILED)
                            .then(function (valid) {
                                 return _validateNestedAsync(validator, scope, results, nested);
                            }, function (errors) {
                                if (errors instanceof Error) {
                                    return Promise.reject(errors);
                                }
                                return _validateNestedAsync(validator, scope, results, nested).then(function () {
                                    _mapResults(results, errors);
                                });
                            });
                    } else {
                        var errors = validatejs(target, constraints, DETAILED);
                        for (var key in nested) {
                            var child = nested[key];
                            if (child instanceof Array) {
                                for (var i = 0; i < child.length; ++i) {
                                    validator.validate(child[i], scope, results.addKey(key + '.' + i));
                                }
                            } else {
                                validator.validate(child, scope, results.addKey(key));
                            }
                        }
                        _mapResults(results, errors);
                    }
                }
            }
        ]
    });

    function _validateNestedAsync(validator, scope, results, nested) {
        var pending = [];
        for (var key in nested) {
            var child = nested[key], childResults;
            if (child instanceof Array) {
                for (var i = 0; i < child.length; ++i) {
                    childResults = results.addKey(key + '.' + i);
                    childResults = validator.validateAsync(child[i], scope, childResults);
                    pending.push(childResults);
                }
            } else {
                childResults = results.addKey(key);
                childResults = validator.validateAsync(child, scope, childResults);
                pending.push(childResults);
            }
        }
        return Promise.all(pending);
    }

    function _mapResults(results, errors) {
        if (errors) {
            Array2.forEach(errors, function (error) {
                results.addKey(error.attribute).addError(error.validator, {
                    message: error.error,
                    value:   error.value 
                });
            });
        }
    }

    function _buildConstraints(target, nested) {
        var meta        = target.$meta,
            descriptors = meta && meta.getDescriptor(VALIDATABLE),
            constraints;
        if (descriptors) {
            for (var key in descriptors) {
                var descriptor = descriptors[key],
                    validate   = descriptor.validate;
                (constraints || (constraints = {}))[key] = validate;
                for (name in validate) {
                    if (name === 'nested') {
                        var child = target[key];
                        if (child) {
                            nested[key] = child;
                        }
                    } else if (!(name in validatejs.validators)) {
                        validatejs.validators[name] = function () {
                            var validator = $composer && $composer.resolve(name);
                            if (!validator) {
                                throw new Error("Unable to resolve validator '" + name + "'.");
                            }
                            return validator.validate.apply(validator, arguments);
                        };
                    }
                }
            }
            return constraints;
        }
    }

    eval(this.exports);

}

},{"../callback.js":4,"../miruken.js":12,"./validate.js":21,"bluebird":23,"validate.js":25}],23:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.10.2
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var util = _dereq_("./util.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.enableTrampoline = function() {
    if (!this._trampolineEnabled) {
        this._trampolineEnabled = true;
        this._schedule = function(fn) {
            setTimeout(fn, 0);
        };
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    if (schedule.isStatic) {
        schedule = function(fn) { setTimeout(fn, 0); };
    }
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31,"./util.js":38}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        maybePromise._then(function() {
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    async.enableTrampoline();
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundValue();
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (util.isNode && process.env["BLUEBIRD_DEBUG"] == 0) debugging = false;

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ignoreRejections = function() {
    this._unsetRejectionIsUnhandled();
    this._bitField = this._bitField | 16777216;
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 16777216) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};
var returnUndefined = function() {};
var throwUndefined = function() {
    throw undefined;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value === undefined) return this.then(returnUndefined);

    if (isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    } else if (value instanceof Promise) {
        value._ignoreRejections();
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (reason === undefined) return this.then(throwUndefined);

    if (isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue())
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue(), value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundValue();
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback =
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var util = _dereq_("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var UNDEFINED_BINDING = {};
var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + 2] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./progress.js")(Promise, PromiseArray);
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./call_get.js')(Promise);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._ignoreRejections();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key, fn, suffix);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundValue();
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
var util = _dereq_("./util");
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    
    var err;
    if(!util.isPrimitive(message) && (message instanceof Error)) {
        err = message;
    } else {
        if (typeof message !== "string") {
            message = "operation timed out";
        }
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = spreadArgs
                        ? fn.apply(undefined, vals) : fn.call(undefined,  vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function f() {}
    f.prototype = obj;
    var l = 8;
    while (l--) new f();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":24}],24:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],25:[function(require,module,exports){
//     Validate.js 0.7.0

//     (c) 2013-2015 Nicklas Ansman, 2013 Wrapp
//     Validate.js may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://validatejs.org/

(function(exports, module, define) {
  "use strict";

  // The main function that calls the validators specified by the constraints.
  // The options are the following:
  //   - format (string) - An option that controls how the returned value is formatted
  //     * flat - Returns a flat array of just the error messages
  //     * grouped - Returns the messages grouped by attribute (default)
  //     * detailed - Returns an array of the raw validation data
  //   - fullMessages (boolean) - If `true` (default) the attribute name is prepended to the error.
  //
  // Please note that the options are also passed to each validator.
  var validate = function(attributes, constraints, options) {
    options = v.extend({}, v.options, options);

    var results = v.runValidations(attributes, constraints, options)
      , attr
      , validator;

    for (attr in results) {
      for (validator in results[attr]) {
        if (v.isPromise(results[attr][validator])) {
          throw new Error("Use validate.async if you want support for promises");
        }
      }
    }
    return validate.processValidationResults(results, options);
  };

  var v = validate;

  // Copies over attributes from one or more sources to a single destination.
  // Very much similar to underscore's extend.
  // The first argument is the target object and the remaining arguments will be
  // used as targets.
  v.extend = function(obj) {
    [].slice.call(arguments, 1).forEach(function(source) {
      for (var attr in source) {
        obj[attr] = source[attr];
      }
    });
    return obj;
  };

  v.extend(validate, {
    // This is the version of the library as a semver.
    // The toString function will allow it to be coerced into a string
    version: {
      major: 0,
      minor: 7,
      patch: 0,
      metadata: null,
      toString: function() {
        var version = v.format("%{major}.%{minor}.%{patch}", v.version);
        if (!v.isEmpty(v.version.metadata)) {
          version += "+" + v.version.metadata;
        }
        return version;
      }
    },

    // Below is the dependencies that are used in validate.js

    // The constructor of the Promise implementation.
    // If you are using Q.js, RSVP or any other A+ compatible implementation
    // override this attribute to be the constructor of that promise.
    // Since jQuery promises aren't A+ compatible they won't work.
    Promise: typeof Promise !== "undefined" ? Promise : /* istanbul ignore next */ null,

    // If moment is used in node, browserify etc please set this attribute
    // like this: `validate.moment = require("moment");
    moment: typeof moment !== "undefined" ? moment : /* istanbul ignore next */ null,

    XDate: typeof XDate !== "undefined" ? XDate : /* istanbul ignore next */ null,

    EMPTY_STRING_REGEXP: /^\s*$/,

    // Runs the validators specified by the constraints object.
    // Will return an array of the format:
    //     [{attribute: "<attribute name>", error: "<validation result>"}, ...]
    runValidations: function(attributes, constraints, options) {
      var results = []
        , attr
        , validatorName
        , value
        , validators
        , validator
        , validatorOptions
        , error;

      if (v.isDomElement(attributes)) {
        attributes = v.collectFormValues(attributes);
      }

      // Loops through each constraints, finds the correct validator and run it.
      for (attr in constraints) {
        value = v.getDeepObjectValue(attributes, attr);
        // This allows the constraints for an attribute to be a function.
        // The function will be called with the value, attribute name, the complete dict of
        // attributes as well as the options and constraints passed in.
        // This is useful when you want to have different
        // validations depending on the attribute value.
        validators = v.result(constraints[attr], value, attributes, attr, options, constraints);

        for (validatorName in validators) {
          validator = v.validators[validatorName];

          if (!validator) {
            error = v.format("Unknown validator %{name}", {name: validatorName});
            throw new Error(error);
          }

          validatorOptions = validators[validatorName];
          // This allows the options to be a function. The function will be
          // called with the value, attribute name, the complete dict of
          // attributes as well as the options and constraints passed in.
          // This is useful when you want to have different
          // validations depending on the attribute value.
          validatorOptions = v.result(validatorOptions, value, attributes, attr, options, constraints);
          if (!validatorOptions) {
            continue;
          }
          results.push({
            attribute: attr,
            value: value,
            validator: validatorName,
            options: validatorOptions,
            error: validator.call(validator, value, validatorOptions, attr,
                                  attributes)
          });
        }
      }

      return results;
    },

    // Takes the output from runValidations and converts it to the correct
    // output format.
    processValidationResults: function(errors, options) {
      var attr;

      errors = v.pruneEmptyErrors(errors, options);
      errors = v.expandMultipleErrors(errors, options);
      errors = v.convertErrorMessages(errors, options);

      switch (options.format || "grouped") {
        case "detailed":
          // Do nothing more to the errors
          break;

        case "flat":
          errors = v.flattenErrorsToArray(errors);
          break;

        case "grouped":
          errors = v.groupErrorsByAttribute(errors);
          for (attr in errors) {
            errors[attr] = v.flattenErrorsToArray(errors[attr]);
          }
          break;

        default:
          throw new Error(v.format("Unknown format %{format}", options));
      }

      return v.isEmpty(errors) ? undefined : errors;
    },

    // Runs the validations with support for promises.
    // This function will return a promise that is settled when all the
    // validation promises have been completed.
    // It can be called even if no validations returned a promise.
    async: function(attributes, constraints, options) {
      options = v.extend({}, v.async.options, options);
      var results = v.runValidations(attributes, constraints, options);

      return new v.Promise(function(resolve, reject) {
        v.waitForResults(results).then(function() {
          var errors = v.processValidationResults(results, options);
          if (errors) {
            reject(errors);
          } else {
            resolve(attributes);
          }
        }, function(err) {
          reject(err);
        });
      });
    },

    single: function(value, constraints, options) {
      options = v.extend({}, v.single.options, options, {
        format: "flat",
        fullMessages: false
      });
      return v({single: value}, {single: constraints}, options);
    },

    // Returns a promise that is resolved when all promises in the results array
    // are settled. The promise returned from this function is always resolved,
    // never rejected.
    // This function modifies the input argument, it replaces the promises
    // with the value returned from the promise.
    waitForResults: function(results) {
      // Create a sequence of all the results starting with a resolved promise.
      return results.reduce(function(memo, result) {
        // If this result isn't a promise skip it in the sequence.
        if (!v.isPromise(result.error)) {
          return memo;
        }

        return memo.then(function() {
          return result.error.then(
            function() {
              result.error = null;
            },
            function(error) {
              // If for some reason the validator promise was rejected but no
              // error was specified.
              if (!error) {
                v.warn("Validator promise was rejected but didn't return an error");
              } else if (error instanceof Error) {
                throw error;
              }
              result.error = error;
            }
          );
        });
      }, new v.Promise(function(r) { r(); })); // A resolved promise
    },

    // If the given argument is a call: function the and: function return the value
    // otherwise just return the value. Additional arguments will be passed as
    // arguments to the function.
    // Example:
    // ```
    // result('foo') // 'foo'
    // result(Math.max, 1, 2) // 2
    // ```
    result: function(value) {
      var args = [].slice.call(arguments, 1);
      if (typeof value === 'function') {
        value = value.apply(null, args);
      }
      return value;
    },

    // Checks if the value is a number. This function does not consider NaN a
    // number like many other `isNumber` functions do.
    isNumber: function(value) {
      return typeof value === 'number' && !isNaN(value);
    },

    // Returns false if the object is not a function
    isFunction: function(value) {
      return typeof value === 'function';
    },

    // A simple check to verify that the value is an integer. Uses `isNumber`
    // and a simple modulo check.
    isInteger: function(value) {
      return v.isNumber(value) && value % 1 === 0;
    },

    // Uses the `Object` function to check if the given argument is an object.
    isObject: function(obj) {
      return obj === Object(obj);
    },

    // Returns false if the object is `null` of `undefined`
    isDefined: function(obj) {
      return obj !== null && obj !== undefined;
    },

    // Checks if the given argument is a promise. Anything with a `then`
    // function is considered a promise.
    isPromise: function(p) {
      return !!p && v.isFunction(p.then);
    },

    isDomElement: function(o) {
      if (!o) {
        return false;
      }

      if (!v.isFunction(o.querySelectorAll) || !v.isFunction(o.querySelector)) {
        return false;
      }

      if (v.isObject(document) && o === document) {
        return true;
      }

      // http://stackoverflow.com/a/384380/699304
      /* istanbul ignore else */
      if (typeof HTMLElement === "object") {
        return o instanceof HTMLElement;
      } else {
        return o &&
          typeof o === "object" &&
          o !== null &&
          o.nodeType === 1 &&
          typeof o.nodeName === "string";
      }
    },

    isEmpty: function(value) {
      var attr;

      // Null and undefined are empty
      if (!v.isDefined(value)) {
        return true;
      }

      // functions are non empty
      if (v.isFunction(value)) {
        return false;
      }

      // Whitespace only strings are empty
      if (v.isString(value)) {
        return v.EMPTY_STRING_REGEXP.test(value);
      }

      // For arrays we use the length property
      if (v.isArray(value)) {
        return value.length === 0;
      }

      // If we find at least one property we consider it non empty
      if (v.isObject(value)) {
        for (attr in value) {
          return false;
        }
        return true;
      }

      return false;
    },

    // Formats the specified strings with the given values like so:
    // ```
    // format("Foo: %{foo}", {foo: "bar"}) // "Foo bar"
    // ```
    // If you want to write %{...} without having it replaced simply
    // prefix it with % like this `Foo: %%{foo}` and it will be returned
    // as `"Foo: %{foo}"`
    format: v.extend(function(str, vals) {
      return str.replace(v.format.FORMAT_REGEXP, function(m0, m1, m2) {
        if (m1 === '%') {
          return "%{" + m2 + "}";
        } else {
          return String(vals[m2]);
        }
      });
    }, {
      // Finds %{key} style patterns in the given string
      FORMAT_REGEXP: /(%?)%\{([^\}]+)\}/g
    }),

    // "Prettifies" the given string.
    // Prettifying means replacing [.\_-] with spaces as well as splitting
    // camel case words.
    prettify: function(str) {
      if (v.isNumber(str)) {
        // If there are more than 2 decimals round it to two
        if ((str * 100) % 1 === 0) {
          return "" + str;
        } else {
          return parseFloat(Math.round(str * 100) / 100).toFixed(2);
        }
      }

      if (v.isArray(str)) {
        return str.map(function(s) { return v.prettify(s); }).join(", ");
      }

      if (v.isObject(str)) {
        return str.toString();
      }

      // Ensure the string is actually a string
      str = "" + str;

      return str
        // Splits keys separated by periods
        .replace(/([^\s])\.([^\s])/g, '$1 $2')
        // Removes backslashes
        .replace(/\\+/g, '')
        // Replaces - and - with space
        .replace(/[_-]/g, ' ')
        // Splits camel cased words
        .replace(/([a-z])([A-Z])/g, function(m0, m1, m2) {
          return "" + m1 + " " + m2.toLowerCase();
        })
        .toLowerCase();
    },

    stringifyValue: function(value) {
      return v.prettify(value);
    },

    isString: function(value) {
      return typeof value === 'string';
    },

    isArray: function(value) {
      return {}.toString.call(value) === '[object Array]';
    },

    contains: function(obj, value) {
      if (!v.isDefined(obj)) {
        return false;
      }
      if (v.isArray(obj)) {
        return obj.indexOf(value) !== -1;
      }
      return value in obj;
    },

    getDeepObjectValue: function(obj, keypath) {
      if (!v.isObject(obj) || !v.isString(keypath)) {
        return undefined;
      }

      var key = ""
        , i
        , escape = false;

      for (i = 0; i < keypath.length; ++i) {
        switch (keypath[i]) {
          case '.':
            if (escape) {
              escape = false;
              key += '.';
            } else if (key in obj) {
              obj = obj[key];
              key = "";
            } else {
              return undefined;
            }
            break;

          case '\\':
            if (escape) {
              escape = false;
              key += '\\';
            } else {
              escape = true;
            }
            break;

          default:
            escape = false;
            key += keypath[i];
            break;
        }
      }

      if (v.isDefined(obj) && key in obj) {
        return obj[key];
      } else {
        return undefined;
      }
    },

    // This returns an object with all the values of the form.
    // It uses the input name as key and the value as value
    // So for example this:
    // <input type="text" name="email" value="foo@bar.com" />
    // would return:
    // {email: "foo@bar.com"}
    collectFormValues: function(form, options) {
      var values = {}
        , i
        , input
        , inputs
        , value;

      if (!form) {
        return values;
      }

      options = options || {};

      inputs = form.querySelectorAll("input[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);

        if (v.isDefined(input.getAttribute("data-ignored"))) {
          continue;
        }

        value = v.sanitizeFormValue(input.value, options);
        if (input.type === "number") {
          value = +value;
        } else if (input.type === "checkbox") {
          if (input.attributes.value) {
            if (!input.checked) {
              value = values[input.name] || null;
            }
          } else {
            value = input.checked;
          }
        } else if (input.type === "radio") {
          if (!input.checked) {
            value = values[input.name] || null;
          }
        }
        values[input.name] = value;
      }

      inputs = form.querySelectorAll("select[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);
        value = v.sanitizeFormValue(input.options[input.selectedIndex].value, options);
        values[input.name] = value;
      }

      return values;
    },

    sanitizeFormValue: function(value, options) {
      if (options.trim && v.isString(value)) {
        value = value.trim();
      }

      if (options.nullify !== false && value === "") {
        return null;
      }
      return value;
    },

    capitalize: function(str) {
      if (!v.isString(str)) {
        return str;
      }
      return str[0].toUpperCase() + str.slice(1);
    },

    // Remove all errors who's error attribute is empty (null or undefined)
    pruneEmptyErrors: function(errors) {
      return errors.filter(function(error) {
        return !v.isEmpty(error.error);
      });
    },

    // In
    // [{error: ["err1", "err2"], ...}]
    // Out
    // [{error: "err1", ...}, {error: "err2", ...}]
    //
    // All attributes in an error with multiple messages are duplicated
    // when expanding the errors.
    expandMultipleErrors: function(errors) {
      var ret = [];
      errors.forEach(function(error) {
        // Removes errors without a message
        if (v.isArray(error.error)) {
          error.error.forEach(function(msg) {
            ret.push(v.extend({}, error, {error: msg}));
          });
        } else {
          ret.push(error);
        }
      });
      return ret;
    },

    // Converts the error mesages by prepending the attribute name unless the
    // message is prefixed by ^
    convertErrorMessages: function(errors, options) {
      options = options || {};

      var ret = [];
      errors.forEach(function(errorInfo) {
        var error = errorInfo.error;

        if (error[0] === '^') {
          error = error.slice(1);
        } else if (options.fullMessages !== false) {
          error = v.capitalize(v.prettify(errorInfo.attribute)) + " " + error;
        }
        error = error.replace(/\\\^/g, "^");
        error = v.format(error, {value: v.stringifyValue(errorInfo.value)});
        ret.push(v.extend({}, errorInfo, {error: error}));
      });
      return ret;
    },

    // In:
    // [{attribute: "<attributeName>", ...}]
    // Out:
    // {"<attributeName>": [{attribute: "<attributeName>", ...}]}
    groupErrorsByAttribute: function(errors) {
      var ret = {};
      errors.forEach(function(error) {
        var list = ret[error.attribute];
        if (list) {
          list.push(error);
        } else {
          ret[error.attribute] = [error];
        }
      });
      return ret;
    },

    // In:
    // [{error: "<message 1>", ...}, {error: "<message 2>", ...}]
    // Out:
    // ["<message 1>", "<message 2>"]
    flattenErrorsToArray: function(errors) {
      return errors.map(function(error) { return error.error; });
    },

    exposeModule: function(validate, root, exports, module, define) {
      if (exports) {
        if (module && module.exports) {
          exports = module.exports = validate;
        }
        exports.validate = validate;
      } else {
        root.validate = validate;
        if (validate.isFunction(define) && define.amd) {
          define([], function () { return validate; });
        }
      }
    },

    warn: function(msg) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(msg);
      }
    },

    error: function(msg) {
      if (typeof console !== "undefined" && console.error) {
        console.error(msg);
      }
    }
  });

  validate.validators = {
    // Presence validates that the value isn't empty
    presence: function(value, options) {
      options = v.extend({}, this.options, options);
      if (v.isEmpty(value)) {
        return options.message || this.message || "can't be blank";
      }
    },
    length: function(value, options, attribute) {
      // Empty values are allowed
      if (v.isEmpty(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var is = options.is
        , maximum = options.maximum
        , minimum = options.minimum
        , tokenizer = options.tokenizer || function(val) { return val; }
        , err
        , errors = [];

      value = tokenizer(value);
      var length = value.length;
      if(!v.isNumber(length)) {
        v.error(v.format("Attribute %{attr} has a non numeric value for `length`", {attr: attribute}));
        return options.message || this.notValid || "has an incorrect length";
      }

      // Is checks
      if (v.isNumber(is) && length !== is) {
        err = options.wrongLength ||
          this.wrongLength ||
          "is the wrong length (should be %{count} characters)";
        errors.push(v.format(err, {count: is}));
      }

      if (v.isNumber(minimum) && length < minimum) {
        err = options.tooShort ||
          this.tooShort ||
          "is too short (minimum is %{count} characters)";
        errors.push(v.format(err, {count: minimum}));
      }

      if (v.isNumber(maximum) && length > maximum) {
        err = options.tooLong ||
          this.tooLong ||
          "is too long (maximum is %{count} characters)";
        errors.push(v.format(err, {count: maximum}));
      }

      if (errors.length > 0) {
        return options.message || errors;
      }
    },
    numericality: function(value, options) {
      // Empty values are fine
      if (v.isEmpty(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var errors = []
        , name
        , count
        , checks = {
            greaterThan:          function(v, c) { return v > c; },
            greaterThanOrEqualTo: function(v, c) { return v >= c; },
            equalTo:              function(v, c) { return v === c; },
            lessThan:             function(v, c) { return v < c; },
            lessThanOrEqualTo:    function(v, c) { return v <= c; }
          };

      // Coerce the value to a number unless we're being strict.
      if (options.noStrings !== true && v.isString(value)) {
        value = +value;
      }

      // If it's not a number we shouldn't continue since it will compare it.
      if (!v.isNumber(value)) {
        return options.message || this.notValid || "is not a number";
      }

      // Same logic as above, sort of. Don't bother with comparisons if this
      // doesn't pass.
      if (options.onlyInteger && !v.isInteger(value)) {
        return options.message || this.notInteger  || "must be an integer";
      }

      for (name in checks) {
        count = options[name];
        if (v.isNumber(count) && !checks[name](value, count)) {
          // This picks the default message if specified
          // For example the greaterThan check uses the message from
          // this.notGreaterThan so we capitalize the name and prepend "not"
          var msg = this["not" + v.capitalize(name)] ||
            "must be %{type} %{count}";

          errors.push(v.format(msg, {
            count: count,
            type: v.prettify(name)
          }));
        }
      }

      if (options.odd && value % 2 !== 1) {
        errors.push(this.notOdd || "must be odd");
      }
      if (options.even && value % 2 !== 0) {
        errors.push(this.notEven || "must be even");
      }

      if (errors.length) {
        return options.message || errors;
      }
    },
    datetime: v.extend(function(value, options) {
      // Empty values are fine
      if (v.isEmpty(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var err
        , errors = []
        , earliest = options.earliest ? this.parse(options.earliest, options) : NaN
        , latest = options.latest ? this.parse(options.latest, options) : NaN;

      value = this.parse(value, options);

      // 86400000 is the number of seconds in a day, this is used to remove
      // the time from the date
      if (isNaN(value) || options.dateOnly && value % 86400000 !== 0) {
        return options.message || this.notValid || "must be a valid date";
      }

      if (!isNaN(earliest) && value < earliest) {
        err = this.tooEarly || "must be no earlier than %{date}";
        err = v.format(err, {date: this.format(earliest, options)});
        errors.push(err);
      }

      if (!isNaN(latest) && value > latest) {
        err = this.tooLate || "must be no later than %{date}";
        err = v.format(err, {date: this.format(latest, options)});
        errors.push(err);
      }

      if (errors.length) {
        return options.message || errors;
      }
    }, {
      // This is the function that will be used to convert input to the number
      // of millis since the epoch.
      // It should return NaN if it's not a valid date.
      parse: function(value, options) {
        if (v.isFunction(v.XDate)) {
          return new v.XDate(value, true).getTime();
        }

        if (v.isDefined(v.moment)) {
          return +v.moment.utc(value);
        }

        throw new Error("Neither XDate or moment.js was found");
      },
      // Formats the given timestamp. Uses ISO8601 to format them.
      // If options.dateOnly is true then only the year, month and day will be
      // output.
      format: function(date, options) {
        var format = options.dateFormat;

        if (v.isFunction(v.XDate)) {
          format = format || (options.dateOnly ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm:ss");
          return new XDate(date, true).toString(format);
        }

        if (v.isDefined(v.moment)) {
          format = format || (options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm:ss");
          return v.moment.utc(date).format(format);
        }

        throw new Error("Neither XDate or moment.js was found");
      }
    }),
    date: function(value, options) {
      options = v.extend({}, options, {dateOnly: true});
      return v.validators.datetime.call(v.validators.datetime, value, options);
    },
    format: function(value, options) {
      if (v.isString(options) || (options instanceof RegExp)) {
        options = {pattern: options};
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is invalid"
        , pattern = options.pattern
        , match;

      // Empty values are allowed
      if (v.isEmpty(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }

      if (v.isString(pattern)) {
        pattern = new RegExp(options.pattern, options.flags);
      }
      match = pattern.exec(value);
      if (!match || match[0].length != value.length) {
        return message;
      }
    },
    inclusion: function(value, options) {
      // Empty values are fine
      if (v.isEmpty(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (v.contains(options.within, value)) {
        return;
      }
      var message = options.message ||
        this.message ||
        "^%{value} is not included in the list";
      return v.format(message, {value: value});
    },
    exclusion: function(value, options) {
      // Empty values are fine
      if (v.isEmpty(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (!v.contains(options.within, value)) {
        return;
      }
      var message = options.message || this.message || "^%{value} is restricted";
      return v.format(message, {value: value});
    },
    email: v.extend(function(value, options) {
      options = v.extend({}, this.options, options);
      var message = options.message || this.message || "is not a valid email";
      // Empty values are fine
      if (v.isEmpty(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }
      if (!this.PATTERN.exec(value)) {
        return message;
      }
    }, {
      PATTERN: /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
    }),
    equality: function(value, options, attribute, attributes) {
      if (v.isEmpty(value)) {
        return;
      }

      if (v.isString(options)) {
        options = {attribute: options};
      }
      options = v.extend({}, this.options, options);
      var message = options.message ||
        this.message ||
        "is not equal to %{attribute}";

      if (v.isEmpty(options.attribute) || !v.isString(options.attribute)) {
        throw new Error("The attribute must be a non empty string");
      }

      var otherValue = v.getDeepObjectValue(attributes, options.attribute)
        , comparator = options.comparator || function(v1, v2) {
          return v1 === v2;
        };

      if (!comparator(value, otherValue, options, attribute, attributes)) {
        return v.format(message, {attribute: v.prettify(options.attribute)});
      }
    }
  };

  validate.exposeModule(validate, this, exports, module, define);
}).call(this,
        typeof exports !== 'undefined' ? /* istanbul ignore next */ exports : null,
        typeof module !== 'undefined' ? /* istanbul ignore next */ module : null,
        typeof define !== 'undefined' ? /* istanbul ignore next */ define : null);

},{}]},{},[8,17,1]);
