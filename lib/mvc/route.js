var miruken = require('../miruken.js');
var Promise = require('bluebird');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken",
        exports: "Route,Routing,Router"
    });

    eval(this.imports);

    /**
     * Route definition.
     * @class Route
     * @extends Base
     */    
    var Route = Base.extend({
        name:    undefined,
        pattern: undefined,
        params:  undefined
    });
    
    /**
     * Protocol for routing.
     * @class Routing
     * @extends Protocol
     */
    var Routing = StrictProtocol.extend({
        /**
         * Handles to the specified `route`.
         * @method routeTo
         * @param    {miruken.mvc.Route}  route  -  route
         * @returns  {Promise} navigation promise.
         */
        handleRoute: function (route) {},
        /**
         * Follows the route matching `navigation`.
         * @method followNavigation
         * @param    {miruken.mvc.Navigation}  navigation  -  navigation
         */
        followNavigation: function (navigation) {}
    });

    var controllerKeyRegExp = /(.*)controller$/i;
    
    /**
     * Base class for routing.
     * @class Router
     * @constructor
     * @extends Base
     * @uses miruken.mvc.Routing
     */    
    var Router = Base.extend(Routing, {
        handleRoute: function (route) {
            var name   = route.name,
                params = route.params;
            if (params == null) {
                return Promise.reject(new Error(format(
                    "Missing params route '%1'", name)));
            }
            var controller = params.controller;
            if (controller == null) {
                return Promise.reject(new Error(format(
                    "Missing controller for route '%1'", name)));
            }
            var composer = global.$composer,
                navigate = Navigate(composer),
                action   = params.action || "index",
                execute  = function (ctrl) {
                    var property = this.selectActionMethod(ctrl, action),
                        method   = property && ctrl[property];
                    Controller.bindIO(ctrl.context, ctrl);
                    return $isFunction(method) ? method.call(ctrl, params)
                         : Promise.reject(new Error(format(
                             "%1 missing action '%2' for route '%3'",
                             ctrl, action, name)));
                }.bind(this),
                controllerKey = this.expandControllerKey(controller);

            return navigate.next(controllerKey, execute)
                .catch (function (err) {
                    return (err instanceof ControllerNotFound)
                        && (controllerKey !== controller)
                         ? navigate.to(controller, execute)
                         : Promise.reject(err);
                });
        },
        extractControllerKey: function (controller) {
            var matches = controller.match && controller.match(controllerKeyRegExp);
            return matches ? matches[1].toLowerCase() : controller;
        },
        expandControllerKey: function (controller) {
            return controller.match && !controller.match(controllerKeyRegExp)
                 ? controller + "Controller"
                 : controller;
        },
        selectActionMethod: function (controller, action) {
            if (action in controller) { return action; }
            action = action.toLowerCase();
            for (var property in controller) {
                if (action === property.toLowerCase()) {
                    return property;
                }
            }
        }
    });
    
    eval(this.exports);
    
}
