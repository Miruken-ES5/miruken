var miruken = require('./miruken.js');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruke.ioc.config
     */
    var config = new base2.Package(this, {
        name:    "config",
        version: miruken.ioc.version,
        parent:  miruken.ioc,
        imports: "miruken,miruken.ioc",
        exports: "ComponentBuilder,$component"
    });

    eval(this.imports);

    /**
     * @function $component
     * @param   {Any} key - component key
     * @returns {ComponentBuilder} a fluent component builder.
     */
    function $component(key) {
    if ($isNothing(key)) {
        throw new TypeError("The component key must be specified.");
    }
    return new ComponentBuilder(key);
    }

    /**
     * @class {ComponentBuilder}
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel;
            _componentModel.setKey(key);
            this.extend({
                invariant: function () {
                    _componentModel.invariant();
                },
                boundTo: function (classOrService) {
                    if ($isProtocol(classOrService)) {
                        _componentModel.setService(classOrService);
                    } else {
                        _componentModel.setClass(classOrService);
                    }
                    return this;
                },
                dependsOn: function (/* dependencies */) {
                    _componentModel.setDependencies(Array2.flatten(arguments));
                    return this;
                },
                usingFactory: function (factory) {
                    _componentModel.setFactory(factory);
                    return this;
                },
                singleton: function () {
                    _componentModel.setLifestyle(new SingletonLifestyle);
                    return this;
                },
                transient: function () {
                    _componentModel.setLifestyle(new TransientLifestyle);
                    return this;
                },
                contextual: function () {
                    _componentModel.setLifestyle(new ContextualLifestyle);
                    return this;
                },
                configure: function (configurer) {
                    if (!$isFunction(configurer)) {
                        throw new TypeError("Function required for configure.");
                    }
                    cofigurer(_componentModel);
                    return this;
                },
                register: function(container) {
                    return container.register(_componentModel);
                }
            });
        }
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = config;
    } else if (typeof define === "function" && define.amd) {
        define("miruken.ioc.config", [], function() {
            return config;
        });
    }

    eval(this.exports);
}