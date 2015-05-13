require('./base2.js');

new function () { // closure

    /**
     * Definition goes here
     * @module miruken
     * @namespace miruken
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Enum,NullThenable,Variance,Protocol,StrictProtocol,Delegate,Miruken,MetaStep,MetaMacro,Disposing,DisposingMixin,Invoking,Parenting,Starting,Startup,Facet,Interceptor,InterceptorSelector,ProxyBuilder,Modifier,ArrayManager,IndexedList,$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isPromise,$isSomething,$isNothing,$using,$lift,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant,$createModifier,$properties,$inferProperties,$inheritStatic"
    });

    eval(this.imports);

    var META = '$meta';

    var $eq       = $createModifier(),
        $use      = $createModifier(),
        $copy     = $createModifier(),
        $lazy     = $createModifier(),
        $eval     = $createModifier(),
        $every    = $createModifier(),
        $child    = $createModifier(),
        $optional = $createModifier(),
        $promise  = $createModifier(),
        $instant  = $createModifier();
    
    /**
     * Represents an enumeration
     * @class Enum
     * @constructor
     */
    var Enum = Base.extend({
        constructor: function() {
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
     * NullThenable
     * Null pattern for thenable.
     */
    var NullThenable = Object.freeze({
        then: Undefined
    });
    
    /**
     * Variance enum
     * @property Variance
     * @type Enum
     */
    var Variance = Enum({
        Covariant:     1,  // out
        Contravariant: 2,  // in
        Invariant:     3   // exact
        });

    /**
     * Delegates stuff
     * @class Delegate
     * @extends Base
     */
    var Delegate = Base.extend({
        /**
         * Delegates the property get on the protocol.
         * @method get
         * @param   {Protocol} protocol      - receiving protocol
         * @param   {string}   propertyName  - name of the property
         * @param   {boolean}  strict        - true if target must adopt protocol
         * @returns {Any}      the result of the proxied get.
         */
        get: function (protocol, propertyName, strict) {},
        /**
         * Delegates the property set on the protocol.
         * @method set
         * @param   {Protocol} protocol      - receiving protocol
         * @param   {string}   propertyName  - name of the property
         * @param   {Object}   propertyValue - value of the property
         * @param   {boolean}  strict        - true if target must adopt protocol
         */
        set: function (protocol, propertyName, propertyValue, strict) {},
        /**
         * Delegates the method invocation on the protocol.
         * @method invoke
         * @param   {Protocol} protocol    - receiving protocol
         * @param   {string}   methodName  - name of the method
         * @param   {Array}    args        - method arguments
         * @param   {boolean}  strict      - true if target must adopt protocol
         * @returns {Any}      the result of the proxied invocation.
         */
         invoke: function (protocol, methodName, args, strict) {}
    });

    /**
     * @class ObjectDelegate
     * @constructor
     * @extends Delegate
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            if ($isNothing(object)) {
                throw new TypeError("No object specified.");
            }
            Object.defineProperty(this, 'object', { value: object });
        },
        /**
         * Description goes here
         * @method get
         * @params {Protocol}    protocol        - definition
         * @params {string}      propertyName    - definition
         * @params {boolean}     strict          - definition
         * @return {Object}      object          - definition
         */
        get: function (protocol, propertyName, strict) {
            var object = this.object;
            if (!strict || protocol.adoptedBy(object)) {
                return object[propertyName];
            }
        },
        /**
         * Description goes here
         * @method set
         * @params {Protocol}    protocol        - definition
         * @params {string}      propertyName    - definition
         * @params {string}      propertyValue   - definition
         * @params {boolean}     strict          - definition
         * @return {Object}      object          - definition
         */
        set: function (protocol, propertyName, propertyValue, strict) {
            var object = this.object;
            if (!strict || protocol.adoptedBy(object)) {
                return object[propertyName] = propertyValue;
            }
        },
        /**
         * Description goes here
         * @method invoke
         * @params {Protocol}    protocol        - definition
         * @params {string}      methodName      - definition
         * @params {Array}       args            - definition
         * @params {boolean}     strict          - definition
         * @return {Method}      method          - definition
         */
        invoke: function (protocol, methodName, args, strict) {
            var object = this.object,
                method = object[methodName];
            if (method && (!strict || protocol.adoptedBy(object))) {
                return method.apply(object, args);
            }
        }
    });
    
    /**
     * Description goes here
     * @class Protocol
     * @constructor
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
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        conformsTo: False,
        adoptedBy:  function (target) {
            return target && $isFunction(target.conformsTo)
                 ? target.conformsTo(this)
                 : false;
        },
        coerce: function (object, strict) { return new this(object, strict); }
    });

    /**
     * MetaStep enum
     * @property MetaStep
     * @type Enum
     */
    var MetaStep = Enum({
        Subclass:  1,
        Implement: 2,
        Extend:    3
        });

    /**
     * Description goes here
     * @class MetaMacro
     * @extends Base
     */
    var MetaMacro = Base.extend({
        /**
         * Description goes here
         * @method apply
         * @param {Step}           step        - definition
         * @param {MetaData}       metadata    - definition
         * @param {Target}         target      - definition
         * @param {Definition}     definition  - definition
         */
        apply: function (step, metadata, target, definition) {},
        /**
         * Description goes here
         * @method protocolAdded
         * @param {MetaData}       metadata    - definition
         * @param {Protocol}       protocol    - definition
         */
        protocolAdded: function (metadata, protocol) {},
        shouldInherit: False,
        isActive: False,
    }, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Description goes here
     * @class MetaBase
     * @constructor
     * @extends MetaMacro
     */
    var MetaBase = MetaMacro.extend({
        constructor: function(parent)  {
            var _protocols   = [],
                _descriptors;
            this.extend({
                /**
                 * Description goes here
                 * @method getParent
                 * @return {Parent}     parent          - definition
                 */
                getParent: function () { return parent; },
                /**
                 * Description goes here
                 * @method getProtocols
                 * @return {Protocols}     protocols    - definition
                 */
                getProtocols: function () { return _protocols.slice(0) },
                /**
                 * Description goes here
                 * @method getAllProtocols
                 * @return {Array}     protocols        - definition
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
                 * Description goes here
                 * @method addProtocol
                 * @param  {Array}     protocols        - definition
                 * @return {Array}     protocols        - definition
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
                 * Description goes here
                 * @method conformsTo
                 * @params {Protocol}   protocol     - definition
                 * @return {boolean}    bool         - definition
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
                 * Description goes here
                 * @method defineProperty
                 * @param  {Object}     target      - definition
                 * @param  {string}     name        - definition
                 * @param  {Object}     spec        - definition
                 * @param  {Object}     descriptor  - definition
                 */
                defineProperty: function(target, name, spec, descriptor) {
                    descriptor = extend({}, descriptor);
                    Object.defineProperty(target, name, spec);
                    this.addDescriptor(name, descriptor);
                },
                /**
                 * Description goes here
                 * @method getDescriptor
                 * @param  {Filter}     filter      - definition
                 * @return {Parent}     parent      - definition
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
                 * Description goes here
                 * @method addDescriptor
                 * @param  {string}     name        - definition
                 * @param  {Object}     descriptor  - definition
                 */
                addDescriptor: function (name, descriptor) {
                    _descriptors = extend(_descriptors || {}, name, descriptor);
                    return this;
                },
                /**
                 * Description goes here
                 * @method matchDescriptor
                 * @param  {Object}     descriptor  - definition
                 * @param  {Object}     filter      - definition
                 */
                matchDescriptor: function (descriptor, filter) {
                    if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                        return;
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
                 * Description goes here
                 * @method linkBase
                 * @param  {Method}     method      - definition
                 * @return {Method}     method      - definition
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
     * Description goes here
     * @class ClassMeta
     * @constructor
     * @extends MetaBase
     */
    var ClassMeta = MetaBase.extend({
        constructor: function(baseClass, subClass, protocols, macros)  {
            var _isProtocol = (subClass === Protocol) || (subClass.prototype instanceof Protocol),
                _macros     = macros ? macros.slice(0) : undefined;
            this.base(baseClass.$meta, protocols);
            this.extend({
                getBase: function () { return baseClass; },
                getClass: function () { return subClass; },
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
     * Description goes here
     * @class InstanceMeta
     * @constructor
     * @extends MetaBase
     */
    var InstanceMeta = MetaBase.extend({
        constructor: function (classMeta) {
            this.base(classMeta);
            this.extend({
                getBase: function () { return classMeta.getBase(); },
                getClass: function () { return classMeta.getClass(); },
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
     * Metamacro to proxy protocol methods through delegate.
     * @class $proxyProtocol
     * @extends MetaMacro
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
        shouldInherit: True,
        isActive: True
    });
    Protocol.extend     = Base.extend
    Protocol.implement  = Base.implement;;
    Protocol.$meta      = new ClassMeta(Base, Protocol, null, [new $proxyProtocol]);
    Protocol.$meta.apply(MetaStep.Subclass, Protocol.$meta, Protocol.prototype);

    /**
     * Description goes here
     * @class StrictProtocol
     * @constructor
     * @extends Protocol     
     */
    var StrictProtocol = Protocol.extend({
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        }
    });

    /**
     * Metamacro to create properties.
     * @class $properties
     * @constructor
     * @extends MetaMacro
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
        shouldInherit: True,
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
     * Metamacro to derive properties from existng methods.
     * @class $inferProperties
     * @extends MetaMacro
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
        shouldInherit: True,
        isActive: True
    });

    var DEFAULT_GETTERS = ['get', 'is'];

    function _inferProperty(key, value, definition, spec) {
        for (var i = 0; i < DEFAULT_GETTERS.length; ++i) {
            var prefix = DEFAULT_GETTERS[i];
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
     * Metamacro to inherit static members in subclass.
     * @class $inhertStatic
     * @constructor
     * @extends MetaMacro
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
        shouldInherit: True
    });

    /**
     * Base class to prefer coercion over casting.
     * @class Miruken
     * @extends Base
     */
    var Miruken = Base.extend(null, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Protocol for Disposing
     * @class Disposing
     * @extends Protocol
     */
    var Disposing = Protocol.extend({
        /**
         * Releases the object.
         * @method dispose
         */
        dispose: function () {}
    });

    /**
     * Description goes here
     * @class DisposingMixin
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
     * Description goes here
     * @class Invoking
     * @extends StrictProtocol
     * @constructor
     */
    var Invoking = StrictProtocol.extend({
        /**
         * Invokes the function with dependencies.
         * @param   {Function} fn           - function to invoke
         * @param   {Array}    dependencies - function dependencies
         * @param   {Object}   ctx          - function context
         * @return {Object} result of function.
         */
        invoke: function (fn, dependencies, ctx) {}
    });

    /**
     * Description goes here
     * @class Parenting
     * @extends Protocol
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @method newChild
         * @return {Any} the new child.
         */
        newChild: function () {}
    });

    /**
     * Description goes here
     * @class Starting
     * @extends Protocol
     */
    var Starting = Protocol.extend({
        start: function () {}
    });

    /**
     * Description goes here
     * @class Startup
     * @extends Base
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
    });

    /**
     * Convenience function for disposing resources.
     * @method $using
     * @param    {Disposing}           disposing  - object to dispose
     * @param    {Function | Promise}  action     - block or Promise
     * @param    {Object}              context    - block context
     * @return   {Any} result of executing action in context.
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
     * Description goes here
     * @class Modifier
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
     * Description goes here
     * @class ArrayManager
     * @extends Base
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            var _items = [];
            this.extend({
                /** 
                 * Description goes here
                 * @method getItems
                 * @return {Object} item
                 */
                getItems: function () { return _items; },
                /** 
                 * Description goes here
                 * @method getIndex
                 * @return {Object} item
                 */
                getIndex: function (index) {
                    if (_items.length > index) {
                        return _items[index];
                    }
                },
                /** 
                 * Description goes here
                 * @method getIndex
                 * @param  {Index}      index - description
                 * @param  {Item}       item  - description
                 * @return {Object}     item
                 */
                setIndex: function (index, item) {
                    if ((_items.length <= index) ||
                        (_items[index] === undefined)) {
                        _items[index] = this.mapItem(item);
                    }
                    return this;
                },
                /** 
                 * Description goes here
                 * @method insertIndex
                 * @param  {Index}      index - description
                 * @param  {Item}       item  - description
                 * @return {Object}     item
                 */
                insertIndex: function (index, item) {
                    _items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                /** 
                 * Description goes here
                 * @method replaceIndex
                 * @param  {Index}      index - description
                 * @param  {Item}       item  - description
                 * @return {Object}     item
                 */
                replaceIndex: function (index, item) {
                    _items[index] = this.mapItem(item);
                    return this;
                },
                /** 
                 * Description goes here
                 * @method removeIndex
                 * @param  {Index}      index - description
                 * @return {Object}     item
                 */
                removeIndex: function (index) {
                    if (_items.length > index) {
                        _items.splice(index, 1);
                    }
                    return this;
                },
                /** 
                 * Description goes here
                 * @method append
                 * @param  {Items}      items - description
                 * @return {Object}     this  - description
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
                 * Description goes here
                 * @method merge
                 * @param  {Array}      items - description
                 * @return {This}       this  - description
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
         * Description goes here
         * @method mapItem
         * @param  {Object}     item - description
         * @return {Object}     item - description
         */
        mapItem: function (item) { return item; }
    });

    /**
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     * @class IndexedList
     * @constructor
     * @extends Base
     */
    var IndexedList = Base.extend({
        constructor: function(order) {
            var _index = {};
            this.extend({
                /** 
                 * Description goes here
                 * @method isEmpty
                 * @return {Object}     this - description
                 */
                isEmpty: function () {
                    return !this.head;
                },
                /** 
                 * Description goes here
                 * @method getIndex
                 * @param  {Index}      index - description
                 * @return {Index}      index - description
                 */
                getIndex: function (index) {
                    return index && _index[index];
                },
                /** 
                 * Description goes here
                 * @method insert
                 * @param  {Node}       node    - description
                 * @param  {Index}      index   - description
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
                 * Description goes here
                 * @method remove
                 * @param  {Node}       node    - description
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
     * Facet enum
     * @property Facet
     * @type Enum
     */
    var Facet = Enum({
        Parameters:           'parameters',
        Interceptors:         'interceptors',
        InterceptorSelectors: 'interceptorSelectors',
        Delegate:             'delegate'
        });


    /**
     * Description goes here
     * @class Interceptor
     * @extends Base
     */
    var Interceptor = Base.extend({
        /**
         * @method intercept
         * @param  {Invocation} invocation
         * @return {Invocation} invocation
         */
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * Description goes here
     * @class InterceptorSelector
     * @extends Base
     */
    var InterceptorSelector = Base.extend({
        /**
         * Description goes here
         * @method selectInterceptors
         * @param  {Type}           type
         * @param  {Method}         method
         * @param  {Interceptors}   interceptors
         * @return {Interceptors}   interceptors
         */
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * Description goes here
     * @class ProxyBuilder
     * @extends Base
     */
    var ProxyBuilder = Base.extend({
        /**
         * Description goes here
         * @method buildProxy
         * @param  {Array}          types           - description
         * @param  {Options}        options         - description
         * @return {Object}         buildProxy      - description
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

    /**
     * Metamacro to intercept proxied methods.
     * @class $interceptMethods
     * @extends MetaMacro
     */
    var $interceptMethods = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            var proxy = metadata.getClass();
            switch (step) {
                case MetaStep.Subclass:
                {
                    for (key in target) {
                        if (!(key in _noProxyMethods) &&
                            (!proxy.shouldProxy || proxy.shouldProxy(key, proxy))) {
                            var descriptor = _getPropertyDescriptor(sourceProto, key);
                            if ('value' in descriptor) {
                                var member = descriptor.value;
                                if ($isNothing(member) || $isFunction(member)) {
                                    target[key] = _proxyMethod(key, member, proxy);
                                }
                            }
                        }
                    }
                    break;
                }
                case MetaStep.Implement:
                {
                    break;
                }
                case MetaStep.Extend:
                {
                    break;
                }
            }
        },
        protocolAdded: function (metadata, protocol) {
        },
        shouldInherit: True,
        isActive: True
    });

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
                        "Interceptor cannot proceed without a class or delegate method '%1'.",
                        key));
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

    /**
     * Package extensions
     */
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
     * Description goes here
     * @method $isProtocol
     * @param    {Any}     protocol  - protocol to test
     * @returns  {boolean} true if a protocol.
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * Description goes here
     * @method $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * Description goes here
     * @method $classOf
     * @param    {Object}  instance  - object
     * @return   {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * Description goes here
     * @method $ancestorOf
     * @param    {Function} clazz  - clazz
     * @return   {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * Description goes here
     * @method $isString
     * @param    {Any}     str  - string to test
     * @returns  {boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * Description goes here
     * @method $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * Description goes here
     * @method $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * Description goes here
     * @method $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }

    /**
     * Description goes here
     * @method $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return (value !== undefined && value !== null);
    }

    /**
     * Description goes here
     * @method $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return (value === undefined || value === null);
    }

    /**
     * Description goes here
     * @method $lift
     * @param    {Any} value  - any value
     * @return   {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    function _getPropertyDescriptor(object, key) {
        var source = object, descriptor;
        while (source && !(
            descriptor = Object.getOwnPropertyDescriptor(source, key))
              ) source = Object.getPrototypeOf(source);
        return descriptor;
    }

    /**
     * Description goes here
     * @method new
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

    /**
     * Add miruken and Miruken to the global namespace
     */
    global.miruken = miruken;
    global.Miruken = Miruken;

    eval(this.exports);

}
