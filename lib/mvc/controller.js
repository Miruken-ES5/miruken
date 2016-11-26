var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');
var Promise = require('bluebird');

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
        exports: "Controller,ControllerNotFound,Navigate,Navigation,NavigateCallbackHandler"
    });

    eval(this.imports);

    var globalPrepare = new Array2(),
        globalExecute = new Array2();

    /**
     * Captures a navigation context.
     * @class Navigation
     * @extends Base
     */        
    var Navigation = Base.extend({
        controller: undefined,
        action:     undefined,
        args:       undefined
    });
    
    /**
     * Protocol to navigate controllers.
     * @class Navigate
     * @extends miruken.StrictProtocol
     */
    var Navigate = StrictProtocol.extend({
        /**
         * Transitions to next `action` on `controller`.
         * @method next
         * @param   {Any}       controller  -  controller key
         * @param   {Function}  action      -  controller action
         * @returns {Promise} promise when transition complete.
         */        
        next: function (controller, action) {},
        /**
         * Transitions to next `action` on `controller` in a new context.
         * @method to
         * @param   {Any}       controller  -  controller key
         * @param   {Function}  action      -  controller action
         * @returns {Promise} promise when transition complete.
         */        
        push: function (controller, action) {}        
    });
    
    var $currentController = MetaMacro.extend({
        inflate: function (step, metadata, target, definition) {
            if (!Controller) { return; }
            Array2.forEach(Object.getOwnPropertyNames(definition), function (key) {
                if (key === "contructor" || key === "initialize") { return; }
                var member = Object.getOwnPropertyDescriptor(definition, key);
                if ($isFunction(member.value)) {
                    var method = member.value;
                    (function (action) {
                        member.value = function () {
                            var io   = Controller.io,
                                args = Array.prototype.slice.call(arguments);
                            if (io) {
                                Controller.io = io.$$provide([Navigation, new Navigation({
                                    controller: this,
                                    action:     action,
                                    args:       args
                                })]);
                            }
                            return method.apply(this, args);
                        };
                    })(key);
                }
                Object.defineProperty(definition, key, member);
            });
        },
        shouldInherit: True,
        isActive: True
    });
        
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
        $contextual, $currentController, $validateThat, Validating, {

        get io() {
            var io = Controller.io || this.context;
            io     = _assemble(io, this._prepare, this);
            io     = _assemble(io, globalPrepare, this);
            var execute = this._execute;
            if ((!execute || execute.length === 0) &&
                (globalExecute.length === 0)) {
                return io;
            }
            var controller = this,
                executor   = io.decorate({
                    toDelegate: function () {
                        var ex = _assemble(this, execute, controller);
                        ex = _assemble(ex, globalExecute, controller);
                        delete executor.toDelegate;
                        return ex.toDelegate();
                    }
                });
            return executor;
        },
        get ifValid() {
            return this.io.$validAsync(this);
        },
        validate: function (target, scope) {
            return _validate.call(this, target, 'validate', scope);
        },
        validateAsync: function (target, scope) {
            return _validate.call(this, target, 'validateAsync', scope);
        },
        get prepare() {
            return this._prepare || (this._prepare = new Array2());
        },
        get execute() {
            return this._execute || (this._execute = new Array2());
        }            
    }, {
        get prepare() { return globalPrepare; },
        get execute() { return globalExecute; },
        coerce: function (source) {
            var controller = this;
            if (source instanceof Controller) {
                source = source.io;
            }
            var navigate = Navigate(source);
            return {
                next: function (action) {
                    return navigate.next(controller, action);
                },
                push: function (action) {
                    return navigate.push(controller, action);
                }
            };
        }
    });

    /**
     * Represents the failure to resolve a `controller`.
     * @class ControllerNotFound
     * @constructor
     * @param  {Any}  controller  -  controller key
     * @extends Error
     */    
    function ControllerNotFound(controller) {
        this.message    = format("The controller '%1' could not be resolved", controller);
        this.controller = controller;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    ControllerNotFound.prototype             = new Error;
    ControllerNotFound.prototype.constructor = ControllerNotFound;
     
    /**
     * Default navigation implementation.
     * @class NavigateCallbackHandler
     * @constructor
     * @extends miruken.callback.CompositeCallbackHandler
     * @uses miruken.mvc.Navigate
     */    
    var NavigateCallbackHandler = CompositeCallbackHandler.extend(Navigate, {
        next: function (controller, action, push) {
            return this.to(controller, action, false);
        },
        push: function (controller, action, push) {
            return this.to(controller, action, true);            
        },        
        to: function (controller, action, push) {
            if (action == null) {
                return Promise.reject(new Error("Missing action"));
            };
            
            var composer  = $composer,
                context   = composer.resolve(Context),
                initiator = composer.resolve(Controller),
                ctx       = push ? context.newChild() : context;

            var oldIO = Controller.io;
            return Promise.resolve(context.resolve(controller))
                .then(function (ctrl) {
                    if (!ctrl) {
                        return Promise.reject(new ControllerNotFound(controller));
                    }                    
                    Controller.io = composer !== context ? ctx.next(composer) : ctx;
                    if ((ctrl != initiator) && (initiator != null) && (initiator.context == ctx))
                        initiator.context = null;                    
                    return action(ctrl);
                })
                .finally(function () {
                    if (oldIO) {
                        Controller.io = oldIO;
                    } else {
                        delete Controller.io;
                    }
                });
        }
    });
    
    function _assemble(handler, builders, context) {
        return handler && builders
             ?  builders.reduce(function (result, builder) {
                    return $isFunction(builder) ? builder.call(context, result) : result;
                }, handler)
            : handler;
    }
    
    function _validate(target, method, scope) {
        var context = this.context;
        if (!context) {
            throw new Error("Validation requires a context to be available.");
        }
        var validator = Validator(context);
        return validator[method].call(validator, target || this, scope);
    }
    
    eval(this.exports);
    
}
