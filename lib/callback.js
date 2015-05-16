var miruken = require('./miruken.js'),
    Promise = require('bluebird');

new function () { // closure

    /**
     * Definition goes here
     * @module miruken
     * @submodule callback
     * @namespace miruken.callback
     */
    var callback = new base2.Package(this, {
        name:    "callback",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken",
        exports: "CallbackHandler,CallbackHandlerDecorator,CallbackHandlerFilter,CallbackHandlerAspect,CascadeCallbackHandler,CompositeCallbackHandler,ConditionalCallbackHandler,AcceptingCallbackHandler,ProvidingCallbackHandler,MethodCallbackHandler,InvocationOptions,Resolution,HandleMethod,RejectedError,getEffectivePromise,$handle,$callbacks,$define,$provide,$lookup,$NOT_HANDLED"
    });

    eval(this.imports);

    var _definitions = {},
        $handle      = $define('$handle',  Variance.Contravariant),
        $provide     = $define('$provide', Variance.Covariant),
        $lookup      = $define('$lookup' , Variance.Invariant),
        $NOT_HANDLED = {};

    /**
     * Metamacro to register callback definitions.
     * @class $callbacks
     */
    var $callbacks = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            if ($isNothing(definition)) {
                return;
            }
            var source = target,
                clazz  = metadata.getClass();
            if (target === clazz.prototype) {
                target = clazz;
            }
            for (tag in _definitions) {
                var list = null;
                if (definition.hasOwnProperty(tag)) {
                    list = definition[tag];
                    delete definition[tag];
                    delete source[tag];
                }
                if ($isFunction(list)) {
                    list = list();
                }
                if (!list || list.length == 0) {
                    continue;
                }
                var define = _definitions[tag];
                for (var idx = 0; idx < list.length; ++idx) {
                    var constraint = list[idx];
                    if (++idx >= list.length) {
                        throw new Error(format(
                            "Incomplete '%1' definition: missing handler for constraint %2.",
                            tag, constraint));
                        }
                    define(target, constraint, list[idx]);
                }
            }
        },
        shouldInherit: True,
        isActive: True
    });

    /**
     * Definition goes here
     * @class HandleMethod
     * @constructor
     * @extends Base
     */
    var HandleMethod = Base.extend({
        constructor: function (type, protocol, methodName, args, strict) {
            if (protocol && !$isProtocol(protocol)) {
                throw new TypeError("Invalid protocol supplied.");
            }
            var _returnValue, _exception;
            this.extend({
                getType:        function () { return type; },
                getProtocol:    function () { return protocol; },
                getMethodName:  function () { return methodName; },
                getArguments:   function () { return args; },
                getReturnValue: function () { return _returnValue; },
                setReturnValue: function (value) { _returnValue = value; },
                getException:   function () { return _exception; },
                setException:   function (exception) { _exception = exception; },
                invokeOn:       function (target, composer) {
                    if (!target || (strict && protocol && !protocol.adoptedBy(target))) {
                        return false;
                    }
                    var method, result;
                    if (type === HandleMethod.Invoke) {
                        method = target[methodName];
                        if (!$isFunction(method)) {
                            return false;
                        }                    
                    }
                    try {
                        var oldComposer = global.$composer;
                        global.$composer = composer;
                        switch (type) {
                            case HandleMethod.Get:
                                result = target[methodName];
                                break;
                            case HandleMethod.Set:
                                result = target[methodName] = args;
                                break;
                            case HandleMethod.Invoke:
                                result = method.apply(target, args);
                                break;
                        }
                        if (result === $NOT_HANDLED) {
                            return false;
                        }
                        _returnValue = result;
                    } catch (exception) {
                        _exception = exception;
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
    }, {
        Get:    1,  // Getter
        Set:    2,  // Setter
        Invoke: 3   // Method
    });

    /**
     * Definition goes here
     * @class Lookup
     * @constructor
     * @extends Base
     */
    var Lookup = Base.extend(
        $inferProperties, {
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _results = [],
                _instant = $instant.test(key);
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
                getResults: function () { return _results; },
                addResult: function (result) {
                    if (!(_instant && $isPromise(result))) {
                        _results.push(result);
                    }
                }
            });
        }
    });

    /**
     * Definition goes here
     * @class Deferred
     * @constructor
     * @extends Base
     */
    var Deferred = Base.extend(
        $inferProperties, {
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
     * Definition goes here
     * @class Resolution
     * @constructor
     * @extends Base
     */
    var Resolution = Base.extend(
        $inferProperties, {
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [],
                _instant     = $instant.test(key);
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
                getResolutions: function () { return _resolutions; },
                resolve: function (resolution) {
                    if (!(_instant && $isPromise(resolution))) {
                        _resolutions.push(resolution);
                    }
                }
            });
        }
    });

    /**
     * Definition goes here
     * @class Reentrant
     * @constructor
     * @extends Base
     */
    var Reentrant = Base.extend({
        constructor: function (callback) {
            this.extend({
                getCallback: function () { return callback; },
            });
        }
    });

    /**
     * Definition goes here
     * @class CallbackHandler
     * @constructor
     * @extends Base
     */
    var CallbackHandler = Base.extend(
        $callbacks, {
        constructor: function _(delegate) {
            var spec = _.spec || (_.spec = {});
            spec.value = delegate;
            Object.defineProperty(this, 'delegate', spec);
            delete spec.value;
        },
        /**
         * Handles the callback.
         * @method handle
         * @param   {Object}          callback    - any callback
         * @param   {boolean}         greedy      - true of handle greedily
         * @param   {CallbackHandler} [composer]  - initiated the handle for composition
         * @returns {boolean} true if the callback was handled, false otherwise.
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
                    resolved = $provide.dispatch(this, resolution, key, composer, many, resolution.resolve);
                if (!resolved) { // check if delegate or handler implicitly satisfy key
                    var implied  = new _Node(key),
                        delegate = this.delegate;
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
                return method.invokeOn(this.delegate, composer) || method.invokeOn(this, composer);
            },
            Reentrant, function (reentrant, composer) {
                return $handle.dispatch(this, reentrant.getCallback(), null, composer);
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
     * Definition goes here
     * @class ReentrantDecorator
     * @constructor
     * @extends CallbackHandler
     */
    var ReentrantDecorator = CallbackHandler.extend({
        constructor: function _(handler) {
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    if (!(callback instanceof Reentrant)) {
                        callback = new Reentrant(callback);
                    }
                    return handler.handleCallback(callback, greedy, composer);
                }
            });                        
        }
    });

    /**
     * Definition goes here
     * @class CallbackHandlerDecorator
     * @constructor
     * @extends CallbackHandler
     */
    var CallbackHandlerDecorator = CallbackHandler.extend({
        constructor: function _(decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            Object.defineProperty(this, 'decoratee', {
                get: function () { return decoratee; },
                set: function (value) { decoratee = value.toCallbackHandler() }
            });
            this.decoratee = decoratee;
        },
        handleCallback: function (callback, greedy, composer) {
            return this.decoratee.handleCallback(callback, greedy, composer)
                || this.base(callback, greedy, composer);
        }
    });

    /**
     * Definition goes here
     * @class CallbackHandlerFilter
     * @constructor
     * @extends CallbackHandlerDecorator
     */
    var CallbackHandlerFilter = CallbackHandlerDecorator.extend({
        constructor: function _(decoratee, filter) {
            this.base(decoratee);
            if ($isNothing(filter)) {
                throw new TypeError("No filter specified.");
            } else if (!$isFunction(filter)) {
                throw new TypeError(format("Invalid filter: %1 is not a function.", filter));
            }
            var spec = _.spec || (_.spec = {});
            spec.value = filter;
            Object.defineProperty(this, '_filter', spec);
            delete spec.value;
        },
        handleCallback: function (callback, greedy, composer) {
            var decoratee = this.decoratee;
            if (callback instanceof Reentrant) {
                return decoratee.handleCallback(callback, greedy, composer);
            }
            if (composer == this) {
                composer = new ReentrantDecorator(composer);
            }
            return this._filter(callback, composer, function () {
                return decoratee.handleCallback(callback, greedy, composer);
            })
        }
    });                                                                   

    /**
     * Definition goes here
     * @class RejectedError
     */
    function RejectedError() {
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    RejectedError.prototype             = new Error;
    RejectedError.prototype.constructor = RejectedError;

    /**
     * Definition goes here
     * @class CallbackHandlerAspect
     * @constructor
     * @extends CallbackHandlerFilter
     */
    var CallbackHandlerAspect = CallbackHandlerFilter.extend({
        constructor: function (decoratee, before, after) {
            this.base(decoratee, function (callback, composer, proceed) {
                if ($isFunction(before)) {
                    var test     = before(callback, composer),
                        isMethod = callback instanceof HandleMethod;
                    if ($isPromise(test)) {
                        var accept = test.then(function (accepted) {
                            if (accepted !== false) {
                                _aspectProceed(callback, composer, proceed);
                                return isMethod ? method.getReturnValue() : true;
                            }
                            return Promise.reject(new RejectedError);
                        });
                        if (isMethod) {
                            callback.setReturnValue(accept);
                        } else if (callback instanceof Deferred) {
                            callback.track(accept);
                        }
                        return true;
                    } else if (test === false) {
                        return true;
                    }
                }
                return _aspectProceed(callback, composer, proceed, after);
            });
        }
    });

    function _aspectProceed(callback, composer, proceed, after) {
        var promise;
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
            }
            return handled;
        } finally {
            if (!promise && $isFunction(after)) {
                after(callback, composer);
            }
        }
    }
    
    /**
     * Definition goes here
     * @class CascadeCallbackHandler
     * @constructor
     * @extends CallbackHandler
     */
    var CascadeCallbackHandler = CallbackHandler.extend({
        constructor: function _(handler, cascadeToHandler) {
            if ($isNothing(handler)) {
                throw new TypeError("No handler specified.");
            } else if ($isNothing(cascadeToHandler)) {
                throw new TypeError("No cascadeToHandler specified.");
            }
            var spec = _.spec || (_.spec = {});
            spec.value = handler.toCallbackHandler();
            Object.defineProperty(this, 'handler', spec);
            spec.value = cascadeToHandler.toCallbackHandler();
            Object.defineProperty(this, 'cascadeToHandler', spec);
            delete spec.value;
        },
        handleCallback: function (callback, greedy, composer) {
            var handled = greedy
                ? (this.handler.handleCallback(callback, true, composer)
                   | this.cascadeToHandler.handleCallback(callback, true, composer))
                : (this.handler.handleCallback(callback, false, composer)
                   || this.cascadeToHandler.handleCallback(callback, false, composer));
            if (!handled || greedy) {
                handled = this.base(callback, greedy, composer) || handled;
            }
            return !!handled;
        }
    });

    /**
     * Definition goes here
     * @class CompositeCallbackHandler
     * @constructor
     * @extends CallbackHandler
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
                            if (testHandler == handler || testHandler.delegate == handler) {
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
                        if (handler.handleCallback(callback, greedy, composer)) {
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
     * Definition goes here
     * @class ConditionalCallbackHandler
     * @constructor
     * @extends CallbackHandlerDecorator
     */
    var ConditionalCallbackHandler = CallbackHandlerDecorator.extend({
        constructor: function _(decoratee, condition) {
            this.base(decoratee);
            if ($isNothing(condition)) {
                throw new TypeError("No condition specified.");
            } else if (!$isFunction(condition)) {
                throw new TypeError(format(
                    "Invalid condition: %1 is not a function.", condition));
            }
            var spec = _.spec || (_.spec = {});
            spec.value = condition;
            Object.defineProperty(this, 'condition', spec);
            delete spec.value;
        },
        handleCallback: function (callback, greedy, composer) {
            return this.condition(callback)
                 ? this.base(callback, greedy, composer)
                 : false;
        }
    });

    /**
     * Definition goes here
     * @class AcceptingCallbackHandler
     * @constructor
     * @extends CallbackHandler
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
     * Definition goes here
     * @class ProvidingCallbackHandler
     * @constructor
     * @extends CallbackHandler
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
     * Definition goes here
     * @class MethodCallbackHandler
     * @constructor
     * @extends CallbackHandler
     */
    var MethodCallbackHandler = CallbackHandler.extend({
        constructor: function _(methodName, method) {
            if (!$isString(methodName) || methodName.length === 0 || !methodName.trim()) {
                throw new TypeError("No methodName specified.");
            } else if (!$isFunction(method)) {
                throw new TypeError(format("Invalid method: %1 is not a function.", method));
            }
            var spec = _.spec || (_.spec = {});
            spec.value = methodName;
            Object.defineProperty(this, 'methodName', spec);
            spec.value = method;
            Object.defineProperty(this, 'method', spec);
            delete spec.value;
        },
        handleCallback: function (callback, greedy, composer) {
            if (callback instanceof HandleMethod) {
                var target = new Object;
                target[this.methodName] = this.method;
                return callback.invokeOn(target);
            }
            return false;
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
     * @property InvocationOptions
     * @type Enum
     */
    var InvocationOptions = {
        None:        0,
        Broadcast:   1 << 0,
        BestEffort:  1 << 1,
        Strict:      1 << 2,
    };
    InvocationOptions.Notify = InvocationOptions.Broadcast | InvocationOptions.BestEffort;
    InvocationOptions = Enum(InvocationOptions);

    /**
     * Definition goes here
     * @class InvocationSemantics
     * @constructor
     * @extends Base
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
                }
            });
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

    /**
     * Definition goes here
     * @class InvocationOptionsHandler
     * @constructor
     * @extends CallbackHandler
     */
    var InvocationOptionsHandler = CallbackHandler.extend({
        constructor: function _(handler, options) {
            var spec = _.spec || (_.spec = {});
            spec.value = handler;
            Object.defineProperty(this, 'handler', spec);
            spec.value = new InvocationSemantics(options);
            Object.defineProperty(this, 'semantics', spec);
            delete spec.value;
        },
        handleCallback: function (callback, greedy, composer) {
            if (callback instanceof Reentrant) {
                callback = callback.getCallback();
            }
            if (callback instanceof InvocationSemantics) {
                this.semantics.mergeInto(callback);
                return true;
            }
            return this.handler.handleCallback(callback, greedy, composer);
        }
    });

    /**
     * Definition goes here
     * @class InvocationDelegate
     * @constructor
     * @extends Delegate
     */
    var InvocationDelegate = Delegate.extend({
        constructor: function _(handler) {
            var spec = _.spec || (_.spec = {});
            spec.value = handler;
            Object.defineProperty(this, 'handler', spec);
            delete spec.value;
        },
        get: function (protocol, propertyName, strict) {
            return _delegateInvocation(this, HandleMethod.Get, protocol, propertyName, null, strict);
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            return _delegateInvocation(this, HandleMethod.Set, protocol, propertyName, propertyValue, strict);
        },
        invoke: function (protocol, methodName, args, strict) {
            return _delegateInvocation(this, HandleMethod.Invoke, protocol, methodName, args, strict);
        }
    });

    function _delegateInvocation(delegate, type, protocol, methodName, args, strict) {
        var handler   = delegate.handler, 
            semantics = new InvocationSemantics;
        handler.handle(new Reentrant(semantics), true);
        strict  = !!(strict | semantics.getOption(InvocationOptions.Strict));
        var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
            bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
            handleMethod = new HandleMethod(type, protocol, methodName, args, strict);
        if (handler.handle(handleMethod, !!broadcast) === false && !bestEffort) {
            throw new TypeError(format("Object %1 has no method '%2'", handler, methodName));
        }
        return handleMethod.getReturnValue();
    }

    CallbackHandler.implement({
        $strict: function () { return this.$callOptions(InvocationOptions.Strict); },
        $broadcast: function () { return this.$callOptions(InvocationOptions.Broadcast); },
        $bestEffort: function () { return this.$callOptions(InvocationOptions.BestEffort); },
        $notify: function () { return this.$callOptions(InvocationOptions.Notify); },
        $callOptions: function (options) { return new InvocationOptionsHandler(this, options); }
    });

    CallbackHandler.implement({
        defer: function (callback) {
            var deferred = new Deferred(callback);
            return this.handle(deferred, false, global.$composer)
                 ? Promise.all(deferred.getPending()).return(true)
                 : Promise.resolve(false);
        },
        deferAll: function (callback) {
            var deferred = new Deferred(callback, true);
            return this.handle(deferred, true, global.$composer)
                 ? Promise.all(deferred.getPending()).return(true)
                 : Promise.resolve(false);
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
                    return $instant.test(key)
                         ? Array2.flatten(resolutions)
                         : Promise.all(resolutions).then(Array2.flatten);
                }
            }
            return [];
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
                    return $instant.test(key)
                         ? Array2.flatten(resolutions)
                         : Promise.all(results).then(Array2.flatten);
                }
            }
            return [];
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
     * Defines a new handler relationship.
     * @method $define
     * @param    {string}   tag       - name of definition
     * @param    {Variance} variance  - variance of definition
     * @return   {Function} function to add to definition.
     */
    function $define(tag, variance) {
        if (!$isString(tag) || tag.length === 0 || /\s/.test(tag)) {
            throw new TypeError("The tag must be a non-empty string with no whitespace.");
        } else if (_definitions[tag]) {
            throw new TypeError(format("'%1' is already defined.", tag));
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
            }
            return _definition(owner, constraint, handler, removed);
        }
        function _definition(owner, constraint, handler, removed) {
            if ($isNothing(owner)) {
                throw new TypeError("Definitions must have an owner.");
            } else if ($isNothing(handler)) {
                handler    = constraint;
                constraint = $classOf(Modifier.unwrap(constraint));
            }
            if ($isNothing(handler)) {
                throw new TypeError(format(
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
            var meta  = owner.$meta,
                node  = new _Node(constraint, handler, removed),
                index = _createIndex(node.constraint),
                list  = meta[tag] || (meta[tag] = new IndexedList(comparer));
            list.insert(node, index);
            return function (notifyRemoved) {
                list.remove(node);
                if (list.isEmpty()) {
                    delete meta[tag];
                }
                if (node.removed && (notifyRemoved !== false)) {
                    node.removed(owner);
                }
            };
        };
        definition.removeAll = function (owner) {
            var meta = owner.$meta;
            var list = meta[tag],
                head = list.head;
            while (head) {
                if (head.removed) {
                    head.removed(owner);
                }
                head = head.next;
            }
            delete meta[tag];
        };
        definition.dispatch = function (handler, callback, constraint, composer, all, results) {
            var v        = variance,
                delegate = handler.delegate;
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
                var meta      = owner.$meta,
                    index     = _createIndex(constraint),
                    list      = meta && meta[tag],
                    invariant = (v === Variance.Invariant);
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
     * Definition goes here
     * @class _Node
     * @param {Constraint} constraint
     * @param {Handler} handler
     * @param {Removed} removed
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
