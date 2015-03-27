var miruken = require('./miruken.js'),
    Promise = require('bluebird');
              require('./callback.js');

new function () { // closure

    /**
     * @namespace miruken.validate
     */
    var validate = new base2.Package(this, {
        name:    "validate",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "Validator,ValidationErrorCode,ValidationError,ValidationResult,ValidationCallbackHandler,$validate"
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
         * @returns {Promise(ValidationResult)} a promise for the validation result
         */
        validate: function (object, scope) {}
    });

    /**
     * ValidationErrorCode enum
     * @enum {Number}
     */
    var ValidationErrorCode = Enum({
        Invalid:           100,
        Required:          101,
        TypeMismatch:      102,
        MutuallyExclusive: 103,
        NumberTooLarge:    104,
        NumberTooSmall:    105,
        DateTooLate:       106,
        DateTooSoon:       107
        });

    /**
     * @class {ValidationError}
     * @param {String} message   - validation error message
     * @param {Object} userInfo  - additional error info
     *   Standard userInfo keys:
     *   key    => identifies invald key
     *   domain => identifies category of error
     *   code   => identifies type of error
     *   source => captures invalid value
     */
    function ValidationError(message, userInfo) {
        this.message  = message;
        this.userInfo = userInfo;
        this.stack    = (new Error).stack;
    }
    ValidationError.prototype             = new Error;
    ValidationError.prototype.constructor = ValidationError;

    // =========================================================================
    // ValidationResult
    // =========================================================================
    
    var $childResultsKey = '__childResults';

    /**
     * @class {ValidationResult}
     */
    var ValidationResult = Base.extend({
        constructor: function (object, scope) {
            var _errors = {};
            this.extend({
                getObject: function () { return object; },
                getScope: function () { return scope; },
                isValid: function () {
                    for (var k in _errors) {
                        return false;
                    }
                    return true;
                },
                getKeyCulprits: function () {
                    var keys = [];
                    for (var k in _errors) {
                        if (k !== $childResultsKey) {
                            keys.push(k);
                        }
                    }
                    return keys;
                },
                getKeyErrors: function (key) { return _errors[key]; },
                addKeyError: function (key, error) {
                    if (!((error instanceof ValidationResult) && error.isValid())) {
                        var keyErrors = _errors[key];
                        if (!keyErrors) {
                            keyErrors = _errors[key] = [];
                        }
                        keyErrors.push(error);
                    }
                    return this;
                },
                getChildResults: function () { 
                    return this.getKeyErrors($childResultsKey);
                },
                addChildResult: function (childResult) {
                    this.addKeyError($childResultsKey, childResult);
                }
            });
        },
        toString: function () {
            var str = "",
                keys = this.getKeyCulprits();
            for (var ki = 0; ki < keys.length; ++ki) {
                var key    = keys[ki],
                    errors = this.getKeyErrors(key);
                str += key;
                for (var ei = 0; ei < errors.length; ++ei) {
                    var error = errors[ei];
                    str += '\n    - ';
                    str += error.message;
                }
                str += '\n';
            }
            return str;
        }
    });

    ValidationResult.implement({
        invalid: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.Invalid, message, source);
        },
        required: function(key, message) {
            _addValidationError(this, key, ValidationErrorCode.Required, message);
        },
        typeMismatch: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.TypeMismatch, message);
        },
        mutuallyExclusive: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.MutuallyExclusive, message);
        },
        numberToLarge: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.NumberToLarge, message);
        },
        numberToSmall: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.NumberToSmall, message);
        },
        dateToLate: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.DateToLate, message);
        },
        dateToSoon: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.DateToSoon, message);
        }
    });

    function _addValidationError(result, key, code, message, source) {
        var userInfo = { key: key, code: code };
        if (source) {
            userInfo.source = source;
        }
        result.addKeyError(key, new ValidationError(message, userInfo));
    }

    /**
     * @class {ValidationCallbackHandler}
     */
    var ValidationCallbackHandler = CallbackHandler.extend({
        validate: function (object, scope) {
            var validation = new ValidationResult(object, scope);
            return Promise.resolve($composer.deferAll(validation)).then(function (handled) {
                return !handled || validation.isValid() ? validation : Promise.reject(validation);
            });
        }
    });

    $handle(CallbackHandler, ValidationResult, function (validation, composer) {
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
