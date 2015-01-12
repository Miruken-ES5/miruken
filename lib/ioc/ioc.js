var miruken = require('../miruken.js'),
    Q       = require('q');
              require('../context.js'),
              require('../validate.js');

new function () { // closure

    /**
     * @namespace miruken.ioc
     */
    var ioc = new base2.Package(this, {
        name:    "ioc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,Lifestyle,TransientLifestyle,SingletonLifestyle,ContextualLifestyle,DependencyModifiers,DependencyModel,DependencyManager,DependencyInspector,ComponentModel,ComponentBuilder,IoContainer,DependencyResolution,DependencyResolutionError,$component,$$composer,$container"
    });

    eval(this.imports);

    /**
     * Composer dependency.
     */
    var $$composer = {},
        $container = $createModifier();

    /**
     * @protocol {Container}
     */
    var Container = Protocol.extend(Disposing, {
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        },
        /**
         * Registers on or more components in the container.
         * @param   {Any*}    registrations  - Registrations
         * @returns {Promise} a promise representing the registration.
         */
        register: function (/*registrations*/) {},
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
         * Encapsulates the regisration of one or more components.
         * @param {Container}       container  - container to register components in
         * @param {CallbackHandler} composer   - supports composition
         */
         register: function (container, composer) {}
    });

    /**
     * @protocol {ComponentPolicy}
     */
    var ComponentPolicy = Protocol.extend({
        /**
         * Applies the policy to the ComponentModel.
         * @param {ComponentModel} componentModel  - component model
         */
         apply: function (componentModel) {}
    });

    /**
     * DependencyModifiers enum
     * @enum {Number}
     */
    var DependencyModifiers = {
        None:       0,
        Use:        1 << 0,
        Lazy:       1 << 1,
        Dynamic:    1 << 2,
        Optional:   1 << 3,
        Promise:    1 << 4,
        Invariant:  1 << 5,
        Container:  1 << 6,
        Child:      1 << 7
    };

    /**
     * @class {DependencyModel}
     */
    var DependencyModel = Base.extend({
        constructor: function (dependency, modifiers) {
            modifiers = modifiers || DependencyModifiers.None;
            if (dependency instanceof Modifier) {
                if ($use.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Use;
                }
                if ($lazy.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Lazy;
                }
                if ($eval.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Dynamic;
                }
                if ($child.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Child;
                }
                if ($optional.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Optional;
                }
                if ($promise.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Promise;
                }
                if ($container.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Container;
                }
                if ($eq.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Invariant;
                }
                dependency = Modifier.unwrap(dependency);
            }
            this.extend({
                getDependency: function () { return dependency; },
                getModifiers: function () { return modifiers; },
                test: function (modifier) {
                    return (modifiers & modifier) === modifier;
                }
            });
        }
    }, {
        coerce: function (object) {
           return (object === undefined) ? undefined : new DependencyModel(object);
        }
    });

    /**
     * @class {DependencyManager}
     */
    var DependencyManager = Base.extend({
        constructor: function (dependencies) {
            dependencies = dependencies || [];
            this.extend({
                getDependencies: function () { return dependencies; },
                getIndex: function (index) {
                    if (dependencies.length > index) {
                        return dependencies[index];
                    }
                },
                setIndex: function (index, dependency) {
                    if ((dependencies.length <= index) ||
                        (dependencies[index] === undefined)) {
                        dependencies[index] = DependencyModel(dependency);
                    }
                    return this;
                },
                insertIndex: function (index, dependency) {
                    dependencies.splice(index, 0, DependencyModel(dependency));
                    return this;
                },
                replaceIndex: function (index, dependency) {
                    dependencies[index] = DependencyModel(dependency);
                    return this;
                },
                removeIndex: function (index) {
                    if (dependencies.length > index) {
                        dependencies.splice(index, 1);
                    }
                    return this;
                },
                append: function (/* dependencies */) {
                    var deps = Array2.flatten(arguments).map(DependencyModel);
                    dependencies.push.apply(dependencies, deps);
                    return this;
                },
                merge: function (dependencies) {
                    for (var index = 0; index < dependencies.length; ++index) {
                        var dependency = dependencies[index];
                        if (dependency !== undefined) {
                            this.setIndex(index, dependency);
                        }
                    }
                    return this;
                }
            });
        }
    });

    /**
     * @class {DependencyInspector}
     */
    var DependencyInspector = Base.extend({
        inspect: function (componentModel, policies) {
            // Dependencies will be merged from $inject definitions
            // starting from most derived unitl no more remain or the
            // current definition is fully specified (no undefined).
            var dependencies = componentModel.getDependencies();
            if (dependencies && !Array2.contains(dependencies, undefined)) {
                return;
            }
            var clazz = componentModel.getClass();
            componentModel.manageDependencies(function (dependencies) {
                while (clazz && (clazz !== Base)) {
                    var injects = [clazz.prototype.$inject, clazz.$inject];
                    for (var i = 0; i < injects.length; ++i) {
                        var inject = injects[i];
                        if (inject !== undefined) {
                            if (!(inject instanceof Array)) {
                                inject = [inject];
                            }
                            dependencies.merge(inject);
                            if (!Array2.contains(inject, undefined)) {
                                return;
                            }
                        }
                    }
                    clazz = $ancestorOf(clazz);
                }
            });
        }
    });

    /**
     * @class {ComponentModel}
     */
    var ComponentModel = Base.extend({
        constructor: function () {
            var _key, _class, _lifestyle, _factory,
                _dependencies, _invariant = false;
            this.extend({
                getKey: function () {
                    return _key || _class
                },
                setKey: function (value) { _key = value; },
                getClass: function () {
                    var clazz = _class;
                    if (!clazz && $isClass(_key)) {
                        clazz = _key;
                    }
                    return clazz;
                },
                setClass: function (value) {
                    if ($isSomething(value) && !$isClass(value)) {
                        throw new TypeError(lang.format("%1 is not a class.", value));
                    }
                    _class = value;
                },
                isInvariant: function () {
                    return _invariant;
                },
                setInvariant: function (value) { _invariant = !!value; },
                getLifestyle: function () { return _lifestyle; },
                setLifestyle: function (value) {
                    if (!$isSomething(value) && !(value instanceof Lifestyle)) {
                        throw new TypeError(lang.format("%1 is not a Lifestyle.", value));
                    }
                    _lifestyle = value; 
                },
                getFactory: function () {
                    var factory = _factory,
                        clazz   = this.getClass();
                    if (!factory && clazz) {
                        factory = clazz.new.bind(clazz);
                    }
                    return factory;
                },
                setFactory: function (value) {
                    if ($isSomething(value) && !$isFunction(value)) {
                        throw new TypeError(lang.format("%1 is not a function.", value));
                    }
                    _factory = value;
                },
                getDependencies: function () { return _dependencies; },
                setDependencies: function (value) {
                    if ($isSomething(value) && !(value instanceof Array)) {
                        throw new TypeError(lang.format("%1 is not an array.", value));
                    }
                    _dependencies = Array2.map(value, DependencyModel);
                },
                manageDependencies: function (actions) {
                    if ($isFunction(actions)) {
                        var manager = new DependencyManager(_dependencies);
                        actions(manager);
                        if (_dependencies === undefined) {
                            var dependencies = manager.getDependencies();
                            if (dependencies.length > 0) {
                                _dependencies = manager.getDependencies();
                            }
                        }
                    }
                    return _dependencies;
                }
            });
        }
    });

    /**
     * @class {Lifestyle}
     */
    var Lifestyle = Base.extend(ComponentPolicy, Disposing, DisposingMixin, {
        resolve: function (factory) { return factory(); },
        trackInstance: function (instance) {
            if (instance && $isFunction(instance.dispose)) {
                var _this = this;
                instance.extend({
                    dispose: function (disposing) {
                        if (disposing || _this.disposeInstance(instance, true)) {
                            this.base();
                            this.dispose = this.base;
                        }
                    }
                });
            }
        },
        disposeInstance: function (instance, disposing) {
            if (!disposing && instance && $isFunction(instance.dispose)) {
                instance.dispose(true);
            }
            return !disposing;
        },
        apply: function (componentModel) {
            componentModel.setLifestyle(this);
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
                    if (!instance) {
                        var _this = this;
                        return Q(factory()).then(function (object) {
                            // Only cache fulfilled instances
                            if (!instance && object) {
                                instance = object;
                                _this.trackInstance(instance);
                            }
                            return instance;
                        });
                    }
                    return instance;
                },
                disposeInstance: function (obj, disposing) {
                    // Singletons cannot be disposed directly
                    if (!disposing && (obj === instance)) {
                        if (this.base(obj, disposing)) {
                           instance = undefined;
                           return true;
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    this.disposeInstance(instance);
                }
            });
        }
    });

   /**
     * @class {ContextualLifestyle}
     */
    var ContextualLifestyle = Lifestyle.extend({
        constructor: function () {
            var _cache = {};
            this.extend({
                resolve: function (factory, composer) {
                    var context = composer.resolve(Context);
                    if (context) {
                        var id       = assignID(context),
                            instance = _cache[id];
                        if (!instance) {
                            var _this = this;
                            return Q(factory()).then(function (object) {
                                // Only cache fulfilled instances
                                if (object && !(instance = _cache[id])) {
                                    _cache[id] = instance = object;
                                    if (Contextual.adoptedBy(object) ||
                                        $isFunction(object.setContext)) {
                                        ContextualHelper.bindContext(object, context);
                                    }
                                    _this.trackInstance(instance);
                                    var cancel = context.observe({
                                        contextEnded: function () {
                                            _this.disposeInstance(instance);
                                            delete _cache[id];
                                            cancel();
                                        }
                                    });
                                }
                                return instance;
                            });
                        }
                        return instance;
                    }
                },
                disposeInstance: function (instance, disposing) {
                    if (!disposing) {  // Cannot be disposed directly
                        for (contextId in _cache) {
                            if (_cache[contextId] === instance) {
                                this.base(instance, disposing);
                                delete _cache[contextId];
                                return true;
                            } 
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    for (contextId in _cache) {
                        this.disposeInstance(_cache[contextId]);
                    }
                    _cache = {};
                }
            });
        }
    });

    /**
     * @class {ComponentBuilder}
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel,
                _policies       = [],
                _newInContext, _newInChildContext;
            _componentModel.setKey(key);
            this.extend({
                invariant: function () {
                    _componentModel.setInvariant();
                },
                boundTo: function (clazz) {
                    _componentModel.setClass(clazz);
                    return this;
                },
                dependsOn: function (/* dependencies */) {
                    _componentModel.setDependencies(Array2.flatten(arguments));
                    return this;
                },
                usingFactory: function (factory) {
                    _componentModel.setFactory(factory);
                    return this;
                },
                instance: function (instance) {
                    _componentModel.setLifestyle(new SingletonLifestyle(instance));
                    return this;
                },
                singleton: function () {
                    _componentModel.setLifestyle(new SingletonLifestyle);
                    return this;
                },
                transient: function () {
                    _componentModel.setLifestyle(new TransientLifestyle);
                    return this;
                },
                contextual: function () {
                    _componentModel.setLifestyle(new ContextualLifestyle);
                    return this;
                },
                newInContext: function () {
                    _newInContext = true;
                    return this;
                },
                newInChildContext: function () {
                    _newInChildContext = true;
                    return this;
                },
                getPolicy: function (policyClass) {
                    for (var i = 0; i < _policies.length; ++i) {
                        var policy = _policies[i];
                        if (policy instanceof policyClass) {
                            return policy;
                        }
                    }
                },
                addPolicy: function (policy) {
                    if (this.getPolicy($classOf(policy))) {
                        return false;
                    }
                    _policies.push(policy);
                    return true;
                },
                register: function(container) {
                    if ( _newInContext || _newInChildContext) {
                        var clazz = _componentModel.getClass();
                        if (clazz) {
                            var ctor = _newInContext
                                     ? clazz.newInContext 
                                     : clazz.newInChildContext;
                            _componentModel.setFactory(function () {
                                var parameters = Array.prototype.slice.call(arguments);
                                parameters.unshift(this.resolve(Context));
                                return ctor.apply(clazz, parameters);
                            });
                        }
                    }
                    return container.addComponent(_componentModel);
                }
            });
        }
    });

    /**
     * @function $component
     * @param   {Any} key - component key
     * @returns {ComponentBuilder} a fluent component builder.
     */
    function $component(key) {
        return new ComponentBuilder(key);
    }

    /**
     * @class {DependencyResolution}
     */
    var DependencyResolution = Resolution.extend({
        constructor: function (key, parent) {
            var _owner, _class;
            this.base(key);
            this.extend({
                claim: function (owner, clazz) { 
                    if (this.isResolvingDependency(key, owner)) {
                        return false;
                    }
                    _owner = owner;
                    _class = clazz;
                    return true;
                },
                isResolvingDependency: function (dependency, requestor) {
                    if ((requestor === _owner)
                    &&  (Modifier.unwrap(dependency) == Modifier.unwrap(key))) {
                        return true;
                    }
                    return parent && parent.isResolvingDependency(dependency, requestor);
                },
                formattedDependencyChain: function () {
                    var invariant  = $eq.test(key),
                        keyDisplay = invariant ? ('`' + Modifier.unwrap(key) + '`') : key,
                        display    = _class ? ("(" + keyDisplay + " <- " + _class + ")") : keyDisplay;
                    return parent 
                         ? (display + " <= " + parent.formattedDependencyChain())
                         : display;
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
     * @class {IoContainer}
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            var _inspectors = [new DependencyInspector];
            this.extend({
                register: function (/*registrations*/) {
                    var _this = this;
                    return Q.all(Array2.flatten(arguments).map(function (registration) {
                               return registration.register(_this, $composer);
                           }));
                },
                addComponent: function (componentModel, policies) {
                    var _this = this;
                    policies  = policies || [];
                    for (var i = 0; i < _inspectors.length; ++i) {
                        _inspectors[i].inspect(componentModel, policies);
                    }
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.apply)) {
                            policy.apply(componentModel);
                        }
                    }
                    return Validator($composer).validate(componentModel).then(function () {
                        return _this.registerHandler(componentModel); 
                    })
                },
                addInspector: function (inspector) {
                    if (!$isFunction(inspector.inspect)) {
                        throw new TypeError("Inspectors must have an inspect method.");
                    }
                    _inspectors.push(inspector);
                },
                removeInspector: function (inspector) {
                    Array2.remove(_inspectors,inspector);
                },
                registerHandler: function(componentModel) {
                    var key          = componentModel.getKey(),
                        clazz        = componentModel.getClass(),
                        factory      = componentModel.getFactory(),
                        dependencies = componentModel.getDependencies() || [],
                        lifestyle    = componentModel.getLifestyle() || new SingletonLifestyle;
                    key = componentModel.isInvariant() ? $eq(key) : key;
                    return _registerHandler(this, key, clazz, lifestyle, factory, dependencies); 
                },
                dispose: function () {
                    $provide.removeAll(this);
                }
            })
        },
        $validate:[
            ComponentModel, function (validation, composer) {
                var componentModel = validation.getObject(),
                    key            = componentModel.getKey(),
                    clazz          = componentModel.getClass(),
                    factory        = componentModel.getFactory();
                if (!key) {
                    validation.required('Key', 'Key could not be determined for component.');
                }
                if (!factory) {
                    validation.required('Factory', 'Factory could not be determined for component.');
                }
            }]
    });

    function _registerHandler(container, key, clazz, lifestyle, factory, dependencies) {
        return $provide(container, key, function (resolution, composer) {
            if ((resolution instanceof DependencyResolution) &&
                (resolution.claim(container, clazz) === false) /* cycle */) {
                return Q.reject(new DependencyResolutionError(resolution,
                    lang.format("Dependency cycle %1 detected.",
                                resolution.formattedDependencyChain())))
            }
            return lifestyle.resolve(
                _activate.bind(container, clazz, factory, dependencies, resolution, composer),
                composer
            );
        }, lifestyle.dispose.bind(lifestyle));
    }

    function _activate(clazz, factory, dependencies, resolution, composer) {
        var parameters   = [], promises = [],
            containerDep = Container(composer);
        for (var index = 0; index < dependencies.length; ++index) {
            var dep = dependencies[index];
            if (dep === undefined) {
                continue;
            }
            var use        = dep.test(DependencyModifiers.Use),
                lazy       = dep.test(DependencyModifiers.Lazy),
                promise    = dep.test(DependencyModifiers.Promise),
                child      = dep.test(DependencyModifiers.Child),
                dynamic    = dep.test(DependencyModifiers.Dynamic),
                dependency = dep.getDependency();
            if (use || dynamic || $isNothing(dependency)) {
                if (dynamic && $isFunction(dependency)) {
                    dependency = dependency(containerDep);
                }
                if (child) {
                    dependency = _createChild(dependency);
                }
                if (promise) {
                    dependency = Q(dependency);
                }
            } else if (dependency === $$composer) {
                dependency = composer;
            } else if (dependency === Container) {
                dependency = containerDep;
            } else {
                var optional      = dep.test(DependencyModifiers.Optional),
                    invariant     = dep.test(DependencyModifiers.Invariant),
                    fromContainer = dep.test(DependencyModifiers.Container);
                if (invariant) {
                    dependency = $eq(dependency);
                }
                if (lazy) {
                    dependency = (function (paramDep, created, param) {
                        return function () {
                            if (!created) {
                                created = true;
                                var container = fromContainer ? containerDep : composer;
                                param = _resolveDependency(paramDep, false, promise, child, container);
                            }
                            return param;
                        };
                    })(dependency);
                } else {
                    if (!(resolution instanceof DependencyResolution)) {
                        resolution = new DependencyResolution(resolution.getKey());
                        resolution.claim(this, clazz);
                    }
                    var paramDep  = new DependencyResolution(dependency, resolution),
                        container = fromContainer ? containerDep : composer;
                    dependency = _resolveDependency(paramDep, !optional, promise, child, container);
                    if (!promise && $isPromise(dependency)) {
                        promises.push(dependency);
                        (function (paramPromise, paramIndex) {
                            paramPromise.then(function (param) {
                                parameters[paramIndex] = param;
                            });
                        })(dependency, index);
                    }
                }
            }
            parameters[index] = dependency;
        }
        function createInstance () {
            return factory.apply(composer, parameters);
        }
        if (promises.length === 1) {
            return promises[0].then(createInstance);
        } else if (promises.length > 0) {
            return Q.all(promises).then(createInstance);
        } else {
            return createInstance();
        }
    }
    
    function _resolveDependency(dependency, required, promise, child, composer) {
        var result = composer.resolve(dependency);
        if (result === undefined) {
            return required
                 ? Q.reject(new DependencyResolutionError(dependency,
                       lang.format("Dependency %1 could not be resolved.",
                                   dependency.formattedDependencyChain())))
                 : result;
        } else if (child) {
            result = $isPromise(result) 
                 ? result.then(function (parent) { return _createChild(parent); })
                 : _createChild(result)
        }
        return promise ? Q(result) : result;
    }

    function _createChild(parent) {
        if (!(parent && $isFunction(parent.newChild))) {
            throw new Error(lang.format(
                "Child dependency requested, but %1 is not a parent.", parent));
        }
        return parent.newChild();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = ioc;
    } else if (typeof define === "function" && define.amd) {
        define("miruken.ioc", [], function() {
            return ioc;
        });
    }

    eval(this.exports);

}