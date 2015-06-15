require('./base2.js');

new function () { // closure

    /**
     * Package containing enhancements to the javascript language.
     * @module miruken
     * @namespace miruken
     * @main miruken
     * @class $
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Enum,Variance,Protocol,StrictProtocol,Delegate,Miruken,MetaStep,MetaMacro,Disposing,DisposingMixin,Invoking,Parenting,Starting,Startup,Facet,Interceptor,InterceptorSelector,ProxyBuilder,Modifier,ArrayManager,IndexedList,$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isPromise,$isNothing,$isSomething,$using,$lift,$equals,$decorator,$decorate,$decorated,$debounce,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant,$createModifier,$properties,$inferProperties,$inheritStatic"
    });

    eval(this.imports);

    var META = '$meta';

    /**
     * Annotates invariance.
     * @attribute $eq
     * @for miruken.Modifier
     */
    var $eq = $createModifier();
    /**
     * Annotates use value as is.
     * @attribute $use
     * @for miruken.Modifier
     */    
    var $use = $createModifier();
    /**
     * Annotates copy semantics.
     * @attribute $copy
     * @for miruken.Modifier
     */        
    var $copy = $createModifier();
    /**
     * Annotates lazy semantics.
     * @attribute $lazy
     * @for miruken.Modifier
     */            
    var $lazy = $createModifier();
    /**
     * Annotates function to be evaluated.
     * @attribute $eval
     * @for miruken.Modifier
     */                
    var $eval = $createModifier();
    /**
     * Annotates zero or more semantics.
     * @attribute $every
     * @for miruken.Modifier
     */                    
    var $every = $createModifier();
    /**
     * Annotates 
     * @attribute use {{#crossLink "miruken.Parenting"}}{{/crossLink}} protocol.
     * @attribute $child
     * @for miruken.Modifier
     */                        
    var $child  = $createModifier();
    /**
     * Annotates optional semantics.
     * @attribute $optional
     * @for miruken.Modifier
     */                        
    var $optional = $createModifier();
    /**
     * Annotates Promise expectation.
     * @attribute $promise
     * @for miruken.Modifier
     */                            
    var $promise = $createModifier();
    /**
     * Annotates synchronous.
     * @attribute $instant
     * @for miruken.Modifier
     */                                
    var $instant = $createModifier();
    
    /**
     * Defines an enumeration.
     * <pre>
     *    var Color = Enum({
     *        red:   1,
     *        green: 2,
     *        blue:  3
     *    })
     * </pre>
     * @class Enum
     * @constructor
     * @param  {Object}  choices  -  enum choices
     */
    var Enum = Base.extend({
        constructor: function () {
            throw new TypeError("Enums cannot be instantiated.");
        }
    }, {
        coerce: function (choices) {
            var en     = this.extend(null, choices),
                names  = Object.freeze(Object.keys(choices)),
                values = Object.freeze(Array2.map(names, function (name) {
                        return choices[name];
                }));
            Object.defineProperties(en, {
                names:  { value: names },
                values: { value: values }
            });
            return Object.freeze(en);
        }
    });

    /**
     * Variance enum
     * @class Variance
     * @extends miruken.Enum
     */
    var Variance = Enum({
        /**
         * Matches a more specific type than originally specified.
         * @property {number} Covariant
         */
        Covariant: 1,
        /**
         * Matches a more generic (less derived) type than originally specified.
         * @property {number} Contravariant
         */        
        Contravariant: 2,
        /**
         * Matches only the type originally specified.
         * @property {number} Invariant
         */        
        Invariant: 3
        });

    /**
     * Delegates properties and methods to another object.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class Delegate
     * @extends Base
     */
    var Delegate = Base.extend({
        /**
         * Delegates the property get on the protocol.
         * @method get
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         * @returns {Any} result of the proxied get.
         */
        get: function (protocol, propertyName, strict) {},
        /**
         * Delegates the property set on the protocol.
         * @method set
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {Object}           propertyValue - value of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         */
        set: function (protocol, propertyName, propertyValue, strict) {},
        /**
         * Delegates the method invocation on the protocol.
         * @method invoke
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           methodName  - name of the method
         * @param   {Array}            args        - method arguments
         * @param   {boolean}          strict      - true if target must adopt protocol
         * @returns {Any} result of the proxied invocation.
         */
         invoke: function (protocol, methodName, args, strict) {}
    });

    /**
     * Delegates properties and methods to an obejct.
     * @class ObjectDelegate
     * @constructor
     * @param   {Object}  object  - receiving object
     * @extends miruken.Delegate
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            if ($isNothing(object)) {
                throw new TypeError("No object specified.");
            }
            Object.defineProperty(this, 'object', { value: object });
        },
        get: function (protocol, propertyName, strict) {
            var object = this.object;
            if (!strict || protocol.adoptedBy(object)) {
                return object[propertyName];
            }
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            var object = this.object;
            if (!strict || protocol.adoptedBy(object)) {
                return object[propertyName] = propertyValue;
            }
        },
        invoke: function (protocol, methodName, args, strict) {
            var object = this.object,
                method = object[methodName];
            if (method && (!strict || protocol.adoptedBy(object))) {
                return method.apply(object, args);
            }
        }
    });
    
    /**
     * Declares methods and properties independent of a class.
     * <pre>
     *    var Auditing = Protocol.extend({
     *        $properties: {
     *            level: undefined
     *        },
     *        record: function (activity) {}
     *    })
     * </pre>
     * @class Protocol
     * @constructor
     * @param   {miruken.Delegate}  delegate        -  delegate
     * @param   {boolean}           [strict=false]  -  true ifstrict, false otherwise
     * @extends Base
     */
    var Protocol = Base.extend({
        constructor: function (delegate, strict) {
            if ($isNothing(delegate)) {
                delegate = new Delegate;
            } else if ((delegate instanceof Delegate) === false) {
                if ($isFunction(delegate.toDelegate)) {
                    delegate = delegate.toDelegate();
                    if ((delegate instanceof Delegate) === false) {
                        throw new TypeError(format(
                            "Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one.", delegate));
                    }
                } else {
                    delegate = new ObjectDelegate(delegate);
                }
            }
            Object.defineProperty(this, 'delegate', { value: delegate });
            Object.defineProperty(this, 'strict', { value: !!strict });
        },
        __get: function (propertyName) {
            return this.delegate.get(this.constructor, propertyName, this.strict);
        },
        __set: function (propertyName, propertyValue) {                
            return this.delegste.set(this.constructor, propertyName, propertyValue, this.strict);
        },
        __invoke: function (methodName, args) {
            return this.delegate.invoke(this.constructor, methodName, args, this.strict);
        }
    }, {
        /**
         * Determines if the target is a {{#crossLink "miruken.Protocol"}}{{/crossLink}}.
         * @static
         * @method isProtocol
         * @param   {Any}      target    -  target to test
         * @returns {boolean}  true if the target is a Protocol.
         */
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        conformsTo: False,
        /**
         * Determines if the target conforms to this protocol.
         * @static
         * @method conformsTo
         * @param   {Any}      target    -  target to test
         * @returns {boolean}  true if the target conforms to this protocol.
         */
        adoptedBy: function (target) {
            return target && $isFunction(target.conformsTo)
                 ? target.conformsTo(this)
                 : false;
        },
        /**
         * Creates a protocol binding over the object.
         * @static
         * @method coerce
         * @param   {Object} object  -  object delegate
         * @returns {Object} protocol instance delegating to object. 
         */
        coerce: function (object, strict) { return new this(object, strict); }
    });

    /**
     * MetaStep enum
     * @class MetaStep
     * @extends Enum
     */
    var MetaStep = Enum({
        /**
         * Triggered when a new class is derived
         * @property {number} Subclass
         */
        Subclass: 1,
        /**
         * Triggered when an existing class is extended
         * @property {number} Implement
         */
        Implement: 2,
        /**
         * Triggered when an instance is extended
         * @property {number} Extend
         */
        Extend: 3
        });

    /**
     * Provides a method to modify a class definition at runtime.
     * @class MetaMacro
     * @extends Base
     */
    var MetaMacro = Base.extend({
        /**
         * Executes the macro for the given step.
         * @method apply
         * @param  {miruken.MetaStep}  step        - meta step
         * @param  {miruken.MetaBase}  metadata    - effective metadata
         * @param  {Object}            target      - target macro applied to 
         * @param  {Object}            definition  - literal containing changes
         */
        apply: function (step, metadata, target, definition) {},
        /**
         * Triggered when a protocol is added to metadata.
         * @method protocolAdded
         * @param {miruken.MetaBase}   metadata    - effective metadata
         * @param {miruken.Protocol}   protocol    - protocol added
         */
        protocolAdded: function (metadata, protocol) {},
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} false
         */
        shouldInherit: False,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} false
         */
        isActive: False,
    }, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Base class for all metadata.
     * @class MetaBase
     * @constructor
     * @param  {miruken.MetaBase}  [parent]  - parent meta-data
     * @extends miruken.MetaMacro
     */
    var MetaBase = MetaMacro.extend({
        constructor: function (parent)  {
            var _protocols = [], _descriptors;
            this.extend({
                /**
                 * Gets the parent metadata.
                 * @method getParent
                 * @returns {miruken.MetaBase} parent metadata if present.
                 */
                getParent: function () { return parent; },
                /**
                 * Gets the declared protocols.
                 * @method getProtocols
                 * @returns {Array} declared protocols.
                 */
                getProtocols: function () { return _protocols.slice(0) },
                /**
                 * Gets all conforming protocools.
                 * @method getAllProtocols
                 * @returns {Array} conforming protocols.
                 */
                getAllProtocols: function () {
                    var protocols = this.getProtocols(),
                        inner     = protocols.slice(0);
                    for (var i = 0; i < inner.length; ++i) {
                        var innerProtocols = inner[i].$meta.getAllProtocols();
                        for (var ii = 0; ii < innerProtocols.length; ++ii) {
                            var protocol = innerProtocols[ii];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        } 
                    }
                    return protocols;
                },
                /**
                 * Adds one or more protocols to the metadata.
                 * @method addProtocol
                 * @param  {Array}  protocols  -  protocols to add
                 */
                addProtocol: function (protocols) {
                    if ($isNothing(protocols)) {
                        return;
                    }
                    if (!(protocols instanceof Array)) {
                        protocols = Array.prototype.slice.call(arguments);
                    }
                    for (var i = 0; i < protocols.length; ++i) {
                        var protocol = protocols[i];
                        if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                            _protocols.push(protocol);
                            this.protocolAdded(this, protocol);
                        }
                    }
                },
                protocolAdded: function (metadata, protocol) {
                    if (parent) {
                        parent.protocolAdded(metadata, protocol);
                    }
                },
                /**
                 * Determines if the metadata conforms to the protocol.
                 * @method conformsTo
                 * @param  {miruken.Protocol}   protocol -  protocols to test
                 * @returns {boolean}  true if the metadata includes the protocol.
                 */
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    }
                    for (var index = 0; index < _protocols.length; ++index) {
                        var proto = _protocols[index];
                        if (protocol === proto || proto.conformsTo(protocol)) {
                            return true;
                        }
                    }
                    return false;
                },
                apply: function _(step, metadata, target, definition) {
                    if (parent) {
                        parent.apply(step, metadata, target, definition);
                    } else if ($properties) {
                        (_.p || (_.p = new $properties)).apply(step, metadata, target, definition);
                    }
                },
                /**
                 * Defines a property on the metadata.
                 * @method defineProperty
                 * @param  {Object}   target        -  target receiving property
                 * @param  {string}   name          -  name of the property
                 * @param  {Object}   spec          -  property specification
                 * @param  {Object}   [descriptor]  -  property descriptor
                 */
                defineProperty: function(target, name, spec, descriptor) {
                    descriptor = extend({}, descriptor);
                    Object.defineProperty(target, name, spec);
                    this.addDescriptor(name, descriptor);
                },
                /**
                 * Gets the descriptor for one or more properties.
                 * @method getDescriptor
                 * @param    {Object|string}  filter  -  property selector
                 * @returns  {Object} aggregated property descriptor.
                 */
                getDescriptor: function (filter) {
                    var descriptors;
                    if ($isNothing(filter)) {
                        if (parent) {
                            descriptors = parent.getDescriptor(filter);
                        }
                        if (_descriptors) {
                            descriptors = extend(descriptors || {}, _descriptors);
                        }
                    } else if ($isString(filter)) {
                        return _descriptors[filter] || (parent && parent.getDescriptor(filter));
                    } else {
                        if (parent) {
                            descriptors = parent.getDescriptor(filter);
                        }
                        for (var key in _descriptors) {
                            var descriptor = _descriptors[key];
                            if (this.matchDescriptor(descriptor, filter)) {
                                descriptors = extend(descriptors || {}, key, descriptor);
                            }
                        }
                    }
                    return descriptors;
                },
                /**
                 * Sets the descriptor for a property.
                 * @method addDescriptor
                 * @param    {string}   name        -  property name
                 * @param    {Object}   descriptor  -  property descriptor
                 * @returns  {miruken.MetaBase} current metadata.
                 * @chainable
                 */
                addDescriptor: function (name, descriptor) {
                    _descriptors = extend(_descriptors || {}, name, descriptor);
                    return this;
                },
                /**
                 * Determines if the property descriptor matches the filter.
                 * @method matchDescriptor
                 * @param    {Object}   descriptor  -  property descriptor
                 * @param    {Object}   filter      -  matching filter
                 * @returns  {boolean} true if the descriptor matches, false otherwise.
                 */
                matchDescriptor: function (descriptor, filter) {
                    if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                        return false;
                    }
                    for (var key in filter) {
                        var match = filter[key];
                        if (match === undefined) {
                            if (!(key in descriptor)) {
                                return false;
                            }
                        } else {
                            var value = descriptor[key];
                            if (match instanceof Array) {
                                if (!(value instanceof Array)) {
                                    return false;
                                }
                                for (var i = 0; i < match.length; ++i) {
                                    if (value.indexOf(match[i]) < 0) {
                                        return false;
                                    }
                                }
                            } else if (!(value === match || this.matchDescriptor(value, match))) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                /**
                 * Binds a method to the parent if not present.
                 * @method linkBase
                 * @param    {Function}  method  -  method name
                 * @returns  {miruken.MetaBase} current metadata.
                 * @chainable
                 */
                linkBase: function (method) {
                    if (!this[method]) {
                        this.extend(method, function () {
                            var baseMethod = parent && parent[method];
                            if (baseMethod) {
                                return baseMethod.apply(parent, arguments);
                            }
                        });
                    }
                    return this;
                }        
            });
        }
    });

    /**
     * Represents metadata describing a class.
     * @class ClassMeta
     * @constructor
     * @param   {Function}  baseClass  -  associated base class
     * @param   {Function}  subClass   -  associated class
     * @param   {Array}     protocols  -  conforming protocols
     * @param   {Array}     macros     -  class macros
     * @extends miruken.MetaBase
     */
    var ClassMeta = MetaBase.extend({
        constructor: function(baseClass, subClass, protocols, macros)  {
            var _isProtocol = (subClass === Protocol)
                           || (subClass.prototype instanceof Protocol),
                _macros     = macros ? macros.slice(0) : undefined;
            this.base(baseClass.$meta, protocols);
            this.extend({
                /**
                 * Gets the associated base class.
                 * @method getBase
                 * @returns  {Function} base class.
                 */                
                getBase: function () { return baseClass; },
                /**
                 * Gets the associated class
                 * @method getClass
                 * @returns  {Function} class.
                 */                                
                getClass: function () { return subClass; },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                
                isProtocol: function () { return _isProtocol; },
                getAllProtocols: function () {
                    var protocols = this.base();
                    if (!_isProtocol && baseClass.$meta) {
                        var baseProtocols = baseClass.$meta.getAllProtocols();
                        for (var i = 0; i < baseProtocols.length; ++i) {
                            var protocol = baseProtocols[i];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        }
                    }
                    return protocols;
                },
                protocolAdded: function (metadata, protocol) {
                    this.base(metadata, protocol);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    for (var i = 0; i < _macros.length; ++i) {
                        macro = _macros[i];
                        if ($isFunction(macro.protocolAdded)) {
                            macro.protocolAdded(metadata, protocol);
                        }
                    }
                },
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    } else if ((protocol === subClass) || (subClass.prototype instanceof protocol)) {
                        return true;
                    }
                    if (this.base(protocol)) {
                        return true;
                    }
                    return baseClass && (baseClass !== Protocol) && baseClass.conformsTo
                         ? baseClass.conformsTo(protocol)
                         : false;
                },
                apply: function (step, metadata, target, definition) {
                    this.base(step, metadata, target, definition);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    var inherit = (this !== metadata),
                        active  = (step !== MetaStep.Subclass);
                    for (var i = 0; i < _macros.length; ++i) {
                        var macro = _macros[i];
                        if ((!active  || macro.isActive()) &&
                            (!inherit || macro.shouldInherit())) {
                            macro.apply(step, metadata, target, definition);
                        }
                    }
                }
            });
            this.addProtocol(protocols);
        }
    });

    /**
     * Represents metadata describing an instance.
     * @class InstanceMeta
     * @constructor
     * @param   {miruken.ClassMeta}  classMeta  -  class meta-data
     * @extends miruken.MetaBase
     */
    var InstanceMeta = MetaBase.extend({
        constructor: function (classMeta) {
            this.base(classMeta);
            this.extend({
                /**
                 * Gets the associated base class.
                 * @method getBase
                 * @returns  {Function} base class.
                 */                                
                getBase: function () { return classMeta.getBase(); }, 
                /**
                 * Gets the associated class
                 * @method getClass
                 * @returns  {Function} class.
                 */                                              
                getClass: function () { return classMeta.getClass(); },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                                
                isProtocol: function () { return classMeta.isProtocol(); }
            });
        }
    });

    var baseExtend  = Base.extend;
    Base.extend = Abstract.extend = function () {
        return (function (base, args) {
            var protocols, mixins, macros, 
                constraints = args;
            if (base.prototype instanceof Protocol) {
                (protocols = []).push(base);
            }
            if (args.length > 0 && (args[0] instanceof Array)) {
                constraints = args.shift();
            }
            while (constraints.length > 0) {
                var constraint = constraints[0];
                if (!constraint) {
                    break;
                } else if (constraint.prototype instanceof Protocol) {
                    (protocols || (protocols = [])).push(constraint);
                } else if (constraint instanceof MetaMacro) {
                    (macros || (macros = [])).push(constraint);
                } else if ($isFunction(constraint) 
                           &&  constraint.prototype instanceof MetaMacro) {
                    (macros || (macros = [])).push(new constraint);
                } else if (constraint.prototype) {
                    (mixins || (mixins = [])).push(constraint);
                } else {
                    break;
                }
                constraints.shift();
            }
            var instanceDef = args.shift(),
                staticDef   = args.shift(),
                subclass    = baseExtend.call(base, instanceDef, staticDef),
                metadata    = new ClassMeta(base, subclass, protocols, macros);
            Object.defineProperty(subclass, META, {
                enumerable:   false,
                configurable: false,
                writable:     false,
                value:        metadata
            });
            Object.defineProperty(subclass.prototype, META, {
                enumerable:   false,
                configurable: false,
                get:          _createInstanceMeta
            });
            subclass.conformsTo = metadata.conformsTo.bind(metadata);
            metadata.apply(MetaStep.Subclass, metadata, subclass.prototype, instanceDef);
            if (mixins) {
                Array2.forEach(mixins, subclass.implement, subclass);
            }
            return subclass;
            })(this, Array.prototype.slice.call(arguments));
    };

    function _createInstanceMeta() {
        var spec = _createInstanceMeta.spec ||
            (_createInstanceMeta.spec = {
                enumerable:   false,
                configurable: false,
                writable:     false
            }),
            metadata = new InstanceMeta(this.constructor.$meta);
        spec.value = metadata;
        Object.defineProperty(this, META, spec);
        delete spec.value;
        return metadata;
    }

    Base.prototype.conformsTo = function (protocol) {
        return this.constructor.$meta.conformsTo(protocol);
    };
    
    var implement = Base.implement;
    Base.implement = Abstract.implement = function (source) {
        if ($isFunction(source)) {
            source = source.prototype; 
        }
        var metadata = this.$meta;
        implement.call(this, source);
        if (metadata) {
            metadata.apply(MetaStep.Implement, metadata, this.prototype, source);
        }
        return this;
    }

    var extendInstance = Base.prototype.extend;
    Base.prototype.extend = function (key, value) {
        var definition = (arguments.length === 1) ? key : {};
        if (arguments.length >= 2) {
            definition[key] = value;
        }
        var metadata = this.$meta;
        extendInstance.call(this, definition);
        if (metadata) {
            metadata.apply(MetaStep.Extend, metadata, this, definition);
        }
        return this;
    }

    /**
     * Metamacro to proxy protocol methods through a delegate.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class $proxyProtocol
     * @extends miruken.MetaMacro
     */
    var $proxyProtocol = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            var clazz = metadata.getClass();
            if (clazz === Protocol) {
                return;
            }    
            var protocolProto = Protocol.prototype;
            for (var key in definition) {
                if (key in protocolProto) {
                    continue;
                }
                var member = target[key];
                if ($isFunction(member)) {
                    (function (methodName) {
                        target[methodName] = function () {
                            var args = Array.prototype.slice.call(arguments);
                            return this.__invoke(methodName, args);
                        }
                    })(key);
                }
            }
            if (step === MetaStep.Subclass) {
                clazz.adoptedBy = Protocol.adoptedBy;
            }
        },
        protocolAdded: function (metadata, protocol) {
            var source        = protocol.prototype,
                target        = metadata.getClass().prototype,
                protocolProto = Protocol.prototype;
            for (var key in source) {
                if (!((key in protocolProto) && (key in this))) {
                    var descriptor = _getPropertyDescriptor(source, key);
                    Object.defineProperty(target, key, descriptor);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */        
        isActive: True
    });
    Protocol.extend     = Base.extend
    Protocol.implement  = Base.implement;
    Protocol.$meta      = new ClassMeta(Base, Protocol, null, [new $proxyProtocol]);
    Protocol.$meta.apply(MetaStep.Subclass, Protocol.$meta, Protocol.prototype);

    /**
     * Protocol base requiring conformance to match methods.
     * @class StrictProtocol
     * @constructor
     * @param   {miruken.Delegate}  delegate       -  delegate
     * @param   {boolean}           [strict=true]  -  true ifstrict, false otherwise
     * @extends miruekn.Protocol     
     */
    var StrictProtocol = Protocol.extend({
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        }
    });

    /**
     * Metamacro to define class properties.  This macro is automatically applied.
     * <pre>
     *    var Person = Base.extend({
     *        $properties: {
     *            firstName: '',
     *            lastNane:  '',
     *            fullName:  {
     *                get: function () {
     *                   return this.firstName + ' ' + this.lastName;
     *                },
     *                set: function (value) {
     *                    var parts = value.split(' ');
     *                    if (parts.length > 0) {
     *                        this.firstName = parts[0];
     *                    }
     *                    if (parts.length > 1) {
     *                        this.lastName = parts[1];
     *                    }
     *                }
     *            },
     *        }
     *    })
     * </pre>
     * would give the Person class a firstName and lastName property and a computed fullName.
     * @class $properties
     * @constructor
     * @param   {string}  [tag='$properties']  - properties tag
     * @extends miruken.MetaMacro
     */
    var $properties = MetaMacro.extend({
        constructor: function _(tag) {
            var spec = _.spec || (_.spec = {});
            spec.value = tag || '$properties';
            Object.defineProperty(this, 'tag', spec);
        },
        apply: function _(step, metadata, target, definition) {
            if ($isNothing(definition) || !definition.hasOwnProperty(this.tag)) {
                return;
            }
            var properties = definition[this.tag];
            if ($isFunction(properties)) {
                properties = properties();
            }
            for (var name in properties) {
                var property = properties[name],
                    spec = _.spec || (_.spec = {
                        configurable: true,
                        enumerable:   true
                    });
                if ($isNothing(property) || $isString(property) ||
                    typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                    property = { value: property };
                }
                if (target instanceof Protocol) {
                    spec.get = function (get) {
                        return function () {
                            return this.__get(get);
                        };
                    }(name);
                    spec.set = function (set) {
                        return function (value) {
                            return this.__set(set, value);
                        };
                    }(name);
                } else {
                    spec.writable = true;
                    if (property.get || property.set) {
                        var methods = {},
                            cname   = name.charAt(0).toUpperCase() + name.slice(1);
                        if (property.get) {
                            var get      = 'get' + cname; 
                            methods[get] = property.get;
                            spec.get     = _makeGetter(get);
                        }
                        if (property.set) {
                            var set      = 'set' + cname 
                            methods[set] = property.set;
                            spec.set     = _makeSetter(set); 
                        }
                        if (step == MetaStep.Extend) {
                            target.extend(methods);
                        } else {
                            metadata.getClass().implement(methods);
                        }
                        delete spec.writable;
                    } else {
                        spec.value = property.value;
                    }
                }
                _cleanDescriptor(property);
                this.defineProperty(metadata, target, name, spec, property);
                _cleanDescriptor(spec);
            }
            delete definition[this.tag];
            delete target[this.tag];
        },
        defineProperty: function(metadata, target, name, spec, descriptor) {
            metadata.defineProperty(target, name, spec, descriptor);
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */                
        isActive: True
    });

    function _makeGetter(getMethodName) {
        return function () {
            var getter = this[getMethodName];
            if ($isFunction(getter)) {
                return getter.call(this);
            }
        };   
    }

    function _makeSetter(setMethodName) {
        return function (value) {
            var setter = this[setMethodName];
            if ($isFunction(setter)) {
                setter.call(this, value);
                return value;
            }
        };
    }

    function _cleanDescriptor(descriptor) {
        delete descriptor.writable;
        delete descriptor.value;
        delete descriptor.get;
        delete descriptor.set;
    }

    /**
     * Metamacro to derive class properties from existng methods.
     * <p>Currently getFoo, isFoo and setFoo conventions are recognized.</p>
     * <pre>
     *    var Person = Base.extend(**$inferProperties**, {
     *        getName: function () { return this._name; },
     *        setName: function (value) { this._name = value; },
     *    })
     * </pre>
     * would create a Person.name property bound to getName and setName 
     * @class $inferProperties
     * @constructor
     * @extends miruken.MetaMacro
     */
    var $inferProperties = MetaMacro.extend({
        apply: function _(step, metadata, target, definition) {
            for (var key in definition) {
                var value = definition[key];
                if (!$isFunction(value)) {
                    continue;
                }
                var spec = _.spec || (_.spec = {
                    configurable: true,
                    enumerable:   true
                });
                if (_inferProperty(key, value, definition, spec)) {
                    var name = spec.name;
                    if (name && !(name in target)) {
                        spec.get = _makeGetter(spec.get);
                        spec.set = _makeSetter(spec.set);                        
                        this.defineProperty(metadata, target, name, spec);
                    }
                    delete spec.name;
                    delete spec.get;
                    delete spec.set;
                }
            }
        },
        defineProperty: function(metadata, target, name, spec) {
            metadata.defineProperty(target, name, spec);
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */               
        isActive: True
    });

    var GETTER_CONVENTIONS = ['get', 'is'];

    function _inferProperty(key, value, definition, spec) {
        for (var i = 0; i < GETTER_CONVENTIONS.length; ++i) {
            var prefix = GETTER_CONVENTIONS[i];
            if (key.lastIndexOf(prefix, 0) == 0) {
                if (value.length === 0) {  // no arguments
                    var name  = key.substring(prefix.length);
                    spec.get  = key;
                    spec.set  = 'set' + name;
                    spec.name = name.charAt(0).toLowerCase() + name.slice(1);
                    return true;
                }
            }
        }
        if (key.lastIndexOf('set', 0) == 0) {
            if (value.length === 1) {  // 1 argument
                var name  = key.substring(3);
                spec.set  = key;
                spec.get  = 'get' + name;
                spec.name = name.charAt(0).toLowerCase() + name.slice(1);
                return true;
            }
        }
    }

    /**
     * Metamacro to inherit static members in subclasses.
     * <pre>
     * var Math = Base.extend(
     *     **$inheritStatic**, null, {
     *         PI:  3.14159265359,
     *         add: function (a, b) {
     *             return a + b;
     *          }
     *     }),
     *     Geometry = Math.extend(null, {
     *         area: function(length, width) {
     *             return length * width;
     *         }
     *     });
     * </pre>
     * would make Math.PI and Math.add available on the Geometry class.
     * @class $inhertStatic
     * @constructor
     * @param  {string}  [...members]  -  members to inherit
     * @extends miruken.MetaMacro
     */
    var $inheritStatic = MetaMacro.extend({
        constructor: function _(/*members*/) {
            var spec = _.spec || (_.spec = {});
            spec.value = Array.prototype.slice.call(arguments);
            Object.defineProperty(this, 'members', spec);
            delete spec.value;
        },
        apply: function (step, metadata, target) {
            if (step === MetaStep.Subclass) {
                var members  = this.members,
                    clazz    = metadata.getClass(),
                    ancestor = $ancestorOf(clazz);
                if (members.length > 0) {
                    for (var i = 0; i < members.length; ++i) {
                        var member = members[i];
                        if (!(member in clazz)) {
                            clazz[member] = ancestor[member];
                        }
                    }
                } else if (ancestor !== Base && ancestor !== Object) {
                    for (var key in ancestor) {
                        if (ancestor.hasOwnProperty(key) && !(key in clazz)) {
                            clazz[key] = ancestor[key];
                        }
                    }
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True
    });

    /**
     * Base class to prefer coercion over casting.
     * By default, Type(target) will cast target to the type.
     * @class Miruken
     * @extends Base
     */
    var Miruken = Base.extend(null, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Protocol for targets that manage disposal lifecycle.
     * @class Disposing
     * @extends miruken.Protocol
     */
    var Disposing = Protocol.extend({
        /**
         * Releases any resources managed by the receiver.
         * @method dispose
         */
        dispose: function () {}
    });

    /**
     * Mixin for {{#crossLink "miruken.Disposing"}}{{/crossLink}} implementation.
     * @class DisposingMixin
     * @uses miruken.Disposing
     * @extends Module
     */
    var DisposingMixin = Module.extend({
        dispose: function (object) {
            if ($isFunction(object._dispose)) {
                object._dispose();
                object.dispose = Undefined;  // dispose once
            }
        }
    });

    /**
     * Protocol for targets that can execute functions.
     * @class Invoking
     * @extends miruken.StrictProtocol
     */
    var Invoking = StrictProtocol.extend({
        /**
         * Invokes the function with dependencies.
         * @method invoke
         * @param    {Function} fn           - function to invoke
         * @param    {Array}    dependencies - function dependencies
         * @param    {Object}   [ctx]        - function context
         * @returns  {Any}      result of the function.
         */
        invoke: function (fn, dependencies, ctx) {}
    });

    /**
     * Protocol for targets that have parent/child relationships.
     * @class Parenting
     * @extends miruken.Protocol
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @method newChild
         * @returns  {Object} the new child.
         */
        newChild: function () {}
    });

    /**
     * Protocol for targets that can be started.
     * @class Starting
     * @extends miruken.Protocol
     */
    var Starting = Protocol.extend({
        /**
         * Starts the reciever.
         * @method start
         */
        start: function () {}
    });

    /**
     * Base class for startable targets.
     * @class Startup
     * @uses miruken.Starting
     * @extends Base
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
    });

    /**
     * Convenience function for disposing resources.
     * @for miruken.$
     * @method $using
     * @param    {miruken.Disposing}   disposing  - object to dispose
     * @param    {Function | Promise}  action     - block or Promise
     * @param    {Object}              [context]  - block context
     * @returns  {Any} result of executing the action in context.
     */
    function $using(disposing, action, context) {
        if (disposing && $isFunction(disposing.dispose)) {
            if ($isFunction(action)) {
                var result;
                try {
                    result = action.call(context, disposing);
                    return result;
                } finally {
                    if ($isPromise(result)) {
                        action = result;
                    } else {
                        disposing.dispose();
                    }
                }
            } else if (!$isPromise(action)) {
                return;
            }
            action.finally(function () { disposing.dispose(); });
            return action;
        }
    }

    /**
     * Class for annotating targets.
     * @class Modifier
     * @param  {Object}  source  -  source to annotate
     */
    function Modifier() {}
    Modifier.isModified = function (source) {
        return source instanceof Modifier;
    };
    Modifier.unwrap = function (source) {
        return (source instanceof Modifier) 
             ? Modifier.unwrap(source.getSource())
             : source;
    }
    function $createModifier() {
        var allowNew;
        function modifier(source) {
            if (this === global) {
                if (modifier.test(source)) {
                    return source;
                }
                allowNew = true;
                var wrapped = new modifier(source);
                allowNew = false;
                return wrapped;
            } else {
                if (!allowNew) {
                    throw new Error("Modifiers should not be called with the new operator.");
                }
                this.getSource = function () {
                    return source;
                }
            }
        }
        modifier.prototype = new Modifier();
        modifier.test      = function (source) {
            if (source instanceof modifier) {
                return true;
            } else if (source instanceof Modifier) {
                return modifier.test(source.getSource());
            }
            return false;
        }
        return modifier;
    }

    /**
     * Helper class to simplify array manipulation.
     * @class ArrayManager
     * @constructor
     * @param  {Array}  [...items]  -  initial items
     * @extends Base
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            var _items = [];
            this.extend({
                /** 
                 * Gets the array.
                 * @method getItems
                 * @returns  {Array} array.
                 */
                getItems: function () { return _items; },
                /** 
                 * Gets the item at array index.
                 * @method getIndex
                 * @param    {number}  index - index of item
                 * @returns  {Any} item at index.
                 */
                getIndex: function (index) {
                    if (_items.length > index) {
                        return _items[index];
                    }
                },
                /** 
                 * Sets the item at array index if empty.
                 * @method setIndex
                 * @param    {number}  index - index of item
                 * @param    {Any}     item  - item to set
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                setIndex: function (index, item) {
                    if ((_items.length <= index) ||
                        (_items[index] === undefined)) {
                        _items[index] = this.mapItem(item);
                    }
                    return this;
                },
                /** 
                 * Inserts the item at array index.
                 * @method insertIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to insert
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                insertIndex: function (index, item) {
                    _items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                /** 
                 * Replaces the item at array index.
                 * @method replaceIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to replace
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                replaceIndex: function (index, item) {
                    _items[index] = this.mapItem(item);
                    return this;
                },
                /** 
                 * Removes the item at array index.
                 * @method removeIndex
                 * @param    {number}   index - index of item
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                removeIndex: function (index) {
                    if (_items.length > index) {
                        _items.splice(index, 1);
                    }
                    return this;
                },
                /** 
                 * Appends one or more items to the end of the array.
                 * @method append
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                append: function (/* items */) {
                    var newItems;
                    if (arguments.length === 1 && (arguments[0] instanceof Array)) {
                        newItems = arguments[0];
                    } else if (arguments.length > 0) {
                        newItems = arguments;
                    }
                    if (newItems) {
                        for (var i = 0; i < newItems.length; ++i) {
                            _items.push(this.mapItem(newItems[i]));
                        }
                    }
                    return this;
                },
                /** 
                 * Merges the items into the array.
                 * @method merge
                 * @param    {Array}  items - items to merge from
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                merge: function (items) {
                    for (var index = 0; index < items.length; ++index) {
                        var item = items[index];
                        if (item !== undefined) {
                            this.setIndex(index, item);
                        }
                    }
                    return this;
                }
            });
            if (items) {
                this.append(items);
            }
        },
        /** 
         * Optional mapping for items before adding to the array.
         * @method mapItem
         * @param    {Any}  item  -  item to map
         * @returns  {Any}  mapped item.
         */
        mapItem: function (item) { return item; }
    });

    /**
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     * @class IndexedList
     * @constructor
     * @param  {Function}  order  -  orders items
     * @extends Base
     */
    var IndexedList = Base.extend({
        constructor: function (order) {
            var _index = {};
            this.extend({
                /** 
                 * Determines if list is empty.
                 * @method isEmpty
                 * @returns  {boolean}  true if list is empty, false otherwise.
                 */
                isEmpty: function () {
                    return !this.head;
                },
                /** 
                 * Gets the node at an index.
                 * @method getIndex
                 * @param    {number} index - index of node
                 * @returns  {Any}  the node at index.
                 */
                getIndex: function (index) {
                    return index && _index[index];
                },
                /** 
                 * Inserts the node at an index.
                 * @method insert
                 * @param  {Any}     node   - node to insert
                 * @param  {number}  index  - index to insert at
                 */
                insert: function (node, index) {
                    var indexedNode = this.getIndex(index),
                        insert      = indexedNode;
                    if (index) {
                        insert = insert || this.head;
                        while (insert && order(node, insert) >= 0) {
                            insert = insert.next;
                        }
                    }
                    if (insert) {
                        var prev    = insert.prev;
                        node.next   = insert;
                        node.prev   = prev;
                        insert.prev = node;
                        if (prev) {
                            prev.next = node;
                        }
                        if (this.head === insert) {
                            this.head = node;
                        }
                    } else {
                        delete node.next;
                        var tail = this.tail;
                        if (tail) {
                            node.prev = tail;
                            tail.next = node;
                        } else {
                            this.head = node;
                            delete node.prev;
                        }
                        this.tail = node;
                    }
                    if (index) {
                        node.index = index;
                        if (!indexedNode) {
                            _index[index] = node;
                        }
                    }
                },
                /** 
                 * Removes the node from the list.
                 * @method remove
                 * @param  {Any}  node  - node to remove
                 */
                remove: function (node) {
                    var prev = node.prev,
                        next = node.next;
                    if (prev) {
                        if (next) {
                            prev.next = next;
                            next.prev = prev;
                        } else {
                            this.tail = prev;
                            delete prev.next;
                        }
                    } else if (next) {
                        this.head = next;
                        delete next.prev;
                    } else {
                        delete this.head;
                        delete this.tail;
                    }
                    var index = node.index;
                    if (this.getIndex(index) === node) {
                        if (next && next.index === index) {
                            _index[index] = next;
                        } else {
                            delete _index[index];
                        }
                    }
                }
            });
        }
    });

    /**
     * Facet choices for proxies.
     * @class Facet
     * @extends miruken.Enum
     */
    var Facet = Enum({
        /**
         * @property {string} Parameters
         */
        Parameters: 'parameters',
        /**
         * @property {string} Interceptors
         */        
        Interceptors: 'interceptors',
        /**
         * @property {string} InterceptorSelectors
         */                
        InterceptorSelectors: 'interceptorSelectors',
        /**
         * @property {string} Delegate
         */                        
        Delegate: 'delegate'
        });


    /**
     * Base class for method interception.
     * @class Interceptor
     * @extends Base
     */
    var Interceptor = Base.extend({
        /**
         * @method intercept
         * @param    {Object} invocation  - invocation
         * @returns  {Any} invocation result
         */
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * Responsible for selecting which interceptors to apply to a method.
     * @class InterceptorSelector
     * @extends Base
     */
    var InterceptorSelector = Base.extend({
        /**
         * Description goes here
         * @method selectInterceptors
         * @param    {Type}    type         - type being intercepted
         * @param    {string}  method       - method name
         * @param    {Array}   interceptors - available interceptors
         * @returns  {Array} effective interceptors
         */
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * Builds proxy classes for interception.
     * @class ProxyBuilder
     * @extends Base
     */
    var ProxyBuilder = Base.extend({
        /**
         * Builds a proxy class for the supplied types.
         * @method buildProxy
         * @param    {Array}     ...types    - classes and protocols
         * @param    {Object}    options     - literal options
         * @returns  {Function}  proxy class.
         */
        buildProxy: function(types, options) {
            if (!(types instanceof Array)) {
                throw new TypeError("ProxyBuilder requires an array of types to proxy.");
            }
            var classes   = Array2.filter(types, $isClass),
                protocols = Array2.filter(types, $isProtocol);
            return _buildProxy(classes, protocols, options || {});
        }
    });

    function _buildProxy(classes, protocols, options) {
        var base  = options.baseType || classes.shift() || Base,
            proxy = base.extend(protocols.concat(classes), {
            constructor: function _(facets) {
                var spec = _.spec || (_.spec = {});
                spec.value = facets[Facet.InterceptorSelectors]
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'selectors', spec);
                }
                spec.value = facets[Facet.Interceptors];
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'interceptors', spec);
                }
                spec.value = facets[Facet.Delegate];
                if (spec.value) {
                    spec.writable = true;
                    Object.defineProperty(this, 'delegate', spec);
                }
                ctor = _proxyMethod('constructor', this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors: function (source, method) {
                var selectors = this.selectors;
                return selectors 
                     ? Array2.reduce(selectors, function (interceptors, selector) {
                           return selector.selectInterceptors(source, method, interceptors);
                       }, this.interceptors)
                     : this.interceptors;
            },
            extend: _extendProxy
        }, {
            shouldProxy: options.shouldProxy
        });
        _proxyClass(proxy, protocols);
        proxy.extend = proxy.implement = _throwProxiesSealedExeception;
        return proxy;
    }

    function _throwProxiesSealedExeception()
    {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
    }

    function _proxyClass(proxy, protocols) {
        var sources    = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied    = {};
        for (var i = 0; i < sources.length; ++i) {
            var source      = sources[i],
                sourceProto = source.prototype,
                isProtocol  = $isProtocol(source);
            for (key in sourceProto) {
                if (!((key in proxied) || (key in _noProxyMethods))
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var descriptor = _getPropertyDescriptor(sourceProto, key);
                    if ('value' in descriptor) {
                        var member = isProtocol ? undefined : descriptor.value;
                        if ($isNothing(member) || $isFunction(member)) {
                            proxyProto[key] = _proxyMethod(key, member, proxy);
                        }
                        proxied[key] = true;
                    } else if (isProtocol) {
                        var cname = key.charAt(0).toUpperCase() + key.slice(1),
                            get   = 'get' + cname,
                            set   = 'set' + cname,
                            spec  = _proxyClass.spec || (_proxyClass.spec = {
                                enumerable: true
                            });
                        spec.get = function (get) {
                            var proxyGet;
                            return function () {
                                if (get in this) {
                                    return (this[get]).call(this);
                                }
                                if (!proxyGet) {
                                    proxyGet = _proxyMethod(get, undefined, proxy);
                                }
                                return proxyGet.call(this);
                            }
                        }(get);
                        spec.set = function (set) {
                            var proxySet;
                            return function (value) {
                                if (set in this) {
                                    return (this[set]).call(this, value);
                                }
                                if (!proxySet) {
                                    proxySet = _proxyMethod(set, undefined, proxy);
                                }
                                return proxySet.call(this, value);
                            }
                        }(set);
                        Object.defineProperty(proxy.prototype, key, spec);
                        proxied[key] = true;
                    }
                }
            }
        }
    }
    
    function _proxyMethod(key, method, source) {
        var spec = _proxyMethod.spec || (_proxyMethod.spec = {}),
            interceptors;
        function methodProxy() {
            var _this    = this,
                delegate = this.delegate,
                idx      = -1;
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                args: Array.prototype.slice.call(arguments),
                useDelegate: function (value) {
                    delegate = value; 
                },
                replaceDelegate: function (value) {
                    _this.delegate = delegate = value;
                },
                proceed: function () {
                    ++idx;
                    if (interceptors && idx < interceptors.length) {
                        var interceptor = interceptors[idx];
                        return interceptor.intercept(invocation);
                    }
                    if (delegate) {
                        var delegateMethod = delegate[key];
                        if ($isFunction(delegateMethod)) {
                            return delegateMethod.apply(delegate, this.args);
                        }
                    } else if (method) {
                        return method.apply(_this, this.args);
                    }
                    throw new Error(format(
                        "Interceptor cannot proceed without a class or delegate method '%1'.", key));
                }
            };
            spec.value = key;
            Object.defineProperty(invocation, 'method', spec);
            spec.value = source;
            Object.defineProperty(invocation, 'source', spec);
            delete spec.value;
            spec.get = function () {
                if (interceptors && (idx + 1 < interceptors.length)) {
                    return true;
                }
                if (delegate) {
                    return $isFunction(delegate(key));
                }
                return !!method;
            };
            Object.defineProperty(invocation, 'canProceed', spec);
            delete spec.get;
            return invocation.proceed();
        }
        methodProxy.baseMethod = method;
        return methodProxy;
    }
    
    function _extendProxy() {
        var proxy     = this.constructor,
            clazz     = proxy.prototype,
            overrides = (arguments.length === 1) ? arguments[0] : {};
        if (arguments.length >= 2) {
            overrides[arguments[0]] = arguments[1];
        }
        for (methodName in overrides) {
            if (!(methodName in _noProxyMethods) && 
                (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
                var method = this[methodName];
                if (method && method.baseMethod) {
                    this[methodName] = method.baseMethod;
                }
                this.base(methodName, overrides[methodName]);
                this[methodName] = _proxyMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    var _noProxyMethods = {
        base: true, extend: true, constructor: true, conformsTo: true,
        getInterceptors: true, getDelegate: true, setDelegate: true
    };

    Package.implement({
        export: function (name, member) {
            this.addName(name, member);
        },
        getProtocols: function (cb) {
            _listContents(this, cb, $isProtocol);
        },
        getClasses: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return $isClass(member) && (memberName != "constructor");
            });
        },
        getPackages: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return (member instanceof Package) && (memberName != "parent");
            });
        }
    });

    function _listContents(package, cb, filter) {
        if ($isFunction(cb)) {
            for (memberName in package) {
                var member = package[memberName];
                if (!filter || filter(member, memberName)) {
                    cb({ member: member, name: memberName});
                }
            }
        }
    }

    /**
     * Determines if target is a protocol.
     * @method $isProtocol
     * @param    {Any}     protocol  - target to test
     * @returns  {boolean} true if a protocol.
     * @for miruken.$
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * Determines if target is a class.
     * @method $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * Gets the class the instance belongs to.
     * @method $classOf
     * @param    {Object}  instance  - object
     * @returns  {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * Gets the classes superclass.
     * @method $ancestorOf
     * @param    {Function} clazz  - class
     * @returns  {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * Determines if target is a string.
     * @method $isString
     * @param    {Any}     str  - string to test
     * @returns  {boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * Determines if the target is a function.
     * @method $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * Determines if target is an object.
     * @method $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * Determines if target is a promise.
     * @method $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }

    /**
     * Determines if value is null or undefined.
     * @method $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return (value === undefined) || (value === null);
    }

    /**
     * Description goes here
     * @method $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return !$isNothing(value);
    }

    /**
     * Returns a function that returns value.
     * @method $lift
     * @param    {Any}      value  - any value
     * @returns  {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    /**
     * Determines whether the objects are considered equal.
     * <p>
     * Objects are considered equal if the objects are strictly equal (===) or
     * either object has an equals method accepting other object that returns true.
     * </p>
     * @method $equals
     * @param    {Any}     obj1  - first object
     * @param    {Any}     obj2  - second object
     * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
     */
    function $equals(obj1, obj2) {
        if (obj1 === obj2) {
            return true;
        }
        if ($isFunction(obj1.equals)) {
            return obj1.equals(obj2);
        } else if ($isFunction(obj2.equals)) {
            return obj2.equals(obj1);
        }
        return false;
    }

    /**
     * Creates a decorator builder.<br/>
     * See [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern)
     * @method
     * @param   {Object}   decorations  -  object defining decorations
     * @erturns {Function} function to build decorators.
     */
    function $decorator(decorations) {
        return function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            var decorator = Object.create(decoratee),
                spec      = $decorator.spec || ($decorator.spec = {});
            spec.value = decoratee;
            Object.defineProperty(decorator, 'decoratee', spec);
            if (decorations) {
                decorator.extend(decorations);
            }
            delete spec.value;
            return decorator;
        }
    }

    /**
     * Decorates an instance using the 
     * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
     * @method
     * @param   {Object}   decoratee    -  decoratee
     * @param   {Object}   decorations  -  object defining decorations
     * @erturns {Function} function to build decorators.
     */
    function $decorate(decoratee, decorations) {
        return $decorator(decorations)(decoratee);
    }

    /**
     * Gets the decoratee used in the  
     * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
     * @method
     * @param   {Object}   decorator  -  possible decorator
     * @param   {boolean}  deepest    -  true if deepest decoratee, false if nearest.
     * @erturns {Object}   decoratee if present, otherwise decorator.
     */
    function $decorated(decorator, deepest) {
        var decoratee;
        while (decorator && (decoratee = decorator.decoratee)) {
            if (!deepest) {
                return decoratee;
            }
            decorator = decoratee;
        }
        return decorator;
    }

    /**
     * Throttles a function over a time period.
     * @method $debounce
     * @param    {Function} func                - function to throttle
     * @param    {int}      wait                - time (ms) to throttle func
     * @param    {boolean}  immediate           - if true, trigger func early
     * @param    {Any}      defaultReturnValue  - value to return when throttled
     * @returns  {Function} throttled function
     */
    function $debounce(func, wait, immediate, defaultReturnValue) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    return func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                return func.apply(context, args);
            }
            return defaultReturnValue;
        };
    };
    
    function _getPropertyDescriptor(object, key) {
        var source = object, descriptor;
        while (source && !(
            descriptor = Object.getOwnPropertyDescriptor(source, key))
              ) source = Object.getPrototypeOf(source);
        return descriptor;
    }

    /**
     * Enhances Functions to create instances.
     * @method new
     * @for Function
     */
    if (Function.prototype.new === undefined)
        Function.prototype.new = function () {
            var args        = arguments,
                constructor = this;
            function Wrapper () { constructor.apply(this, args); }
            Wrapper.prototype  = constructor.prototype;
            return new Wrapper;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = miruken;
    }

    global.miruken = miruken;
    global.Miruken = Miruken;

    eval(this.exports);

}
