var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../callback.js');

new function () { // closure

    /**
     * @namespace miruken.validate
     */
    var validate = new base2.Package(this, {
        name:    "validate",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "Validator,Validation,ValidationResult,ValidationCallbackHandler,$validate"
    });

    eval(this.imports);

    var $validate = $define('$validate');

    /**
     * @protocol {Validator}
     */
    var Validator = Protocol.extend({
        /**
         * Validates the object in the scope.
         * @param   {Object} object  - object to validate
         * @param   {Object} scope   - scope of validation
         */
        validate: function (object, scope) {},
        /**
         * Validates the object in the scope.
         * @param   {Object} object  - object to validate
         * @param   {Object} scope   - scope of validation
         * @returns {Promise} a promise for the validation
         */
        validateAsync: function (object, scope) {}
    });

    /**
     * @class {Validation}
     */
    var Validation = Base.extend({
        constructor: function (object, async, scope) {
            async = !!async;
            delete object.$validation;
            this.extend({
                getObject: function () { return object; },
                isAsync: function () { return async; },
                getScope: function () { return scope; },
                getResults: function () {
                    return object.$validation || (object.$validation = new ValidationResult);
                }
            });
        }
    });

    // =========================================================================
    // ValidationResult
    // =========================================================================
    
    /**
     * @class {ValidationResult}
     */
    var ValidationResult = Base.extend({
        isValid: function () {
            for (var name in this) {
                if (!(name in ValidationResult.prototype)) {
                    return false;
                }
            }
            return true;
        },
        addKey: function (key) {
            return this[key] || (this[key] = new ValidationResult);
        },
        addError: function (name, error) {
            var errors = (this.errors || (this.errors = {})),
                named  = errors[name];
            if (named) {
                named.push(error);
            } else {
                errors[name] = [error];
            }
            return this;
        }
    });

    /**
     * @class {ValidationCallbackHandler}
     */
    var ValidationCallbackHandler = CallbackHandler.extend({
        validate: function (object, scope) {
            var validation = new Validation(object, false, scope);
            $composer.handle(validation, true);
            return validation.getResults();
        },
        validateAsync: function (object, scope) {
            var validation = new Validation(object, true, scope);
            return $composer.deferAll(validation).then(function () {
                return validation.getResults();
            });
        }
    });

    $handle(CallbackHandler, Validation, function (validation, composer) {
        var target = validation.getObject(),
            source = target && target.constructor;
        if (source) {
            return $validate.dispatch(this, validation, source, composer);
        }
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = validate;
    }

    eval(this.exports);

}
