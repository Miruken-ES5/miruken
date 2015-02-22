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
        exports: "CallbackHandler,CallbackHandlerDecorator,CallbackHandlerFilter,CallbackHandlerAspect,CascadeCallbackHandler,CompositeCallbackHandler,ConditionalCallbackHandler,AcceptingCallbackHandler,ProvidingCallbackHandler,MethodCallbackHandler,InvocationOptions,Resolution,HandleMethod,Expandable,getEffectivePromise,$handle,$expand,$define,$provide,$lookup,$NOT_HANDLED"
    });

    eval(this.imports);

    var _definitions = {},
        $handle      = $define('$handle',  Variance.Contravariant),
        $provide     = $define('$provide', Variance.Covariant),
        $lookup      = $define('$lookup' , Variance.Invariant),
        $NOT_HANDLED = {};

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
     * @class {Lookup}
     */
    var Lookup = Base.extend({
            constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _results = [];
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
                getResults: function () { return _results; },
                addResult: function (result) { _results.push(result); }
            });
        }
    });

    /**
     * @class {Deferred}
     */
    var Deferred = Base.extend({
        constructor: function (callback, many) {
            if ($isNothing(callback)) {
                throw new TypeError("The callback is required.");
            }
            many = !!many;
            var _pending = [];
            this.extend({
                isMany: function () { return many; },
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
     * @class {Resolution}
     */
    var Resolution = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [];
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
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
            return !$isNothing(callback) &&
                   !!this.handleCallback(callback, !!greedy, composer || this);
        },
        handleCallback: function (callback, greedy, composer) {
            return $handle.dispatch(this, callback, null, composer, greedy);
        },
        $handle:[
            Lookup, function (lookup, composer) {
                return $lookup.dispatch(this, lookup,lookup.getKey(), composer, 
                                        lookup.isMany(), lookup.addResult);
            },
            Deferred, function (deferred, composer) {
                return $handle.dispatch(this, deferred.getCallback(), null, composer,
                                        deferred.isMany(), deferred.track);
            },
            Resolution, function (resolution, composer) {
                var key      = resolution.getKey(),
                    many     = resolution.isMany(),
                    resolved = $provide.dispatch(this, resolution, key, composer,
                                                 many, resolution.resolve);
                if (!resolved) {
                    // check if delegate or handler implicitly satisfy key
                    var implied  = new _Node(key),
                        delegate = this.getDelegate();
                    if (delegate && implied.match($classOf(delegate), Variance.Contravariant)) {
                        resolution.resolve(delegate);
                        resolved = true;
                    }
                    if ((!resolved || many) && implied.match($classOf(this), Variance.Contravariant)) {
                        resolution.resolve(this);
                        resolved = true;
                    }
                }
                return resolved;
            },
            HandleMethod, function (method, composer) {
                return method.invokeOn(this.getDelegate(), composer)
                    || method.invokeOn(this, composer);
            }
        ],
        toDelegate: function () { return new InvocationDelegate(this); }
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
                throw new TypeError(lang.format(
                    "Invalid condition: %1 is not a function.", condition));
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
     * @class {InvocationDelegate}
     */
    var InvocationDelegate = Delegate.extend({
        constructor: function (handler) {
            this.extend({
                delegate: function (protocol, methodName, args, strict) {
                    var semantics  = new InvocationSemantics();
                    handler.handle(semantics, true);
                    var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
                        bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
                        strict       = !!(strict | semantics.getOption(InvocationOptions.Strict)),
                        handleMethod = new HandleMethod(protocol, methodName, args, strict);
                    if (handler.handle(handleMethod, !!broadcast) === false && !bestEffort) {
                        throw new TypeError(lang.format(
                            "Object %1 has no method '%2'", handler, methodName));
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
                var deferred = new Deferred(callback, true);
            return this.handle(deferred, true, global.$composer)
                 ? Q.all(deferred.getPending()).thenResolve(true)
                 : Q(false);
        },
        resolve: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key);
            if (this.handle(resolution, false, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return resolutions[0];
                }
            }
        },
        resolveAll: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key, true);
            if (this.handle(resolution, true, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return Q.all(resolutions).then(Array2.flatten);
                }
            }
        },
        lookup: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key);
            if (this.handle(lookup, false, global.$composer)) {
                var results = lookup.getResults();
                if (results.length > 0) {
                    return results[0];
                }
            }
        },
        lookupAll: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key, true);
            if (this.handle(lookup, true, global.$composer)) {
                var results = lookup.getResults();
                if (results.length > 0) {
                    return Q.all(results).then(Array2.flatten);
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
            var when      = new _Node(constraint),
                condition = function (callback) {
                if (callback instanceof Deferred) {
                    return when.match($classOf(callback.getCallback()), Variance.Contravariant);
                } else if (callback instanceof Resolution) {
                    return when.match(callback.getKey(), Variance.Covariant);
                } else {
                    return when.match($classOf(callback), Variance.Contravariant);
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
        if ($isNothing(owner)) {
            throw new TypeError("Definitions must have an owner.");
        }
        for (tag in _definitions) {
            var list = null;
            if (owner.prototype && owner.prototype.hasOwnProperty(tag)) {
                list = owner.prototype[tag];
                delete owner.prototype[tag];
            } else if (owner.hasOwnProperty(tag)) {
                list = owner[tag];
                delete owner[tag];
            }
            if (list && list.length > 0) {
                var define = _definitions[tag];
                for (var idx = 0; idx < list.length; ++idx) {
                    var constraint = list[idx];
                    if (++idx >= list.length) {
                        throw new Error(lang.format(
                            "Incomplete '%1' definition: missing handler for constraint %2.",
                            tag, constraint));
                    }
                    define(owner, constraint, list[idx]);
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

        var handled, comparer;
        variance = variance || Variance.Contravariant;
        switch (variance) {
            case Variance.Covariant:
                handled  = _resultRequired;
                comparer = _covariantComparer; 
                break;
            case Variance.Contravariant:
                handled  = _successImplied;
                comparer = _contravariantComparer; 
                break;
            case Variance.Invariant:
                handled  = _resultRequired;
                comparer = _invariantComparer; 
                break;
            default:
                throw new Error("Variance must be Covariant, Contravariant or Invariant");
        }

        function definition(owner, constraint, handler, removed) {
            if (constraint instanceof Array) {
                return Array2.reduce(constraint, function (result, c) {
                    var undefine = _definition(owner, c, handler, removed);
                    return function (notifyRemoved) {
                        result(notifyRemoved);
                        undefine(notifyRemoved);
                    };
                }, Undefined);
            } else {
                return _definition(owner, constraint, handler, removed);
            }
        }
        function _definition(owner, constraint, handler, removed) {
            if ($isNothing(owner)) {
                throw new TypeError("Definitions must have an owner.");
            } else if ($isNothing(handler)) {
                handler    = constraint;
                constraint = $classOf(Modifier.unwrap(constraint));
            }
            if ($isNothing(handler)) {
                throw new TypeError(lang.format(
                    "Incomplete '%1' definition: missing handler for constraint %2.",
                    tag, constraint));
            } else if (removed && !$isFunction(removed)) {
                throw new TypeError("The removed argument is not a function.");
            }
            if (!$isFunction(handler)) {
                if ($copy.test(handler)) {
                    var source = Modifier.unwrap(handler);
                    if (!$isFunction(source.copy)) {
                        throw new Error("$copy requires the target to have a copy method.");
                    }
                    handler = source.copy.bind(source);
                } else {
                    var source = $use.test(handler) ? Modifier.unwrap(handler) : handler;
                    handler    = $lift(source);
                }
            }
            var definitions = owner.$miruken || (owner.$miruken = {}),
                node        = new _Node(constraint, handler, removed),
                index       = _createIndex(node.constraint),
                list        = definitions.hasOwnProperty(tag) ? definitions[tag]
                            : definitions[tag] = new IndexedList(comparer);
            list.insert(node, index);
            return function (notifyRemoved) {
                list.remove(node);
                if (list.isEmpty()) {
                    delete definitions[tag];
                }
                if (node.removed && (notifyRemoved !== false)) {
                    node.removed(owner);
                }
            };
        };
        definition.removeAll = function (owner) {
            var definitions = owner.$miruken;
            if (definitions) {
                var list = definitions[tag],
                    head = list.head;
                while (head) {
                    if (head.removed) {
                        head.removed(owner);
                    }
                    head = head.next;
                }
                delete definitions[tag];
            }
        };
        definition.dispatch = function (handler, callback, constraint, composer, all, results) {
            var v        = variance,
                delegate = handler.getDelegate();
            constraint = constraint || callback;
            if (constraint) {
                if ($eq.test(constraint)) {
                    v = Variance.Invariant;
                }
                constraint = Modifier.unwrap(constraint);
                if (typeOf(constraint) === 'object') {
                    constraint = $classOf(constraint);
                }
            }
            var ok = _dispatch(delegate, delegate, callback, constraint, v, composer, all, results);
            if (!ok || all) {
                ok = ok || _dispatch(handler, handler, callback, constraint, v, composer, all, results);
            }
            return ok;
        };
        function _dispatch(target, owner, callback, constraint, v, composer, all, results) {
            var dispatched = false;
            while (owner && (owner !== Base) && (owner !== Object)) {
                var definitions = owner.$miruken,
                    index       = _createIndex(constraint),
                    list        = definitions && definitions[tag],
                    invariant   = (v === Variance.Invariant);
                owner = (owner === target) ? $classOf(owner) : $ancestorOf(owner);
                if (list && (!invariant || index)) {
                    var node = list.getIndex(index) || list.head;
                    while (node) {
                        if (node.match(constraint, v)) {
                            var base       = target.base,
                                baseCalled = false;
                            target.base    = function () {
                                var baseResult;
                                baseCalled = true;
                                _dispatch(target, owner, callback, constraint, v, composer, false,
                                          function (result) { baseResult = result; });
                                return baseResult;
                            };
                            try {
                                var result = node.handler.call(target, callback, composer);
                                if (handled(result)) {
                                    if (results) {
                                        results.call(callback, result);
                                    }
                                    if (!all) {
                                        return true;
                                    }
                                    dispatched = true;
                                } else if (baseCalled) {
                                    if (!all) {
                                        return false;
                                    }
                                }
                            } finally {
                                target.base = base;
                            }
                        } else if (invariant) {
                            break;  // stop matching if invariant not satisifed
                        }
                        node = node.next;
                    }
                }
            }
            return dispatched;
        }
        _definitions[tag] = definition;
        return definition;
    }

    /**
     * @class {_Node}
     */
    function _Node(constraint, handler, removed) {
        var invariant   = $eq.test(constraint);
        constraint      = Modifier.unwrap(constraint);
        this.constraint = constraint;
        this.handler    = handler;
        if ($isNothing(constraint)) {
            this.match = invariant ? False : _matchEverything;
        } else if ($isProtocol(constraint)) {
            this.match = invariant ? _matchInvariant : _matchProtocol;
        } else if ($isClass(constraint)) {
            this.match = invariant ? _matchInvariant : _matchClass;
        } else if ($isString(constraint)) {
            this.match = _matchString;
        } else if (instanceOf(constraint, RegExp)) {
            this.match = invariant ? False : _matchRegExp;
        } else if ($isFunction(constraint)) {
            this.match = constraint;
        } else {
            this.match = False;
        }
        if (removed) {
            this.removed = removed;
        }
    }

    function _createIndex(constraint) {
        if (constraint) {
            if ($isString(constraint)) {
                return constraint;
            } else if ($isFunction(constraint)) {
                return assignID(constraint);
            }
        }
    }

    function _matchInvariant(match) {
        return this.constraint === match;
    }

    function _matchEverything(match, variance) {
        return variance !== Variance.Invariant;
    }

    function _matchProtocol(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Covariant) {
            return constraint.conformsTo(match);
        } else if (variance === Variance.Contravariant) {
            return match.conformsTo && match.conformsTo(constraint);
        }
        return false;
    }

    function _matchClass(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Contravariant) {
            return match.prototype instanceof constraint;
        }
        else if (variance === Variance.Covariant) {
            return match.prototype &&
                (constraint.prototype instanceof match
                 || ($isProtocol(match) && match.adoptedBy(constraint)));
        }
        return false;
    }

    function _matchString(match) {
        return $isString(match) && this.constraint == match;
    }

    function _matchRegExp(match, variance) {
        return (variance !== Variance.Invariant) && this.constraint.test(match);
    }

    function _covariantComparer(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Covariant)) {
            return -1;
        }
        return 1;
    }
    
    function _contravariantComparer(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Contravariant)) {
            return -1;
        }
        return 1;
    }

    function _invariantComparer(node, insert) {
        return insert.match(node.constraint, Variance.Invariant) ? 0 : -1;
    }

    function _resultRequired(result) {
        return ((result !== null) && (result !== undefined) && (result !== $NOT_HANDLED));
    }

    function _successImplied(result) {
        return result ? (result !== $NOT_HANDLED) : (result === undefined);
    }

    function getEffectivePromise(object) {
        if (object instanceof HandleMethod) {
            object = object.getReturnValue();
        }
        return $isPromise(object) ? object : null;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = callback;
    }

    eval(this.exports);

}
