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
            var controller = params.controller;
            if (controller == null || controller.length === 0) {
                return Promise.reject("Controller could not be determined for state "
                                      + state.current.name);
            }            
        
            var navigate = Navigate(context.unwind()),
                action   = params.action || "index",
                execute  = function (ctrl) {
                    var method = ctrl[action];
                    return $isFunction(method)
                         ? method.call(ctrl, params)
                         : Promise.reject(new Error(ctrl + " missing action " + action));
                },
                controllerName = this.inferControllerName(controller);

            return navigate.to(controllerName, execute)
                .catch (function (err) {
                    return err instanceof ControllerNotFound
                         ? navigate.to(controller, execute)
                         : Promise.reject(err);
                })
                .catch(function (err) {
                    Errors(context).handleError(err, "ui-router");
                });        
        },
        inferControllerName: function (controller) {
            return controller.endsWith("Controller") ? controller : controller + "Controller";
        }
    }, {
        use: function ($stateProvider) {
            return $stateProvider.state("mvc", {
                abstract:   true,
                template:   "<div region='route'></div>",
                controller: ["$scope", function ($scope) {
                    var router  = $scope.router,
                        context = $scope.context;
                    if (!router) {
                        $scope.router = router = new UiRouter();
                        $scope.$on("$stateChangeSuccess", function(event, toState, toParams) {
                            router.executeController(context, toParams, toState);                        
                        });
                    }
                }]
            });
        },
        mvc: function ($stateProvider) {
            return this.use($stateProvider)
                .state("mvc.default-id",
                       this.route("/{controller}/{action}/{id}"))
                .state("mvc.default",
                       this.route("/{controller}/{action}"));            
        },
        route: function (urlPattern, options) {
            var route  = { url: urlPattern };
            if (options) { route.params = options; }
            return route;
        }
    });

    eval(this.exports);
    
}
