var miruken = require('./miruken.js');
              require('./graph.js');
              require('./callback.js');

new function () { // closure

    /**
     * Package providing contextual support.<br />
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "graph"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule context
     * @namespace miruken.context
     */
    miruken.package(this, {
        name:    "context",
        imports: "miruken,miruken.graph,miruken.callback",
        exports: "ContextState,ContextObserver,Context,ContextualHelper,$contextual"
    });

    eval(this.imports);

    /**
     * Represents the state of a {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextState
     * @extends miruken.Enum
     */
    var ContextState = Enum({
        /**
         * Context is active.
         * @property {number} Active
         */
        Active: 1,
        /**
         * Context is in the process of ending.
         * @property {number} Ending
         */        
        Ending: 2,
        /**
         * Context has ended.
         * @property {number} Ended
         */                
        Ended:  3 
    });

    /**
     * Protocol for observing the lifecycle of
     * {{#crossLink "miruken.context.Context"}}{{/crossLink}}.
     * @class ContextObserver
     * @extends miruken.Protocol
     */
    var ContextObserver = Protocol.extend({
        /**
         * Called when a context is in the process of ending.
         * @method contextEnding
         * @param   {miruken.context.Context}  context
         */
        contextEnding: function (context) {},
        /**
         * Called when a context has ended.
         * @method contextEnded
         * @param   {miruken.context.Context}  context
         */        
        contextEnded: function (context) {},
        /**
         * Called when a child context is in the process of ending.
         * @method childContextEnding
         * @param   {miruken.context.Context}  childContext
         */
        childContextEnding: function (childContext) {},
        /**
         * Called when a child context has ended.
         * @method childContextEnded
         * @param   {miruken.context.Context}  childContext
         */        
        childContextEnded: function (context) {}
    });

    /**
     * A Context represents the scope at a give point in time.<br/>
     * It has a beginning and an end and can handle callbacks as well as notify observers of lifecycle changes.<br/>
     * In addition, it maintains parent-child relationships and thus can participate in a hierarchy.
     * @class Context
     * @constructor
     * @param   {miruken.context.Context}  [parent]  -  parent context
     * @extends miruken.callback.CompositeCallbackHandler
     * @uses miruken.Parenting
     * @uses miruken.graph.Traversing
     * @uses miruken.graph.TraversingMixin
     * @uses miruken.Disposing
     */    
    var Context = CompositeCallbackHandler.extend(
        Parenting, Traversing, Disposing, TraversingMixin, {
        constructor: function (parent) {
            this.base();

            var _id         = assignID(this),
                _state      = ContextState.Active,
                _parent     = parent,
                _children   = new Array2,
                _observers;

            this.extend({
                /**
                 * Gets the unique id of this context.
                 * @property {string} id
                 * @readOnly
                 */
                get id() { return _id },
                /**
                 * Gets the context state.
                 * @property {miruken.context.ContextState} state
                 * @readOnly
                 */
                get state() { return _state; },
                /**
                 * Gets the parent context.
                 * @property {miruken.context.Context} parent
                 * @readOnly
                 */                
                get parent() { return _parent; },
                /**
                 * Gets the context children.
                 * @property {Array} children
                 * @readOnly
                 */                                
                get children() { return _children.copy(); },
                /**
                 * Determines if the context has children.
                 * @property {boolean} hasChildren
                 * @readOnly
                 */                                                
                get hasChildren() { return _children.length > 0; },
                /**
                 * Gets the root context.
                 * @property {miruken.context.Context} root
                 * @readOnly
                 */                                
                get root() {
                    var root = this, parent;    
                    while (root && (parent = root.parent)) {
                        root = parent;
                    }
                    return root;
                },
                newChild: function () {
                    ensureActive();
                    var childContext = new ($classOf(this))(this).extend({
                        end: function () {
                            var notifier = makeNotifier();
                            notifier.childContextEnding(childContext);
                            _children.remove(childContext);
                            this.base();
                            notifier.childContextEnded(childContext);                            
                        }
                    });
                    _children.push(childContext);
                    return childContext;
                },
                /**
                 * Stores the object in the context.
                 * @method store
                 * @param  {Object} object  -  object to store
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                store: function (object) {
                    if ($isSomething(object)) {
                        $provide(this, object);
                    }
                    return this;
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = false,
                        axis    = this.__axis;
                    if (!axis) {
                        handled = this.base(callback, greedy, composer);
                        if (handled && !greedy) {
                            return handled;
                        }
                        if (_parent) {
                            handled = handled | _parent.handle(callback, greedy, composer);
                        }
                        return !!handled;                        
                    }
                    delete this.__axis;
                    if (axis === TraversingAxis.Self) {
                        return this.base(callback, greedy, composer);
                    } else {
                        this.traverse(axis, function (node) {
                            handled = handled | ($equals(node, this)
                                    ? this.base(callback, greedy, composer)
                                    : node.handleAxis(TraversingAxis.Self, callback, greedy, composer));
                            return handled && !greedy;
                        }, this);
                    }
                    return !!handled;
                },
                /**
                 * Handles the callback using the traversing axis.
                 * @method handleAxis
                 * @param   {miruken.graph.TraversingAxis}     axis            -  any callback
                 * @param   {Object}                           callback        -  any callback
                 * @param   {boolean}                          [greedy=false]  -  true if handle greedily
                 * @param   {miruken.callback.CallbackHandler} [composer]      -  composition handler
                 * @returns {boolean} true if the callback was handled, false otherwise.
                 */                
                handleAxis: function (axis, callback, greedy, composer) {
                    if (!(axis instanceof TraversingAxis)) {
                        throw new TypeError("Invalid axis type supplied");
                    }        
                    this.__axis = axis;
                    return this.handle(callback, greedy, composer);
                },
                /**
                 * Subscribes to the context notifications.
                 * @method observe
                 * @param   {miruken.context.ContextObserver}  observer  -  receives notifications
                 * @returns {Function} unsubscribes from context notifications.
                 */                                
                observe: function (observer) {
                    ensureActive();
                    if (observer === null || observer === undefined) {
                        return;
                    }
                    (_observers || (_observers = new Array2)).push(observer);
                    return function () { _observers.remove(observer); };
                },
                /**
                 * Unwinds to the root context.
                 * @method unwindToRootContext
                 * @param   {miruken.context.ContextObserver}  observer  -  receives notifications
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                unwindToRootContext: function () {
                    var current = this;
                    while (current) {
                        var parent = current.parent;
                        if (parent == null) {
                            current.unwind();
                            return current;
                        }
                        current = parent;
                    }
                    return this;
                },
                /**
                 * Unwinds to the context by ending all children.
                 * @method unwind
                 * @returns {miruken.context.Context} receiving context.
                 * @chainable
                 */                                                
                unwind: function () {
                    this.children.invoke('end');
                    return this;
                },
                /**
                 * Ends the context.
                 * @method end
                 */                                                                
                end: function () { 
                    if (_state == ContextState.Active) {
                        var notifier = makeNotifier();
                        _state = ContextState.Ending;
                        notifier.contextEnding(this);
                        this.unwind();
                        _state = ContextState.Ended;
                        notifier.contextEnded(this);                        
                        _observers = null;
                    }
                },
                dispose: function () { this.end(); }
            });

            function ensureActive() {
                if (_state != ContextState.Active) {
                    throw new Error("The context has already ended.");
                }
            }

            function makeNotifier() {
                return new ContextObserver(_observers ? _observers.copy() : null);
            }
        }
    });

    /**
     * Mixin to provide the minimal functionality to support contextual based operations.<br/>
     * This is an alternatve to the delegate model of communication, but with less coupling 
     * and ceremony.
     * @class ContextualMixin
     * @private
     */
    var ContextualMixin = Object.freeze({
        /**
         * The context associated with the receiver.
         * @property {miruken.context.Context} context
         */        
        get context() { return this.__context; },
        set context(context) {
            if (this.__context === context) {
                return;
            }
            if (this.__context)
                this.__context.removeHandlers(this);
            if (context) {
                this.__context = context;
                context.addHandlers(this);
            } else {
                delete this.__context;
            }
        },
        /**
         * Determines if the receivers context is active.
         * @property {boolean} isActiveContext
         * @readOnly
         */        
        get isActiveContext() {
            return this.__context && (this.__context.state === ContextState.Active);
        },
        /**
         * Ends the receivers context.
         * @method endContext
         */                
        endContext: function () {
            if (this.__context) {
                this.__context.end();
            }
        }
    });

    /**
     * Metamacro to make classes contextual.<br/>
     * <pre>
     *    var Controller = Base.extend($contextual, {
     *       action: function () {}
     *    })
     * </pre>
     * would give the Controller class contextual support.
     * @class $contextual
     * @constructor
     * @extends miruken.MetaMacro
     */    
    var $contextual = MetaMacro.extend({
        execute: function (step, metadata) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();
                clazz.implement(ContextualMixin);
            }
        }
    });

    /**
     * Mixin for {{#crossLink "miruken.context.Contextual"}}{{/crossLink}} helper support.
     * @class ContextualHelper
     * @extends Module
     */    
    var ContextualHelper = Module.extend({
        /**
         * Resolves the receivers context.
         * @method resolveContext
         * @returns {miruken.context.Context} receiver if a context or the receiver context. 
         */                
        resolveContext: function (contextual) {
            return $isNothing(contextual) || (contextual instanceof Context)
                 ? contextual
                 : contextual.context;
        },
        /**
         * Ensure the receiver is associated with a context.
         * @method requireContext
         * @throws {Error} an error if a context could not be resolved.
         */                        
        requireContext: function (contextual) {
            var context = ContextualHelper.resolveContext(contextual);
            if (!(context instanceof Context))
                throw new Error("The supplied object is not a Context or Contextual object.");
            return context;
        },
        /**
         * Clears and ends the receivers associated context.
         * @method clearContext
         */                                
        clearContext: function (contextual) {
            var context = contextual.context;
            if (context) {
                try {
                    context.end();
                }
                finally {
                    contextual.context = null;
                }
            }
        },
        /**
         * Attaches the context to the receiver.
         * @method bindContext
         * @param  {miruken.context.Context}  context  -  context
         * @param  {boolean}                  replace  -  true if replace existing context
         * @returns {miruken.context.Context} effective context.
         * @throws {Error} an error if the context could be attached.
         */                                        
        bindContext: function (contextual, context, replace) {
            if (contextual && (replace || !contextual.context)) {
                contextual.context = ContextualHelper.resolveContext(context);
            }
            return contextual;
        },
        /**
         * Attaches a child context of the receiver to the contextual child.
         * @method bindChildContext
         * @param  {miruken.context.Context}  child    -  contextual child
         * @param  {boolean}                  replace  -  true if replace existing context
         * @returns {miruken.context.Context} effective child context.
         * @throws {Error} an error if the child context could be attached.
         */                                                
        bindChildContext: function (contextual, child, replace) {
            var childContext;
            if (child) {
                if (!replace) {
                    childContext = child.context;
                    if (childContext && childContext.state === ContextState.Active) {
                        return childContext;
                    }
                }
                var context = ContextualHelper.requireContext(contextual);
                while (context && context.state !== ContextState.Active) {
                    context = context.parent;
                }
                if (context) {
                    childContext = context.newChild();
                    ContextualHelper.bindContext(child, childContext, true);
                }
            }
            return childContext;
        }
    });

    Context.implement({
        /**
         * Observes 'contextEnding' notification.
         * @method onEnding
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'contextEnding' notification.
         * @for miruken.context.Context
         */
        onEnding: function (observer) {
            return this.observe({contextEnding: observer});
        },
        /**
         * Observes 'contextEnded' notification.
         * @method onEnded
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'contextEnded' notification.
         * @for miruken.context.Context
         * @chainable
         */        
        onEnded: function (observer) {
            return this.observe({contextEnded: observer});
        },
        /**
         * Observes 'childContextEnding' notification.
         * @method onChildEnding
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'childContextEnding' notification.
         * @for miruken.context.Context
         * @chainable
         */                
        onChildEnding: function (observer) {
            return this.observe({childContextEnding: observer});
        },
        /**
         * Observes 'childContextEnded' notification.
         * @method onChildEnded
         * @param   {Function}  observer  -  receives notification
         * @returns {Function}  unsubscribes from 'childContextEnded' notification.
         * @for miruken.context.Context
         * @chainable
         */                        
        onChildEnded: function (observer) {
            return this.observe({childContextEnded: observer});            
        }        
    });
    
   /**
     * Context traversal
     */
    var axisControl = {
        /**
         * Changes the default traversal axis.
         * @method axis
         * @param   {miruken.graph.TraversingAxis}  axis  -  axis
         * @returns {miruken.context.Context} callback handler axis.
         * @for miruken.context.Context
         */
        axis: function (axis) {
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    if (!(callback instanceof Composition)) {
                        this.__axis = axis;                        
                    }
                    return this.base(callback, greedy, composer);
                },
                equals: function (other) {
                    return (this === other) || ($decorated(this) === $decorated(other));
                }
            });
        }},
        applyAxis = axisControl.axis;

    Array2.forEach(TraversingAxis.names, function (name) {
        var key = '$' + name.charAt(0).toLowerCase() + name.slice(1);
        axisControl[key] = Function2.partial(applyAxis, TraversingAxis[name]);
    });

    CallbackHandler.implement({
        /**
         * Establishes publish invocation semantics.
         * @method $publish
         * @returns {miruken.callback.CallbackHandler} publish semantics.
         * @for miruken.callback.CallbackHandler
         */
        $publish: function () {
            var composer = this;
            var context = ContextualHelper.resolveContext(composer);
            if (context) {
                composer = context.$descendantOrSelf();
            }
            return composer.$notify();
        },
        $publishFromRoot: function () {
            var composer = this;
            var context = ContextualHelper.resolveContext(composer);
            if (context) {
                composer = context.root.$descendantOrSelf();
            }
            return composer.$notify();
        }
    });
    
    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Self:property"}}{{/crossLink}}.
     * @method $self
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Root:property"}}{{/crossLink}}.
     * @method $root
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Child:property"}}{{/crossLink}}.
     * @method $child
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Sibling:property"}}{{/crossLink}}.
     * @method $sibling
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Ancestor:property"}}{{/crossLink}}.
     * @method $ancestor
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/Descendant:property"}}{{/crossLink}}.
     * @method $descendant
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantReverse:property"}}{{/crossLink}}.
     * @method $descendantReverse
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */        

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/ChildOrSelf:property"}}{{/crossLink}}.
     * @method $childOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/SiblingOrSelf:property"}}{{/crossLink}}.
     * @method $siblingOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/AncestorOrSelf:property"}}{{/crossLink}}.
     * @method $ancestorOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */        

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantOrSelf:property"}}{{/crossLink}}.
     * @method $descendantOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/DescendantOrSelfReverse:property"}}{{/crossLink}}.
     * @method $descendantOrSelfReverse
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    /**
     * Sets the default traversal axis to
     * {{#crossLink "miruken.graph.TraversingAxis/AncestorSiblingOrSelf:property"}}{{/crossLink}}.
     * @method $ancestorSiblingOrSelf
     * @returns {miruken.context.Context} default traversal axis.
     * @for miruken.context.Context
     */

    Context.implement(axisControl);

    /**
     * Enhances Functions to create instances in a context.
     * @method newInContext
     * @for Function
     */
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

    /**
     * Enhances Functions to create instances in a child context.
     * @method newInChildContext
     * @for Function
     */
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
        module.exports = exports = this.package;
    }

    eval(this.exports);

}
