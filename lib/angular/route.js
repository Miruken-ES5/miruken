var miruken = require('../miruken');
              require('../mvc');
              require('../error');

new function () { // closure

    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.error,miruken.mvc",
        exports: "UiRouter"
    });

    eval(this.imports);

    /**
     * Adapts the [Angular ui-router] (https://github.com/angular-ui/ui-router)
     * to support conventional MVC routing semantics
     * @class UiRouter
     * @extends Base     
     */
    var UiRouter = Base.extend({
        executeController: function (context, params, state) {
            this.resolveController(context, params, state).then(function (ctrl) {
                var action = params.action || "index",
                    method = ctrl[action];
                return $isFunction(method)
                     ? method.call(ctrl, params)
                     : Promise.reject(ctrl + " missing action " + action);
            })
            .catch(function (err) { Errors(context).handleError(err, "ui-router"); });
        },
        resolveController: function (context, params, state) {
            var controller = params.controller;
            if (controller == null || controller.length === 0) {
                return Promise.reject("Controller could not be determined for state " + state.current.name);
            }            
            controllerName = this.inferControllerName(controller);
            var findController = context.resolve(controllerName);
            return Promise.resolve(findController).then(function (ctrl) {
                if (ctrl) { return ctrl; }
                if (controllerName != controller) {
                    findController = context.resolve(controller);
                    return Promise.resolve(findController).then(function (ctrl) {
                        return ctrl ? ctrl : Promise.reject(controllerName + " could not be resolved");
                    });
                }
                return Promise.reject(controller + " Controller could not be resolved");
            });
        },
        inferControllerName: function (controller) {
            return controller.endsWith("Controller") ? controller : controller + "Controller";
        }
    }, {
        route: function (urlPattern, options) {
            var router = new UiRouter(),
                route  = {
                    url:     urlPattern,
                    router:  router,
                    onEnter: ["$rootScope", "$rootElement", function ($rootScope, $rootElement) {
                        var success = $rootScope.$on("$stateChangeSuccess", function (event, state, params) {
                            success();
                            var scope   = event.targetScope,
                                context = scope.context,
                                region  = params.region;
                            if ($isString(region) && region.length > 0) {
                                var regionElement = $rootElement.find("[region='" + region+ "']");
                                if (!regionElement) {
                                    throw new Error(format("UiRouter cannot find region element '%1'.", region));
                                }
                                context = regionElement.scope().context;
                            }
                            router.executeController(context, params, state);                                  
                        });
                    }]
                };
            if (options) { route.params = options; }
            return route;
        }
    });

    eval(this.exports);
    
}
