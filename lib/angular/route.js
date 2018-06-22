var miruken = require('../miruken');
              require('../mvc');
              require('../error');

new function () { // closure

    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.error,miruken.mvc",
        exports: "RouteRegion,RouteRegionDirective,UiRouter"
    });

    eval(this.imports);
    
    var RouteRegion = PartialRegion.extend({
        constructor: function () {
            this.base.apply(this, arguments);
            this.extend({
                show: function (view) {
                    var composer = $composer,
                        layer    = this.base(view);
                    var navigate = composer.resolve(Navigation);
                    if (!navigate) { return layer; }
                    return layer.then(function (result) {
                        if (result.index === 0) {
                            Routing(composer).followNavigation(navigate);
                        }
                        return result;
                    });
                }
            });
        }
    });
    
    /**
     * Adapts the [Angular ui-router] (https://github.com/angular-ui/ui-router)
     * to support conventional MVC routing semantics
     * @class UiRouter
     * @extends Router
     */
    var UiRouter = Router.extend(context.$contextual, {
        constructor: function (prefix, $state, $urlMatcherFactory) {
            var _urls = {};            
            prefix = prefix + ".";
            this.extend({
                handleRoute: function (route) {
                    $state.go(route.name, route.params);
                    return this.base(route);
                },
                followNavigation: function (navigation) {
                    var states = $state.get();
                    for (var i = 0; i < states.length; ++i) {
                        var state = states[i],
                            route = state.name;
                        if (!state.abstract && route.indexOf(prefix) === 0) {
                            var url = _urls[route];
                            if (!url) {
                                url = $urlMatcherFactory.compile(state.url);
                                _urls[route] = url;
                            }
                            var params = Object.create(state.params || null);
                            if (this.matchesRoute(navigation, url, params)) {
                                $state.go(route, params, { notify: false });
                                return;
                            }
                        }
                    }
                }
            });
        },
        rejectRoute: function (route, error) {
            return Errors($composer).handleError(error, "ui-router");
        },        
        matchesRoute: function (navigation, url, params) {
            var urlParams = url.params,
                navAction = navigation.action.toLowerCase(),
                action    = params.action;
            
            if ((action == null || navAction == null ||
                 action.toLowerCase() !== navAction) && !("action" in urlParams)) {
                return false;
            }
            params.action = navAction;
            
            var navController = navigation.controller,
                controller    = params.controller;
            if (controller) {
                if ($isFunction(controller) && !(navController instanceof controller)) {
                    return false;
                } else if (!$isString(controller)) {
                    return false;
                }
                var key  = this.extractControllerKey(controller),
                    keys = Array2.filter(navController.componentModel.key, $isString);
                if (!Array2.some(keys, function (k) {
                    return this.extractControllerKey(k) === key;
                })) {
                    return false;
                };
                params.controller = key;
            } else if (!("controller" in urlParams)) {
                return false;
            } else {
                var keys = Array2.filter(navController.componentModel.key, $isString);
                if (keys.length === 0) { return false; }
                params.controller = this.extractControllerKey(keys[0]);
            }

            var args    = navigation.args;
                urlKeys = Object.getOwnPropertyNames(urlParams); 
            if (args && args.length === 1) {
                args = args[0];
            }
            for (var i = 0; i < urlKeys.length; ++i) {
                var urlKey = urlKeys[i];
                if (!(urlKey in params)) {
                    if (args && (urlKey in args)) {
                        params[urlKey] = args[urlKey];
                    } else {
                        return false;
                    }
                }
            }
            return true;
        }
    }, {
        install: function (prefix, created) {
            var clazz = this;
            return {
                name:       prefix,
                abstract:   true,
                template:   "<div route-region></div>",
                controller: ["$scope", "$state", "$urlMatcherFactory",
                             function ($scope, $state, $urlMatcherFactory) {
                    var context = $scope.context,
                        router  = clazz.new.call(clazz, prefix, $state, $urlMatcherFactory);
                    router.context = context;
                    context.addHandlers(router);
                    new Controller().context = context;  // dummy controller
                    $scope.$on("$stateChangeSuccess", function (event, toState, toParams) {
                        var route = new Route({
                                name:    toState.name,
                                pattern: toState.url,
                                params:  toParams
                            }),
                            locals = [Route, route];
                        
                        var ctx = context.$$provide(locals);
                        Routing(ctx.unwind()).handleRoute(route);
                    });
                    if ($isFunction(created)) {
                        created(router);                 
                    }
                }]
            };
        },
        route: function (urlPattern, options) {
            var route = { url: urlPattern };
            if (options) { route.params = options; }
            return route;
        }
    });

    /**
     * Specialized {{#crossLink "miruken.ng.RegionDirective"}}{{/crossLink}}
     * for hosting routed content.
     * @class RouteRegionDirective
     * @constructor
     * @extends miruken.ng.RegionDirective     
     */    
    var RouteRegionDirective = RegionDirective.extend({
        scope: false,
        createRegion: function (tag, element, $templates, $compile, $q, $timeout) {
            return new RouteRegion(tag, element, $templates, $compile, $q, $timeout);
        }
    });

    eval(this.exports);
    
}
