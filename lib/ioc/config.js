var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruken.ioc.
     */
    var ioc = new base2.Package(this, {
        name:    "ioc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.ioc",
        exports: "Installer,$classes"
    });

    eval(this.imports);

    /**
     * @class {Installer}
     */
    var Installer = Base.extend(Registration, {
        register: function(container, composer) {}
    });

    /**
     * @class {FromBuilder}
     */
    var FromBuilder = Base.extend(Registration, {
        constructor: function () {
            var _basedOn;
            this.extend({
                getClasses: function () { return []; },
                basedOn: function (/*constraints*/) {
                    _basedOn = new BasedOnBuilder(this, Array2.flatten(arguments));
                    return _basedOn;
                },
                register: function(container, composer) {
                    var registrations,
                        classes = this.getClasses();
                    if (_basedOn) {  // try based on
                        registrations = Array2.filter(
                            Array2.map(classes, function (member) {
                                return _basedOn.builderForClass(member);
                            }), function (component) {
                            return component;
                        });
                    } else { // try installers
                        registrations = Array2.map(
                            Array2.filter(classes, function (member) {
                                var clazz = member.member || member;
                                return clazz.prototype instanceof Installer;
                            }), function (installer) {
                                installer = installer.member || installer;
                                return new installer;
                            });
                    }
                    return Promise.all(container.register(registrations))
                        .then(function (registrations) {
                            return _unregisterBatch(registrations);
                        });
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
            var _if, _unless, _configuration;
            this.withKeys = new KeyBuilder(this);
            this.extend({
                if: function (condition) {
                    if (_if) {
                        var cond = _if;
                        _if = function (clazz) {
                            return cond(clazz) && condition(clazz);
                        };
                    } else {
                        _if = condition;
                    }
                    return this;
                },
                unless: function (condition) {
                    if (_unless) {
                        var cond = _unless;
                        _unless = function (clazz) {
                            return cond(clazz) || condition(clazz);
                        };
                    } else {
                        _unless = condition;
                    }
                    return this;
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
                builderForClass: function (member) {
                    var basedOn = [],
                        clazz   = member.member || member,
                        name    = member.name;
                    if ((_if && !_if(clazz)) || (_unless && _unless(clazz))) {
                        return;
                    }
                    for (var i = 0; i < constraints.length; ++i) {
                        var constraint = constraints[i];
                        if ($isProtocol(constraint)) {
                            if (!constraint.adoptedBy(clazz)) {
                                continue;
                            }
                        } else if ($isClass(constraint)) {
                            if (!(clazz.prototype instanceof constraint)) {
                                continue;
                            }
                        }
                        if (basedOn.indexOf(constraint) < 0) {
                            basedOn.push(constraint);
                        }
                    }
                    if (basedOn.length > 0 || constraints.length === 0) {
                        var keys      = this.withKeys.getKeys(clazz, basedOn, name),
                            component = $component(keys).boundTo(clazz);
                        if (_configuration) {
                            _configuration(component);
                        }
                        return component;
                    }
                },
                register: function(container, composer) {
                    return from.register(container, composer);
                }
            });
        }
    });

    /**
     * @class {KeyBuilder}
     */
    var KeyBuilder = Base.extend({
        constructor: function (basedOn) {
            var _keySelector;
            this.extend({
                self: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push(clazz);
                    });
                },
                basedOn: function () {
                    return selectKeys(function (keys, clazz, constraints) {
                        keys.push.apply(keys, constraints);
                    });
                },
                anyService: function () {
                    return selectKeys(function (keys, clazz) {
                        var services = clazz.$meta.getAllProtocols();
                        if (services.length > 0) {
                            keys.push(services[0]);
                        }
                    });
                },
                allServices: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push.apply(keys, clazz.$meta.getAllProtocols());
                    });
                },
                mostSpecificService: function (service) {
                    return selectKeys(function (keys, clazz, constraints) {
                        if ($isProtocol(service)) {
                            _addMatchingProtocols(clazz, service, keys);
                        } else {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if ($isFunction(constraint)) {
                                    _addMatchingProtocols(clazz, constraint, keys);
                                }
                            }
                        }
                        if (keys.length === 0) {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if (constraint !== Base && constraint !== Object) {
                                    if ($isProtocol(constraint)) {
                                        if (constraint.adoptedBy(clazz)) {
                                            keys.push(constraint);
                                            break;
                                        }
                                    } else if (clazz === constraint ||
                                               clazz.prototype instanceof constraint) {
                                        keys.push(constraint);
                                        break;
                                    }
                                }
                            }
                        }
                    });
                },
                name: function (n) {
                    return selectKeys(function (keys, clazz, constraints, name) {
                        if ($isNothing(n)) {
                            if (name) {
                                keys.push(name);
                            }
                        } else if ($isFunction(n)) {
                            if (name = n(name)) {
                                keys.push(String(name));
                            }
                        } else {
                            keys.push(String(n));
                        }
                    });
                },
                getKeys: function (clazz, constraints, name) {
                    var keys = [];
                    if (_keySelector) {
                        _keySelector(keys, clazz, constraints, name);
                    }
                    if (keys.length > 0) {
                        return keys;
                    }
                }
            });

            function selectKeys(selector) {
                if (_keySelector) { 
                    var select   = _keySelector;
                    _keySelector = function (keys, clazz, constraints, name) {
                        select(keys, clazz, constraints, name);
                        selector(keys, clazz, constraints, name);
                    };
                } else {
                    _keySelector = selector;
                }
                return basedOn;
            }
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
        throw new TypeError(format("Unrecognized $classes from %1.", hint));
    }

    $classes.fromPackage = function (package) {
        if (!(package instanceof Package)) {
            throw new TypeError(
                format("$classes expected a Package, but received %1 instead.", package));
        }
        return new FromPackageBuilder(package);
    };

    function _unregisterBatch(registrations) {
        return function () {
            for (var i = 0; i < registrations.length; ++i) {
                registrations[i]();
            }
        };
    }

    function _addMatchingProtocols(clazz, preference, matches) {
        var toplevel = _toplevelProtocols(clazz);
        for (var i = 0; i < toplevel.length; ++i) {
            var protocol = toplevel[i];
            if (protocol.$meta.getAllProtocols().indexOf(preference) >= 0) {
                matches.push(protocol);
            }
        }
    }

    function _toplevelProtocols(type) {
        var protocols = type.$meta.getAllProtocols(),
            toplevel  = protocols.slice(0);
        for (var i = 0; i < protocols.length; ++i) {
            var parents = protocols[i].$meta.getAllProtocols();
            for (var ii = 0; ii < parents.length; ++ii) {
                Array2.remove(toplevel, parents[ii]);
            }
        }
        return toplevel;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = ioc;
    }

    eval(this.exports);
}
