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
        exports: "Controller,ControllerNotFound,Navigate,NavigateCallbackHandler"
    });

    eval(this.imports);

    var globalPrepare = new Array2(),
        globalExecute = new Array2();

    /**
     * Protocol to navigate controllrs.
     * @class Navigate
     * @extends miruken.StrictProtocol
     */    
    var Navigate = StrictProtocol.extend({
        /**
         * Executes `action` on the resolved `controller`.
         * @method to
         * @param   {Any}       controller  -  controller key
         * @param   {Function}  action      -  controller action
         * @returns {Promise} promise for navigation context.
         */        
        to: function(controller, action, push) {}
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
        $contextual, $validateThat, Validating, {

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
        next: function (controller, action) {
            return Navigate(this.io).to(controller, action);
        },            
        get prepare() {
            return this._prepare || (this._prepare = new Array2());
        },
        get execute() {
            return this._execute || (this._execute = new Array2());
        }            
    }, {
        io: undefined,
        get prepare() { return globalPrepare; },
        get execute() { return globalExecute; }        
    });

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
        to: function(controller, action, push) {
            var composer = $composer;
            if (action == null || composer == null) { return null };

            var context   = composer.resolve(Context),
                initiator = composer.resolve(Controller),
                ctx       = push ? context.newChild() : context;

            var oldIO = Controller.io;   
            return Promise.resolve(context.resolve(controller))
                .then(function (ctrl) {
                    if (!ctrl) {
                        return Promise.reject(new ControllerNotFound(controller));
                    }
                    if (composer !== context) {
                        Controller.io = ctx.next(composer);
                    } 
                    if (initiator != null && initiator.context == ctx)
                        initiator.context = null;                   
                    return action(ctrl);
                })
                .finally(function () {
                    Controller.io = oldIO;
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
