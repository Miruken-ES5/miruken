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
        exports: "Controller"
    });

    eval(this.imports);

    var globalPrepare = new Array2(),
        globalExecute = new Array2();
    
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
            return _validateController(this, target, 'validate', scope);
        },
        validateAsync: function (target, scope) {
            return _validateController(this, target, 'validateAsync', scope);
        },
        next: function (controller, action) {
            return Promise.resolve(this.io.resolve(controller))
                .then(function (ctrl) { return action(ctrl); });
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

    function _assemble(handler, builders, context) {
        return handler && builders
             ?  builders.reduce(function (result, builder) {
                    return $isFunction(builder) ? builder.call(context, result) : result;
                }, handler)
            : handler;
    }
    
    function _validateController(controller, target, method, scope) {
        var context = controller.context;
        if (!context) {
            throw new Error("Validation requires a context to be available.");
        }
        var validator = Validator(context);
        return validator[method].call(validator, target || controller, scope);
    }

    eval(this.exports);
    
}
