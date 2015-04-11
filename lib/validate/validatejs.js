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

    /**
     * @class {ValidateJsCallbackHandler}
     */
    var ValidateJsCallbackHandler = CallbackHandler.extend({
        $validate: [
            null,  function (validation, composer) {
                console.log("EEE " + validatejs.runValidations);
            }
        ]
    });

    eval(this,exports);

}