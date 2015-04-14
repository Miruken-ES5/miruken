require('./base2.js');

new function () { // closure

    /**
     * @namespace miruken
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Enum,Protocol,Delegate,Miruken,MetaStep,MetaMacro,Disposing,DisposingMixin,Parenting,Starting,Startup,Facet,Interceptor,InterceptorSelector,ProxyBuilder,TraversingAxis,Traversing,TraversingMixin,Traversal,Variance,Modifier,ArrayManager,IndexedList,$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isPromise,$isSomething,$isNothing,$using,$lift,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant,$createModifier,$properties,$inferProperties,$inheritStatic"
    });

    eval(this.imports);

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
     * @class {Enum}
     * Represents an enumeration
     */
    var Enum = Base.extend({
        constructor: function() {
            throw new TypeError("Enums cannot be instantiated.");
        }
    }, {
        coerce: function (choices) {
            return Object.freeze(this.extend(null, choices));
        }
    });

    /**
     * Variance enum
     * @enum {Number}
     */
    var Variance = Enum({
        Covariant:     1,  // out
        Contravariant: 2,  // in
        Invariant:     3   // exact
        });

    /**
     * @class {Delegate}
     */
    var Delegate = Base.extend({
        /**
         * Delegates the method invocation on the protocol.
         * @param   {Protocol} protocol    - receiving protocol
         * @param   {String}   methodName  - name of the method
         * @param   {Array}    args        - method arguments
         * @returns {Any}      the result of the proxied invocation.
         */
        delegate: function (protocol, methodName, args) {}
    });

    /**
     * @class {ObjectDelegate}
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            if ($isNothing(object)) {
                throw new TypeError("No object specified.");
            }
            this.extend({
                delegate: function (protocol, methodName, args, strict) {
                    var method = object[methodName];
                    if (method && (!strict || protocol.adoptedBy(object))) {
                        return method.apply(object, args);
                    }
                }
            });
        }
    });

    /**
     * @class {Protocol}
     */
    var Protocol = Base.extend({
        constructor: function (delegate, strict) {
            if ($isNothing(delegate)) {
                delegate = new Delegate;
            } else if ((delegate instanceof Delegate) === false) {
                if ($isFunction(delegate.toDelegate)) {
                    delegate = delegate.toDelegate();
                    if ((delegate instanceof Delegate) === false) {
                        throw new TypeError(lang.format(
                            "Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one."));
                    }
                } else {
                    delegate = new ObjectDelegate(delegate);
                }
            }
            this.extend({ 
                delegate: function (methodName, args) {
                    return delegate && delegate.delegate(
                        $classOf(this), methodName, args, strict);
                }
            });
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
        coerce: function (object, strict) {
            return new this(object, strict);
        }
    });

    /**
     * MetaStep enum
     * @enum {Number}
     */
    var MetaStep = Enum({
        Subclass:  1,
        Implement: 2,
        Extend:    3
        });

    /**
     * @class {MetaMacro}
     */
    var MetaMacro = Base.extend({
        apply: function (step, metadata, target, definition) {},
        shouldInherit: False,
        isActive: False,
    }, {
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });

    /**
     * @class {MetaBase}
     */
    var MetaBase = MetaMacro.extend({
        constructor: function(parent)  {
            var _protocols = [];
            this.extend({
                getParent: function () { return parent; },
                getProtocols: function () { return _protocols.slice(0) },
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
                            this.protocolAdded(protocol);
                        }
                    }
                },
                protocolAdded: function (protocol) {
                },
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
                getDescriptor: function (filter) {
                    if (parent) {
                        return parent.getDescriptor(filter);
                    }
                },
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
     * @class {ClassMeta}
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
                    if (!_isProtocol && baseClass !== Base) {
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
                protocolAdded: function (protocol) {
                    if (_isProtocol) {
                        _liftMethods.call(subClass.prototype, protocol);
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
                    return baseClass && (baseClass !== Base) && (baseClass !== Protocol)
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
     * @class {InstanceMeta}
     */
    var InstanceMeta = MetaBase.extend({
        constructor: function (classMeta) {
            this.base(classMeta);
            this.extend({
                getClass: function () {
                    return classMeta.getClass();
                }
            });
        }
    });

    var extend  = Base.extend;
    Base.extend = function () {
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
                subclass    = extend.call(base, instanceDef, staticDef),
                metadata    = new ClassMeta(base, subclass, protocols, macros);
            Object.defineProperty(subclass, '$meta', {
                enumerable:   false,
                configurable: false,
                writable:     false,
                value:        metadata
            });
            Object.defineProperty(subclass.prototype, '$meta', {
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
        Object.defineProperty(this, '$meta', spec);
        delete spec.value;
        return metadata;
    }

    Base.prototype.conformsTo = function (protocol) {
        return this.constructor.$meta.conformsTo(protocol);
    };
    
    var implement = Base.implement;
    Base.implement = function (source) {
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
     * @class {$proxyProtocol}
     * Metamacro to proxy protocol methods through delegate.
     */
    var $proxyProtocol = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            for (var key in definition) {
                if (key === 'delegate' || (key in Base.prototype)) {
                    continue;
                }
                var member = target[key];
                if ($isFunction(member)) {
                    (function (methodName) {
                        target[methodName] = function () {
                            var args = Array.prototype.slice.call(arguments);
                            return this.delegate(methodName, args);
                        }
                    })(key);
                }
            }
            if (step === MetaStep.Subclass) {
                metadata.getClass().adoptedBy = Protocol.adoptedBy;
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
     * @class {$properties}
     * Metamacro to create properties.
     */
    var $properties = MetaMacro.extend({
        constructor: function (tag) {
            this._tag = tag || '$properties';
        },
        apply: function _(step, metadata, target, definition) {
            if ($isNothing(definition) || !definition.hasOwnProperty(this._tag)) {
                return;
            }
            var properties = definition[this._tag],
                descriptors;
            for (var name in properties) {
                var property = properties[name],
                    spec = _.spec || (_.spec = {
                    enumerable:   true,
                    configurable: true
                    }),
                    descriptor = false;
                spec.writable = true;
                if ($isNothing(property) || $isString(property) ||
                    typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                    spec.value = property;
                } else {
                    descriptor = true;
                    if (property.get) {
                        spec.get = property.get;
                    }
                    if (property.set) {
                        spec.set = property.set;
                    }
                    if (spec.get || spec.set) {
                        delete spec.writable;
                    } else {
                        spec.value = property.value;
                    }
                }
                this.defineProperty(metadata, target, name, spec);
                if (descriptor) {
                    _cleanDescriptor(property);
                    Object.freeze(property);
                    (descriptors || (descriptors = {}))[name] = property;
                }
                _cleanDescriptor(spec);
            }
            if (descriptors) {
                metadata.extend({
                    getDescriptor: function (filter) {
                        if ($isNothing(filter)) {
                            return lang.extend(lang.extend({}, this.base(filter)), descriptors);
                        }
                        if ($isString(filter)) {
                            return descriptors[filter] || this.base(filter);
                        } else {
                            var matches = this.base(filter);
                            for (var key in descriptors) {
                                var descriptor = descriptors[key];
                                if (_matchDescriptor(descriptor, filter)) {
                                    matches = matches || {};
                                    lang.extend(matches, key, descriptor);
                                }
                            }
                            return matches;
                        }
                    }
                });
            }
            delete definition[this._tag];
            delete target[this._tag];
        },
        defineProperty: function(metadata, target, name, spec) {
            Object.defineProperty(target, name, spec);
        },
        shouldInherit: True,
        isActive: True
    });

    function _matchDescriptor(descriptor, filter) {
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
                } else if (!(value === match || _matchDescriptor(value, match))) {
                    return false;
                }
            }
        }
        return true;
    }

    function _cleanDescriptor(descriptor) {
        delete descriptor.writable;
        delete descriptor.value;
        delete descriptor.get;
        delete descriptor.set;
    }

    /**
     * @class {$inferProperties}
     * Metamacro to derive properties from existng methods.
     */
    var $inferProperties = MetaMacro.extend({
        apply: function _(step, metadata, target, definition) {
            for (var key in definition) {
                var value = definition[key];
                if (!$isFunction(value)) {
                    continue;
                }
                var spec = _.spec || (_.spec = {
                    enumerable: true
                });
                if (_inferProperty(key, value, definition, spec)) {
                    var name = spec.name;
                    if (name && name.length > 0) {
                        name = name.charAt(0).toLowerCase() + name.slice(1);
                        if (!(name in target)) {
                            this.defineProperty(metadata, target, name, spec);
                        }
                    }
                    delete spec.name;
                    delete spec.get;
                    delete spec.set;
                }
            }
        },
        defineProperty: function(metadata, target, name, spec) {
            Object.defineProperty(target, name, spec);
        },
        shouldInherit: True,
        isActive: True
    });

    var DEFAULT_GETTERS = ['get', 'is', 'can'];

    function _inferProperty(key, value, definition, spec) {
        for (var i = 0; i < DEFAULT_GETTERS.length; ++i) {
            var prefix = DEFAULT_GETTERS[i];
            if (key.lastIndexOf(prefix, 0) == 0) {
                if (value.length === 0) { // no arguments
                    spec.name = key.substring(prefix.length);
                    spec.get  = value;
                    break;
                }
            }
        }
        if (spec.get) {
            spec.set = definition['set' + spec.name];
        } else if (key.lastIndexOf('set', 0) == 0) {
            spec.name = key.substring(3);
            spec.set  = value;
        }
        return !!spec.name;
    }

    /**
     * @class {$inhertStatic}
     * Metamacro to inherit static members in subclass.
     */
    var $inheritStatic = MetaMacro.extend({
        constructor: function (/*members*/) {
            var _members = Array.prototype.slice.call(arguments);
            this.extend({
                apply: function (step, metadata, target) {
                    if (step === MetaStep.Subclass) {
                        var clazz    = metadata.getClass(),
                            ancestor = $ancestorOf(clazz);
                        if (_members.length > 0) {
                            for (var i = 0; i < _members.length; ++i) {
                                var member = _members[i];
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
                }
            });
        },
        shouldInherit: True
    });

    /**
     * @class {Miruken}
     * Base class to prefer coercion over casting.
     */
    var Miruken = Base.extend({
        constructor: function () {
            this.base.apply(this, arguments);
        }
    }, {
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });

    /**
     * @protocol {Disposing}
     */
    var Disposing = Protocol.extend({
        /**
         * Releases the object.
         */
        dispose: function () {}
    });

    /**
     * @class {DisposingMixin}
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
     * @protocol {Parenting}
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @returns {Any} the new child.
         */
        newChild: function () {}
    });

    /**
     * @protocol {Starting}
     */
    var Starting = Protocol.extend({
        start: function () {}
    });

    /**
     * @class {Startup}
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
    });

    /**
     * @function $using
     * Convenience function for disposing resources.
     * @param    {Disposing}           disposing  - object to dispose
     * @param    {Function | Promise}  action     - block or Promise
     * @param    {Object}              context    - block context
     * @returns  {Any} result of executing action in context.
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
     * @class {Modifier}
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
     * @class {ArrayManager}
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            items = items || [];
            this.extend({
                getItems: function () { return items; },
                getIndex: function (index) {
                    if (items.length > index) {
                        return items[index];
                    }
                },
                setIndex: function (index, item) {
                    if ((items.length <= index) ||
                        (items[index] === undefined)) {
                        items[index] = this.mapItem(item);
                    }
                    return this;
                },
                insertIndex: function (index, item) {
                    items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                replaceIndex: function (index, item) {
                    items[index] = this.mapItem(item);
                    return this;
                },
                removeIndex: function (index) {
                    if (items.length > index) {
                        items.splice(index, 1);
                    }
                    return this;
                },
                append: function (/* items */) {
                    var newItems;
                    if (arguments.length === 1 && (arguments[0] instanceof Array)) {
                        newItems = arguments[0];
                    } else if (arguments.length > 0) {
                        newItems = Array.prototype.slice.call(arguments);
                    }
                    if (newItems) {
                        for (var i = 0; i < newItems.length; ++i) {
                            items.push(this.mapItem(newItems[i]));
                        }
                    }
                    return this;
                },
                merge: function (items) {
                    for (var index = 0; index < items.length; ++index) {
                        var item = items[index];
                        if (item !== undefined) {
                            this.setIndex(index, item);
                        }
                    }
                    return this;
                },

            });
        },
        mapItem: function (item) { return item; }
    });

    /**
     * @class {IndexedList}
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     */
    var IndexedList = Base.extend({
        constructor: function(order) {
            var _index = {};
            this.extend({
                isEmpty: function () {
                    return !this.head;
                },
                getIndex: function (index) {
                    return index && _index[index];
                },
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
     * @enum {Number}
     */
    var Facet = Enum({
        Parameters:           'parameters',
        Interceptors:         'interceptors',
        InterceptorSelectors: 'interceptorSelectors',
        Delegate:             'delegate'
        });


    /**
     * @class {Interceptor}
     */
    var Interceptor = Base.extend({
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * @class {Interceptor}
     */
    var InterceptorSelector = Base.extend({
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * @class {ProxyBuilder}
     */
    var ProxyBuilder = Base.extend({
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
            constructor: function (facets) {
                this._selectors    = facets[Facet.InterceptorSelectors];
                this._interceptors = facets[Facet.Interceptors];
                this._delegate     = facets[Facet.Delegate];
                if (base !== Base) {
                    ctor = _proxiedMethod('constructor', this.base, base);
                    ctor.apply(this, facets[Facet.Parameters]);
                }
            },
            extend: _proxyExtender,
            getDelegate: function () { return this._delegate; },
            setDelegate: function (value) { this._delegate = value; },
            getInterceptors: function (source, method) {
                return (this._selectors && this._selectors.length > 0)
                     ? Array2.reduce(this._selectors, function (interceptors, selector) {
                           return selector.selectInterceptors(source, method, interceptors);
                       }, this._interceptors)
                     : this._interceptors;
            }
        }, {
            shouldProxy: options.shouldProxy
        });
        var sources    = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied    = {};
        for (var i = 0; i < sources.length; ++i) {
            var source      = sources[i],
                sourceProto = source.prototype;
            for (key in sourceProto) {
                if (!(key in proxied) && !(key in _noProxyMethods)
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var member = $isProtocol(source) ? undefined : sourceProto[key];
                    if ($isNothing(member) || $isFunction(member)) {
                        proxyProto[key] = _proxiedMethod(key, member, proxy);
                    }
                    proxied[key] = true;
                }
            }
        }
        proxy.extend = proxy.implement = _throwProxiesSealedExeception;
        return proxy;
    }

    function _proxyExtender() {
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
                this[methodName] = _proxiedMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    function _proxiedMethod(key, method, source) {
        var interceptors;
        function proxyMethod () {
            var _this    = this, idx = -1,
                delegate = this.getDelegate(),
                args     = Array.prototype.slice.call(arguments);
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                getMethod: function () { return key; },
                getSource: function () { return source; },
                getArgs: function () { return args; },
                setArgs: function (value) { args = value; },
                useDelegate: function (value) { delegate = value; },
                replaceDelegate: function (value) {
                    _this.setDelegate(value);
                    delegate = value;
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
                            return delegateMethod.apply(delegate, args);
                        }
                    } else if (method) {
                        return method.apply(_this, args);
                    }
                    throw new Error(lang.format(
                        "Interceptor cannot proceed without a class or delegate method '%1'.",
                        key));
                }
            };
            return invocation.proceed();
        }
        proxyMethod.baseMethod = method;
        return proxyMethod;
    }

    function _throwProxiesSealedExeception()
    {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
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
     * @function $isProtocol
     * @param    {Any}     protocol  - protocol to test
     * @returns  {Boolean} true if a protocol.
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * @function $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {Boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * @function $classOf
     * @param    {Object}  instance  - object
     * @returns  {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * @function $ancestorOf
     * @param    {Function} clazz  - clazz
     * @returns  {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * @function $isString
     * @param    {Any}     str  - string to test
     * @returns  {Boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * @function $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {Boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * @function $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {Boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * @function $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {Boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }

    /**
     * @function $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return (value !== undefined && value !== null);
    }

    /**
     * @function $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return (value === undefined || value === null);
    }

    /**
     * @function $lift
     * @param    {Any} value  - any value
     * @returns  {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    // =========================================================================
    // Traversing
    // =========================================================================

    /**
     * Traversing enum
     * @enum {Number}
     */
    var TraversingAxis = Enum({
        Self:                    1,
        Root:                    2,
        Child:                   3,
        Sibling:                 4,
        Ancestor:                5,
        Descendant:              6,
        DescendantReverse:       7,
        ChildOrSelf:             8,
        SiblingOrSelf:           9,
        AncestorOrSelf:          10,
        DescendantOrSelf:        11,
        DescendantOrSelfReverse: 12,
        ParentSiblingOrSelf:     13
    });

    /**
     * @protocol {Traversing}
     */
    var Traversing = Protocol.extend({
        /**
         * Traverse a graph of objects.
         * @param {TraversingAxis} axis       - axis of traversal
         * @param {Function}       visitor    - receives visited nodes
         * @param {Object}         [context]  - visitor callback context
         */
        traverse: function (axis, visitor, context) {}
    });

    /**
     * Traversing mixin
     * @class {Traversing}
     */
    var TraversingMixin = Module.extend({
        traverse: function (object, axis, visitor, context) {
            if ($isFunction(axis)) {
                context = visitor;
                visitor = axis;
                axis    = TraversingAxis.Child;
            }
            if (!$isFunction(visitor)) return;
            switch (axis) {
            case TraversingAxis.Self:
                _traverseSelf.call(object, visitor, context);
                break;
                
            case TraversingAxis.Root:
                _traverseRoot.call(object, visitor, context);
                break;
                
            case TraversingAxis.Child:
                _traverseChildren.call(object, visitor, false, context);
                break;

            case TraversingAxis.Sibling:
                _traverseParentSiblingOrSelf.call(object, visitor, false, false, context);
                break;
                
            case TraversingAxis.ChildOrSelf:
                _traverseChildren.call(object, visitor, true, context);
                break;

            case TraversingAxis.SiblingOrSelf:
                _traverseParentSiblingOrSelf.call(object, visitor, true, false, context);
                break;
                
            case TraversingAxis.Ancestor:
                _traverseAncestors.call(object, visitor, false, context);
                break;
                
            case TraversingAxis.AncestorOrSelf:
                _traverseAncestors.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.Descendant:
                _traverseDescendants.call(object, visitor, false, context);
                break;
  
            case TraversingAxis.DescendantReverse:
                _traverseDescendantsReverse.call(object, visitor, false, context);
                break;
              
            case TraversingAxis.DescendantOrSelf:
                _traverseDescendants.call(object, visitor, true, context);
                break;

            case TraversingAxis.DescendantOrSelfReverse:
                _traverseDescendantsReverse.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.ParentSiblingOrSelf:
                _traverseParentSiblingOrSelf.call(object, visitor, true, true, context);
                break;

            default:
                throw new Error("Unrecognized TraversingAxis " + axis + '.');
            }
        }
    });

    function checkCircularity(visited, node) {
        if (visited.indexOf(node) !== -1) {
            throw new Error('Circularity detected for node ' + node + '.');
        }
        visited.push(node);
        return node;
    }

    function _traverseSelf(visitor, context) {
        visitor.call(context, this);
    }

    function _traverseRoot(visitor, context) {
        var parent, root = this, visited = [this];
        while ($isFunction(root.getParent) && (parent = root.getParent())) {
            checkCircularity(visited, parent);
            root = parent;   
        }
        visitor.call(context, root);
    }

    function _traverseChildren(visitor, withSelf, context) {
        if ((withSelf && visitor.call(context, this)) || !$isFunction(this.getChildren)) {
            return;
        }
        var children = this.getChildren();
        for (var i = 0; i < children.length; ++i) {
            if (visitor.call(context, children[i])) {
                return;
            }
        }
    }

    function _traverseAncestors(visitor, withSelf, context) {
        var parent = this, visited = [this];
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        while ($isFunction(parent.getParent) && (parent = parent.getParent()) &&
               !visitor.call(context, parent)) {
            checkCircularity(visited, parent);
        }
    }

    function _traverseDescendants(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.levelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.levelOrder(this, function (node) {
                if (node != self) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseDescendantsReverse(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.reverseLevelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.reverseLevelOrder(this, function (node) {
                if (node != self) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseParentSiblingOrSelf(visitor, withSelf, withParent, context) {
        if (withSelf && visitor.call(context, this) || !$isFunction(this.getParent)) {
            return;
        }
        var self = this, parent = this.getParent();
        if (parent) {
            if ($isFunction(parent.getChildren)) {
                var children = parent.getChildren();
                for (var i = 0; i < children.length; ++i) {
                    var sibling = children[i];
                    if (sibling != self && visitor.call(context, sibling)) {
                        return;
                    }
                }
            }
            if (withParent) {
                visitor.call(context, parent);
            }
        }
    }

    var Traversal = Abstract.extend({}, {
        preOrder: function (node, visitor, context) {
            return _preOrder(node, visitor, context, []);
        },
        postOrder: function (node, visitor, context) {
            return _postOrder(node, visitor, context, []);
        },
        levelOrder: function (node, visitor, context) {
            return _levelOrder(node, visitor, context, []);
        },
        reverseLevelOrder: function (node, visitor, context) {
            return _reverseLevelOrder(node, visitor, context, []);
        }
    });

    function _preOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.preOrder(child, visitor, context);
            });
        return false;
    }

    function _postOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.postOrder(child, visitor, context);
            });
        return visitor.call(context, node);
    }

    function _levelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            if (visitor.call(context, next)) {
                return;
            }
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) queue.push(child);
                });
        }
    }

    function _reverseLevelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node],
            stack = [];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            stack.push(next);
            var level = [];
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) level.unshift(child);
                });
            queue.push.apply(queue, level);
        }
        while (stack.length > 0) {
            if (visitor.call(context, stack.pop())) {
                return;
            }
        }
    }

    /**
     * @function _liftMethods
     * @param    {Object} source  - object to lift
     */
    function _liftMethods(source) {
        source = source.prototype;
        for (var key in source) {
            if (!(key in this)) {
                var member = source[key];
                if ($isFunction(member)) {
                    this[key] = member;
                }
            }
        }
    }

    /**
     * @function new
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
