var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../callback.js'),
              require('../context.js'),
              require('../validate');

new function () { // closure

    /**
     * Package providing dependency injection and inversion-of-control.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule ioc
     * @namespace miruken.ioc
     * @Class $
     */        
    miruken.package(this, {
        name:    "ioc",
        imports: "miruken,miruken.graph,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,Lifestyle,TransientLifestyle," +
                 "SingletonLifestyle,ContextualLifestyle,DependencyModifier,DependencyModel," +
                 "DependencyManager,ComponentModel,ComponentBuilder,ComponentModelError," +
                 "IoContainer,DependencyResolution,DependencyResolutionError," +
                 "$component,$$composer,$container"
    });

    eval(this.imports);

    /**
     * Symbol for injecting composer dependency.<br/>
     * See {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}
     * @property {Object} $$composer
     * @for miruken.ioc.$
     */    
    var $$composer = Object.freeze({});
    
    /**
     * Modifier to request container dependency.<br/>
     * See {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}
     * @class $container
     * @extend miruken.Modifier
     */            
    var $container = $createModifier();
    
    /**
     * Shared proxy builder
     * @property {miruken.ProxyBuilder} proxyBuilder
     * @for miruken.ioc.$
     */            
    var $proxyBuilder = new ProxyBuilder;

    /**
     * Protocol for exposing container capabilities.
     * @class Container
     * @extends miruken.StrictProtocol
     * @uses miruken.Invoking
     * @uses miruken.Disposing
     */            
    var Container = StrictProtocol.extend(Invoking, Disposing, {
        /**
         * Registers components in the container.
         * @method register
         * @param   {Arguments}  [...registrations]  -  registrations
         * @return {Function} function to unregister components.
         */
        register: function (registrations) {},
        /**
         * Adds a configured component to the container.
         * @method addComponent
         * @param   {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param   {Array}                      [...policies]   -  component policies
         * @return  {Function} function to remove component.
         */
        addComponent: function (componentModel, policies) {},
        /**
         * Adds container-wide policies for all components.
         * @method addPolicies
         * @param   {Array}  [...policies]  -  container-wide policies
         */        
        addPolicies: function (policies) {},
        /**
         * Resolves the first component satisfying the key.
         * @method resolve
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Object | Promise} first component satisfying the key.
         * @async
         */
        resolve: function (key) {},
        /**
         * Resolves all the components satisfying the key.
         * @method resolveAll
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Array | Promise} all components satisfying the key.
         * @async
         */
        resolveAll: function (key) {}
    });

    /**
     * Protocol for registering components in a {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class Registration
     * @extends miruken.Protocol
     */                
    var Registration = Protocol.extend({
        /**
         * Encapsulates the regisration of components in a container.
         * @method register
         * @param  {miruken.ioc.Container}            container  -  container
         * @param  {miruken.callback.CallbackHandler} composer   -  composition handler
         * @return {Function} function to unregister components.
         */
         register: function (container, composer) {}
    });

     /**
     * Protocol for defining policies for components.
     * @class ComponentPolicy
     * @extends miruken.Protocol
     */                
    var ComponentPolicy = Protocol.extend({
        /**
         * Applies the policy to the component model.
         * @method applyPolicy
         * @param  {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param  {Array}                      [...policies]   -  all known policies
         */
        applyPolicy: function (componentModel, policies) {},
        /**
         * Notifies the creation of a component.
         * @method componentCreated
         * @param  {Object} component                           -  component instance
         * @param  {Object} dependencies                        -  resolved dependencies
         * @param  {miruken.callback.CallbackHandler} composer  -  composition handler
         */        
        componentCreated: function (component, dependencies, composer) {}
    });

    /**
     * DependencyModifier flags
     * @class DependencyModifier
     * @extends miruken.Enum
     */    
    var DependencyModifier = Flags({
        /**
         * No dependency modifiers.
         * @property {number} None
         */
        None: 0,
        /**
         * See {{#crossLink "miruken.Modifier/$use:attribute"}}{{/crossLink}}
         * @property {number} Use
         */
        Use: 1 << 0,
        /**
         * See {{#crossLink "miruken.Modifier/$lazy:attribute"}}{{/crossLink}}
         * @property {number} Lazy
         */
        Lazy: 1 << 1,
        /**
         * See {{#crossLink "miruken.Modifier/$every:attribute"}}{{/crossLink}}
         * @property {number} Every
         */
        Every: 1 << 2,
        /**
         * See {{#crossLink "miruken.Modifier/$eval:attribute"}}{{/crossLink}}
         * @property {number} Dynamic
         */
        Dynamic: 1 << 3,
        /**
         * See {{#crossLink "miruken.Modifier/$optional:attribute"}}{{/crossLink}}
         * @property {number} Optional
         */
        Optional: 1 << 4,
        /**
         * See {{#crossLink "miruken.Modifier/$promise:attribute"}}{{/crossLink}}
         * @property {number} Promise
         */
        Promise: 1 << 5,
        /**
         * See {{#crossLink "miruken.Modifier/$eq:attribute"}}{{/crossLink}}
         * @property {number} Invariant
         */
        Invariant: 1 << 6,
        /**
         * See {{#crossLink "miruken.ioc.$container"}}{{/crossLink}}
         * @property {number} Container
         */
        Container: 1 << 7,
        /**
         * See {{#crossLink "miruken.Modifier/$child:attribute"}}{{/crossLink}}
         * @property {number} Child
         */        
        Child: 1 << 8
    });

    DependencyModifier.Use.modifier       = $use;
    DependencyModifier.Lazy.modifier      = $lazy;
    DependencyModifier.Every.modifier     = $every;
    DependencyModifier.Dynamic.modifier   = $eval;
    DependencyModifier.Child.modifier     = $child;
    DependencyModifier.Optional.modifier  = $optional;
    DependencyModifier.Promise.modifier   = $promise;
    DependencyModifier.Container.modifier = $container;
    DependencyModifier.Invariant.modifier = $eq;
    
    /**
     * Describes a component dependency.
     * @class DependencyModel
     * @constructor
     * @param {Any} dependency  -  annotated dependency
     * @param {miruken.ioc.DependencyModifier} modifiers  -  dependency annotations
     * @extends Base
     */
    var DependencyModel = Base.extend({
        constructor: function (dependency, modifiers) {
            modifiers = DependencyModifier.None.addFlag(modifiers);
            if (dependency instanceof Modifier) {
                Array2.forEach(DependencyModifier.items, function (flag) {
                    var modifier = flag.modifier;
                    if (modifier && modifier.test(dependency)) {
                        modifiers = modifiers.addFlag(flag);
                    }
                });
                dependency = Modifier.unwrap(dependency);
            }
            this.extend({
                /**
                 * Gets the dependency.
                 * @property {Any} dependency
                 * @readOnly
                 */                            
                get dependency() { return dependency; },
                /**
                 * Gets the dependency flags.
                 * @property {miruken.ioc.DependencyModifier} modifiers
                 * @readOnly
                 */                        
                get modifiers() { return modifiers; }
            });
        },
        /**
         * Tests if the receiving dependency is annotated with the modifier.
         * @method test
         * @param   {miruken.ioc.DependencyModifier}  modifier  -  modifier flags
         * @returns {boolean} true if the dependency is annotated with modifier(s).
         */        
        test: function (modifier) {
            return this.modifiers.hasFlag(modifier);
        }
    }, {
        coerce: function (object) {
           return (object === undefined) ? undefined : new DependencyModel(object);
        }
    });

    /**
     * Manages an array of dependencies.
     * @class DependencyManager
     * @constructor
     * @param {Array} dependencies  -  dependencies
     * @extends miruken.ArrayManager
     */
    var DependencyManager = ArrayManager.extend({
        constructor: function (dependencies) {
            this.base(dependencies);
        },
        mapItem: function (item) {
            return !(item !== undefined && item instanceof DependencyModel) 
                 ? DependencyModel(item) 
                 : item;
        }                         
    });

    /**
     * Describes a component to be managed by a {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class ComponentModel
     * @constructor
     * @extends Base
     */
    var ComponentModel = Base.extend($validateThat, {
        constructor: function () {
            var _key, _implementation, _lifestyle, _factory,
                _invariant = false, _burden = {};
            this.extend({
                /**
                 * Gets/sets the component key.
                 * @property {Any} key
                 */
                get key() { return _key || _implementation },
                set key(value) { _key = value; },
                /**
                 * Gets/sets the component class.
                 * @property {Functon} implementation
                 */
                get implementation() {
                    var impl = _implementation;
                    if (!impl && $isClass(_key)) {
                        impl = _key;
                    }
                    return impl;
                },
                set implementation(value) {
                    if ($isSomething(value) && !$isClass(value)) {
                        throw new TypeError(format("%1 is not a class.", value));
                    }
                    _implementation = value;
                },
                /**
                 * Gets/sets if component is invariant.
                 * @property {boolean} invariant
                 */                                                
                get invariant () { return _invariant; },
                set invariant(value) { _invariant = !!value; },
                /**
                 * Gets/sets the component lifestyle.
                 * @property {miruken.ioc.Lifestyle} lifestyle
                 */
                get lifestyle() { return _lifestyle; },
                set lifestyle(value) {
                    if (!$isSomething(value) && !(value instanceof Lifestyle)) {
                        throw new TypeError(format("%1 is not a Lifestyle.", value));
                    }
                    _lifestyle = value; 
                },
                /**
                 * Gets/sets the component factory.
                 * @property {Function} factory
                 */
                get factory() {
                    var factory = _factory,
                        clazz   = this.implementation;
                    if (!factory) {
                        var interceptors = _burden[Facet.Interceptors];
                        if (interceptors && interceptors.length > 0) {
                            var types = [];
                            if (clazz) {
                                types.push(clazz);
                            }
                            if ($isProtocol(_key)) {
                                types.push(_key);
                            }
                            return _makeProxyFactory(types);
                        } else if (clazz) {
                            return _makeClassFactory(clazz);
                        }
                    }
                    return factory;
                },
                set factory(value) {
                    if ($isSomething(value) && !$isFunction(value)) {
                        throw new TypeError(format("%1 is not a function.", value));
                    }
                    _factory = value;
                },
                /**
                 * Gets the component dependency group.
                 * @method getDependencies
                 * @param   {string} [key=Facet.Parameters]  -  dependency group  
                 * @returns {Array}  group dependencies.
                 */                
                getDependencies: function (key) { 
                    return _burden[key || Facet.Parameters];
                },
                /**
                 * Sets the component dependency group.
                 * @method setDependencies
                 * @param {string} [key=Facet.Parameters]  -  dependency group  
                 * @param {Array}  value                   -  group dependenies.
                 */                
                setDependencies: function (key, value) {
                    if (arguments.length === 1) {
                        value = key, key = Facet.Parameters;
                    }
                    if ($isSomething(value) && !$isArray(value)) {
                        throw new TypeError(format("%1 is not an array.", value));
                    }
                    _burden[key] = Array2.map(value, DependencyModel);
                },
                /**
                 * Manages the component dependency group.
                 * @method manageDependencies
                 * @param  {string}   [key=Facet.Parameters]  -  dependency group  
                 * @param  {Function} actions  -  function accepting miruken.ioc.DependencyManager
                 * @return {Array} dependency group.
                 */                                
                manageDependencies: function (key, actions) {
                    if (arguments.length === 1) {
                        actions = key, key = Facet.Parameters;
                    }
                    if ($isFunction(actions)) {
                        var dependencies = _burden[key],
                            manager      = new DependencyManager(dependencies);
                        actions(manager);
                        var dependencies = manager.getItems();
                        if (dependencies.length > 0) {
                            _burden[key] = dependencies;
                        }
                    }
                    return dependencies;
                },
                /**
                 * Gets the component dependency burden.
                 * @property {Object} burden
                 * @readOnly
                 */                                
                get burden() { return _burden; }
            });
        },
        $validateThat: {
            keyCanBeDetermined: function (validation) {
                if (!this.key) {
                    validation.results.addKey("key").addError("required", { 
                        message: "Key could not be determined for component." 
                    });
                }
            },
            factoryCanBeDetermined: function (validation) {
                if (!this.factory) {
                    validation.results.addKey("factory").addError("required", { 
                        message: "Factory could not be determined for component." 
                    });
                }
            }
        }
    });

    function _makeClassFactory(clazz) {
        return function (burden) {
            return clazz.new.apply(clazz, burden[Facet.Parameters]);
        }
    }

    function _makeProxyFactory(types) {
        var proxy = $proxyBuilder.buildProxy(types);
        return function (burden) {
            return proxy.new.call(proxy, burden);
        }
    }

    /**
     * Manages the creation and destruction of components.
     * @class Lifestyle
     * @extends Base
     * @uses miruken.ioc.ComponentPolicy
     * @uses miruken.DisposingMixin
     * @uses miruken.Disposing
     */
    var Lifestyle = Abstract.extend(ComponentPolicy, Disposing, DisposingMixin, {
        /**
         * Obtains the component instance.
         * @method resolve
         * @returns {Object} component instance.
         */
        resolve: function (factory) {
            return factory();
        },
        /**
         * Tracks the component instance for disposal.
         * @method trackInstance
         * @param {Object} instance  -  component instance.
         */        
        trackInstance: function (instance) {
            if (instance && $isFunction(instance.dispose)) {
                var lifestyle = this;
                instance.extend({
                    dispose: function (disposing) {
                        if (disposing || lifestyle.disposeInstance(instance, true)) {
                            this.base();
                            this.dispose = this.base;
                        }
                    }
                });
            }
        },
        /**
         * Disposes the component instance.
         * @method disposeInstance
         * @param {Object}  instance   -  component instance.
         * @param {boolean} disposing  -  true if being disposed.  
         */                
        disposeInstance: function (instance, disposing) {
            if (!disposing && instance && $isFunction(instance.dispose)) {
                instance.dispose(true);
            }
            return !disposing;
        },
        applyPolicy: function (componentModel) {
            componentModel.lifestyle = new this.constructor;
        }
    });

   /**
     * Creates untracked component instances.
     * @class TransientLifestyle
     * @extends miruken.ioc.Lifestyle
     */
    var TransientLifestyle = Lifestyle.extend({
        constructor: function () {},
        applyPolicy: function (componentModel) {
            componentModel.lifestyle = this;  // stateless
        }
    });

   /**
     * Manages a single instance of a component.
     * @class SingletonLifestyle
     * @constructor
     * @param {Object} [instance]  -  existing component instance
     * @extends miruken.ioc.Lifestyle
     */
    var SingletonLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
                resolve: function (factory) {
                    return instance ? instance : factory(function (object) {
                        if (!instance && object) {
                            instance = object;
                            this.trackInstance(instance);
                        }
                    }.bind(this));
                },
                disposeInstance: function (object, disposing) {
                    // Singletons cannot be disposed directly
                    if (!disposing && (object === instance)) {
                        if (this.base(object, disposing)) {
                           instance = undefined;
                           return true;
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    this.disposeInstance(instance);
                }
            });
        }
    });

   /**
     * Manages instances scoped to a {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextualLifestyle
     * @constructor
     * @extends miruken.ioc.Lifestyle
     */
    var ContextualLifestyle = Lifestyle.extend({
        constructor: function () {
            var _cache = {};
            this.extend({
                resolve: function (factory, composer) {
                    var context = composer.resolve(Context);
                    if (context) {
                        var id       = context.id,
                            instance = _cache[id];
                        return instance ? instance : factory(function (object) {
                            if (object && !_cache[id]) {
                                _cache[id] = instance = object;
                                this.trackInstance(instance);
                                ContextualHelper.bindContext(instance, context);
                                context.onEnded(function () {
                                    instance.context = null;
                                    this.disposeInstance(instance);
                                    delete _cache[id];
                                }.bind(this));
                            }
                        }.bind(this));
                    }
                },
                disposeInstance: function (instance, disposing) {
                    if (!disposing) {  // Cannot be disposed directly
                        for (contextId in _cache) {
                            if (_cache[contextId] === instance) {
                                this.base(instance, disposing);
                                delete _cache[contextId];
                                return true;
                            } 
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    for (contextId in _cache) {
                        this.disposeInstance(_cache[contextId]);
                    }
                    _cache = {};
                }
            });
        }
    });

    /**
     * Collects dependencies to be injected into components.
     * @class InjectionPolicy
     * @uses miruken.ioc.ComponentPolicy
     * @extends Base
     */
    var InjectionPolicy = Base.extend(ComponentPolicy, {
        applyPolicy: function (componentModel) {
            // Dependencies will be merged from inject definitions
            // starting from most derived unitl no more remain or the
            // current definition is fully specified (no holes).
            var dependencies = componentModel.getDependencies();
            if (dependencies && !Array2.contains(dependencies, undefined)) {
                return;
            }
            var clazz = componentModel.implementation;
            componentModel.manageDependencies(function (manager) {
                while (clazz && (clazz !== Base)) {
                    var injects = [clazz.prototype.$inject, clazz.prototype.inject,
                                   clazz.$inject, clazz.inject];
                    for (var i = 0; i < injects.length; ++i) {
                        var inject = injects[i];
                        if (inject !== undefined) {
                            if ($isFunction(inject)) {
                                inject = inject();
                            }
                            manager.merge(inject);
                            if (!Array2.contains(inject, undefined)) {
                                return;
                            }
                        }
                    }
                    clazz = $ancestorOf(clazz);
                }
            });
        }
    });
    
    /**
     * Executes the {{#crossLink "miruken.Initializing"}}{{/crossLink}} protocol.
     * @class InitializationPolicy
     * @uses miruken.ioc.ComponentPolicy
     * @extends Base
     */
    var InitializationPolicy = Base.extend(ComponentPolicy, {
        componentCreated: function (component) {
            if ($isFunction(component.initialize)) {
                return component.initialize();
            }
        }        
    });
    
    /**
     * Builds {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} using fluent api.
     * @class ComponentBuilder
     * @constructor
     * @extends Base
     * @uses miruken.ioc.Registration
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel,
                _newInContext, _newInChildContext, _policies;
            _componentModel.key = key;
            this.extend({
                /**
                 * Marks the component as invariant.
                 * @method invariant
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */
                invariant: function () {
                    _componentModel.setInvariant();
                    return this;
                },
                /**
                 * Specifies the component class.
                 * @method boundTo
                 * @param {Function} value  - component class
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                
                boundTo: function (clazz) {
                    _componentModel.implementation = clazz;
                    return this;
                },
                /**
                 * Specifies component dependencies.
                 * @method dependsOn
                 * @param  {Argument} arguments  -  dependencies
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                dependsOn: function (dependencies) {
                    dependencies = Array.prototype.concat.apply([], arguments);
                    _componentModel.setDependencies(dependencies);
                    return this;
                },
                /**
                 * Specifies the component factory.
                 * @method usingFactory
                 * @param {Function} value  - component factory
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                usingFactory: function (factory) {
                    _componentModel.factory = factory;
                    return this;
                },
                /**
                 * Uses the supplied component instance.
                 * @method instance
                 * @param {Object} instance  - component instance
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                instance: function (instance) {
                    _componentModel.lifestyle = new SingletonLifestyle(instance);
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.SingletonLifestyle"}}{{/crossLink}}.
                 * @method singleon
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */
                singleton: function () {
                    _componentModel.lifestyle = new SingletonLifestyle;
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.TransientLifestyle"}}{{/crossLink}}.
                 * @method transient
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                
                transient: function () {
                    _componentModel.lifestyle = new TransientLifestyle;
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.ContextualLifestyle"}}{{/crossLink}}.
                 * @method contextual
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                contextual: function () {
                    _componentModel.lifestyle = new ContextualLifestyle;
                    return this;
                },
                /**
                 * Binds the component to the current 
                 * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
                 * @method newInContext
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                newInContext: function () {
                    _newInContext = true;
                    return this;
                },
                /**
                 * Binds the component to a child of the current 
                 * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
                 * @method newInContext
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                                
                newInChildContext: function () {
                    _newInChildContext = true;
                    return this;
                },
                /**
                 * Attaches component interceptors.
                 * @method interceptors
                 * @param  {miruken.Interceptor}  ...interceptors  -  interceptors
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                interceptors: function (interceptors) {
                    interceptors = Array.prototype.concat.apply([], arguments);
                    return new InterceptorBuilder(this, _componentModel, interceptors);
                },
                /**
                 * Attaches {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}}'s.
                 * @method policies
                 * @param   {miruken.ioc.ComponentPolicy}  ...policies  -  policies
                 */            
                policies: function (policies) {
                    if (policies) {
                        _policies = Array.prototype.concat.apply(_policies || [], arguments);
                    }
                    return this;
                },
                register: function (container) {
                    if ( _newInContext || _newInChildContext) {
                        var factory = _componentModel.factory;
                        _componentModel.factory = function (dependencies) {
                            var object  = factory(dependencies),
                                context = this.resolve(Context);
                            if (_newInContext) {
                                ContextualHelper.bindContext(object, context);
                            } else {
                                ContextualHelper.bindChildContext(context, object);
                            }
                            return object;
                        };
                    }
                    return container.addComponent(_componentModel, _policies);
                }
            });
        }
    });

    /**
     * Builds {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} interceptors using fluent api.
     * @class InterceptorBuilder
     * @constructor
     * @param {miruken.ioc.ComponentBuilder}  component       -  component builder
     * @param {miruken.ioc.ComponentModel}    componentModel  -  component model
     * @param {Array}                         interceptors    -  component interceptors
     * @extends Base
     * @uses miruken.ioc.Registration
     */
    var InterceptorBuilder = Base.extend(Registration, {
        constructor: function (component, componentModel, interceptors) {
            this.extend({
                selectWith: function (selectors) {
                    componentModel.manageDependencies(Facet.InterceptorSelectors, function (manager) {
                        Array2.forEach(selectors, function (selector) {
                            if (selector instanceof InterceptorSelector) {
                                selecter = $use(selector);
                            }
                            manager.append(selector);
                        });
                    });
                    return this;
                },
                /**
                 * Marks interceptors to be added to the front of the list.
                 * @method toFront
                 * @returns {miruken.ioc.InterceptorBuilder} builder
                 * @chainable
                 */            
                toFront: function () {
                    return this.atIndex(0);
                },
                /**
                 * Marks interceptors to be added at the supplied index.
                 * @method atIndex
                 * @param {number}  index  -  index to add interceptors at
                 * @returns {miruken.ioc.InterceptorBuilder} builder
                 * @chainable
                 */            
                atIndex: function (index) {
                    componentModel.manageDependencies(Facet.Interceptors, function (manager) {
                        Array2.forEach(interceptors, function (interceptor) {
                            manager.insertIndex(index, interceptor);
                        });
                    });
                    return componentModel;
                },
                register: function(container, composer) {
                    componentModel.manageDependencies(Facet.Interceptors, function (manager) {
                        manager.append(interceptors);
                    });
                    return component.register(container, composer);
                }
            });
        }
    });

    /**
     * Shortcut for creating a {{#crossLink "miruken.ioc.ComponentBuilder"}}{{/crossLink}}.
     * @method $component
     * @param   {Any} key - component key
     * @return  {miruken.ioc.ComponentBuilder} component builder.
     * @for miruken.ioc.$
     */    
    function $component(key) {
        return new ComponentBuilder(key);
    }

    /**
     * Specialized {{#crossLink "miruken.callback.Resolution"}}{{/crossLink}}
     * that maintains a parent relationship for representing resolution chains.
     * @class DependencyResolution
     * @constructor
     * @param   {string}                             key     -  resolution key
     * @param   {miruken.ioc.DependencyResolution}   parent  -  parent resolution
     * @param   {boolean}                            many    -  resolution cardinality
     * @extends miruken.callback.Resolution
     */
    var DependencyResolution = Resolution.extend({
        constructor: function (key, parent, many) {
            var _class, _handler;
            this.base(key, many);
            this.extend({
                claim: function (handler, clazz) { 
                    if (this.isResolvingDependency(handler)) {
                        return false;
                    }
                    _handler = handler;
                    _class   = clazz;
                    return true;
                },
                /**
                 * Determines if the handler is in the process of resolving a dependency.
                 * @method isResolvingDependency
                 * @param   {Function}  handler  -  dependency handler
                 * @returns {boolean} true if resolving a dependency, false otherwise.
                 */                
                isResolvingDependency: function (handler) {
                    return (handler === _handler)
                        || (parent && parent.isResolvingDependency(handler))
                },
                /**
                 * Formats the dependency resolution chain for display.
                 * @method formattedDependencyChain
                 * @returns {string} formatted dependency resolution chain.
                 */                
                formattedDependencyChain: function () {
                    var invariant  = $eq.test(key),
                        rawKey     = Modifier.unwrap(key),
                        keyDisplay = invariant ? ('`' + rawKey + '`') : rawKey,
                        display    = _class ? ("(" + keyDisplay + " <- " + _class + ")") : keyDisplay;
                    return parent 
                         ? (display + " <= " + parent.formattedDependencyChain())
                         : display;
                }
            });
        }
    });

    /**
     * Records a dependency resolution failure.
     * @class DependencyResolutionError
     * @constructor
     * @param {miruken.ioc.DependencyResolution} dependency  -  failing dependency
     * @param {string}                           message     -  error message
     * @extends Error
     */
    function DependencyResolutionError(dependency, message) {
        /**
         * Gets the error message.
         * @property {string} message
         */
        this.message = message;
        /**
         * Gets the failing dependency resolution.
         * @property {miruken.ioc.DependencyResolution} dependency
         */
        this.dependency = dependency;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    DependencyResolutionError.prototype             = new Error;
    DependencyResolutionError.prototype.constructor = DependencyResolutionError;

    /**
     * Identifies an invalid {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}}.
     * @class ComponentModelError
     * @constructor
     * @param {miruken.ioc.ComponentModel}        componentModel     -  invalid component model
     * @param {miruken.validate.ValidationResult} validationResults  -  validation results
     * @param {string}                            message            -  error message
     * @extends Error
     */
    function ComponentModelError(componentModel, validationResults, message) {
        /**
         * Gets the error message.
         * @property {string} message
         */
        this.message = message || "The component model contains one or more errors";
        /**
         * Gets the invalid component model.
         * @property {miruken.ioc.ComponentModel} componentModel
         */         
        this.componentModel = componentModel;
        /**
         * Gets the failing validation results.
         * @property {miruken.validate.ValidationResult} validationResults
         */         
        this.validationResults = validationResults;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    ComponentModelError.prototype             = new Error;
    ComponentModelError.prototype.constructor = ComponentModelError;

    var DEFAULT_POLICIES = [ new InjectionPolicy, new InitializationPolicy ];
    
    /**
     * Default Inversion of Control {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class IoContainer
     * @constructor
     * @extends CallbackHandler
     * @uses miruken.ioc.Container
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            var _policies = DEFAULT_POLICIES;
            this.extend({
                addComponent: function (componentModel, policies) {
                    policies = (policies && policies.length > 0)
                             ? _policies.concat(policies)
                             : _policies;
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.applyPolicy)) {
                            policy.applyPolicy(componentModel, policies);
                        }
                    }
                    var validation = Validator($composer).validate(componentModel);
                    if (!validation.valid) {
                        throw new ComponentModelError(componentModel, validation);
                    }
                    return this.registerHandler(componentModel, policies); 
                },
                addPolicies: function (policies) {
                    if (policies) {
                        _policies = _policies.concat.apply(_policies, arguments);
                    }
                }                
            })
        },
        register: function (registrations) {
            return Array2.flatten(arguments).map(function (registration) {
                return registration.register(this, $composer);
            }.bind(this));
        },
        registerHandler: function (componentModel, policies) {
            var key       = componentModel.key,
                clazz     = componentModel.implementation,
                lifestyle = componentModel.lifestyle || new SingletonLifestyle,
                factory   = componentModel.factory,
                burden    = componentModel.burden;
            key = componentModel.invariant ? $eq(key) : key;
            return _registerHandler(this, key, clazz, lifestyle, factory, burden, policies); 
        },
        invoke: function (fn, dependencies, ctx) {
            var inject  = fn.$inject || fn.inject,
                manager = new DependencyManager(dependencies);
            if (inject) {
                if ($isFunction(inject)) {
                    inject = inject();
                }
                manager.merge(inject);
            }
            dependencies = manager.getItems();
            if (dependencies.length > 0) {
                var burden = { d:  dependencies };
                deps = _resolveBurden(burden, true, null, $composer);
                return fn.apply(ctx, deps.d);
            }
            return fn();
        },
        dispose: function () {
            $provide.removeAll(this);
        }
    });

    function _registerHandler(container, key, clazz, lifestyle, factory, burden, policies) {
        return $provide(container, key, function handler(resolution, composer) {
            if (!(resolution instanceof DependencyResolution)) {
                resolution = new DependencyResolution(resolution.key);
            }
            if (!resolution.claim(handler, clazz)) {  // cycle detected
                return $NOT_HANDLED;
            }
            return lifestyle.resolve(function (configure) {
                var instant      = $instant.test(resolution.key),
                    dependencies = _resolveBurden(burden, instant, resolution, composer);
                return $isPromise(dependencies)
                     ? dependencies.then(createComponent)
                     : createComponent(dependencies);
                function createComponent(dependencies) {
                    var component = factory.call(composer, dependencies);
                    if ($isFunction(configure)) {
                        configure(component, dependencies);
                    }
                    return applyPolicies(0);
                    function applyPolicies(index) {
                        for (var i = index; i < policies.length; ++i) {
                            var policy = policies[i];
                            if ($isFunction(policy.componentCreated)) {
                                var result = policy.componentCreated(component, dependencies, composer);
                                if ($isPromise(result)) {
                                    return result.then(function () {
                                        return applyPolicies(i + 1);
                                    });
                                }
                            }
                        }
                        return component;
                    }
                }
            }, composer);
        }, lifestyle.dispose.bind(lifestyle));
    }

    function _resolveBurden(burden, instant, resolution, composer) {
        var promises     = [],
            dependencies = {},
            containerDep = Container(composer);
        for (var key in burden) {
            var group = burden[key];
            if ($isNothing(group)) {
                continue;
            }
            var resolved = group.slice(0);
            for (var index = 0; index < resolved.length; ++index) {
                var dep = resolved[index];
                if (dep === undefined) {
                    continue;
                }
                var use        = dep.test(DependencyModifier.Use),
                    lazy       = dep.test(DependencyModifier.Lazy),
                    promise    = dep.test(DependencyModifier.Promise),
                    child      = dep.test(DependencyModifier.Child),
                    dynamic    = dep.test(DependencyModifier.Dynamic),
                    dependency = dep.dependency;
                if (use || dynamic || $isNothing(dependency)) {
                    if (dynamic && $isFunction(dependency)) {
                        dependency = dependency(containerDep);
                    }
                    if (child) {
                        dependency = _createChild(dependency);
                    }
                    if (promise) {
                        dependency = Promise.resolve(dependency);
                    }
                } else if (dependency === $$composer) {
                    dependency = composer;
                } else if (dependency === Container) {
                    dependency = containerDep;
                } else {
                    var all           = dep.test(DependencyModifier.Every),
                        optional      = dep.test(DependencyModifier.Optional),
                        invariant     = dep.test(DependencyModifier.Invariant),
                        fromContainer = dep.test(DependencyModifier.Container);
                    if (invariant) {
                        dependency = $eq(dependency);
                    }
                    if (instant) {
                        dependency = $instant(dependency);
                    }
                    if (lazy) {
                        dependency = (function (paramDep, created, param) {
                            return function () {
                                if (!created) {
                                    created = true;
                                    var container = fromContainer ? containerDep : composer;
                                    param = _resolveDependency(paramDep, false, promise, child, all, container);
                                }
                                return param;
                            };
                        })(dependency);
                    } else {
                        var paramDep  = new DependencyResolution(dependency, resolution, all),
                            container = fromContainer ? containerDep : composer;
                        dependency = _resolveDependency(paramDep, !optional, promise, child, all, container);
                        if (!promise && $isPromise(dependency)) {
                            promises.push(dependency);
                            (function (paramPromise, paramSet, paramIndex) {
                                paramPromise.then(function (param) {
                                    paramSet[paramIndex] = param;
                                });
                            })(dependency, resolved, index);
                        }
                    }
                }
                resolved[index] = dependency;
            }
            dependencies[key] = resolved;
        }
        if (promises.length === 1) {
            return promises[0].then(function () {
                return dependencies;
            });
        } else if (promises.length > 1) {
            return Promise.all(promises).then(function () {
                return dependencies;
            });
        }
        return dependencies;
    }
    
    function _resolveDependency(dependency, required, promise, child, all, composer) {
        var result = all ? composer.resolveAll(dependency) : composer.resolve(dependency);
        if (result === undefined) {
            if (required) {
                var error = new DependencyResolutionError(dependency,
                       format("Dependency %1 could not be resolved.",
                              dependency.formattedDependencyChain()));
                if ($instant.test(dependency.key)) {
                    throw error;
                }
                return Promise.reject(error);
            }
            return result;
        } else if (child && !all) {
            result = $isPromise(result) 
                 ? result.then(function (parent) { return _createChild(parent); })
                 : _createChild(result)
        }
        return promise ? Promise.resolve(result) : result;
    }

    function _createChild(parent) {
        if (!(parent && $isFunction(parent.newChild))) {
            throw new Error(format(
                "Child dependency requested, but %1 is not a parent.", parent));
        }
        return parent.newChild();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    eval(this.exports);

}
