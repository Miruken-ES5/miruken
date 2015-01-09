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
        exports: "$classes"
    });

    eval(this.imports);

    /**
     * @class {FromBuilder}
     */
    var FromBuilder = Base.extend(Registration, {
        constructor: function () {
            var _basedOn, _configuration;
            this.extend({
                getClasses: function () { return []; },
                basedOn: function (/*constraints*/) {
                    _basedOn = new BasedOnBuilder(this, Array2.flatten(arguments));
                    return _basedOn;
                },
                configure: function (configuration) {
                    if (_configuration) {
                        var configure  = _configuration;
                        _configuration = function (component) {
                            configure(component);
                            configuration(component);
                        };
                    } else {
                        _configuration = configuration;
                    }
                    return this;
                },
                register: function(container) {
                    var classes = this.getClasses();
                }
            });
        }
    });

    /**
     * @class {FromPackageBuilder}
     */
    var FromPackageBuilder = FromBuilder.extend(Registration, {
        constructor: function (package) {
            this.base();
            this.extend({
                getClasses: function () {
                    var classes = [];
                    package.getClasses(function (clazz) {
                        classes.push(clazz);
                    });
                    return classes;
                }
            });
        }
    });

    /**
     * @class {BasedOnBuilder}
     */
    var BasedOnBuilder = Base.extend(Registration, {
        constructor: function (from, constraints) {
            this.extend({
                configure: function (configuration) {
                    from.configure(configuration);
                    return this;
                },
                registerClass: function (clazz, container) {
                },
                register: function(container) {
                    return from.register(container);
                }
            });
        }
    });

    /**
     * @function $classes
     * @param   {Any} hint - optional hint 
     * @returns {Any} a fluent class builder.
     */
    function $classes(hint) {
        if (hint instanceof Package) {
            return new FromPackageBuilder(hint);
        }
        throw new TypeError(lang.format("Unrecognized $classes hint %1.", hint));
    }

    $classes.fromPackage = function (package) {
        if (!(package instanceof Package)) {
            throw new TypeError(
                lang.format("$classes expected a Package, but received %1 instead.", package));
        }
        return new FromPackageBuilder(package);
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = config;
    } else if (typeof define === "function" && define.amd) {
        define("miruken.ioc.config", [], function() {
            return config;
        });
    }

    eval(this.exports);
}