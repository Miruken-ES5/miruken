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
                    if (_basedOn) {
                        var components = Array2.reduce(this.getClasses(), function (result, clazz) {
                            var component = _basedOn.builderForClass(clazz);
                            if (component) {
                                if (_configuration) {
                                    _configuration(component);
                                }
                                result.push(component);
                            }
                            return result;
                        }, []);
                    }
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
                builderForClass: function (clazz) {
                    var basedOn = [];
                    for (var i = 0; i < constraints.length; ++i) {
                        var constraint = constraints[i];
                        if ($isProtocol(constraint)) {
                            if (clazz.conformsTo(constraint)) {
                                basedOn.push(constraint);
                            }
                        } else if ($isClass(constraint)) {
                            if (clazz.prototype instanceof constraint) {
                                basedOn.push(constraint);
                            }
                        }
                    }
                    if (basedOn.length > 0) {
                        var component = $component(basedOn[0]).boundTo(clazz);
                        return component;
                    }
                },
                register: function(container) {
                    return from.register(container);
                }
            });
        }
    });

    /**
     * @class {ServiceBuilder}
     */
    var ServiceBuilder = Base.extend({
        constructor: function (basedOn) {
            this.extend({
            });
        }
    });

    /**
     * @function $classes
     * @param   {Any} from - source of classes 
     * @returns {Any} a fluent class builder.
     */
    function $classes(from) {
        if (from instanceof Package) {
            return new FromPackageBuilder(from);
        }
        throw new TypeError(lang.format("Unrecognized $classes from %1.", hint));
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