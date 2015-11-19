var miruken    = require('../miruken.js'),
    validate   = require('./validate.js'),
    validatejs = require("validate.js"),
    Promise    = require('bluebird');
                 require('../callback.js');

new function () { // closure

    /**
     * @module miruken
     * @submodule validate
     * @namespace miruken.validate
     * @class $
     */    
    miruken.package(this, {
        name:    "validate",
        imports: "miruken,miruken.callback,miruken.validate",
        exports: "ValidationRegistry,ValidateJsCallbackHandler,$required,$nested"
    });

    eval(this.imports);

    validatejs.Promise = Promise;

    var DETAILED    = { format: "detailed" },
        VALIDATABLE = { validate: undefined },
        /**
         * Shortcut to indicate required property.
         * @property {Object} $required
         * @readOnly
         * @for miruken.validate.$ 
         */
        $required = Object.freeze({ presence: true }),
        /**
         * Shortcut to indicate nested validation.
         * @property {Object} $nested
         * @readOnly
         * @for miruken.validate.$ 
         */
        $nested = Object.freeze({ nested: true });

    validatejs.validators.nested = Undefined;

    /**
     * Metamacro to register custom validators with [validate.js](http://validatejs.org).
     * <pre>
     *    var CustomValidators = Base.extend($registerValidators, {
     *        uniqueUserName: [Database, function (db, userName) {
     *            if (db.hasUserName(userName)) {
     *               return "UserName " + userName + " is already taken";
     *            }
     *        }]
     *    })
     * </pre>
     * would register a uniqueUserName validator with a Database dependency.
     * @class $registerValidators
     * @extends miruken.MetaMacro
     */    
    var $registerValidators = MetaMacro.extend({
        execute: function (step, metadata, target, definition) {
            if (step === MetaStep.Subclass || step === MetaStep.Implement) {
                for (var name in definition) {
                    var validator = definition[name];
                    if ($isArray(validator)) {
                        var dependencies = validator.slice(0);
                        validator = dependencies.pop();
                        if (!$isFunction(validator)) {
                            continue;
                        }
                        if (dependencies.length > 0) {
                            validator = (function (nm, val, deps) {
                                return function () {
                                    if (!$composer) {
                                        throw new Error("Unable to invoke validator '" + nm + "'.");
                                    }
                                    var d = Array2.concat(deps, Array2.map(arguments, $use));
                                    return Invoking($composer).invoke(val, d);
                                }
                            })(name, validator, dependencies);
                        }
                    }
                    if ($isFunction(validator)) {
                        validatejs.validators[name] = validator;
                    }
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

    /**
     * Base class to define custom validators using
     * {{#crossLink "miruken.validate.$registerValidators"}}{{/crossLink}}.
     * <pre>
     *    var CustomValidators = ValidationRegistry.extend({
     *        creditCardNumber: function (cardNumber, options, key, attributes) {
     *           // do the check...
     *        }
     *    })
     * </pre>
     * would register a creditCardNumber validator function.
     * @class ValidationRegistry
     * @constructor
     * @extends Abstract
     */        
    var ValidationRegistry = Abstract.extend($registerValidators);

    /**
     * CallbackHandler for performing validation using [validate.js](http://validatejs.org)
     * <p>
     * Classes participate in validation by declaring **validate** constraints on properties.
     * </p>
     * <pre>
     * var Address = Base.extend({
     *     $properties: {
     *         line:    { <b>validate</b>: { presence: true } },
     *         city:    { <b>validate</b>: { presence: true } },
     *         state:   { 
     *             <b>validate</b>: {
     *                 presence: true,
     *                 length: { is: 2 }
     *             }
     *         },
     *         zipcode: { 
     *             <b>validate</b>: {
     *                 presence: true,
     *                 length: { is: 5 }
     *         }
     *     }
     * })
     * </pre>
     * @class ValidateJsCallbackHandler
     * @extends miruken.callback.CallbackHandler
     */            
    var ValidateJsCallbackHandler = CallbackHandler.extend({
        $validate: [
            null,  function (validation, composer) {
                var target      = validation.object,
                    nested      = {},
                    constraints = _buildConstraints(target, nested);
                if (constraints) {
                    var scope     = validation.scope,
                        results   = validation.results,
                        validator = Validator(composer); 
                    if (validation.isAsync) {
                        return validatejs.async(target, constraints, DETAILED)
                            .then(function (valid) {
                                 return _validateNestedAsync(validator, scope, results, nested);
                            }, function (errors) {
                                if (errors instanceof Error) {
                                    return Promise.reject(errors);
                                }
                                return _validateNestedAsync(validator, scope, results, nested).then(function () {
                                    _mapResults(results, errors);
                                });
                            });
                    } else {
                        var errors = validatejs(target, constraints, DETAILED);
                        for (var key in nested) {
                            var child = nested[key];
                            if (child instanceof Array) {
                                for (var i = 0; i < child.length; ++i) {
                                    validator.validate(child[i], scope, results.addKey(key + '.' + i));
                                }
                            } else {
                                validator.validate(child, scope, results.addKey(key));
                            }
                        }
                        _mapResults(results, errors);
                    }
                }
            }
        ]
    });

    function _validateNestedAsync(validator, scope, results, nested) {
        var pending = [];
        for (var key in nested) {
            var child = nested[key], childResults;
            if (child instanceof Array) {
                for (var i = 0; i < child.length; ++i) {
                    childResults = results.addKey(key + '.' + i);
                    childResults = validator.validateAsync(child[i], scope, childResults);
                    pending.push(childResults);
                }
            } else {
                childResults = results.addKey(key);
                childResults = validator.validateAsync(child, scope, childResults);
                pending.push(childResults);
            }
        }
        return Promise.all(pending);
    }

    function _mapResults(results, errors) {
        if (errors) {
            Array2.forEach(errors, function (error) {
                results.addKey(error.attribute).addError(error.validator, {
                    message: error.error,
                    value:   error.value 
                });
            });
        }
    }

    function _buildConstraints(target, nested) {
        var meta        = target.$meta,
            descriptors = meta && meta.getDescriptor(VALIDATABLE),
            constraints;
        if (descriptors) {
            for (var key in descriptors) {
                var descriptor = descriptors[key],
                    validate   = descriptor.validate;
                (constraints || (constraints = {}))[key] = validate;
                for (name in validate) {
                    if (name === 'nested') {
                        var child = target[key];
                        if (child) {
                            nested[key] = child;
                        }
                    } else if (!(name in validatejs.validators)) {
                        validatejs.validators[name] = function () {
                            var validator = $composer && $composer.resolve(name);
                            if (!validator) {
                                throw new Error("Unable to resolve validator '" + name + "'.");
                            }
                            return validator.validate.apply(validator, arguments);
                        };
                    }
                }
            }
            return constraints;
        }
    }

    eval(this.exports);

}
