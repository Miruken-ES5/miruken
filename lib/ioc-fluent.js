var miruken = require('./miruken.js');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruke.ioc.fluent
     */
    var fluent = new base2.Package(this, {
        name:    "fluent",
        version: miruken.version,
        parent:  miruken.ioc,
        imports: "miruken,miruken.ioc",
        exports: ""
    });

    eval(this.imports);

    if (typeof module !== 'undefined' && module.exports)
        module.exports = exports = fluent;

    eval(this.exports);
}