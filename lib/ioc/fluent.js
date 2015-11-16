var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('./ioc.js');

new function () { // closure

    /**
     * @module miruken
     * @submodule ioc
     * @namespace miruken.ioc
     * @Class $
     */            
    miruken.package(this, {
        name:    "ioc",
        imports: "miruken,miruken.ioc",
        exports: "Installer,FromBuilder,FromPackageBuilder,BasedOnBuilder,KeyBuilder,$classes"
    });

    eval(this.imports);

    /**
     * Base class for installing one or more components into a 
     * {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class Installer
     * @extends Base
     * @uses miruken.ioc.Registration
     */        
    var Installer = Base.extend(Registration, {
        register: function (container, composer) {}
    });

    /**
     * Fluent builder for specifying source of components.
     * @class FromBuilder
     * @constructor
     * @extends Base
     * @uses miruken.ioc.Registration
     */    
    var FromBuilder = Base.extend(Registration, {
        constructor: function () {
            var _basedOn;
            this.extend({
                /**
                 * Gets the classes represented by this source.
                 * @method getClasses
                 * @returns {Array} classes from this source.
                 */        
                getClasses: function () { return []; },
                /**
                 * Gets the builder for filtering classes from this source.
                 * @method basedOn
                 * @returns {miruken.ioc.BasedOnBuilder} fluent class filter.
                 */        
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
     * Fluent builder for specifying a Package as a source of components.
     * @class FromPackageBuilder
     * @constructor
     * @param {Package} package     -  package containing components
     * @param {Array}   [...names]  -  optional member name filter
     * @extends miruken.ioc.FromBuilder
     */        
    var FromPackageBuilder = FromBuilder.extend({
        constructor: function (package, names) {
            this.base();
            this.extend({
                getClasses: function () {
                    var classes = [];
                    package.getClasses(names, function (clazz) {
                        classes.push(clazz);
                    });
                    return classes;
                }
            });
        }
    });

    /**
     * Fluent builder for filtering a source of components.
     * @class BasedOnBuilder
     * @constructor
     * @param  {miruken.ioc.FromBuilder}  from            -  source of components
     * @param  {Array}                    ...constraints  -  initial constraints
     * @extends Base
     * @uses miruken.ioc.Registration
     */        
    var BasedOnBuilder = Base.extend(Registration, {
        constructor: function (from, constraints) {
            var _if, _unless, _configuration;
            this.withKeys = new KeyBuilder(this);
            this.extend({
                /**
                 * Adds a predicate for including a component.
                 * @method if
                 * @param   {Function}  condition  -  predicate to include component
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */        
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
                /**
                 * Adds a predicate for excluding a component.
                 * @method unless
                 * @param   {Function}  condition  -  predicate to exclude component
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */                        
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
                /**
                 * Adds a custom component configuration.
                 * @method configure
                 * @param   {Function}  configuration  -  receives
                 * {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} for configuration
                 * @returns {miruken.ioc.BasedOnBuilder} current builder.
                 * @chainable
                 */                                        
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
     * Fluent builder for identifying component key(s).
     * @class KeyBuilder
     * @constructor
     * @param  {miruken.ioc.BasedOnBuilder}  basedOn  -  based on builder
     * @extends Base
     */            
    var KeyBuilder = Base.extend({
        constructor: function (basedOn) {
            var _keySelector;
            this.extend({
                /**
                 * Uses the component class as the key.
                 * @method self
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                self: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push(clazz);
                    });
                },
                /**
                 * Uses the based on contraints as the keys.
                 * @method basedOn
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                basedOn: function () {
                    return selectKeys(function (keys, clazz, constraints) {
                        keys.push.apply(keys, constraints);
                    });
                },
                /**
                 * Uses any class {{#crossLink "miruken.Protocol"}}{{/crossLink}} as the key.
                 * @method anyService
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                anyService: function () {
                    return selectKeys(function (keys, clazz) {
                        var services = clazz.$meta.getAllProtocols();
                        if (services.length > 0) {
                            keys.push(services[0]);
                        }
                    });
                },
                /**
                 * Uses all class {{#crossLink "miruken.Protocol"}}{{/crossLink}} as the keys.
                 * @method allServices
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
                allServices: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push.apply(keys, clazz.$meta.getAllProtocols());
                    });
                },
                /**
                 * Uses the most specific {{#crossLink "miruken.Protocol"}}{{/crossLink}} 
                 * in the class hierarchy as the key.
                 * @method mostSpecificService
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */
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
                /**
                 * Uses a string as the component name.  
                 * If no name is provided, the default name will be used.
                 * @method name
                 * @param {string | Function}  [n]  -  name or function receiving default name
                 * @returns {miruken.ioc.BasedOnBuilder} based on builder.
                 */                
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
                /**
                 * Gets the component keys to be registered as.
                 * @method getKeys
                 * @param {Function}  clazz           -  component class
                 * @param {Array}     ...constraints  -  initial constraints
                 * @param {string}    name            -  default name
                 * @returns {Array} component keys.
                 */                                
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
     * Shortcut for creating a {{#crossLink "miruken.ioc.FromBuilder"}}{{/crossLink}}.
     * @method $classes
     * @param  {Any}    from        -  any source of classes.  Only Package is currently supported.
     * @param  {Array}  [...names]  -  optional member name filter
     * @return {miruken.ioc.FromBuilder} from builder.
     * @for miruken.ioc.$
     */        
    function $classes(from, names) {
        if (from instanceof Package) {
            return new FromPackageBuilder(from, names);
        }
        throw new TypeError(format("Unrecognized $classes from %1.", hint));
    }

    /**
     * Creates a {{#crossLink "miruken.ioc.FromBuilder"}}{{/crossLink}} using a Package source.
     * @method $classes.fromPackage
     * @param  {Package}  package
     * @param  {Array}    [...names]  -  optional member name filter
     * @for miruken.ioc.$
     */    
    $classes.fromPackage = function (package, names) {
        if (!(package instanceof Package)) {
            throw new TypeError(
                format("$classes expected a Package, but received %1 instead.", package));
        }
        return new FromPackageBuilder(package, names);
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
        module.exports = exports = this.package;
    }

    eval(this.exports);
}
