var miruken = require('../miruken.js');

new function () { // closure

    /**
     * @namespace miruken.mvc
     */
    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.context",
        exports: "Controller"
    });

    eval(this.imports);

    /**
     * @class {Controller}
     */
    var Controller = Miruken.extend(Contextual, ContextualMixin, {
    });

    eval(this.exports);
}
