var miruken = require('./miruken.js');
              require('./graph.js');
              require('./callback.js');

new function () { // closure

    /**
     * @namespace miruken.context
     */
    var context = new base2.Package(this, {
        name:    "context",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.graph,miruken.callback",
        exports: "ContextState,ContextObserver,Context,Contextual,ContextualMixin,ContextualHelper,$contextual"
    });

    eval(this.imports);

    /**
     * ContextState enum
     * @enum {Number}
     */
    var ContextState = Enum({
        Active: 1,
        Ending: 2,
        Ended:  3 
    });

    /**
     * @protocol {ContextObserver}
     */
    var ContextObserver = Protocol.extend({
        contextEnding:      function (context) {},
        contextEnded:       function (context) {},
        childContextEnding: function (context) {},
        childContextEnded:  function (context) {}
    });

    /**
     * @class {Context}
     */
    var Context = CompositeCallbackHandler.extend(
        Parenting, Traversing, Disposing, TraversingMixin,
        $inferProperties, {
        constructor: function (parent) {
            this.base();

            var _state              = ContextState.Active,
                _parent             = parent,
                _children           = new Array2,
                _baseHandleCallback = this.handleCallback,
                _observers;

            this.extend({
                getState: function () {
                    return _state; 
                },
                getParent: function () {
                    return _parent; 
                },
                getChildren: function () {
                    return _children.copy(); 
                },
                hasChildren: function () {
                    return _children.length > 0; 
                },
                getRoot: function () {
                    var root = this;    
                    while (root && root.getParent()) {
                        root = root.getParent();
                    }
                    return root;
                },
                newChild: function () {
                    _ensureActive();
                    var childContext = new ($classOf(this))(this).extend({
                        end: function () {
                            if (_observers) {
                                _observers.invoke('childContextEnding', childContext);
                            }
                            _children.remove(childContext);
                            this.base();
                            if (_observers) {
                                _observers.invoke('childContextEnded', childContext);
                            }
                        }
                    });
                    _children.push(childContext);
                    return childContext;
                },
                store: function (object) {
                    if ($isSomething(object)) {
                        $provide(this, object);
                    }
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = this.base(callback, greedy, composer);
                    if (handled && !greedy) {
                        return handled;
                    }
                    if (_parent) {
                        handled = handled | _parent.handle(callback, greedy, composer);
                    }
                    return !!handled;
                },
                handleAxis: function (axis, callback, greedy, composer) {
                    if (callback === null || callback === undefined) {
                        return false;
                    }
                    greedy   = !!greedy;
                    composer = composer || this;
                    if (axis == TraversingAxis.Self) {
                        return _baseHandleCallback.call(this, callback, greedy, composer);
                    }
                    var handled = false;
                    this.traverse(axis, function (node) {
                        handled = handled
                                | node.handleAxis(TraversingAxis.Self, callback, greedy, composer);
                        return handled && !greedy;
                    });
                    return !!handled;
                },
                observe: function (observer) {
                    _ensureActive();
                    if (observer === null || observer === undefined) {
                        return;
                    }
                    observer = ContextObserver(observer);
                    (_observers || (_observers = new Array2)).push(observer);
                    return function () { _observers.remove(observer); };
                },
                unwindToRootContext: function () {
                    var current = this;
                    while (current) {
                        if (current.getParent() == null) {
                            current.unwind();
                            return current;
                        }
                        current = current.getParent();
                    }
                    return null;
                },
                unwind: function () {
                    this.getChildren().invoke('end');
                },
                end: function () { 
                    if (_state == ContextState.Active) {
                        _state = ContextState.Ending;
                        if (_observers) {
                            _observers.invoke('contextEnding', this);
                        }
                        this.unwind();
                        _state = ContextState.Ended;
                        if (_observers) {
                            _observers.invoke('contextEnded', this);
                        }
                        _observers = null;
                    }
                },
                dispose: function () { this.end(); }
            });

            function _ensureActive() {
                if (_state != ContextState.Active) {
                    throw new Error("The context has already ended.");
                }
            }
        }
    });

    /**
     * @protocol {Contextual}
     */
    var Contextual = Protocol.extend({
        /**
         * Gets the Context associated with this object.
         * @returns {Context} this associated Context.
         */
        getContext: function () {},
        /**
         * Sets the Context associated with this object.
         * @param   {Context} context  - associated context
         */
        setContext: function (context) {}
    });

    /**
     * Contextual mixin
     * @class {Contextual}
     */
    var ContextualMixin = Module.extend({
        getContext: function (object) {
            return object.__context;
        },
        setContext: function (object, context) {
            if (object.__context === context) {
                return;
            }
            if (object.__context)
                object.__context.removeHandlers(object);
            if (context) {
                object.__context = context;
                context.addHandlers(object);
            } else {
                delete object.__context;
            }
        },
        isActiveContext: function (object) {
            return object.__context && (object.__context.getState() === ContextState.Active);
        },
        endContext: function (object) {
            if (object.__context) object.__context.end();
        }
    });

    /**
     * @class {$contextual}
     * Metamacro to implement Contextual protocol.
     */
    var $contextual = MetaMacro.extend({
        apply: function (step, metadata) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();
                clazz.$meta.addProtocol(Contextual);
                clazz.implement(ContextualMixin);
            }
        }
    });

    /**
     * ContextualHelper mixin
     * @class {ContextualHelper}
     */
    var ContextualHelper = Module.extend({
        resolveContext: function (contextual) {
            if (!contextual) return null;
            if (contextual instanceof Context) return contextual;
            return $isFunction(contextual.getContext)
                 ? contextual.getContext() : null;
        },
        requireContext: function (contextual) {
            var context = ContextualHelper.resolveContext(contextual);
            if (!(context instanceof Context))
                throw new Error("The supplied object is not a Context or Contextual object.");
            return context;
        },
        clearContext: function (contextual) {
            if (!contextual ||
                !$isFunction(contextual.getContext) || 
                !$isFunction(contextual.setContext)) {
                return;
            }
            var context = contextual.getContext();
            if (context) {
                try {
                    context.end();
                }
                finally {
                    contextual.setContext(null);
                }
            }
        },
        bindContext: function (contextual, context, replace) {
            if (!contextual ||
                (!replace && $isFunction(contextual.getContext)
                 && contextual.getContext())) {
                return contextual;
            }
            if (contextual.setContext === undefined) {
                contextual = ContextualMixin(contextual);
            } else if (!$isFunction(contextual.setContext)) {
                throw new Error("Unable to set the context on " + contextual + ".");
            }
            contextual.setContext(ContextualHelper.resolveContext(context));
            return contextual;
        },
        bindChildContext: function (contextual, child) {
            var childContext;
            if (child) {
                if ($isFunction(child.getContext)) {
                    childContext = child.getContext();
                    if (childContext && childContext.getState() === ContextState.Active) {
                        return childContext;
                    }
                }
                var context  = ContextualHelper.requireContext(contextual);
                while (context && context.getState() !== ContextState.Active) {
                    context = context.getParent();
                }
                if (context) {
                    childContext = context.newChild();
                    ContextualHelper.bindContext(child, childContext, true);
                }
            }
            return childContext;
        }
    });

    var axisNames  = TraversingAxis.names,
        axisValues =  TraversingAxis.values;
    
   /**
     * Context traversal
     */
    Context.implement({
        /*
        $properties: {
            $self: {
                get: function () {
                    return _newContextTraversal(this, TraversingAxis.Self);
                }
            }
        },
*/
        self: function () {
            return _newContextTraversal(this, TraversingAxis.Self);
        },
        root: function () {
            return _newContextTraversal(this, TraversingAxis.Root);   
        },
        child: function () {
            return _newContextTraversal(this, TraversingAxis.Child);   
        },
        sibling: function () {
            return _newContextTraversal(this, TraversingAxis.Sibling);   
        },
        childOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.ChildOrSelf);   
        },
        siblingOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.SiblingOrSelf);   
        },
        ancestor: function () {
            return _newContextTraversal(this, TraversingAxis.Ancestor);   
        },
        ancestorOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.AncestorOrSelf);   
        },
        descendant: function () {
            return _newContextTraversal(this, TraversingAxis.Descendant);   
        },
        descendantOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.DescendantOrSelf);   
        },
        parentSiblingOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.ParentSiblingOrSelf);   
        }
    });

    function _newContextTraversal(context, axis) {
        function Traversal() {
            for (var key in context) {
                if (key in Base.prototype) {
                    continue;
                }
                var member = context[key];
                if ($isFunction(member))
                    this[key] = (function (k, m) {
                        return function () {
                            var owner       = (k in CallbackHandler.prototype) ? this : context, 
                                returnValue = m.apply(owner, arguments);
                            if (returnValue === context) {
                                returnValue = this;
                            }
                            else if (returnValue && returnValue.decoratee == context) {
                                returnValue.decoratee = this;
                            }
                            return returnValue;
                        }
                    })(key, member);
            }
            this.extend({
                handle: function (callback, greedy, composer) {
                    return this.handleAxis(axis, callback, greedy, composer);
                }});
        }
        Traversal.prototype = context.constructor.prototype;
        return new Traversal();
    }

    // =========================================================================
    // Function context extensions
    // =========================================================================

    if (Function.prototype.newInContext === undefined)
        Function.prototype.newInContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindContext(object, context);
            return object;
        };

    if (Function.prototype.newInChildContext === undefined)
        Function.prototype.newInChildContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindChildContext(context, object);
            return object;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = context;
    }

    eval(this.exports);

}
