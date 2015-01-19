var Q  = require('q');
         require('./base2.js');

new function () { // closure

    /**
     * @namespace miruken
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Protocol,Proxy,Disposing,DisposingMixin,Parenting,Interceptor,InterceptorSelector,ProxyBuilder,TraversingAxis,Traversing,TraversingMixin,Traversal,Variance,Modifier,IndexedList,$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isPromise,$isSomething,$isNothing,$using,$lift,$eq,$use,$copy,$lazy,$eval,$child,$optional,$promise,$createModifier"
    });

    eval(this.imports);

    var $eq       = $createModifier(),
        $use      = $createModifier(),
        $copy     = $createModifier(),
        $lazy     = $createModifier(),
        $eval     = $createModifier(),
        $child    = $createModifier(),
        $optional = $createModifier(),
        $promise  = $createModifier();

    /**
     * Variance enum
     * @enum {Number}
     */
    var Variance = {
        Covariant:     1,  // out
        Contravariant: 2,  // in
        Invariant:     3   // exact
    };

    /**
     * @class {Proxy}
     */
    var Proxy = Base.extend({
        /**
         * Proxies the method invocation on the protocol.
         * @param   {Protocol} protocol    - receiving protocol
         * @param   {String}   methodName  - name of the method
         * @param   {Array}    args        - method arguments
         * @returns {Any}      the result of the proxied invocation.
         */
        proxyMethod: function (protocol, methodName, args) {}
    });

    /**
     * @class {ObjectProxy}
     */
    var ObjectProxy = Proxy.extend({
        constructor: function (object) {
            if ($isNothing(object)) {
                throw new TypeError("No object specified.");
            }
            this.extend({
                proxyMethod: function (protocol, methodName, args, strict) {
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
        constructor: function (proxy, strict) {
            if ($isNothing(proxy)) {
                proxy = new Proxy;
            } else if ((proxy instanceof Proxy) === false) {
                if ($isFunction(proxy.toProxy)) {
                    proxy = proxy.toProxy();
                    if ((proxy instanceof Proxy) === false) {
                        throw new TypeError("Invalid proxy: " + proxy +
                            " is not a Proxy nor does it have a 'toProxy' method that returned a Proxy.");
                    }
                } else {
                    proxy = new ObjectProxy(proxy);
                }
            }
            this.extend({ 
                proxyMethod: function (methodName, args) {
                    return proxy && proxy.proxyMethod($classOf(this), methodName, args, strict);
                }
            });
        }
    }, {
        init: function () {
            var extend  = Base.extend;
            Base.extend = function () {
                var _protocols      = [],
                    isProtocol      = (this === Protocol) || (this.prototype instanceof Protocol),
                    getProtocols    = function () { return _protocols.slice(0); },
                    getAllProtocols = function () {
                        var protocols = this.getProtocols(),
                            inner     = protocols.slice(0);
                        if (!isProtocol) {
                            var ancestor = $ancestorOf(this);
                            if (ancestor !== Base) {
                                inner.push(ancestor);
                            }
                        }
                        for (var i = 0; i < inner.length; ++i) {
                            var innerProtocols = inner[i].getAllProtocols();
                            for (var ii = 0; ii < innerProtocols.length; ++ii) {
                                var protocol = innerProtocols[ii];
                                if (protocols.indexOf(protocol) < 0) {
                                    protocols.push(protocol);
                                }
                            } 
                        }
                        return protocols;
                    },
                    addProtocol  = function (protocol) {
                        if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                            if (isProtocol) {
                                _liftMethods.call(this.prototype, protocol);
                            }
                            _protocols.push(protocol);
                        }
                    };
                return (function (base, args) {
                    var constraints = args,
                        protocols   = [],
                        mixins      = [];
                    if (base.prototype instanceof Protocol) {
                        protocols.push(base);
                    }
                    if (args.length > 0 && (args[0] instanceof Array)) {
                        constraints = args.shift();
                    }
                    while (constraints.length > 0) {
                        var constraint = constraints[0];
                        if (constraint.prototype instanceof Protocol) {
                            protocols.push(constraints.shift());
                        } else if (constraint.prototype) {
                            mixins.push(constraints.shift());
                        } else {
                            break;
                        }
                    }
                    var subclass = extend.apply(base, args);
                    Array2.forEach(protocols, addProtocol, subclass);
                    subclass.addProtocol     = addProtocol;
                    subclass.getProtocols    = getProtocols;
                    subclass.getAllProtocols = getAllProtocols;
                    subclass.conformsTo      = _conformsTo.bind(subclass, _protocols);
                    Array2.forEach(mixins, subclass.implement, subclass);
                    return subclass;
                })(this, Array.prototype.slice.call(arguments));
            };

            Base.prototype.conformsTo = function (protocol) {
                return $classOf(this).conformsTo(protocol);
            };

            // Proxying methods
            this.extend = function () {
                var derived = Base.extend.apply(this, arguments);
                for (var key in derived.prototype) {
                    if (!(key in Base.prototype)) {
                        var member = derived.prototype[key];
                        if ($isFunction(member)) {
                            (function (methodName) {
                                var proxiedMethod = {};
                                proxiedMethod[methodName] = function () {
                                    var args = Array.prototype.slice.call(arguments);
                                    return this.proxyMethod(methodName, args);
                                }
                                derived.implement(proxiedMethod);
                            })(key);
                        }
                    }
                }
                derived.adoptedBy = Protocol.adoptedBy;
                return derived;
            };
        },
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        conformsTo: function (protocol) { return false; },
        adoptedBy:  function (target) {
            return target && $isFunction(target.conformsTo)
                 ? target.conformsTo(this)
                 : false;
        },
        coerce: function (object, strict) { return new this(object, strict); }
    });

    function _conformsTo(protocols, protocol) {
        if (!(protocol && (protocol.prototype instanceof Protocol))) {
            return false;
        } else if ((protocol === this) || (this.prototype instanceof protocol)) {
            return true;
        }
        for (var index = 0; index < protocols.length; ++index) {
            var proto = protocols[index];
            if (protocol === proto || proto.conformsTo(protocol)) {
                return true;
            }
        }
        var ancestor = this.ancestor;
        return ancestor && (ancestor !== Base) && (ancestor !== Protocol)
            ? ancestor.conformsTo(protocol)
            : false;
    };

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
     * Disposing mixin
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
            action.fin(function () { disposing.dispose(); });
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
     * @class {Interceptor}
     */
    var Interceptor = Base.extend({
        intercept: function (source, method, args, proceed) {
            return proceed();
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
            var classes   = Array2.filter(types, $isClass),
                protocols = Array2.filter(types, $isProtocol);
            return _buildProxy(classes, protocols, options || {});
        }
    });

    var _unproxiedMethods = ['base', 'extend', 'constructor', 'conformsTo'];

    function _buildProxy(classes, protocols, options) {
        var base  = options.baseType || classes.shift() || Base,
            proxy = base.extend(protocols.concat(classes), {
            constructor: function () {
                var args         = Array.prototype.slice.call(arguments),
                    interceptors = args.shift() || [];
                this.getInterceptors = function () { return interceptors; };
                if (base !== Base) {
                    ctor = _proxiedMethod('constructor', this.base, base);
                    this.extend("extend", _proxiedCtorExtend);
                    ctor.apply(this, args);
                }
                this.extend = _throwProxiesAreSealedExeception;
            }
        }, {
            shouldProxy: options.shouldProxy, 
            selector:    options.interfaceSelector,
            extend:      _throwProxiesAreSealedExeception
        });
        var sources        = [proxy].concat(protocols),
            proxyPrototype = proxy.prototype,
            proxied        = {};
        for (var i = 0; i < sources.length; ++i) {
            var source          = sources[i],
                sourcePrototype = source.prototype;
            for (key in sourcePrototype) {
                if (!proxied.hasOwnProperty(key)
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))
                && ( _unproxiedMethods.indexOf(key) < 0)) {
                    var member = sourcePrototype[key];
                    if ($isNothing(member) || $isFunction(member)) {
                        proxyPrototype[key] = _proxiedMethod(key, member, proxy);
                    }
                    proxied[key] = true;
                }
            }
        }
        return proxy;
    }

    function _proxiedMethod(key, method, source) {
        var interceptors;
        return function () {
            var _this = this, idx = -1,
                args  = Array.prototype.slice.call(arguments);
            if (!interceptors) {
                var selector = this.constructor.selector;
                interceptors = this.getInterceptors();
                if (selector) {
                    interceptors = selector(source, method, interceptors);
                }
            }
            function proceed() {
                ++idx;
                if (arguments.length > 0) {
                    agrs = Array.prototype.slice.call(arguments);
                }
                if (idx < interceptors.length) {
                    var interceptor = interceptors[idx];
                    return interceptor.intercept(source, key, args, proceed);
                } else if (method) {
                    return method.apply(_this, args);
                }
            }
            return proceed();
        }
    }

    function _proxiedCtorExtend()
    {
        var result = this.base.apply(this, arguments),
            proxy  = this.constructor,
            clazz  = proxy.prototype,
            overrides;
        if (arguments.length >= 2) {
            overrides = {};
            overrides[arguments[0]] = Undefined;
        } else if (arguments.length > 0) {
            overrides = arguments[0];
        }
        if (overrides) {
            for (method in overrides) {
                if ((!proxy.shouldProxy || proxy.shouldProxy(method, clazz))
                &&  (_unproxiedMethods.indexOf(method) < 0)) {
                    this[method] = _proxiedMethod(method, this[method], clazz);
                }
            }
        }
        return result;
    }

    function _throwProxiesAreSealedExeception()
    {
        throw new TypeError("Proxies are sealed and cannot be extended.");
    }

    /**
     * Package extensions
     */
    Package.implement({
        getProtocols: function (cb) {
            _listContents(this, cb, $isProtocol);
        },
        getClasses: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return $isClass(member) && (memberName != "constructor");
            });
        }
    });

    function _listContents(package, cb, filter) {
        if ($isFunction(cb)) {
            for (memberName in package) {
                var member = package[memberName];
                if (!filter || filter(member, memberName)) {
                    cb(member, memberName);
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
     * @function $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {Boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return Q.isPromiseAlike(promise);
    }

    /**
     * @function $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value not null or undefined
     */
    function $isSomething(value) {
        return (value !== undefined && value !== null);
    }

    /**
     * @function $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value null or undefined
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
    var TraversingAxis = {
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
    }

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
        if (!node || !$isFunction(visitor)) return true;
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
    } else if (typeof define === "function" && define.amd) {
        define("miruken", [], function() {
            return miruken;
        });
    }

    eval(this.exports);

}
