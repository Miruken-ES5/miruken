var miruken = require('./miruken.js'),
    Promise = require('bluebird');

new function () { // closure

    /**
     * Package providing message handling support.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}} module.
     * @module miruken
     * @submodule callback
     * @namespace miruken.callback
     * @class $
     */
    var callback = new base2.Package(this, {
        name:    "callback",
        parent:  miruken,
        imports: "miruken",
        exports: "CallbackHandler,CascadeCallbackHandler,CompositeCallbackHandler,InvocationOptions,Resolving,Resolution,Composition,HandleMethod,ResolveMethod,RejectedError,getEffectivePromise,$handle,$callbacks,$define,$provide,$lookup,$NOT_HANDLED"
    });

    eval(this.imports);

    var _definitions = {},
        /**
         * Definition for handling callbacks contravariantly.
         * @method $handle
         * @for miruken.callback.$
         */
        $handle = $define('$handle',  Variance.Contravariant),
        /**
         * Definition for providing callbacks covariantly.
         * @method $provide  
         * @for miruken.callback.$
         */        
        $provide = $define('$provide', Variance.Covariant),
        /**
         * Definition for matching callbacks invariantly.
         * @method $lookup  
         * @for miruken.callback.$
         */                
        $lookup = $define('$lookup' , Variance.Invariant),
        /**
         * return value to indicate a callback was not handled.
         * @property {Object} $NOT_HANDLED
         * @for miruken.callback.$
         */                
        $NOT_HANDLED = Object.freeze({});

    /**
     * Metamacro to process callback handler definitions.
     * <pre>
     *    var Bank = Base.extend(**$callbacks**, {
     *        $handle: [
     *            Deposit, function (deposit, composer) {
     *                // perform the deposit
     *            }
     *        ]
     *    })
     * </pre>
     * would register a handler in the Bank class for Deposit callbacks.
     * @class $callbacks
     * @extends miruken.MetaMacro
     */
    var $callbacks = MetaMacro.extend({
        perform: function (step, metadata, target, definition) {
            if ($isNothing(definition)) {
                return;
            }
            var source = target,
                clazz  = metadata.getClass();
            if (target === clazz.prototype) {
                target = clazz;
            }
            for (tag in _definitions) {
                var list = this.extractProperty(tag, source, definition);
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
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */ 
        isActive: True
    });

    /**
     * Captures the invocation of a method.
     * @class HandleMethod
     * @constructor
     * @param  {number}            type        -  get, set or invoke
     * @param  {miruken.Protocol}  protocol    -  initiating protocol
     * @param  {string}            methodName  -  method name
     * @param  {Array}             [...args]   -  method arguments
     * @param  {boolean}           strict      -  true if strict, false otherwise
     * @extends Base
     */
    var HandleMethod = Base.extend({
        constructor: function (type, protocol, methodName, args, strict) {
            if (protocol && !$isProtocol(protocol)) {
                throw new TypeError("Invalid protocol supplied.");
            }
            var _returnValue, _exception;
            this.extend({
                /**
                 * Gets the type of method.
                 * @property {number} type
                 * @readOnly
                 */
                get type() { return type; },
                /**
                 * Gets the Protocol the method belongs to.
                 * @property {miruken.Protocol} protocol
                 * @readOnly
                 */
                get protocol() { return protocol; },
                /**
                 * Gets the name of the method.
                 * @property {string} methodName
                 * @readOnly
                 */
                get methodName() { return methodName; },
                /**
                 * Gets the arguments of the method.
                 * @property {Array} arguments
                 * @readOnly
                 */
                get arguments() { return args; },
                /**
                 * Get/sets the return value of the method.
                 * @property {Any} returnValue.
                 */
                get returnValue() { return _returnValue; },
                set returnValue(value) { _returnValue = value; },
                /**
                 * Gets/sets the execption raised by the method.
                 * @property {Any} method exception.
                 */
                get exception() { return _exception; },
                set exception(exception) { _exception = exception; },
                /**
                 * Attempts to invoke the method on the target.<br/>
                 * During invocation, the receiver will have access to a global **$composer** property
                 * representing the initiating {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}.
                 * @method invokeOn
                 * @param   {Object}                            target  - method receiver
                 * @param   {miruken.callback.CallbackHandler}  composer  - composition handler
                 * @returns {boolean} true if the method was accepted.
                 */
                invokeOn: function (target, composer) {
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
        /**
         * Identifies a property get.
         * @property {number} Get
         * @static
         */
        Get: 1,
        /**
         * Identifies a property set.
         * @property {number} Set
         * @static
         */
        Set: 2,
        /**
         * Identifies a method invocation.
         * @property {number} Invoke
         * @static
         */
        Invoke: 3
    });

    /**
     * Captures the invocation of a method using resolution to determine the targets.
     * @class ResolveMethod
     * @constructor
     * @param  {number}            type        -  get, set or invoke
     * @param  {miruken.Protocol}  protocol    -  initiating protocol
     * @param  {string}            methodName  -  method name
     * @param  {Array}             [...args]   -  method arguments
     * @param  {boolean}           strict      -  true if strict, false otherwise
     * @param  {boolean}           all         -  true if invoke all targets
     * @param  {boolean}           required    -  true if at least one target accepts
     * @extends HandleMethod
     */
    var ResolveMethod = HandleMethod.extend({
        constructor: function (type, protocol, methodName, args, strict, all, required) {
            this.base(type, protocol, methodName, args, strict);
            this.extend({
                /**
                 * Attempts to invoke the method on resolved targets.
                 * @method invokeResolve
                 * @param   {miruken.callback.CallbackHandler}  composer  - composition handler
                 * @returns {boolean} true if the method was accepted.
                 */
                invokeResolve: function (composer) {
                    var handled = false,
                        targets = composer.resolveAll(protocol);
                    
                    function invokeTargets(targets) {
                        for (var i = 0; i < targets.length; ++i) {
                            handled = handled | this.invokeOn(targets[i], composer);
                            if (handled && !all) {
                                break;
                            }
                        }
                    }
                    
                    if ($isPromise(targets)) {
                        var that = this;
                        this.returnValue = new Promise(function (resolve, reject) {
                            targets.then(function (targets) {
                                invokeTargets.call(that, targets);
                                if (that.execption) {
                                    reject(that.exeception);
                                } else if (handled) {
                                    resolve(that.returnValue);
                                } else if (required) {
                                    reject(new TypeError(format("Object %1 has no method '%2'", composer, methodName)));
                                } else {
                                    resolve();
                                }
                            });
                        });
                        return true;
                    }
                    
                    invokeTargets.call(this, targets);
                    return handled;
                }
            });
        }
    });
    
    /**
     * Callback representing the invariant lookup of a key.
     * @class Lookup
     * @constructor
     * @param   {Any}      key   -  lookup key
     * @param   {boolean}  many  -  lookup cardinality
     * @extends Base
     */
    var Lookup = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _results = [],
                _instant = $instant.test(key);
            this.extend({
                /**
                 * Gets the lookup key.
                 * @property {Any} key
                 * @readOnly
                 */
                get key() { return key; },
                /**
                 * true if lookup all, false otherwise.
                 * @property {boolean} many
                 * @readOnly
                 */
                get isMany() { return many; },
                /**
                 * Gets the matching results.
                 * @property {Array} results
                 * @readOnly
                 */
                get results() { return _results; },
                /**
                 * Adds a lookup result.
                 * @param  {Any}  reault - lookup result
                 */
                addResult: function (result) {
                    if (!(_instant && $isPromise(result))) {
                        _results.push(result);
                    }
                }
            });
        }
    });

    /**
     * Callback representing the deferred handling of another callback.
     * @class Deferred
     * @constructor
     * @param   {Object}   callback  -  callback
     * @param   {boolean}  many      -  deferred cardinality
     * @extends Base
     */
    var Deferred = Base.extend({
        constructor: function (callback, many) {
            if ($isNothing(callback)) {
                throw new TypeError("The callback is required.");
            }
            many = !!many;
            var _pending = [];
            this.extend({
                /**
                 * true if handle all, false otherwise.
                 * @property {boolean} many
                 * @readOnly
                 */
                get isMany() { return many; },
                /**
                 * Gets the callback.
                 * @property {Object} callback
                 * @readOnly
                 */
                get callback() { return callback; },
                /**
                 * Gets the pending promises.
                 * @property {Array} pending
                 * @readOnly
                 */
                get pending() { return _pending; },
                /**
                 * Tracks a pending promise.
                 * @param {miruken.Promise}  promise - handle promise
                 */
                track: function (promise) {
                    if ($isPromise(promise)) {
                        _pending.push(promise);
                    }
                }
            });
        }
    });

    /**
     * Callback representing the covariant resolution of a key.
     * @class Resolution
     * @constructor
     * @param   {any}   key      -  resolution key
     * @param   {boolean}  many  -  resolution cardinality
     * @extends Base
     */
    var Resolution = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [],
                _promised    = false,
                _instant     = $instant.test(key);
            this.extend({
                /**
                 * Gets the key.
                 * @property {Any} key
                 * @readOnly
                 */                
                get key() { return key; },
                /**
                 * true if resolve all, false otherwise.
                 * @property {boolean} isMany
                 * @readOnly
                 */                
                get isMany() { return many; },
                /**
                 * true if resolve all is instant.  Otherwise a promise.
                 * @property {boolean} instant
                 * @readOnly
                 */
                get instant() { return !_promised; },
                /**
                 * Gets the resolutions.
                 * @property {Array} resolutions
                 * @readOnly
                 */                
                get resolutions() { return _resolutions; },
                /**
                 * Adds a resolution.
                 * @param {Any} resolution  -  resolution
                 */
                resolve: function (resolution) {
                    var promised = $isPromise(resolution);
                    if (!_instant || !promised) {
                        _promised = _promised || promised;
                        _resolutions.push(resolution);
                    }
                }
            });
        }
    });

    /**
     * Marks a callback as composed.
     * @class Composition
     * @constructor
     * @param   {Object}  callback  -  callback to compose
     * @extends Base
     */
    var Composition = Base.extend({
        constructor: function (callback) {
            if (callback) {
                this.extend({
                    /**
                     * Gets the callback.
                     * @property {Object} callback
                     * @readOnly
                     */
                    get callback() { return callback; },
                });
            }
        }
    });

    var compositionScope = $decorator({
        handleCallback: function (callback, greedy, composer) {
            if ($classOf(callback) !== Composition) {
                callback = new Composition(callback);
            }
            return this.base(callback, greedy, composer);
        }
    });
    
    /**
     * Base class for handling arbitrary callbacks.<br/>
     * See {{#crossLink "miruken.callback.$callbacks"}}{{/crossLink}}
     * @class CallbackHandler
     * @constructor
     * @param  {Object}  [delegate]  -  delegate
     * @extends Base
     */
    var CallbackHandler = Base.extend(
        $callbacks, {
        constructor: function (delegate) {
            this.extend({
                /**
                 * Gets the delegate.
                 * @property {Object} delegate
                 * @readOnly
                 */            
                get delegate() { return delegate; }
            });
        },
        /**
         * Handles the callback.
         * @method handle
         * @param   {Object}                           callback        -  any callback
         * @param   {boolean}                          [greedy=false]  -  true if handle greedily
         * @param   {miruken.callback.CallbackHandler} [composer]      -  composition handler
         * @returns {boolean} true if the callback was handled, false otherwise.
         */
        handle: function (callback, greedy, composer) {
            if ($isNothing(callback)) {
                return false;
            }
            if ($isNothing(composer)) {
                composer = compositionScope(this);
            }
            return !!this.handleCallback(callback, !!greedy, composer);
        },
        /**
         * Handles the callback with all arguments populated.
         * @method handleCallback
         * @param   {Object}                           callback    -  any callback
         * @param   {boolean}                          greedy      -  true if handle greedily
         * @param   {miruken.callback.CallbackHandler} [composer]  -  composition handler
         * @returns {boolean} true if the callback was handled, false otherwise.
         */
        handleCallback: function (callback, greedy, composer) {
            return callback instanceof ResolveMethod
                ? callback.invokeResolve(composer)
                : $handle.dispatch(this, callback, null, composer, greedy);
        },
        $handle:[
            Lookup, function (lookup, composer) {
                return $lookup.dispatch(this, lookup,lookup.key, composer, 
                                        lookup.isMany, lookup.addResult);
            },
            Deferred, function (deferred, composer) {
                return $handle.dispatch(this, deferred.callback, null, composer,
                                        deferred.isMany, deferred.track);
            },
            Resolution, function (resolution, composer) {
                var key      = resolution.key,
                    many     = resolution.isMany,
                    resolved = $provide.dispatch(this, resolution, key, composer, many, resolution.resolve);
                if (!resolved) { // check if delegate or handler implicitly satisfy key
                    var implied  = new _Node(key),
                        delegate = this.delegate;
                    if (delegate && implied.match($classOf(delegate), Variance.Contravariant)) {
                        resolution.resolve($decorated(delegate, true));
                        resolved = true;
                    }
                    if ((!resolved || many) && implied.match($classOf(this), Variance.Contravariant)) {
                        resolution.resolve($decorated(this, true));
                        resolved = true;
                    }
                }
                return resolved;
            },
            HandleMethod, function (method, composer) {
                return method.invokeOn(this.delegate, composer) || method.invokeOn(this, composer);
            },
            Composition, function (composable, composer) {
                var callback = composable.callback;
                return callback && $handle.dispatch(this, callback, null, composer);
            }
        ],
        /**
         * Converts the callback handler to a {{#crossLink "miruken.Delegate"}}{{/crossLink}}.
         * @method toDelegate
         * @returns {miruken.callback.InvocationDelegate}  delegate for this callback handler.
         */            
        toDelegate: function () { return new InvocationDelegate(this); }
    }, {
        coerce: function (object) { return new this(object); }
    });

    Base.implement({
        toCallbackHandler: function () { return CallbackHandler(this); }
    });

    /**
     * Identifies a rejected callback.  This usually occurs from aspect processing.<br/>
     * See {{#crossLink "miruken.callback.CallbackHandlerAspect"}}{{/crossLink}}
     * @class RejectedError
     * @constructor
     * @param {Object}  callback  -  rejected callback
     * @extends Error
     */
    function RejectedError(callback) {
        /**
         * Gets the rejected callback.
         * @property {Object} callback
         */         
        this.callback = callback;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    RejectedError.prototype             = new Error;
    RejectedError.prototype.constructor = RejectedError;
    
    /**
     * Represents a two-way {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}} path.
     * @class CascadeCallbackHandler
     * @constructor
     * @param  {miruken.callback.CallbackHandler}  handler           -  primary handler
     * @param  {miruken.callback.CallbackHandler}  cascadeToHandler  -  secondary handler
     * @extends miruken.callback.CallbackHandler
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
                /**
                 * Gets the primary handler.
                 * @property {miruken.callback.CallbackHandler} handler
                 * @readOnly
                 */
                get handler() { return handler; },
                /**
                 * Gets the secondary handler.
                 * @property {miruken.callback.CallbackHandler} cascadeToHandler
                 * @readOnly
                 */
                get cascadeToHandler() { return cascadeToHandler; }                
            });
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
     * Encapsulates zero or more {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}}.<br/>
     * See [Composite Pattern](http://en.wikipedia.org/wiki/Composite_pattern)
     * @class CompositeCallbackHandler
     * @constructor
     * @param  {Arguments}  arguments  -  callback handlers
     * @extends miruken.callback.CallbackHandler
     */
    var CompositeCallbackHandler = CallbackHandler.extend({
        constructor: function () {
            var _handlers = new Array2;
            this.extend({
                /**
                 * Gets all participating callback handlers.
                 * @method getHandlers
                 * @returns {Array} participating callback handlers.
                 */
                getHandlers: function () { return _handlers.copy(); },
                /**
                 * Adds the callback handlers to the composite.
                 * @method addHandlers
                 * @returns {miruken.callback.CompositeCallbackHandler}  composite
                 * @chainable
                 */
                addHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (handler) {
                            _handlers.push(handler.toCallbackHandler());
                        }
                    });
                    return this;
                },
                /**
                 * Removes callback handlers from the composite.
                 * @method removeHandlers
                 * @returns {miruken.callback.CompositeCallbackHandler}  composite
                 * @chainable
                 */
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
     * Shortcut for handling a callback.
     * @method
     * @static
     * @param   {Function}  handler     -  handles callbacks
     * @param   {Any}       constraint  -  callback constraint
     * @returns {miruken.callback.CallbackHandler} callback handler.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.accepting = function (handler, constraint) {
        var accepting = new CallbackHandler;
        $handle(accepting, constraint, handler);
        return accepting;
    };

    /**
     * Shortcut for providing a callback.
     * @method
     * @static
     * @param  {Function}  provider    -  provides callbacks
     * @param  {Any}       constraint  -  callback constraint
     * @returns {miruken.callback.CallbackHandler} callback provider.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.providing = function (provider, constraint) {
        var providing = new CallbackHandler;
        $provide(providing, constraint, provider);
        return providing;
    };

    /**
     * Shortcut for handling a 
     * {{#crossLink "miruken.callback.HandleMethod"}}{{/crossLink}} callback.
     * @method
     * @static
     * @param  {string}    methodName  -  method name
     * @param  {Function}  method      -  method function
     * @returns {miruken.callback.CallbackHandler} method handler.
     * @for miruken.callback.CallbackHandler
     */
    CallbackHandler.implementing = function (methodName, method) {
        if (!$isString(methodName) || methodName.length === 0 || !methodName.trim()) {
            throw new TypeError("No methodName specified.");
        } else if (!$isFunction(method)) {
            throw new TypeError(format("Invalid method: %1 is not a function.", method));
        }
        return (new CallbackHandler).extend({
            handleCallback: function (callback, greedy, composer) {
                if (callback instanceof HandleMethod) {
                    var target = new Object;
                    target[methodName] = method;
                    return callback.invokeOn(target);
                }
                return false;
            }
        });
    };
    
    /**
     * InvocationOptions flags enum
     * @class InvocationOptions
     * @extends miruken.Enum
     */
    var InvocationOptions = {
        /**
         * @property {number} None
         */
        None: 0,
        /**
         * Delivers invocation to all handlers.  At least one must recognize it.
         * @property {number} Broadcast
         */
        Broadcast: 1 << 0,
        /**
         * Marks invocation as optional.
         * @property {number} BestEffort
         */        
        BestEffort: 1 << 1,
        /**
         * Requires invocation to match conforming protocol.
         * @property {number} Strict
         */                
        Strict: 1 << 2,
        /**
         * Uses Resolve to determine instances to invoke.
         * @property {number} Resolve
         */                
        Resolve: 1 << 3        
    };
    /**
     * Publishes invocation to all handlers.
     * @property {number} Notify
     */                
    InvocationOptions.Notify = InvocationOptions.Broadcast | InvocationOptions.BestEffort;
    InvocationOptions = Enum(InvocationOptions);

    /**
     * Captures invocation semantics.
     * @class InvocationSemantics
     * @constructor
     * @param  {miruken.callback.InvocationOptions}  options  -  invocation options.
     * @extends Base
     */
    var InvocationSemantics = Composition.extend({
        constructor: function (options) {
            var _options   = options || InvocationOptions.None,
                _specified = _options;
            this.extend({
                /**
                 * Gets the invocation option.
                 * @method getOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to test
                 * @returns {boolean} true if invocation option enabled, false otherwise.
                 */
                getOption: function (option) {
                    return (_options & option) === option;
                },
                /**
                 * Sets the invocation option.
                 * @method setOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to set
                 * @param   {boolean}  enabled  -  true if enable option, false to clear.
                 */                
                setOption: function (option, enabled) {
                    if (enabled) {
                        _options = _options | option;
                    } else {
                        _options = _options & (~option);
                    }
                    _specified = _specified | option;
                },
                /**
                 * Determines if the invocation option was specified.
                 * @method getOption
                 * @param   {miruken.callback.InvocationOption} option  -  option to test
                 * @returns {boolean} true if invocation option specified, false otherwise.
                 */                
                isSpecified: function (option) {
                    return (_specified & option) === option;
                }
            });
        },
        /**
         * Merges invocation options into the supplied constraints. 
         * @method mergeInto
         * @param   {miruken.callback.InvocationSemantics}  semantics  -  receives invocation semantics
         */                
        mergeInto: function (semantics) {
            for (var index = 0; index <= 3; ++index) {
                var option = (1 << index);
                if (this.isSpecified(option) && !semantics.isSpecified(option)) {
                    semantics.setOption(option, this.getOption(option));
                }
            }
        }
    });

    /**
     * Protocol marking {{#crossLink "miruken.callback.InvocationOptions/Resolve:property"}}{{/crossLink}} semantics.
     * @class Resolving
     * @extends miruken.Protocol
     */
    var Resolving = Protocol.extend();
    
    /**
     * Delegates properties and methods to a callback handler using 
     * {{#crossLink "miruken.callback.HandleMethod"}}{{/crossLink}}.
     * @class InvocationDelegate
     * @constructor
     * @param   {miruken.callback.CallbackHandler}  handler  -  forwarding handler 
     * @extends miruken.Delegate
     */
    var InvocationDelegate = Delegate.extend({
        constructor: function (handler) {
            this.extend({
                get handler() { return handler; }
            });
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
        handler.handle(semantics, true);
        strict = !!(strict | semantics.getOption(InvocationOptions.Strict));
        var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
            bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
            useResolve   = semantics.getOption(InvocationOptions.Resolve)
                        || protocol.conformsTo(Resolving),
            handleMethod = useResolve
                         ? new ResolveMethod(type, protocol, methodName, args, strict, broadcast, !bestEffort)
                         : new HandleMethod(type, protocol, methodName, args, strict);
        if (!handler.handle(handleMethod, broadcast && !useResolve) && !bestEffort) {
            throw new TypeError(format("Object %1 has no method '%2'", handler, methodName));
        }
        return handleMethod.returnValue;
    }

    CallbackHandler.implement({
        /**
         * Establishes strict invocation semantics.
         * @method $strict
         * @returns {miruken.callback.CallbackHandler} strict semantics.
         * @for miruken.callback.CallbackHandler
         */
        $strict: function () { return this.$callOptions(InvocationOptions.Strict); },
        /**
         * Establishes broadcast invocation semantics.
         * @method $broadcast
         * @returns {miruken.callback.CallbackHandler} broadcast semanics.
         * @for miruken.callback.CallbackHandler
         */        
        $broadcast: function () { return this.$callOptions(InvocationOptions.Broadcast); },
        /**
         * Establishes best-effort invocation semantics.
         * @method $bestEffort
         * @returns {miruken.callback.CallbackHandler} best-effort semanics.
         * @for miruken.callback.CallbackHandler
         */                
        $bestEffort: function () { return this.$callOptions(InvocationOptions.BestEffort); },
        /**
         * Establishes notification invocation semantics.
         * @method $notify
         * @returns {miruken.callback.InvocationOptionsHandler} notification semanics.
         * @for miruken.callback.CallbackHandler
         */
        $notify: function () { return this.$callOptions(InvocationOptions.Notify); },
        /**
         * Establishes resolve invocation semantics.
         * @method $resolve
         * @returns {miruken.callback.CallbackHandler} resolved semantics.
         * @for miruken.callback.CallbackHandler
         */
        $resolve: function () { return this.$callOptions(InvocationOptions.Resolve); },        
        /**
         * Establishes custom invocation semantics.
         * @method $callOptions
         * @param  {miruken.callback.InvocationOptions}  options  -  invocation semantics
         * @returns {miruken.callback.CallbackHandler} custom invocation semanics.
         * @for miruken.callback.CallbackHandler
         */                        
        $callOptions: function (options) {
            var semantics = new InvocationSemantics(options);
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    var handled = false;
                    if (callback instanceof InvocationSemantics) {
                        semantics.mergeInto(callback);
                        handled = true;
                    }
                    if (greedy || !handled) {
                        handled = handled | this.base(callback, greedy, composer);
                    }
                    return !!handled;
                }
            });
        }
    });

    CallbackHandler.implement({
        /**
         * Asynchronusly handles the callback.
         * @method defer
         * @param   {Object}  callback  -  callback
         * @returns {Promise} promise to handled callback.
         * @for miruken.callback.CallbackHandler
         * @async
         */                        
        defer: function (callback) {
            var deferred = new Deferred(callback);
            return this.handle(deferred, false, global.$composer)
                 ? Promise.all(deferred.pending).return(true)
                 : Promise.resolve(false);
        },
        /**
         * Asynchronusly handles the callback greedily.
         * @method deferAll
         * @param   {Object}  callback  -  callback
         * @returns {Promise} promise to handled callback.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                
        deferAll: function (callback) {
            var deferred = new Deferred(callback, true);
            return this.handle(deferred, true, global.$composer)
                 ? Promise.all(deferred.pending).return(true)
                 : Promise.resolve(false);
        },
        /**
         * Resolves the key.
         * @method resolve
         * @param   {Any}  key  -  key
         * @returns {Any}  resolved key.  Could be a promise.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                
        resolve: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key);
            if (this.handle(resolution, false, global.$composer)) {
                var resolutions = resolution.resolutions;
                if (resolutions.length > 0) {
                    return resolutions[0];
                }
            }
        },
        /**
         * Resolves the key greedily.
         * @method resolveAll
         * @param   {Any}   key  -  key
         * @returns {Array} resolved key.  Could be a promise.
         * @for miruken.callback.CallbackHandler
         * @async
         */                                        
        resolveAll: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key, true);
            if (this.handle(resolution, true, global.$composer)) {
                var resolutions = resolution.resolutions;
                if (resolutions.length > 0) {
                    return resolution.instant
                         ? Array2.flatten(resolutions)
                         : Promise.all(resolutions).then(Array2.flatten);
                }
            }
            return [];
        },
        /**
         * Looks up the key.
         * @method lookup
         * @param   {Any}  key  -  key
         * @returns {Any}  value of key.
         * @for miruken.callback.CallbackHandler
         */                                        
        lookup: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key);
            if (this.handle(lookup, false, global.$composer)) {
                var results = lookup.results;
                if (results.length > 0) {
                    return results[0];
                }
            }
        },
        /**
         * Looks up the key greedily.
         * @method lookupAll
         * @param   {Any}  key  -  key
         * @returns {Array}  value(s) of key.
         * @for miruken.callback.CallbackHandler
         */                                                
        lookupAll: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key, true);
            if (this.handle(lookup, true, global.$composer)) {
                var results = lookup.results;
                if (results.length > 0) {
                    return $instant.test(key)
                         ? Array2.flatten(resolutions)
                         : Promise.all(results).then(Array2.flatten);
                }
            }
            return [];
        },
        /**
         * Decorates the handler.
         * @method decorate
         * @param   {Object}  decorations  -  decorations
         * @returns {miruken.callback.CallbackHandler} decorated callback handler.
         * @for miruken.callback.CallbackHandler
         */        
        decorate: function (decorations) {
            return $decorate(this, decorations);
        },
        /**
         * Decorates the handler for filtering callbacks.
         * @method filter
         * @param   {Function}  filter     -  filter
         * @param   {boolean}   reentrant  -  true if reentrant, false otherwise
         * @returns {miruken.callback.CallbackHandler} filtered callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                        
        filter: function (filter, reentrant) {
            if (!$isFunction(filter)) {
                throw new TypeError(format("Invalid filter: %1 is not a function.", filter));
            }
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    if (!reentrant && (callback instanceof Composition)) {
                        return this.base(callback, greedy, composer);
                    }
                    var that = this, base = this.base;
                    return filter(callback, composer, function () {
                        return base.call(that, callback, greedy, composer);
                    });
                }
            });
        },
        /**
         * Decorates the handler for applying aspects to callbacks.
         * @method aspect
         * @param   {Function}  before     -  before predicate
         * @param   {Function}  action     -  after action
         * @param   {boolean}   reentrant  -  true if reentrant, false otherwise
         * @returns {miruken.callback.CallbackHandler}  callback handler aspect.
         * @for miruken.callback.CallbackHandler
         */                                                                
        aspect: function (before, after, reentrant) {
            return this.filter(function (callback, composer, proceed) {
                if ($isFunction(before)) {
                    var test     = before(callback, composer),
                        isMethod = callback instanceof HandleMethod;
                    if ($isPromise(test)) {
                        var accept = test.then(function (accepted) {
                            if (accepted !== false) {
                                _aspectProceed(callback, composer, proceed);
                                return isMethod ? callback.returnValue : true;
                            }
                            return Promise.reject(new RejectedError);
                        });
                        if (isMethod) {
                            callback.returnValue = accept;
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
        },
        /**
         * Decorates the handler to conditionally handle callbacks.
         * @method when
         * @param   {Any}  constraint  -  matching constraint
         * @returns {miruken.callback.ConditionalCallbackHandler}  conditional callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                                        
        when: function (constraint) {
            var when = new _Node(constraint),
                condition = function (callback) {
                    if (callback instanceof Deferred) {
                        return when.match($classOf(callback.callback), Variance.Contravariant);
                    } else if (callback instanceof Resolution) {
                        return when.match(callback.key, Variance.Covariant);
                    } else {
                        return when.match($classOf(callback), Variance.Contravariant);
                    }
                };
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    return condition(callback) && this.base(callback, greedy, composer);
                }
            });
        },
        /**
         * Builds a handler chain.
         * @method next
         * @param   {Arguments}  arguments  -  handler chain members
         * @returns {miruken.callback.CallbackHandler}  chained callback handler.
         * @for miruken.callback.CallbackHandler
         */                                                                                
        next: function () {
            switch(arguments.length) {
            case 0:  return this;
            case 1:  return new CascadeCallbackHandler(this, arguments[0])
            default: return new CompositeCallbackHandler((Array2.unshift(arguments, this), arguments));
            }
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
     * Defines a new handler grouping.  This is the main extensibility point for handling callbacks.
     * @method $define
     * @param   {string}           tag       - group tag
     * @param   {miruken.Variance} variance  - group variance
     * @return  {Function} function to add to a group.
     * @throws  {TypeError} if group already defined.
     * @for $
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
            if ($isArray(constraint)) {
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
            var ok = delegate && _dispatch(delegate, delegate.$meta, callback, constraint, v, composer, all, results);
            if (!ok || all) {
                ok = ok || _dispatch(handler, handler.$meta, callback, constraint, v, composer, all, results);
            }
            return ok;
        };
        function _dispatch(target, meta, callback, constraint, v, composer, all, results) {
            var dispatched = false,
                invariant  = (v === Variance.Invariant),
                index      = meta && _createIndex(constraint);
            while (meta) {
                var list = meta[tag];
                if (list && (!invariant || index)) {
                    var node = list.getIndex(index) || list.head;
                    while (node) {
                        if (node.match(constraint, v)) {
                            var base       = target.base,
                                baseCalled = false;
                            target.base    = function () {
                                var baseResult;
                                baseCalled = true;
                                _dispatch(target, meta.getParent(), callback, constraint, v, composer, false,
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
                meta = meta.getParent();
            }
            return dispatched;
        }
        _definitions[tag] = definition;
        return definition;
    }

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

    /**
     * Gets the effective promise.  This could be the result of a method call.<br/>
     * See {{#crossLink "miruken.callback.HandleMethod"}}{{/crossLink}}
     * @method getEffectivePromise
     * @param    {Object}  object  -  source object
     * @returns  {Promise} effective promise.
     * @for miruken.callback.$
     */
    function getEffectivePromise(object) {
        if (object instanceof HandleMethod) {
            object = object.returnValue;
        }
        return $isPromise(object) ? object : null;
    }

    /**
     * Marks the callback handler for validation.
     * @method $valid
     * @param   {Object}  target  -  object to validate
     * @param   {Any}     scope   -  scope of validation
     * @returns {miruken.callback.CallbackHandlerAspect} validation semantics.
     * @for miruken.callback.CallbackHandler
     */                

    /**
     * Marks the callback handler for asynchronous validation.
     * @method $validAsync
     * @param   {Object}  target  -  object to validate
     * @param   {Any}     scope   -  scope of validation
     * @returns {miruken.callback.CallbackHandlerAspect} validation semantics.
     * @for miruken.callback.CallbackHandler
     */                        

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = callback;
    }

    eval(this.exports);

}
