var miruken    = require('../miruken.js'),
    validate   = require('./validate.js'),
    validatejs = require("validate.js"),
    Promise    = require('bluebird');
                 require('../callback.js');

new function () { // closure

    /**
     * @namespace miruken.validate
     */
    var validate = new base2.Package(this, {
        name:    "validate",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken.callback,miruken.validate",
        exports: "ValidateJsCallbackHandler,$required,$nested"
    });

    eval(this.imports);

    validatejs.Promise = Promise;

    var DETAILED    = { format: "detailed" },
        VALIDATABLE = { validate: undefined },
        $required   = Object.freeze({ presence: true }),
        $nested     = Object.freeze({ nested: true });

    validatejs.validators.nested = Undefined;

    /**
     * @class {ValidateJsCallbackHandler}
     */
    var ValidateJsCallbackHandler = CallbackHandler.extend({
        $validate: [
            null,  function (validation, composer) {
                var target      = validation.getObject(),
                    nested      = {},
                    constraints = _buildConstraints(target, nested);
                if (constraints) {
                    var scope     = validation.getScope(),
                        results   = validation.getResults(),
                        validator = Validator(composer); 
                    if (validation.isAsync()) {
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
                            var validator = $composer.resolve(name);
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