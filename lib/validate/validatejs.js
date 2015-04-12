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
        imports: "miruken,miruken.callback,miruken.validate",
        exports: "ValidateJsCallbackHandler"
    });

    eval(this.imports);

    validatejs.Promise = Promise;

    var detailed = { format: "detailed" };

    /**
     * @class {ValidateJsCallbackHandler}
     */
    var ValidateJsCallbackHandler = CallbackHandler.extend({
        $validate: [
            null,  function (validation, composer) {
                var target      = validation.getObject(),
                    constraints = _buildConstraints(target);
                if (constraints) {
                    if (validation.isAsync()) {
                        return validatejs.async(target, constraints, detailed)
                            .then(function (valid) {
                                return true;
                            }, function (invalid) {
                        }); 
                    } else {
                        var errors = validatejs(target, constraints, detailed);
                        if (errors) {
                        }
                    }
                }
            }
        ]
    });

    function _buildConstraints(target) {
        var constraints,
            meta        = target.$meta,
            descriptors = meta && meta.getDescriptor();
        if (descriptors) {
            for (var key in descriptors) {
                var descriptor = descriptors[key], validate;
                if (descriptor && (validate = descriptor.validate)) {
                    (constraints || (constraints = {}))[key] = validate;
                }
            }
            return constraints;
        }
    }

    eval(this.exports);

}