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

    var globalFilters = new Array2(), ioChain;
    
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
            var _this = this,
                io = ioChain || this.context;
            if (!io) { return; }
            if (this._filters) {
                io = this._filters.reduce(function (result, filter) {
                    return $isFunction(filter) ? filter.call(_this, result) : result;
                }, io);
            }
            io = globalFilters.reduce(function (result, filter) {
                return $isFunction(filter) ? filter.call(_this, result) : result;
            }, io);
            return io;
        },
        validate: function (target, scope) {
            return _validateController(this, target, 'validate', scope);
        },
        validateAsync: function (target, scope) {
            return _validateController(this, target, 'validateAsync', scope);
        },
        next: function (controller){
            return Promise.resolve(this.io.resolve(controller));
        },            
        get filters() {
            return this._filters || (this._filters = new Array2());
        }
    }, {
        get globalFilters() { return globalFilters; }
    });
    
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
