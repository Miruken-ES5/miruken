/*jslint node: true, sloppy: true, evil: true, vars: true, unparam: true, plusplus: true */
/*global base2, Base, Abstract, Module, typeOf */

var miruken = require('./miruken.js');
              require('./callback.js');

new function () { // closure

    /**
     * @namespace miruken.context
     */
    var context = new base2.Package(this, {
        name:    "context",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "ContextState,ContextObserver,Context,Contextual,ContextualHelper"
    });

    eval(this.imports);

    /**
     * ContextState enum
     * @enum {Number}
     */
    var ContextState = {
        Active: 1,
        Ending: 2,
        Ended:  3 
    }

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
    var Context = CompositeCallbackHandler.extend({
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
                getRootContext: function () {
                    var root = this;    
                    while (root && root.getParent()) {
                        root = root.getParent();
                    }
                    return root;
                },
                newChildContext: function () {
                    _ensureActive();
                    var childContext = new this.constructor(this).extend({
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
                    this.addHandlers(new ObjectCallbackHandler(object));
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

                    if (typeOf(callback) !== 'object') {
                        throw new TypeError("Invalid callback: " + callback + " is not an object.");
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
                }
            });

            function _ensureActive() {
                if (_state != ContextState.Active) {
                    throw new Error("The context has already ended.");
                }
            }
        }
    });
    Context.implement(Traversing);

    /**
     * Contextual mixin
     * @class {Contextual}
     */
    var Contextual = Module.extend({
        getContext: function (object) {
            return object.__context;
        },
        setContext: function (object, context) {
            if (object.__context === context) return;
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

    CallbackHandler.implement({
        getContext: function () {
            return (this instanceof Context) ? this : this.resolve(Context);
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
            return typeOf(contextual.getContext) === 'function'
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
                typeOf(contextual.getContext) !== 'function' || 
                typeOf(contextual.setContext) !== 'function') {
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
        bindContext: function (contextual, context) {
            if (!contextual) {
                return contextual;
            }
            if (contextual.setContext === undefined) {
                contextual = Contextual(contextual);
            } else if (typeOf(contextual.setContext) !== 'function') {
                throw new Error("Unable to set the context on " + contextual + ".");
            }
            contextual.setContext(ContextualHelper.resolveContext(context));
            return contextual;
        },
        bindChildContext: function (contextual, child) {
            if (!child) {
                return null;
            }
            var childContext = typeOf(child.getContext) === 'function'
                             ? child.getContext() : null;
            if (!childContext) {
                var context  = ContextualHelper.requireContext(contextual);
                childContext = context.newChildContext();
                ContextualHelper.bindContext(child, childContext);
            }
            return childContext;
        }
    });

   /**
     * Context traversal
     */
    Context.implement({
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
                if (typeOf(member) === 'function')
                    this[key] = (function (k, m) {
                        return function () {
                            var owner       = (k in CallbackHandler.prototype) ? this : context, 
                                returnValue = m.apply(owner, arguments);
                            if (returnValue === context) {
                                returnValue = this;
                            }
                            else if (returnValue &&
                                     typeOf(returnValue.getDecoratee) === 'function' &&
                                     typeOf(returnValue.setDecoratee) === 'function' &&
                                     returnValue.getDecoratee() == context) {
                                returnValue.setDecoratee(this);
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
            var args        = [].slice.call(arguments, 0),
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
            var args        = [].slice.call(arguments, 0),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindChildContext(context, object);
            return object;
        };

    if (typeof module !== 'undefined' && module.exports)
        module.exports = exports = context;

    eval(this.exports);

}
