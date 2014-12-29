var miruken    = require('./miruken.js'),
    prettyjson = require('prettyjson'),
    Q          = require('q');
                 require('./callback.js'),

new function() { // closure

    /**
     * @namespace miruken.error
     */
    var error = new base2.Package(this, {
        name:    "error",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "Errors,ErrorCallbackHandler"
    });

    eval(this.imports);

    /**
     * @protocol {Errors}
     */
    var Errors = Protocol.extend({
        handleError:     function(error,     context) {},
        handleException: function(exception, context) {},
        reportError:     function(error,     context) {},
        reportException: function(exception, context) {}
    });

    /**
     * @class {ErrorCallbackHandler}
     */
    var ErrorCallbackHandler = CallbackHandler.extend({
	/**
	 * Handles the error.
	 * @param   {Any}          error      - error (usually Error)
	 * @param   {Any}          [context]  - scope of error
	 * @returns {Promise(Any)} the handled error.
	 */
        handleError: function(error, context) {
            return Q(Errors($composer).reportError(error, context));
        },
	/**
	 * Handles the exception.
	 * @param   {Exception}    excption   - exception
	 * @param   {Any}          [context]  - scope of error
	 * @returns {Promise(Any)} the handled exception.
	 */
        handleException: function(exception, context) {
            return Q(Errors($composer).reportException(exception, context));
        },
	/**
	 * Reports the error. i.e. to the console.
	 * @param   {Any}          error      - error (usually Error)
	 * @param   {Any}          [context]  - scope of error
	 * @returns {Promise(Any)} the reported error (could be a dialog).
	 */
        reportError: function(error, context) {
            console.error(formatJson(error));
            return Q();
        },
	/**
	 * Reports the excepion. i.e. to the console.
	 * @param   {Exception}    exception  - exception
	 * @param   {Any}          [context]  - scope of exception
	 * @returns {Promise(Any)} the reported exception (could be a dialog).
	 */
        reportException: function(exception, context) {
            console.error(formatJson(exception));
            return Q();
        }
    });

    /**
     * Recoverable filter
     */
    CallbackHandler.implement({
        recoverable: function(context) {
            return new CallbackHandlerFilter(this, function(callback, composer, proceed) {
                try {
                    var promise,
                    handled = proceed();
                    if (handled && (promise = getEffectivePromise(callback))) {
                        promise = promise.fail(function(error) {
                            return Errors(composer).handleError(error, context);
                        });
                        if (callback instanceof HandleMethod) {
                            callback.setReturnValue(promise);
                        }
                    }
                    return handled;
                } catch (exception) {
                    Errors(composer).handleException(exception, context);
                    return true;
                }
            });
        },

        recover: function(context) {
            return function(error) {
                return Errors(this).handleError(error, context);
            }.bind(this);
        }
    });

    function formatJson(object) {
        var json = prettyjson.render(object);
        json = json.split('\n').join('\n    ');
        return '    ' + json;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = error;
    } else if (typeof define === "function" && define.amd) {
	define("miruken.error", [], function() {
	    return error;
	});
    }

    eval(this.exports);

}
