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
