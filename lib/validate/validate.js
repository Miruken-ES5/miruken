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
        exports: "Validating,Validator,Validation,ValidationResult,ValidationCallbackHandler,$validate"
    });

    eval(this.imports);

    var $validate = $define('$validate');

    /**
     * @protocol {Validating}
     */
    var Validating = Protocol.extend({
        /**
         * Validates the object in the scope.
         * @param   {Object} object   - object to validate
         * @param   {Object} scope    - scope of validation
         * @param   {Object} results? - validation results
         * @returns the validation results.
         */
        validate: function (object, scope, results) {},
        /**
         * Validates the object in the scope.
         * @param   {Object} object  - object to validate
         * @param   {Object} scope   - scope of validation
         * @returns {Promise} a promise for the validation results.
         */
        validateAsync: function (object, scope, results) {}
    });

    /**
     * @protocol {Validator}
     */
    var Validator = Protocol.extend(Validating, {
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        }
    });

    /**
     * @class {Validation}
     */
    var Validation = Base.extend(
        $inferProperties, {
        constructor: function (object, async, scope, results) {
            var _asyncResults;
            async   = !!async;
            results = results || new ValidationResult;
            this.extend({
                isAsync: function () { return async; },
                getObject: function () { return object; },
                getScope: function () { return scope; },
                getResults: function () { return results; },
                getAsyncResults: function () { return _asyncResults; },
                addAsyncResult: function (result) {
                    if ($isPromise(result)) {
                        (_asyncResults || (_asyncResults = [])).push(result);
                    }
                }
            });
        }
    });
    
    var IGNORE = ['isValid', 'valid', 'getErrors', 'errors', 'addKey', 'addError'];

    /**
     * @class {ValidationResult}
     */
    var ValidationResult = Base.extend(
        $inferProperties, {
        constructor: function () {
            var _errors, _summary;
            this.extend({
                isValid: function () {
                    if (_errors || _summary) {
                        return false;
                    }
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key];
                        if ((result instanceof ValidationResult) && !result.isValid()) {
                            return false;
                        }
                    }
                    return true;
                },
                getErrors: function () {
                    if (_summary) {
                        return _summary;
                    }
                    if (_errors) {
                        _summary = {};
                        for (var name in _errors) {
                            _summary[name] = _errors[name].slice(0);
                        }
                    }
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key],
                            errors = (result instanceof ValidationResult) && result.getErrors();
                        if (errors) {
                            _summary = _summary || {};
                            for (name in errors) {
                                var named    = errors[name],
                                    existing = _summary[name];
                                for (var ii = 0; ii < named.length; ++ii) {
                                    var error = lang.pcopy(named[ii]);
                                    error.key = error.key ? (key + "." + error.key) : key;
                                    if (existing) {
                                        existing.push(error);
                                    } else {
                                        _summary[name] = existing = [error];
                                    }
                                }
                            }
                        }
                    }
                    return _summary;
                },
                addKey: function (key) {
                    return this[key] || (this[key] = new ValidationResult);
                },
               /**
                * @param  {String} name  - validator name
                * @param  {Object} error - literal error details
                *     Standard Keys:
                *        key?     => contains the invalid key
                *        message? => contains the error message
                *        value?   => contains the invalid valid
                */
                addError: function (name, error) {
                    var errors = (_errors || (_errors = {})),
                        named  = errors[name];
                    if (named) {
                        named.push(error);
                    } else {
                        errors[name] = [error];
                    }
                    _summary = null;
                    return this;
                },
                reset: function () { 
                    _errors = _summary = undefined;
                    var ownKeys = Object.getOwnPropertyNames(this);
                    for (var i = 0; i < ownKeys.length; ++i) {
                        var key = ownKeys[i];
                        if (IGNORE.indexOf(key) >= 0) {
                            continue;
                        }
                        var result = this[key];
                        if ((result instanceof ValidationResult)) {
                            delete this[key];
                        }
                    }
                    return this;
                }
            });
        }
    });

    /**
     * @class {ValidationCallbackHandler}
     */
    var ValidationCallbackHandler = CallbackHandler.extend(Validator, {
        validate: function (object, scope, results) {
            var validation = new Validation(object, false, scope, results);
            $composer.handle(validation, true);
            results = validation.getResults();
            _bindValidationResults(object, results);
            return results;
        },
        validateAsync: function (object, scope, results) {
            var validation = new Validation(object, true, scope, results);
            return $composer.deferAll(validation).then(function () {
                results = validation.getResults();
                _bindValidationResults(object, results);
                return results;
            });
        }
    });

    $handle(CallbackHandler, Validation, function (validation, composer) {
        var target = validation.getObject(),
            source = $classOf(target);
        if (source) {
            $validate.dispatch(this, validation, source, composer, true, validation.addAsyncResult);
            var asyncResults = validation.getAsyncResults();
            if (asyncResults) {
                return Promise.all(asyncResults);
            }
        }
    });

    function _bindValidationResults(object, results) {
        var spec = _bindValidationResults.spec || 
            (_bindValidationResults.spec = {
                enumerable:   false,
                configurable: true,
                writable:     false
        });
        spec.value = results;
        Object.defineProperty(object, '$validation', spec);
        delete spec.value;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = validate;
    }

    eval(this.exports);

}
