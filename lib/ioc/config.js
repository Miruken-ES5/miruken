var miruken = require('../miruken.js');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruken.ioc.config
     */
    var config = new base2.Package(this, {
        name:    "config",
        version: miruken.ioc.version,
        parent:  miruken.ioc,
        imports: "miruken,miruken.ioc",
        exports: ""
    });

    eval(this.imports);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = config;
    } else if (typeof define === "function" && define.amd) {
        define("miruken.ioc.config", [], function() {
            return config;
        });
    }

    eval(this.exports);
}