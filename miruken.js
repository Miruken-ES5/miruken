require('./base2.js');

new function () { // closure

    /**
     * @namespace miruken
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Protocol,Proxy,TraversingAxis,Traversing,Traversal,Variance,Modifier,$lift,$isClass,$eq,$use,$copy,$lazy,$optional,$promise,$createModifier"
    });

    eval(this.imports);

    var $eq       = $createModifier(),
        $use      = $createModifier(),
        $copy     = $createModifier(),
        $lazy     = $createModifier(),
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
            if (typeOf(object) !== 'object') {
                throw new TypeError("Invalid object: " + object + ".");
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
            if (proxy === null || proxy === undefined) {
                proxy = new Proxy;
            } else if ((proxy instanceof Proxy) === false) {
                if (typeOf(proxy.toProxy) === 'function') {
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
                    return proxy && proxy.proxyMethod(this.constructor, methodName, args, strict);
                }
            });
        }
    }, {
        init: function () {
            var extend  = Base.extend;
            Base.extend = function () {
                var _protocols   = [],
                    isProtocol   = (this === Protocol) || Protocol.ancestorOf(this),
                    getProtocols = function () { return _protocols.slice(0); },
                    addProtocol  = function (protocol) {
                        if (Protocol.ancestorOf(protocol) && _protocols.indexOf(protocol) === -1) {
                            if (isProtocol) {
                                _liftMethods.call(this.prototype, protocol);
                            }
                            _protocols.push(protocol);
                        }
                    };
                return (function (base, args) {
                    var protocols = [];
                    if (Protocol.ancestorOf(base)) {
                        protocols.push(base);
                    }
                    while (args.length > 0 && Protocol.ancestorOf(args[0])) {
                        protocols.push(args.shift());
                    }
                    var subclass = extend.apply(base, args);
                    Array2.forEach(protocols, addProtocol, subclass);
                    subclass.addProtocol  = addProtocol;
                    subclass.getProtocols = getProtocols;
                    subclass.conformsTo   = Base.conformsTo;
                    return subclass;
					})(this, Array.prototype.slice.call(arguments));
            };

			// Conformance
            Base.conformsTo = function (protocol) {
                if (!protocol) {
                    return false;
                }
                if (Protocol.ancestorOf(this) && protocol.ancestorOf(this)) {
                    return true;
                }
                var protocols = this.getProtocols();
				for (var index = 0; index < protocols.length; ++index) {
                    var proto = protocols[index];
                    if (protocol === proto || proto.conformsTo(protocol)) {
                        return true;
                    }
                }
                var ancestor = this.ancestor;
                return (ancestor !== Base) && (ancestor !== Protocol)
                     ? ancestor.conformsTo(protocol)
                     : false;
            };
            Base.prototype.conformsTo = function (protocol) {
                return this.constructor.conformsTo(protocol);
            };

			// Proxying methods
            this.extend = function () {
                var derived = Base.extend.apply(this, arguments);
                for (var key in derived.prototype) {
                    if (!(key in Base.prototype)) {
                        var member = derived.prototype[key];
                        if (typeOf(member) === 'function') {
                            (function (methodName) {
                                var proxiedMethod = {};
                                proxiedMethod[methodName] = function () {
                                    return this.proxyMethod(methodName, [].slice.call(arguments, 0));
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
            return target && this.ancestorOf(target);
        },
        conformsTo: function (protocol) { return false; },
        adoptedBy:  function (target) {
            return target && typeOf(target.conformsTo) === 'function'
                 ? target.conformsTo(this)
                 : false;
        },
        coerce: function (object, strict) { return new this(object, strict); }
    });

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
     * Package extensions
     */
    Package.implement({
        getProtocols: function (cb) {
            _listContents(this, cb, Protocol.isProtocol.bind(Protocol));
        },
        getClasses: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return (member.ancestorOf === Base.ancestorOf) 
                    && !Protocol.isProtocol(member)
                    && (memberName != "constructor");
            });
        }
    });

    function _listContents(package, cb, filter) {
        if (typeOf(cb) === 'function') {
            for (memberName in package) {
                var member = package[memberName];
                if (!filter || filter(member, memberName)) {
                    cb(member, memberName);
                }
            }
        }
    }

    /**
     * @function $isClass
     * @param    {Object} source  - object to test
     * @returns  {Boolean} true if source is a class (not a protocol)
     */
    function $isClass(source) {
        return source && (source.ancestorOf === Base.ancestorOf)
            && !Protocol.isProtocol(source);
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
     * Traversing module
     * @class {Traversing}
     */
    var Traversing = Module.extend({
        /**
         * Traverse a graph of objects.
         * @param {Object}         object     - graph to traverse
         * @param {TraversingAxis} axis       - axis of traversal
         * @param {Funcion}        visitor    - receives visited nodes
         * @param {Object}         [context]  - visitor callback context
         */
        traverse: function (object, axis, visitor, context) {
            if (typeOf(axis) === 'function') {
                context = visitor;
                visitor = axis;
                axis    = TraversingAxis.Child;
            }
            if (typeOf(visitor) != 'function') return;
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
        while (typeOf(root.getParent) === 'function' &&
               (parent = root.getParent())) {
            checkCircularity(visited, parent);
            root = parent;   
        }
        visitor.call(context, root);
    }

    function _traverseChildren(visitor, withSelf, context) {
        if ((withSelf && visitor.call(context, this)) ||
            (typeOf(this.getChildren) !== 'function')) {
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
        while (typeOf(parent.getParent) === 'function' &&
               (parent = parent.getParent()) &&
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
        if (withSelf && visitor.call(context, this) ||
            typeOf(this.getParent) !== 'function') {
            return;
        }
        var self = this, parent = this.getParent();
        if (parent) {
            if (typeOf(parent.getChildren) === 'function') {
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
        if (!node || typeOf(visitor) !== 'function' ||
            visitor.call(context, node)) {
            return true;
        }
        if (typeOf(node.traverse) === 'function')
            node.traverse(function (child) {
                return Traversal.preOrder(child, visitor, context);
            });
        return false;
    }

    function _postOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || typeOf(visitor) !== 'function') return true;
        if (typeOf(node.traverse) === 'function')
            node.traverse(function (child) {
                return Traversal.postOrder(child, visitor, context);
            });
        return visitor.call(context, node);
    }

    function _levelOrder(node, visitor, context, visited) {
        if (!node || typeOf(visitor) !== 'function') {
            return;
        }
        var queue = [node];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            if (visitor.call(context, next)) {
                return;
            }
            if (typeOf(next.traverse) === 'function')
                next.traverse(function (child) {
                    if (child) queue.push(child);
                });
        }
    }

    function _reverseLevelOrder(node, visitor, context, visited) {
        if (!node || typeOf(visitor) !== 'function') {
            return;
        }
        var queue = [node],
            stack = [];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            stack.push(next);
            var level = [];
            if (typeOf(next.traverse) === 'function')
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
                if (typeOf(member) === 'function') {
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

    if (typeof module !== 'undefined' && module.exports)
        module.exports = exports = miruken;

    eval(this.exports);

}
