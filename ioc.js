var miruken = require('./miruken.js'),
    Q       = require('q');
              require('./context.js'),
              require('./validate.js');

new function () { // closure

    /**
     * @namespace miruke.ioc
     */
    var ioc = new base2.Package(this, {
        name:    "ioc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,ComponentKeyPolicy,Lifestyle,TransientLifestyle,SingletonLifestyle,ContextualLifestyle,ComponentModel,IoContainer,DependencyResolution,DependencyResolutionError"
    });

    eval(this.imports);

    /**
     * @protocol {Container}
     */
    var Container = Protocol.extend({
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        },
        /**
         * Registers on or more components in the container.
         * @param   {Any*}    registration  - usually a Registration,
         *                                    ComponentModel or list of policies
         * @returns {Promise} a promise representing the registration.
         */
        register: function (registration) {},
        /**
         * Resolves the component for the key.
         * @param   {Any} key  - key used to identify the component
         * @returns {Any} component (or Promise) satisfying the key.
         */
        resolve: function (key) {}
    });

    /**
     * @protocol {Registration}
     */
    var Registration = Protocol.extend({
        /**
         * Encaluslates the regisration of one or more components.
         * @param {Container} container  - container to register components in
         */
        register: function (container) {}
    });

    /**
     * @protocol {ComponentPolicy}
     */
    var ComponentPolicy = Protocol.extend({
        /**
         * @param   {Any} key  - the current key
         * @returns {Any} effective component key.
         */
        effectiveKey: function (key) {},
        /**
         * @param   {Function} factory  - the current factory
         * @returns {Function} effective component factory.
         */
        effectiveFactory: function (factory) {},
        /**
         * Collects all dependencies for this component.
         * @param   {Array} dependencies  - array receiving dependencies
         */
        collectDependencies: function (dependencies) {},
        /**
         * Collects all interceptors for this component.
         * @param   {Array} interceptors  - array receiving interceptors
         */
        collectInterceptors: function (interceptors) {}
    });

    /**
     * @class {ComponentKeyPolicy}
     */
    var ComponentKeyPolicy = Base.extend(ComponentPolicy, {
        constructor: function () {
            var _key, _service, _class, _factory, _dependencies;
            this.extend({
                getKey: function () { return _key; },
                setKey: function (value) { _key = value; },
                getService: function () { return _service; },
                setService: function (value) {
                    if (!Protocol.isProtocol(value)) {
                        throw new TypeError(lang.format("%1 is not a protocol.", value));
                    }
                    _service = value;
                },
                getClass: function () { return _class; },
                setClass: function (value) {
                    if (!$isClass(value)) {
                        throw new TypeError(lang.format("%1 is not a class.", value));
                    }
                    _class = value;
                },
                getFactory: function () { return _factory; },
                setFactory: function (value) {
                    if (typeOf(value) !== 'function') {
                        throw new TypeError(lang.format("%1 is not a function.", value));
                    }
                    _factory = value;
                },
                getDependecies: function () { return _dependencies.slice(0); },
                setDependencies: function (value) {
                    if (!(value instanceof Array)) {
                        throw new TypeError(lang.format("%1 is not an array.", value));
                    }
                    _dependencies = value;
                },
                effectiveKey: function (key) { return _key || _service ||  _class; },
                effectiveFactory: function (factory) {
                    return _factory || (_class && _class.new.bind(_class));
                },
                collectDependencies: function (dependencies) {
                    var deps = _dependencies ||
                        (_class && (_class.prototype.$inject || _class.$inject));
                    if (deps && deps.length > 0) {
                        dependencies.push.apply(dependencies, deps);
                    }
                }
            });
        }
    });

    /**
     * @class {DependencyResolutionError}
     * @param {DependencyResolution} dependency  - failing dependency
     * @param {String}               message     - error message
     */
    function DependencyResolutionError(dependency, message) {
        this.message    = message;
        this.dependency = dependency;
        this.stack      = new Error().stack;
    }
    DependencyResolutionError.prototype             = new Error();
    DependencyResolutionError.prototype.constructor = DependencyResolutionError;

    /**
     * @class {ComponentModel}
     */
    var ComponentModel = Base.extend(ComponentPolicy, {
        constructor: function (/* policies */) {
            var _policies = new Array2,
                _lifeStyle;
            this.extend({
                getPolicies: function () { return _policies.copy(); },
                getLifestyle: function () { return _lifeStyle; },
                effectiveKey: function (key) {
                    return _policies.reduce(function (k, policy) {
                        return policy.effectiveKey ? policy.effectiveKey(k) : k;
                    }, key);
                },
                effectiveFactory: function (factory) {
                    return _policies.reduce(function (f, policy) {
                        return policy.effectiveFactory ? policy.effectiveFactory(f) : f;
                    }, factory);
                },
                collectDependencies: function (dependencies) {
                    _policies.forEach(function (policy) {
                        if (policy.collectDependencies) {
                            policy.collectDependencies(dependencies);
                        }
                    });
                },
                configure: function (/* policies */) {
                    var policies = Array2.flatten(arguments);
                    switch (policies.length) {
                        case 0: return;
                        case 1:
                        case 2:
                        {
                            var clazz = (policies.length === 1) ? policies[0] : policies[1];
                            if ($isClass(clazz)) {
                                var policy = new ComponentKeyPolicy;
                                policy.setKey(policies[0]);
                                policy.setClass(clazz);
                                policies = [policy];
                            }
                            break;
                        }
                    }
                    policies.forEach(function (policy) {
                        if (policy instanceof ComponentModel) {
                            _policies.push.apply(_policies, policy.getPolicies());
                        } else if (ComponentPolicy.adoptedBy(policy)) {
                            if (policy instanceof Lifestyle) {
                                if (_lifeStyle) {
                                    throw new Error("Only one LifeStyle policy is allowed.");
                                }
                                _lifeStyle = policy;
                            }
                            _policies.push(policy);
                        } else {
                            throw new TypeError(lang.format("%1 is not a ComponentPolicy.", policy));
                        }
                    });
                }
            });
            this.configure(arguments);
        }
    });

    /**
     * @class {Lifestyle}
     */
    var Lifestyle = Base.extend(ComponentPolicy, {
        resolve: function (factory) {
            return factory();
        }
    });

   /**
     * @class {TransientLifestyle}
     */
    var TransientLifestyle = Lifestyle.extend();

   /**
     * @class {SingletonLifestyle}
     */
    var SingletonLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
                resolve: function (factory) {
                    return instance || (instance = factory(true));
                }
            });
        }
    });

   /**
     * @class {ContextualLifestyle}
     */
    var ContextualLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
				resolve: function (factory, composer) {
					var context = composer.resolve(Context);
                }
            });
        }
    });

    /**
     * @class {DependencyResolution}
     */
    var DependencyResolution = CallbackResolution.extend({
        constructor: function (key, parent) {
            var _owner;
            this.base(key);
            this.extend({
                claim: function (owner) { 
                    if (this.isResolvingDependency(key, owner)) {
                        return false;
                    }
                    _owner = owner;
                    return true;
                },
                isResolvingDependency: function (dependency, requestor) {
                    if ((dependency === key) && (requestor === _owner)) {
                        return true;
                    }
                    return parent && parent.isResolvingDependency(dependency, requestor);
                },
                formattedDependencyChain: function () {
                    return parent ? (key + " <= " + parent.formattedDependencyChain()) : key;
                }
            });
        }
    });

    /**
     * @class {IoContainer}
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            this.extend({
                register: function (registration) {
                    if (Registration.adoptedBy(registration)) {
                        return registration.register(this);
                    }
                    var container      = this,
                        componentModel = new ComponentModel(arguments); 
                    return Validator($composer).validate(componentModel).then(function () {
                        var unregister = container.registerHandler(componentModel);
						return { componentModel: componentModel, unregister: unregister };
                    });
                },
                registerHandler: function(componentModel) {
                    var key          = componentModel.effectiveKey(),
                        factory      = componentModel.effectiveFactory(),
                        lifestyle    = componentModel.getLifestyle() || new SingletonLifestyle,
                        dependencies = [];
                        componentModel.collectDependencies(dependencies);
                    return _registerHandler(this, key, factory, lifestyle, dependencies); 
                }
            })
        },
        $validators:[
            ComponentModel, function (validation, composer) {
                var componentModel = validation.getObject();
                return Q.allSettled(
                    Array2.map(componentModel.getPolicies(), function (policy) {
                        return Validator(composer).validate(policy).fail(function (child) {
                            validation.addChildResult(child);
                        });
                    })
                ).then(function () {
                    if (validation.isValid()) {
                        var key     = componentModel.effectiveKey(),
                            factory = componentModel.effectiveFactory();
                        if (!key) {
                            validation.required('Key', 'Key could not be determined for component.');
                        }
                        if (!factory) {
                            validation.required('Factory', 'Factory could not be determined for component.');
                        }
                    }
                    return validation.isValid() ? Q(validation) : Q.reject(validation);
                });
            },
            ComponentKeyPolicy, function (validation) {
                var keyPolicy = validation.getObject(),
                    service   = keyPolicy.getService(),
                    clazz     = keyPolicy.getClass();
                if (service && clazz && !clazz.conformsTo(service)) {
                    validation.typeMismatch('Class', clazz,
                        lang.format('Class %1 does not conform to service %2.', clazz, service));
                }
            }]
    });

    /**
     * Performs the actual component registration in the container.
     * @param   {IoContainer} container     - container
     * @param   {Any}         key           - key to register
     * @param   {Function}    factory       - creates new instance
     * @param   {Lifestyle}   lifesyle      - manages component creation
     * @param   {Array}       dependencies  - component dependencies
	 * @returns {Function} function to unregister the component.
     */
    function _registerHandler(container, key, factory, lifestyle, dependencies) {
        var unbind = $provide(container, key, function (resolution, composer) {
            if ((resolution instanceof DependencyResolution) &&
                (resolution.claim(container) === false) /* cycle */) {
                return Q.reject(new DependencyResolutionError(resolution,
                    lang.format("Dependency cycle %1 detected.",
                                resolution.formattedDependencyChain())))
            }
            return lifestyle.resolve(function (replace) {
                var promises   = [],
                    parameters = [];
                for (var index = 0; index < dependencies.length; ++index) {
                    var dependency = dependencies[index],
                        use        = $use.test(dependency),
                        lazy       = $lazy.test(dependency),
                        promise    = $promise.test(dependency);
                        dependency = Modifier.unwrap(dependency);
                    if (use) {
                        if (lazy || promise) {
                            dependency = Q(dependency);
                            if (lazy) {
                                dependency = $lift(dependency);
                            }
                        }
                    } else {
                        if (!(resolution instanceof DependencyResolution)) {
                            resolution = new DependencyResolution(resolution.getKey());
                            resolution.claim(container);
                        }
                        var paramDependency = new DependencyResolution(dependency, resolution);
                        if (lazy) {
                            dependency = function () {
                                return Q(_resolveDependency(paramDependency, true, composer));
                            };
                        } else {
                            dependency = _resolveDependency(paramDependency, true, composer);
                            if (promise) {
                                dependency = Q(dependency);
                            } else if (Q.isPromiseAlike(dependency)) {
                                promises.push(dependency);
                                (function (paramDep, paramIndex) {
                                    paramDep.then(function (param) {
                                        parameters[paramIndex] = param;
                                    });
                                })(dependency, index);
                            }
                        }
                    }
                    parameters.push(dependency);
                }
                function createInstance () {
                    var instance = factory.apply(container, parameters);
                    if (replace) {
                        unbind();
                        unbind = $provide(container, key, $lift(instance));
                    }
                    return instance;
                }
                if (promises.length === 1) {
                    return promises[0].then(createInstance);
                } else if (promises.length > 0) {
                    return Q.all(promises).then(createInstance);
                } else {
                    return createInstance();
                }
            }, composer);
        });
		return function () { unbind(); }
    }

    function _resolveDependency(dependency, required, composer) {
        var result = composer.resolve(dependency);
        return ((result === undefined) && required)
             ? Q.reject(new DependencyResolutionError(dependency,
                   lang.format("Dependency %1 could not be resolved.",
                               dependency.formattedDependencyChain())))
             : result;
    }

    if (typeof module !== 'undefined' && module.exports)
        module.exports = exports = ioc;

    eval(this.exports);

}