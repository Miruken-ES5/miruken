var miruken = require('./miruken.js'),
    Promise = require('bluebird');
              require('./callback.js');

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
            var reportError = Errors($composer).reportError(error, context);
            return reportError === undefined
                 ? Promise.reject(error)
                 : Promise.resolve(reportError);
        },
        /**
         * Handles the exception.
         * @param   {Exception}    excption   - exception
         * @param   {Any}          [context]  - scope of error
         * @returns {Promise(Any)} the handled exception.
         */
        handleException: function(exception, context) {
            var reportException = Errors($composer).reportException(exception, context);
            return reportException === undefined
                 ? Promise.reject(exception)
                 : Promise.resolve(reportException);
        },                                                      
        /**
         * Reports the error. i.e. to the console.
         * @param   {Any}          error      - error (usually Error)
         * @param   {Any}          [context]  - scope of error
         * @returns {Promise(Any)} the reported error (could be a dialog).
         */
        reportError: function(error, context) {
            console.error(error);
            return Promise.resolve();
        },
        /**
         * Reports the excepion. i.e. to the console.
         * @param   {Exception}    exception  - exception
         * @param   {Any}          [context]  - scope of exception
         * @returns {Promise(Any)} the reported exception (could be a dialog).
         */
        reportException: function(exception, context) {
            console.error(exception);
            return Promise.resolve();
        }
    });

    /**
     * Recoverable filter
     */
    CallbackHandler.implement({
        recover: function (context) {
            return new CallbackHandlerFilter(this, function(callback, composer, proceed) {
                try {
                    var promise,
                    handled = proceed();
                    if (handled && (promise = getEffectivePromise(callback))) {
                        promise = promise.catch(function(error) {
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

        recoverError: function (context) {
            return function (error) {
                return Errors(this).handleError(error, context);
            }.bind(this);
        }
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = error;
    }

    eval(this.exports);

}
