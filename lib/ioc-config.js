var miruken = require('./miruken.js');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruke.ioc.config
     */
    var config = new base2.Package(this, {
        name:    "config",
        version: miruken.version,
        parent:  miruken.ioc,
        imports: "miruken,miruken.ioc",
        exports: "ComponentBuilder"
    });

    eval(this.imports);

    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new componentModel;
            _componentModel.setKey(key);
            this.extend({
                boundTo: function (clazz) {
                    _componentModel.setClass(clazz);
                    return this;
                },
                dependsOn: function (/* dependencies */) {
                    _componentModel.setDependencies(Array2.flatten(arguments));
                },
                usingFactory: function (factory) {
                    _componentModel.setFactory(factory);
                    return this;
                },
                singleton: function () {
                    _componentModel.setLifestyle(new SingletonLifestyle);
                },
                transient: function () {
                    _componentModel.setLifestyle(new TransientLifestyle);
                },
                contextual: function () {
                    _componentModel.setLifestyle(new ContextualLifestyle);
                },
                register: function(container) {
                    return container.register(_componentModel);
                }
            });
        }
    });

    if (typeof module !== 'undefined' && module.exports)
        module.exports = exports = config;

    eval(this.exports);
}