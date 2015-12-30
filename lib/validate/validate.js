var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../callback.js');

new function () { // closure

    /**
     * Package providing validation support.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}} and
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule validate
     * @namespace miruken.validate
     * @class $
     */    
    miruken.package(this, {
        name:    "validate",
        imports: "miruken,miruken.callback",
        exports: "Validating,Validator,Validation,ValidationResult,ValidationCallbackHandler,$validate,$validateThat"
    });

    eval(this.imports);

    /**
     * Validation definition group.
     * @property {Function} $validate
     * @for miruken.validate.$
     */
    var $validate = $define('$validate');

    /**
     * Protocol for validating objects.
     * @class Validating
     * @extends miruken.Protocol
     */        
    var Validating = Protocol.extend({
        /**
         * Validates the object in the scope.
         * @method validate 
         * @param   {Object} object     -  object to validate
         * @param   {Object} scope      -  scope of validation
         * @param   {Object} [results]  -  validation results
         * @returns {miruken.validate.ValidationResult}  validation results.
         */
        validate: function (object, scope, results) {},
        /**
         * Validates the object asynchronously in the scope.
         * @method validateAsync
         * @param   {Object} object     - object to validate
         * @param   {Object} scope      - scope of validation
         * @param   {Object} [results]  - validation results
         * @returns {Promise} promise of validation results.
         * @async
         */
        validateAsync: function (object, scope, results) {}
    });

    /**
     * Protocol for validating objects strictly.
     * @class Validator
     * @extends miruken.StrictProtocol
     * @uses miruken.validate.Validating
     */        
    var Validator = StrictProtocol.extend(Validating);
    
    /**
     * Callback representing the validation of an object.
     * @class Validation
     * @constructor
     * @param   {Object}    object  -  object to validate
     * @param   {boolean}   async   -  true if validate asynchronously
     * @param   {Any}       scope   -  scope of validation
     * @param   {miruken.validate.ValidationResult} results  -  results to validate to
     * @extends Base
     */
    var Validation = Base.extend({
        constructor: function (object, async, scope, results) {
            var _asyncResults;
            async   = !!async;
            results = results || new ValidationResult;
            this.extend({
                /**
                 * true if asynchronous, false if synchronous.
                 * @property {boolean} async
                 * @readOnly
                 */                
                get isAsync() { return async; },
                /**
                 * Gets the target object to validate.
                 * @property {Object} object
                 * @readOnly
                 */                                
                get object() { return object; },
                /**
                 * Gets the scope of validation.
                 * @property {Any} scope
                 * @readOnly
                 */                                                
                get scope() { return scope; },
                /**
                 * Gets the validation results.
                 * @property {miruken.validate.ValidationResult} results
                 * @readOnly
                 */                                                                
                get results() { return results; },
                /**
                 * Gets the async validation results.
                 * @property {miruken.validate.ValidationResult} results
                 * @readOnly
                 */                                                                                
                get asyncResults() { return _asyncResults; },
                /**
                 * Adds an async validation result. (internal)
                 * @method addAsyncResult
                 */                        
                addAsyncResult: function (result) {
                    if ($isPromise(result)) {
                        (_asyncResults || (_asyncResults = [])).push(result);
                    }
                }
            });
        }
    });
    
    var IGNORE = ['valid', 'errors', 'addKey', 'addError'];

    /**
     * Captures structured validation errors.
     * @class ValidationResult
     * @constructor
     * @extends Base
     */    
    var ValidationResult = Base.extend({
        constructor: function () {
            var _errors, _summary;
            this.extend({
                /**
                 * true if object is valid, false otherwisw.
                 * @property {boolean} valid
                 * @readOnly
                 */                
                get valid() {
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
                        if ((result instanceof ValidationResult) && !result.valid) {
                            return false;
                        }
                    }
                    return true;
                },
                /**
                 * Gets aggregated validation errors.
                 * @property {Object} errors
                 * @readOnly
                 */                                
                get errors() {
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
                            errors = (result instanceof ValidationResult) && result.errors;
                        if (errors) {
                            _summary = _summary || {};
                            for (name in errors) {
                                var named    = errors[name],
                                    existing = _summary[name];
                                for (var ii = 0; ii < named.length; ++ii) {
                                    var error = pcopy(named[ii]);
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
               /**
                * Gets or adds validation results for the key.
                * @method addKey
                * @param  {string} key  -  property name
                * @results {miruken.validate.ValidationResult} named validation results.
                */                
                addKey: function (key) {
                    return this[key] || (this[key] = new ValidationResult);
                },
               /**
                * Adds a named validation error.
                * @method addError
                * @param  {string}  name   -  validator name
                * @param  {Object}  error  -  literal error details
                * @example
                *     Standard Keys:
                *        key      => contains the invalid key
                *        message  => contains the error message
                *        value    => contains the invalid valid
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
                /**
                 * Clears all validation results.
                 * @method reset
                 * @returns {miruken.validate.ValidationResult} receiving results
                 * @chainable
                 */
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
     * CallbackHandler for performing validation.
     * <p>
     * Once an object is validated, it will receive a **$validation** property containing the validation results.
     * </p>
     * @class ValidationCallbackHandler
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.validate.Validator
     * @uses miruken.validate.Validating
     */        
    var ValidationCallbackHandler = CallbackHandler.extend(Validator, {
        validate: function (object, scope, results) {
            if ($isNothing(object)) {
                throw new TypeError("Missing object to validate.");
            }
            var validation = new Validation(object, false, scope, results);
            $composer.handle(validation, true);
            results = validation.results;
            _bindValidationResults(object, results);
            _validateThat(validation, null, $composer);
            return results;
        },
        validateAsync: function (object, scope, results) {
            if ($isNothing(object)) {
                throw new TypeError("Missing object to validate.");
            }            
            var validation = new Validation(object, true, scope, results),
                composer   = $composer;
            return composer.deferAll(validation).then(function () {
                results = validation.results;
                _bindValidationResults(object, results);
                var asyncResults = [];
                _validateThat(validation, asyncResults, composer);
                return asyncResults.length > 0
                     ? Promise.all(asyncResults).return(results)
                     : results;
            });
        }
    });

    $handle(CallbackHandler, Validation, function (validation, composer) {
        var target = validation.object,
            source = $classOf(target);
        if (source) {
            $validate.dispatch(this, validation, source, composer, true, validation.addAsyncResult);
            var asyncResults = validation.asyncResults;
            if (asyncResults) {
                return Promise.all(asyncResults);
            }
        }
    });

    /**
     * Metamacro for class-based validation.
     * @class $validateThat
     * @extends miruken.MetaMacro
     */    
    var $validateThat = MetaMacro.extend({
        execute: function _(step, metadata, target, definition) {
            var validateThat = this.extractProperty('$validateThat', target, definition);
            if (!validateThat) {
                return;
            }
            var validators = {};
            for (var name in validateThat) {
                var validator = validateThat[name];
                if ($isArray(validator)) {
                    var dependencies = validator.slice(0);
                    validator = dependencies.pop();
                    if (!$isFunction(validator)) {
                        continue;
                    }
                    if (dependencies.length > 0) {
                        validator = (function (nm, val, deps) {
                            return function (validation, composer) {
                                var d = Array2.concat(deps, Array2.map(arguments, $use));
                                return Invoking(composer).invoke(val, d, this);
                            }
                        })(name, validator, dependencies);
                    }
                }
                if ($isFunction(validator)) {
                    name = 'validateThat' + name.charAt(0).toUpperCase() + name.slice(1);
                    validators[name] = validator;
                }
                if (step == MetaStep.Extend) {
                    target.extend(validators);
                } else {
                    metadata.getClass().implement(validators);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */         
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */
        isActive: True
    });

    function _validateThat(validation, asyncResults, composer) {
        var object = validation.object;
        for (var key in object) {
            if (key.lastIndexOf('validateThat', 0) == 0) {
                var validator   = object[key],
                    returnValue = validator.call(object, validation, composer);
                if (asyncResults && $isPromise(returnValue)) {
                    asyncResults.push(returnValue);
                }
            }
        }
    }

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

    CallbackHandler.implement({
        $valid: function (target, scope) {
            return this.aspect(function (_, composer) {
                return Validator(composer).validate(target, scope).valid;
            });
        },
        $validAsync: function (target, scope) {
            return this.aspect(function (_, composer) {
                return Validator(composer).validateAsync(target, scope).then(function (results) {
                    return results.valid;
                });
            });
        }        
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}
