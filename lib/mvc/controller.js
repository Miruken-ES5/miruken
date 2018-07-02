var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../error.js');
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
        imports: "miruken,miruken.callback,miruken.context,miruken.validate,miruken.error",
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
        push:       undefined,
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
         * @param   {Any}       controller     -  controller key
         * @param   {Function}  action         -  controller action
         * @param   {Function}  [configureIO]  -  configures io
         * @returns {Promise} promise when transition complete.
         */        
        next: function (controller, action, configureIO) {},
        /**
         * Transitions to next `action` on `controller` in a new context.
         * @method to
         * @param   {Any}       controller    -  controller key
         * @param   {Function}  action        -  controller action
         * @param   {Function}  [confgureIO]  -  configures io
         * @returns {Promise} promise when transition complete.
         */        
        push: function (controller, action, configureIO) {}        
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
        DisposingMixin, Validating, $contextual, $validateThat, {
            
        get ifValid() {
            return this.io.$validAsync(this);
        },

        show: function (handler, view) {
            return handler instanceof CallbackHandler
                 ? miruken.mvc.ViewRegion(handler).show(view)
                 : miruken.mvc.ViewRegion(this.io).show(handler);
        },
        next: function (controller, handler) {
            var io = handler || this.io || this.context;            
            return createTrampoline(controller, io, "next");
        },
        push: function (controller, handler) {
            var io = handler || this.io || this.context;
            return createTrampoline(controller, io, "push");
        },                                                
        validate: function (target, scope) {
            return _validate.call(this, target, "validate", scope);
        },
        validateAsync: function (target, scope) {
            return _validate.call(this, target, "validateAsync", scope);
        },
        viewRegionCreated: function (tag, regionContext) {
            this[tag] = regionContext;
        },
        _dispose: function () {
            this.context = null;
            delete this.io;
        }
    }, {
        coerce: function (source) {
            var controller = this;
            return {
                get next() {
                    return createTrampoline(controller, source, "next");
                },
                get push() {
                    return createTrampoline(controller, source, "push");
                }
            };
        },
        get prepare() { return globalPrepare; },
        get execute() { return globalExecute; }        
    });

    var TRAMPOLINE_IGNORE = [ "base", "constructor", "initialize", "dispose" ];

    function createTrampoline(controller, source, style) {
        if (!(controller.prototype instanceof Controller)) {
            throw new TypeError(format("%1 is not a Controller", controller));
        }        
        var trampoline = {},
            navigate   = Navigate(source),
            obj        = controller.prototype;
        var action = navigate[style];
        do {
            Array2.forEach(Object.getOwnPropertyNames(obj), function (key) {
                if (TRAMPOLINE_IGNORE.indexOf(key) >= 0 ||
                    key.lastIndexOf("_", 0) === 0 ||
                    (key in trampoline)) { return; }
                var descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (descriptor == null || !$isFunction(descriptor.value)) {
                    return;
                }
                trampoline[key] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    return action.call(navigate, controller, function (ctrl) {
                        return ctrl[key].apply(ctrl, args);
                    }, function (io, ctrl) {
                        return io.$$provide([Navigation, new Navigation({
                            push:       style === "push",
                            controller: ctrl,
                            action:     key,
                            args:       args
                        })]);
                    });
                };
            });
        } while (obj = Object.getPrototypeOf(obj) && obj instanceof Controller);
        return trampoline;
    }

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
        next: function (controller, action, configureIO) {
            return this.to(controller, action, false, configureIO);
        },
        push: function (controller, action, configureIO) {
            return this.to(controller, action, true, configureIO);
        },        
        to: function (controller, action, push, configureIO) {
            if (action == null) {
                return Promise.reject(new Error("Missing action"));
            };
            
            var composer  = $composer,
                context   = composer.resolve(Context),
                initiator = composer.resolve(Controller),
                ctx       = push ? context.newChild() : context;

            return Promise.resolve(ctx.resolve(controller))
                .then(function (ctrl) {
                    if (!ctrl) {
                        return Promise.reject(new ControllerNotFound(controller));
                    }
                    ctx.onEnding(function () { ctrl.dispose(); });
                    try {
                        if (push) {
                            composer = composer.pushLayer();
                        } else if ((ctrl != initiator) && (initiator != null) &&
                                   (initiator.context == ctx)) {
                            initiator.context = null;
                        }
                        var io = ctx === context ? composer
                               : ctx.$self().next(composer);
                        if ($isFunction(configureIO)) {
                            io = configureIO(io, ctrl) || io;
                        }
                        _bindIO(io, ctrl);                        
                        return action(ctrl);
                    } catch (exception) {
                        return Errors(ctrl.io).handleException(exception);
                    } finally {
                        _bindIO(null, ctrl);
                    }
                });
        }
    });

    function _bindIO(io, controller) {
        io = _assemble(io || controller.context, globalPrepare, controller);
        if (io == null) {
            delete controller.io;
            return;
        }
        if (globalExecute.length === 0) {
            controller.io = io;
            return;
        }
        var executor   = controller.io = io.decorate({
            toDelegate: function () {
                var ex = _assemble(this, globalExecute, controller);
                delete executor.toDelegate;
                return ex.toDelegate();
            }
        });
    }

    function _assemble(handler, builders, context) {
        return handler && builders
             ?  builders.reduce(function (result, builder) {
                 return $isFunction(builder)
                     ? builder.call(context, result) || result
                     : result;
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
