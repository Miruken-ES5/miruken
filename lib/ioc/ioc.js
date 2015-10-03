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
    var ioc = new base2.Package(this, {
        name:    "ioc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.graph,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,Lifestyle,TransientLifestyle,SingletonLifestyle,ContextualLifestyle,DependencyModifiers,DependencyModel,DependencyManager,DependencyInspector,ComponentModel,ComponentBuilder,ComponentModelError,IoContainer,DependencyResolution,DependencyResolutionError,$component,$$composer,$container"
    });

    eval(this.imports);

    /**
     * Symbol for injecting composer dependency.<br/>
     * See {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}
     * @property {Object} $$composer
     * @for miruken.ioc.$
     */    
    var $$composer = {};
    
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
         * Registers on or more components in the container.
         * @method register
         * @param   {Arguments}  [...registrations]  -  registrations
         * @return {Function} function to unregister components.
         */
        register: function (/*registrations*/) {},
        /**
         * Adds a configured component to the container with policies.
         * @method addComponent
         * @param   {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param   {Array}                      [...policies]   -  component policies
         * @return {Function} function to remove component.
         */
        addComponent: function (componentModel, policies) {},
        /**
         * Resolves the component for the key.
         * @method resolve
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Object | Promise}  component satisfying the key.
         * @async
         */
        resolve: function (key) {},
        /**
         * Resolves all the components for the key.
         * @method resolveAll
         * @param   {Any}  key  -  key used to identify the component
         * @returns {Array} components or promises satisfying the key.
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
         * Encapsulates the regisration of one or more components in a container.
         * @method register
         * @param {miruken.ioc.Container}            container  -  container to register components
         * @param {miruken.callback.CallbackHandler} composer   -  composition handler
         * @return {Function} function to unregister components.
         */
         register: function (container, composer) {}
    });

     /**
     * Protocol for applying policies to a {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}}
     * @class ComponentPolicy
     * @extends miruken.Protocol
     */                
    var ComponentPolicy = Protocol.extend({
        /**
         * Applies the policy to the component model.
         * @method apply
         * @param {miruken.ioc.ComponentModel} componentModel  -  component model
         */
         apply: function (componentModel) {}
    });

    /**
     * DependencyModifiers flags enum
     * @class DependencyModifiers
     * @extends miruken.Enum
     */    
    var DependencyModifiers = Enum({
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
        Dynamic:    1 << 3,
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

    /**
     * Describes a component dependency.
     * @class DependencyModel
     * @constructor
     * @param {Any} dependency  -  annotated dependency
     * @param {miruken.ioc.DependencyModifiers} modifiers  -  dependency annotations
     * @extends Base
     */
    var DependencyModel = Base.extend({
        constructor: function _(dependency, modifiers) {
            modifiers = modifiers || DependencyModifiers.None;
            if (dependency instanceof Modifier) {
                if ($use.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Use;
                }
                if ($lazy.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Lazy;
                }
                if ($every.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Every;
                }
                if ($eval.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Dynamic;
                }
                if ($child.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Child;
                }
                if ($optional.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Optional;
                }
                if ($promise.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Promise;
                }
                if ($container.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Container;
                }
                if ($eq.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Invariant;
                }
                dependency = Modifier.unwrap(dependency);
            }
            var spec = _.spec || (_.spec = {});
            spec.value = dependency;
            /**
             * Gets the dependency.
             * @property {Any} dependency
             * @readOnly
             */            
            Object.defineProperty(this, 'dependency', spec);
            spec.value = modifiers;
            /**
             * Gets the dependency flags.
             * @property {miruken.ioc.DependencyModifiers} modifiers
             * @readOnly
             */                        
            Object.defineProperty(this, 'modifiers', spec);
            delete spec.value;
        },
        /**
         * Tests if the receiving dependency is annotated with the modifier.
         * @method test
         * @param   {miruken.ioc.DependencyModifiers}  modifier  -  modifier flags
         * @returns {boolean} true if the dependency is annotated with modifier(s).
         */        
        test: function (modifier) {
            return (this.modifiers & modifier) === modifier;
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
     * Extracts dependencies from a component model.
     * @class DependencyInspector
     * @extends Base
     */
    var DependencyInspector = Base.extend({
        /**
         * Inspects the component model for dependencies.
         * @method inspect
         * @param   {miruken.ioc.ComponentModel} componentModel  -  component model
         * @param   {Array}                      [...policies]   -  component policies
         */
        inspect: function (componentModel, policies) {
            // Dependencies will be merged from inject definitions
            // starting from most derived unitl no more remain or the
            // current definition is fully specified (no undefined).
            var dependencies = componentModel.getDependencies();
            if (dependencies && !Array2.contains(dependencies, undefined)) {
                return;
            }
            var clazz = componentModel.class;
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
     * Describes a component to be managed by a {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class ComponentModel
     * @constructor
     * @extends Base
     */
    var ComponentModel = Base.extend(
        $inferProperties, $validateThat, {
        constructor: function () {
            var _key, _class, _lifestyle, _factory,
                _invariant = false, _burden = {};
            this.extend({
                /**
                 * Gets/sets the component key.
                 * @property {Any} key
                 */
                getKey: function () {
                    return _key || _class
                },
                setKey: function (value) { _key = value; },
                /**
                 * Gets/sets the component class.
                 * @property {Functon} class
                 */
                getClass: function () {
                    var clazz = _class;
                    if (!clazz && $isClass(_key)) {
                        clazz = _key;
                    }
                    return clazz;
                },
                setClass: function (value) {
                    if ($isSomething(value) && !$isClass(value)) {
                        throw new TypeError(format("%1 is not a class.", value));
                    }
                    _class = value;
                },
                /**
                 * true if component is invariant, false otherwise.
                 * @property {boolean} invariant
                 */                                                
                isInvariant: function () {
                    return _invariant;
                },
                setInvariant: function (value) { _invariant = !!value; },
                /**
                 * Gets/sets the component lifestyle.
                 * @property {miruken.ioc.Lifestyle} lifestyle
                 */
                getLifestyle: function () { return _lifestyle; },
                setLifestyle: function (value) {
                    if (!$isSomething(value) && !(value instanceof Lifestyle)) {
                        throw new TypeError(format("%1 is not a Lifestyle.", value));
                    }
                    _lifestyle = value; 
                },
                /**
                 * Gets/sets the component factory.
                 * @property {Function} factory
                 */
                getFactory: function () {
                    var factory = _factory,
                        clazz   = this.class;
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
                setFactory: function (value) {
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
                 */                                
                getBurden: function () { return _burden; }
            });
        },
        $validateThat: {
            keyCanBeDetermined: function (validation) {
                if (!this.key) {
                    validation.results.addKey('key').addError('required', { 
                        message: 'Key could not be determined for component.' 
                    });
                }
            },
            factoryCanBeDetermined: function (validation) {
                if (!this.factory) {
                    validation.results.addKey('factory').addError('required', { 
                        message: 'Factory could not be determined for component.' 
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
    var Lifestyle = Base.extend(ComponentPolicy, Disposing, DisposingMixin, {
        /**
         * Obtains the component instance.
         * @method resolve
         * @returns {Object} component instance.
         */
        resolve: function (factory) {
            var instance = factory();
            if ($isPromise(instance)) {
                return instance.then(function (instance) {
                    if ($isFunction(instance.initialize)) {
                        instance.initialize();
                    }                    
                    return instance;
                });                
            } else if ($isFunction(instance.initialize)) {
                instance.initialize();
            }
            return instance;            
        },
        /**
         * Tracks the component instance for disposal.
         * @method trackInstance
         * @param {Object} instance  -  component instance.
         */        
        trackInstance: function (instance) {
            if (instance && $isFunction(instance.dispose)) {
                var _this = this;
                instance.extend({
                    dispose: function (disposing) {
                        if (disposing || _this.disposeInstance(instance, true)) {
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
        apply: function (componentModel) {
            componentModel.setLifestyle(this);
        }
    });

   /**
     * Lifestyle for creating new untracked component instances.
     * @class TransientLifestyle
     * @extends miruken.ioc.Lifestyle
     */
    var TransientLifestyle = Lifestyle.extend();

   /**
     * Lifestyle for managing a single instance of a component.
     * @class SingletonLifestyle
     * @constructor
     * @param {Object} [instance]  -  existing component instance
     * @extends miruken.ioc.Lifestyle
     */
    var SingletonLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
                resolve: function (factory) {
                    if (!instance) {
                        var object = this.base(factory);
                        if ($isPromise(object)) {
                            var _this = this;
                            return object.then(function (object) {
                                // Only cache fulfilled instances
                                if (!instance && object) {
                                    instance = object;
                                    _this.trackInstance(instance);
                                }
                                return instance;
                            });
                        } else if (object) {
                            instance = object;
                            this.trackInstance(instance)
                        }
                    }
                    return instance;
                },
                disposeInstance: function (obj, disposing) {
                    // Singletons cannot be disposed directly
                    if (!disposing && (obj === instance)) {
                        if (this.base(obj, disposing)) {
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
     * Lifestyle for managing instances scoped to a {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
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
                        if (!instance) {
                            var object = factory();
                            if ($isPromise(object)) {
                                var _this = this;
                                return object.then(function (object) {
                                    // Only cache fulfilled instances
                                    if (object && !(instance = _cache[id])) {
                                        instance = object;
                                        _this._recordInstance(id, instance, context);
                                    }
                                    return instance;
                                });
                            } else if (object) {
                                instance = object;
                                this._recordInstance(id, instance, context);
                            }
                        }
                        return instance;
                    }
                },
                _recordInstance: function (id, instance, context) {
                    var _this  = this;
                    _cache[id] = instance;
                    ContextualHelper.bindContext(instance, context);
                    if ($isFunction(instance.initialize)) {
                        instance.initialize();
                    }                                        
                    this.trackInstance(instance);
                    context.onEnded(function () {
                        instance.context = null;
                        _this.disposeInstance(instance);
                        delete _cache[id];
                    });
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
     * Builds {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} using fluent api.
     * @class ComponentBuilder
     * @constructor
     * @extends Base
     * @uses miruken.ioc.Registration
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel,
                _newInContext, _newInChildContext,
                _policies = [];
            _componentModel.setKey(key);
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
                    _componentModel.setClass(clazz);
                    return this;
                },
                /**
                 * Specifies component dependencies.
                 * @method dependsOn
                 * @param  {Argument} arguments  -  dependencies
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                dependsOn: function (/* dependencies */) {
                    var dependencies;
                    if (arguments.length === 1 && $isArray(arguments[0])) {
                        dependencies = arguments[0];
                    } else if (arguments.length > 0) {
                        dependencies = Array.prototype.slice.call(arguments);
                    }
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
                    _componentModel.setFactory(factory);
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
                    _componentModel.setLifestyle(new SingletonLifestyle(instance));
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.SingletonLifestyle"}}{{/crossLink}}.
                 * @method singleon
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */
                singleton: function () {
                    _componentModel.setLifestyle(new SingletonLifestyle);
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.TransientLifestyle"}}{{/crossLink}}.
                 * @method transient
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                
                transient: function () {
                    _componentModel.setLifestyle(new TransientLifestyle);
                    return this;
                },
                /**
                 * Chooses the {{#crossLink "miruken.ioc.ContextualLifestyle"}}{{/crossLink}}.
                 * @method contextual
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                
                contextual: function () {
                    _componentModel.setLifestyle(new ContextualLifestyle);
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
                 * @param  {Argument} arguments  -  interceptors
                 * @return {miruken.ioc.ComponentBuilder} builder
                 * @chainable
                 */                                                
                interceptors: function (/* interceptors */) {
                    var interceptors = (arguments.length === 1 && $isArray(arguments[0]))
                                     ? arguments[0]
                                     : Array.prototype.slice.call(arguments);
                    return new InterceptorBuilder(this, _componentModel, interceptors);
                },
                /**
                 * Gets the {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}} of type policyClass.
                 * @method getPolicy
                 * @param   {Function}  policyClass  -  type of policy to get
                 * @returns {miruken.ioc.ComponentPolicy} policy of type PolicyClass
                 */            
                getPolicy: function (policyClass) {
                    for (var i = 0; i < _policies.length; ++i) {
                        var policy = _policies[i];
                        if (policy instanceof policyClass) {
                            return policy;
                        }
                    }
                },
                /**
                 * Attaches a {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}} to the model.
                 * @method addPolicy
                 * @param   {miruken.ioc.ComponentPolicy}  policy  -  policy
                 * @returns {boolean} true if policy was added, false if policy type already attached.
                 */            
                addPolicy: function (policy) {
                    if (this.getPolicy($classOf(policy))) {
                        return false;
                    }
                    _policies.push(policy);
                    return true;
                },
                register: function (container) {
                    if ( _newInContext || _newInChildContext) {
                        var factory = _componentModel.getFactory();
                        _componentModel.setFactory(function (dependencies) {
                            var object  = factory(dependencies),
                                context = this.resolve(Context);
                            if (_newInContext) {
                                ContextualHelper.bindContext(object, context);
                            } else {
                                ContextualHelper.bindChildContext(context, object);
                            }
                            return object;
                        });
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

    /**
     * Default Inversion of Control {{#crossLink "miruken.ioc.Container"}}{{/crossLink}}.
     * @class IoContainer
     * @constructor
     * @extends CallbackHandler
     * @uses miruken.ioc.Container
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            var _inspectors = [new DependencyInspector];
            this.extend({
                addComponent: function (componentModel, policies) {
                    policies  = policies || [];
                    for (var i = 0; i < _inspectors.length; ++i) {
                        _inspectors[i].inspect(componentModel, policies);
                    }
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.apply)) {
                            policy.apply(componentModel);
                        }
                    }
                    var validation = Validator($composer).validate(componentModel);
                    if (!validation.isValid()) {
                        throw new ComponentModelError(componentModel, validation);
                    }
                    return this.registerHandler(componentModel); 
                },
                /**
                 * Adds a component inspector to the container.
                 * @method addInspector
                 * @param  {Object}  inspector  -  any object with an 'inspect' method that
                 * accepts a {{#crossLink "miruken.ioc.ComponentModel"}}{{/crossLink}} and
                 * array of {{#crossLink "miruken.ioc.ComponentPolicy"}}{{/crossLink}}
                 */
                addInspector: function (inspector) {
                    if (!$isFunction(inspector.inspect)) {
                        throw new TypeError("Inspectors must have an inspect method.");
                    }
                    _inspectors.push(inspector);
                },
                /**
                 * Removes a previously added component inspector from the container.
                 * @method removeInspector
                 * @param  {Object}  inspector  -  component inspector
                 */                
                removeInspector: function (inspector) {
                    Array2.remove(_inspectors, inspector);
                }
            })
        },
        register: function (/*registrations*/) {
            return Array2.flatten(arguments).map(function (registration) {
                return registration.register(this, $composer);
            }.bind(this));
        },
        registerHandler: function (componentModel) {
            var key       = componentModel.key,
                clazz     = componentModel.class,
                lifestyle = componentModel.lifestyle || new SingletonLifestyle,
                factory   = componentModel.factory,
                burden    = componentModel.burden;
            key = componentModel.isInvariant() ? $eq(key) : key;
            return _registerHandler(this, key, clazz, lifestyle, factory, burden); 
        },
        invoke: function (fn, dependencies, ctx) {
            var inject  = fn.$inject,
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

    function _registerHandler(container, key, clazz, lifestyle, factory, burden) {
        return $provide(container, key, function handler(resolution, composer) {
            if (!(resolution instanceof DependencyResolution)) {
                resolution = new DependencyResolution(resolution.key);
            }
            if (!resolution.claim(handler, clazz)) {  // cycle detected
                return $NOT_HANDLED;
            }
            return lifestyle.resolve(function () {
                var instant      = $instant.test(resolution.key),
                    dependencies = _resolveBurden(burden, instant, resolution, composer);
                if ($isPromise(dependencies)) {
                    return dependencies.then(function (deps) {
                        return factory.call(composer, deps);
                    });
                }
                return factory.call(composer, dependencies);
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
                var use        = dep.test(DependencyModifiers.Use),
                    lazy       = dep.test(DependencyModifiers.Lazy),
                    promise    = dep.test(DependencyModifiers.Promise),
                    child      = dep.test(DependencyModifiers.Child),
                    dynamic    = dep.test(DependencyModifiers.Dynamic),
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
                    var all           = dep.test(DependencyModifiers.Every),
                        optional      = dep.test(DependencyModifiers.Optional),
                        invariant     = dep.test(DependencyModifiers.Invariant),
                        fromContainer = dep.test(DependencyModifiers.Container);
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
            return promises[0].return(dependencies);
        } else if (promises.length > 1) {
            return Promise.all(promises).return(dependencies);
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
        module.exports = exports = ioc;
    }

    eval(this.exports);

}
