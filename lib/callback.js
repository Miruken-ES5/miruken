
var miruken = require('./miruken.js'),
    Q       = require('q');

new function () { // closure

    /**
     * @namespace miruken.callback
     */
    var callback = new base2.Package(this, {
        name:    "callback",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken",
        exports: "CallbackHandler,CallbackHandlerDecorator,CallbackHandlerFilter,CallbackHandlerAspect,CascadeCallbackHandler,CompositeCallbackHandler,ConditionalCallbackHandler,ObjectCallbackHandler,AcceptingCallbackHandler,ProvidingCallbackHandler,MethodCallbackHandler,InvocationOptions,CallbackResolution,HandleMethod,Expandable,$handle,$provide,$define,$expand,getEffectivePromise,$NOT_HANDLED"
    });

    eval(this.imports);

    var _definitions = {},
        $NOT_HANDLED = {};

    var $handle  = $define('$handlers'),
        $provide = $define('$providers', Variance.Covariant);

    /**
     * @class {Expandable}
     */
    var Expandable = Base.extend({}, {
        init: function () {
            var base    = this.extend;
            this.extend = function () {
                return $expand(base.apply(this, arguments));
            };
        }
    });

    /**
     * @class {HandleMethod}
     */
    var HandleMethod = Base.extend({
        constructor: function (protocol, methodName, args, strict) {
            if (protocol && !$isProtocol(protocol)) {
                throw new TypeError("Invalid protocol supplied.");
            }
            var _returnValue, _exception;
            this.extend({
                getProtocol:    function () { return protocol; },
                getMethodName:  function () { return methodName; },
                getArguments:   function () { return args; },
                getReturnValue: function () { return _returnValue; },
                setReturnValue: function (value) { _returnValue = value; },
                getException:   function () { return _exception; },
                invokeOn:       function (target, composer) {
                    if (!target || (strict && protocol && !protocol.adoptedBy(target))) {
                        return false;
                    }
                    var method = target[methodName];
                    if (!$isFunction(method)) {
                        return false;
                    }
                    try {
                        var oldComposer  = global.$composer;
                        global.$composer = composer;
                        var result = method.apply(target, args.slice(0));
                        if (result === $NOT_HANDLED) {
                            return false;
                        }
                        if (_returnValue === undefined) {
                            _returnValue = result;
                        }
                    } catch(exception) {
                        if (_returnValue === undefined && _exception === undefined) {
                            _exception = exception;
                        }
                        throw exception;
                    } finally {
                        if (oldComposer) {
                            global.$composer = oldComposer;
                        } else {
                            delete global.$composer;
                        }
                    }
                    return true;
                }
            });
        }
    });

    /**
     * @class {Deferred}
     */
    var Deferred = Base.extend({
        constructor: function (callback) {
            if ($isNothing(callback)) {
                throw new TypeError("The callback is required.");
            }
            var _pending = [];
            this.extend({
                getCallback: function () { return callback; },
                getPending: function () { return _pending; },
                track: function (result) {
                    if ($isPromise(result)) {
                        _pending.push(result);
                    }
                }
            });
        }
    });

    /**
     * @class {CallbackResolution}
     */
    var CallbackResolution = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [];
            this.extend({
                getKey: function () { return key; },
                getMany: function () { return many; },
                getResolutions: function () { return _resolutions; },
                resolve: function (resolution) { _resolutions.push(resolution); }
            });
        }
    });

    /**
     * @class {CallbackHandler}
     */
    var CallbackHandler = Expandable.extend({
        constructor: function (delegate) {
            this.extend({
                getDelegate : function () { return delegate; }
            });
        },
        getDelegate: function () { return null; },
        /**
         * Handles the callback.
         * @param   {Object}          callback    - any callback
         * @param   {Boolean}         greedy      - true of handle greedily
         * @param   {CallbackHandler} [composer]  - initiated the handle for composition
         * @returns {Boolean} true if the callback was handled, false otherwise.
         */
        handle: function (callback, greedy, composer) {
            if ($isNothing(callback)) {
                return false;
            }
            return !!this.handleCallback(callback, !!greedy, composer || this);
        },
        handleCallback: function (callback, greedy, composer) {
            return $handle.dispatch(this, callback, null, composer) !== $NOT_HANDLED;
        },
        toProxy: function () { return new InvocationProxy(this); },
        $handlers:[
            HandleMethod, function (method, composer) {
                return method.invokeOn(this.getDelegate(), composer)
                    || method.invokeOn(this, composer);
            },
            Deferred, function (deferred, composer) {
                var callback = deferred.getCallback(),
                    pending  = $handle.dispatch(this, callback, null, composer);
                if (pending != $NOT_HANDLED) {
                    deferred.track(pending);
                    return true;
                }
                return false;
            },
            CallbackResolution, function (resolution, composer) {
                var key    = resolution.getKey(),
                    result = $provide.dispatch(this, resolution, key, composer);
                if (result === $NOT_HANDLED) {  // check if delegate or handler implicitly satisfy key
                    var implied = _createNode(key),
                        delegate = this.getDelegate();
                    if (delegate && implied.match(delegate.constructor, Variance.Contravariant)) {
                        result = delegate;
                    } else if (implied.match(this.constructor, Variance.Contravariant)) {
                        result = this;
                    }
                }
                if (result !== $NOT_HANDLED) {
                    resolution.resolve(result);
                    return true;
                }
                return false;
            }]
    }, {
        coerce: function (object) { return new this(object); }
    });

    Base.implement({
        toCallbackHandler: function () { return CallbackHandler(this); }
    });

    /**
     * @class {CallbackHandlerDecorator}
     */
    var CallbackHandlerDecorator = CallbackHandler.extend({
        constructor: function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            this.extend({
                getDecoratee: function () { return decoratee; },
                setDecoratee: function (value) {
                    decoratee = value.toCallbackHandler();
                },
                handleCallback: function (callback, greedy, composer) {
                    return this.getDecoratee().handle(callback, greedy, composer)
                        || this.base(callback, greedy, composer);
                }
            });
            this.setDecoratee(decoratee);
        }
    });

    /**
     * @class {CallbackHandlerFilter}
     */
    var CallbackHandlerFilter = CallbackHandlerDecorator.extend({
        constructor: function (decoratee, filter) {
            this.base(decoratee);
            if ($isNothing(filter)) {
                throw new TypeError("No filter specified.");
            } else if (!$isFunction(filter)) {
                throw new TypeError(lang.format("Invalid filter: %1 is not a function.", filter));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    var decoratee = this.getDecoratee();
                    if (composer == this) {
                        composer = decoratee;
                    }
                    return filter(callback, composer, function () {
                        return decoratee.handle(callback, greedy);
                    })
                }});
        }
    });

    /**
     * @class {CallbackHandlerAspect}
     */
    var CallbackHandlerAspect = CallbackHandlerFilter.extend({
        constructor: function (decoratee, before, after) {
            this.base(decoratee, function (callback, composer, proceed) {
                var promise;
                if ($isFunction(before) && before(callback, composer) === false) {
                    return true;
                }
                try {
                    var handled = proceed();
                    if (handled && (promise = getEffectivePromise(callback))) {
                        // Use 'fulfilled' or 'rejected' handlers instead of 'finally' to ensure
                        // aspect boundary is consistent with synchronous invocations and avoid
                        // reentrancy issues.
                        if ($isFunction(after))
                            promise.then(function (result) {
                                after(callback, composer);
                            }, function (error) {
                                after(callback, composer);
                            });
                        return handled;
                    }
                } finally {
                    if (!promise && $isFunction(after)) {
                        after(callback, composer);
                    }
                }
            });
        }
    });

    /**
     * @class {CascadeCallbackHandler}
     */
    var CascadeCallbackHandler = CallbackHandler.extend({
        constructor: function (handler, cascadeToHandler) {
            if ($isNothing(handler)) {
                throw new TypeError("No handler specified.");
            } else if ($isNothing(cascadeToHandler)) {
                throw new TypeError("No cascadeToHandler specified.");
            }
            handler          = handler.toCallbackHandler();
            cascadeToHandler = cascadeToHandler.toCallbackHandler();
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    var handled = greedy
                        ? (handler.handle(callback, true, composer)
                           | cascadeToHandler.handle(callback, true, composer))
                        : (handler.handle(callback, false, composer)
                           || cascadeToHandler.handle(callback, false, composer));
                    if (!handled || greedy) {
                        handled = this.base(callback, greedy, composer) || handled;
                    }
                    return !!handled;
                }
            });
        }
    });

    /**
     * @class {CompositeCallbackHandler}
     */
    var CompositeCallbackHandler = CallbackHandler.extend({
        constructor: function () {
            var _handlers = new Array2;
            this.extend({
                getHandlers: function () { return _handlers.copy(); },
                addHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (handler) {
                            _handlers.push(handler.toCallbackHandler());
                        }
                    });
                    return this;
                },
                removeHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (!handler) {
                            return;
                        }
                        var count = _handlers.length;
                        for (var idx = 0; idx < count; ++idx) {
                            var testHandler = _handlers[idx];
                            if (testHandler == handler || testHandler.getDelegate() == handler) {
                                _handlers.removeAt(idx);
                                return;
                            }
                        }
                    });
                    return this;
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = false,
                        count   = _handlers.length;
                    for (var idx = 0; idx < count; ++idx) {
                        var handler = _handlers[idx];
                        if (handler.handle(callback, greedy, composer)) {
                            if (!greedy) {
                                return true;
                            }
                            handled = true;
                        }
                    }
                    if (!handled || greedy) {
                        handled = this.base(callback, greedy, composer) || handled;
                    }
                    return handled;
                }
            });
            this.addHandlers(arguments);
        }
    });

    /**
     * @class {ConditionalCallbackHandler}
     */
    var ConditionalCallbackHandler = CallbackHandlerDecorator.extend({
        constructor: function (decoratee, condition) {
            this.base(decoratee);
            if ($isNothing(condition)) {
                throw new TypeError("No condition specified.");
            } else if (!$isFunction(condition)) {
                throw new TypeError(lang.format("Invalid condition: %1 is not a function.", condition));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    return condition(callback)
                         ? this.base(callback, greedy, composer)
                         : false;
                }
            });
        }
    });

    /**
     * @class {ObjectCallbackHandler}
     */
    var ObjectCallbackHandler = CallbackHandler.extend({
        constructor: function (object, exactMatch) {
            if ($isNothing(object)) {
                throw new TypeError("No object provided.");
            }
            $provide(this, object);
        }
    });

    /**
     * @class {AcceptingCallbackHandler}
     */
    var AcceptingCallbackHandler = CallbackHandler.extend({
        constructor: function (handler, constraint) {
            $handle(this, constraint, handler);
        }
    });

    if (Function.prototype.accepting === undefined)
        Function.prototype.accepting = function (constraint) {
            return new AcceptingCallbackHandler(this, constraint);
        };

    CallbackHandler.accepting = function (handler, constraint) {
        return new AcceptingCallbackHandler(handler, constraint);
    };

    /**
     * @class {ProvidingCallbackHandler}
     */
    var ProvidingCallbackHandler = CallbackHandler.extend({
        constructor: function (provider, constraint) {
            $provide(this, constraint, provider);
        }
    });

    if (Function.prototype.providing === undefined)
        Function.prototype.providing = function (constraint) {
            return new ProvidingCallbackHandler(this, constraint);
        };

    CallbackHandler.providing = function (provider, constraint) {
        return new ProvidingCallbackHandler(provider, constraint);
    };

    /**
     * @class {MethodCallbackHandler}
     */
    var MethodCallbackHandler = CallbackHandler.extend({
        constructor: function (methodName, method) {
            if (!$isString(methodName) || methodName.length === 0 || !methodName.trim()) {
                throw new TypeError("No methodName specified.");
            } else if (!$isFunction(method)) {
                throw new TypeError(lang.format("Invalid method: %1 is not a function.", method));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    if (callback instanceof HandleMethod) {
                        var target         = new Object;
                        target[methodName] = method;
                        return callback.invokeOn(target);
                    }
                    return false;
                }
            });
        }
    });

    if (Function.prototype.implementing === undefined)
        Function.prototype.implementing = function (methodName) {
            return new MethodCallbackHandler(methodName, this);
        };

    CallbackHandler.implementing = function (methodName, method) {
        return new MethodCallbackHandler(methodName, method);
    };

    /**
     * InvocationOptions enum
     * @enum {Number}
     */
    var InvocationOptions = {
        None:        0,
        Broadcast:   1 << 0,
        BestEffort:  1 << 1,
        Strict:      1 << 2
    };
    InvocationOptions.Notify = InvocationOptions.Broadcast | InvocationOptions.BestEffort;

    /**
     * @class {InvocationSemantics}
     */
    var InvocationSemantics = Base.extend({
        constructor: function (options) {
            var _options   = options || InvocationOptions.None,
                _specified = _options;
            this.extend({
                getOption: function (option) {
                    return (_options & option) === option;
                },
                setOption: function (option, enabled) {
                    if (enabled) {
                        _options = _options | option;
                    } else {
                        _options = _options & (~option);
                    }
                    _specified = _specified | option;
                },
                isSpecified: function (option) {
                    return (_specified & option) === option;
                },
                mergeInto: function (constraints) {
                    for (var index = 0; index <= 2; ++index) {
                        var option = (1 << index);
                        if (this.isSpecified(option) && !constraints.isSpecified(option)) {
                            constraints.setOption(option, this.getOption(option));
                        }
                    }
                }
            });
        }
    });

    /**
     * @class {InvocationOptionsHandler}
     */
    var InvocationOptionsHandler = CallbackHandler.extend({
        constructor: function (handler, options) {
            var semantics = new InvocationSemantics(options);
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    if (callback instanceof InvocationSemantics) {
                        semantics.mergeInto(callback);
                        return true;
                    }
                    return handler.handle(callback, greedy, composer);
                }
            });
        }
    });

    /**
     * @class {InvocationProxy}
     */
    var InvocationProxy = Proxy.extend({
        constructor: function (handler) {
            this.extend({
                proxyMethod: function (protocol, methodName, args, strict) {
                    var semantics  = new InvocationSemantics();
                    handler.handle(semantics, true);
                    var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
                        bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
                        strict       = !!(strict | semantics.getOption(InvocationOptions.Strict)),
                        handleMethod = new HandleMethod(protocol, methodName, args, strict);
                    if (handler.handle(handleMethod, !!broadcast) === false && !bestEffort) {
                        throw new TypeError(lang.format("Object %1 has no method '%2'", handler, methodName));
                    }
                    return handleMethod.getReturnValue();
                }
            });
        }
    });

    CallbackHandler.implement({
        strict: function () { return this.callOptions(InvocationOptions.Strict); },
        broadcast: function () { return this.callOptions(InvocationOptions.Broadcast); },
        bestEffort: function () { return this.callOptions(InvocationOptions.BestEffort); },
        notify: function () { return this.callOptions(InvocationOptions.Notify); },
        callOptions: function (options) { return new InvocationOptionsHandler(this, options); }
    });

    CallbackHandler.implement({
        defer: function (callback) {
            var deferred = new Deferred(callback);
            return this.handle(deferred, false, global.$composer)
                 ? Q.all(deferred.getPending()).thenResolve(true)
                 : Q(false);
        },
        deferAll: function (callback) {
            var deferred = new Deferred(callback);
            return this.handle(deferred, true, global.$composer)
                 ? Q.all(deferred.getPending()).thenResolve(true)
                 : Q(false);
        },
        resolve: function (key) {
            var resolution = (key instanceof CallbackResolution) ? key
                           : new CallbackResolution(key);
            if (this.handle(resolution, false, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return resolutions[0];
                }
            }
        },
        resolveAll: function (key) {
            var resolution = (key instanceof CallbackResolution) ? key
                           : new CallbackResolution(key, true);
            if (this.handle(resolution, true, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return Q.all(resolutions).then(Array2.flatten);
                }
            }
        },
        filter: function (filter) {
            return new CallbackHandlerFilter(this, filter);
        },
        aspect: function (before, after) {
            return new CallbackHandlerAspect(this, before, after);
        },
        when: function (constraint) {
            var when      = _createNode(constraint),
                matches   = when.match,
                condition = function (callback) {
                if (callback instanceof Deferred) {
                    return matches(callback.getCallback().constructor, Variance.Contravariant);
                } else if (callback instanceof CallbackResolution) {
                    return matches(callback.getKey(), Variance.Covariant);
                } else {
                    return when.match(callback.constructor, Variance.Contravariant);
                }
            };
            return new ConditionalCallbackHandler(this, condition);
        },
        next: function () {
            switch(arguments.length) {
            case 0:  return this;
            case 1:  return new CascadeCallbackHandler(this, arguments[0])
            default: return new CompositeCallbackHandler((Array2.unshift(arguments, this), arguments));
            }
        }
    });

    /**
     * @function $expand
     * Expands the registered definitions in owner
     * @param    {Object} owner  - source of definitions
     */
    function $expand(owner) {
        if (!$isClass(owner) && (typeOf(owner) !== 'object')) {
            throw new TypeError("Definitions can only be applied to classes or instances.");
        }
        for (tag in _definitions) {
            var constraints = null;
            if (owner.prototype && owner.prototype.hasOwnProperty(tag)) {
                constraints = owner.prototype[tag];
                delete owner.prototype[tag];
            } else if (owner.hasOwnProperty(tag)) {
                constraints = owner[tag];
                delete owner[tag];
            }
            if (constraints && constraints.length > 0) {
                var define = _definitions[tag];
                for (var idx = 0; idx < constraints.length; ++idx) {
                    var constraint = constraints[idx];
                    if (++idx >= constraints.length) {
                        throw new Error(lang.format(
                            "Incomplete '%1' definition: missing handler for constraint %2.",
                            tag, constraint));
                    }
                    define(owner, constraint, constraints[idx]);
                }
            }
        }
        return owner;
    }

    /**
     * @function $define
     * Defines a new handler relationship.
     * @param    {String}   tag       - name of definition
     * @param    {Variance} variance  - variance of definition
     * @returns  {Function} function to add to definition.
     */
    function $define(tag, variance) {
        if (!$isString(tag) || tag.length === 0 || /\s/.test(tag)) {
            throw new TypeError("The tag must be a non-empty string with no whitespace.");
        } else if (_definitions[tag]) {
            throw new TypeError(lang.format("'%1' is already defined.", tag));
        }

        var handled;
        variance = variance || Variance.Contravariant;
        switch (variance) {
            case Variance.Covariant:
                handled = _requiresResult;
                break;
            case Variance.Contravariant:
            case Variance.Invariant:
                handled = _impliesResult;
                break;
            default:
                throw new Error("Variance must be Covariant, Contravariant or Invariant");
        }

        function definition(owner, constraint, handler, removed) {
            if ($isNothing(handler)) {
                if ((variance === Variance.Covariant) && (typeOf(constraint) === 'object')) {
                    handler    = constraint;
                    constraint = Modifier.unwrap(constraint).constructor;
                } else {
                    throw new TypeError(lang.format(
                        "No handler specified for constraint %1.", constraint));
                }
            }
        if (removed && !$isFunction(removed)) {
                throw new TypeError("The removed argument is not a function.");
        }
            if (!$isFunction(handler)) {
                if (handler && (variance === Variance.Covariant)) {
                    // Allow copy semantics for convariant handlers
                    if ($copy.test(handler)) {
                        var source = Modifier.unwrap(handler);
                        if (!$isFunction(source.copy)) {
                            throw new Error("$copy requires the target to have a copy method.");
                        }
                        handler = function () { return source.copy(); };
                    } else {
                        var source = $use.test(handler) ? Modifier.unwrap(handler) : handler;
                        handler    =  $lift(source);
                    }
                } else {
                    throw new TypeError(lang.format(
                        "Invalid handler for constraint %1: %2 is not a function.",
                        constraint, handler));
                }
            }
            var definitions = owner.$miruken || (owner.$miruken = {}),
                node        = _createNode(constraint, handler, removed),
                index       = _createIndex(constraint);
            if (!definitions.hasOwnProperty(tag)) {
                var nodes = { $head:node, $tail:node, index: {} };
                if (index) {
                    nodes.index[index] = node;
                }
                definitions[tag] = nodes;
            } else {
                // Maintain partial ordering using variance
                // e.g. More derived handlers come first  (Contravariance)
                //      Less derived providers come first (Covariance)
                var nodes = definitions[tag], insert;
                if (node.constraint) {
                    var indexedNode = index && nodes.index[index];
                    insert = indexedNode || nodes.$head;
                    while (insert &&
                           (insert.match(node.constraint, Variance.Invariant) ||
                            !insert.match(node.constraint, variance))) {
                        insert = insert.next;
                    }
                    if (index && !indexedNode) {
                        nodes.index[index] = node;
                    }
                }
                if (insert === nodes.$head) {
                    var head    = nodes.$head;
                    node.next   = head;
                    nodes.$head = head.prev = node;
                } else if (!insert) {
                    var tail    = node.prev = nodes.$tail;
                    nodes.$tail = tail.next = node;
                } else {
                    var prev    = insert.prev;
                    node.next   = insert;
                    node.prev   = prev;
                    insert.prev = prev.next = node;
                }
            }
            return function (notifyRemoved) {
                var prev = node.prev,
                    next = node.next;
                if (prev) {
                    if (next) {
                        prev.next = next;
                        next.prev = prev;
                    } else {
                        nodes.$tail = prev;
                        delete prev.next;
                    }
                } else if (next) {
                    nodes.$head = next;
                    delete next.prev;
                } else {
                    delete definitions[tag];
                }
                if (index && (nodes.index[index] === node)) {
                    if (next && next.match(node.constraint, Variance.Invariant)) {
                        nodes.index[index] = next;
                    } else {
                        delete nodes.index[index];
                    }
                }
                if (node.removed && (notifyRemoved !== false)) {
                    node.removed(owner);
                }
            };
        };
        definition.removeAll = function (owner) {
            var definitions = owner.$miruken;
            if (definitions) {
                var nodes = definitions[tag],
                    head  = nodes.$head;
                while (head) {
                    if (head.removed) {
                        head.removed(owner);
                    }
                    head = head.next;
                }
                delete definitions[tag];
            }
        };
        definition.dispatch = function (handler, callback, constraint, composer) {
            var varianceMatch = variance,
                delegate      = handler.getDelegate();
            if (constraint) {
                if ($eq.test(constraint)) {
                    varianceMatch = Variance.Invariant;
                }
                constraint = Modifier.unwrap(constraint);
            } else {
                if ($eq.test(callback)) {
                    varianceMatch = Variance.Invariant;
                }
                callback   = Modifier.unwrap(callback);
                constraint = callback.constructor;
            }
            var result = _dispatch(delegate, delegate, callback, constraint, varianceMatch, composer);
            if (result === $NOT_HANDLED) {
                result = _dispatch(handler, handler, callback, constraint, varianceMatch, composer);
            }
            return result;
        };
        function _dispatch(target, owner, callback, constraint, varianceMatch, composer) {
            while (owner && (owner !== Base) && (owner !== Object)) {
                var definitions = owner.$miruken,
                    index       = _createIndex(constraint),
                    nodes       = definitions && definitions[tag],
                    invariant   = (varianceMatch === Variance.Invariant);
                owner = (owner === target) ? owner.constructor : owner.ancestor;
                if (nodes && (!invariant || index)) {
                    var indexedNode = index && nodes.index[index],
                        node        = indexedNode || nodes.$head;
                    while (node) {
                        if (node.match(constraint, varianceMatch)) {
                            var base       = target.base,
                                baseCalled = false;
                            target.base    = function () {
                                baseCalled = true;
                                return _dispatch(target, owner, callback, constraint, varianceMatch, composer);
                            };
                            try {
                                var result = node.handler.call(target, callback, composer);
                                if (handled(result)) {
                                    return result;
                                } else if (baseCalled) {
                                    return $NOT_HANDLED;
                                }
                            } finally {
                                target.base = base;
                            }
                        } else if (invariant) {
                            break;  // stop matching if Invariant not satisifed
                        }
                        node = node.next;
                    }
                }
            }
            return $NOT_HANDLED;
        }
        _definitions[tag] = definition;
        return definition;
    }

    function _impliesResult(result) {
        return result ? (result !== $NOT_HANDLED) : (result === undefined);
    }

    function _requiresResult(result) {
        return ((result !== null) && (result !== undefined) && (result !== $NOT_HANDLED));
    }

    function _everything(match, variance) {
        return (variance !== Variance.Invariant);
    }

    function _createNode(constraint, handler, removed) {
        var varianceOverride;
        if ($eq.test(constraint)) {
            varianceOverride = Variance.Invariant;
        }
        constraint = Modifier.unwrap(constraint);
        var node = { constraint: constraint, handler: handler };
        if (removed) {
            node.removed = removed;
        }
        if ($isNothing(constraint)) {
            node.match = _everything;
        } else if ($isProtocol(constraint)) {
            node.match = function (match, variance) {
                if (!$isFunction(match.conformsTo)) {
                    return false;
                }
                switch (varianceOverride || variance || Variance.Invariant) {
                case Variance.Covariant:      // out
                    return constraint.conformsTo(match);
                case Variance.Contravariant:  // in
                    return match.conformsTo(constraint);
                case Variance.Invariant:      // exact
                    return (match === constraint);
                }
            };
        } else if (constraint.ancestorOf === Base.ancestorOf) {
            node.match = function (match, variance) {
                if (match.ancestorOf !== Base.ancestorOf) {
                    return false;
                }
                switch (varianceOverride || variance || Variance.Invariant) {
                case Variance.Covariant:      // out
                    return (match === constraint) || match.ancestorOf(constraint)
                        || constraint.conformsTo(match);
                case Variance.Contravariant:  // in
                    return (match === constraint) || constraint.ancestorOf(match)
                        ||  match.conformsTo(constraint);
                case Variance.Invariant:      // exact
                    return (match === constraint);
                }
            };
        } else if ($isString(constraint)) {
            node.match = function (match, variance) {
                return match == constraint;
            };
        } else if (instanceOf(constraint, RegExp)) {
            node.match = function (match, variance) {
                return constraint.test(match);
            };
        } else if ($isFunction(constraint)) {
            node.match = constraint;
        } else {
            throw new TypeError(lang.format("Unsupported constraint %1.", constraint));
        }
        return node;
    }

    function _createIndex(constraint) {
        if (constraint) {
            if ($isString(constraint)) {
                return constraint;
            }
            if (constraint.ancestorOf === Base.ancestorOf) {
                return assignID(constraint);
            }
        }
    }

    function getEffectivePromise(object) {
        if (object instanceof HandleMethod) {
            object = object.getReturnValue();
        }
        return $isPromise(object) ? object : null;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = callback;
    } else if (typeof define === "function" && define.amd) {
	define("miruken.callback", [], function() {
	    return callback;
	});
    }

    eval(this.exports);

}
