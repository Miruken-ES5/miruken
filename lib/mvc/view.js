var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');
              require('./model.js');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "ViewRegion,PartialRegion"
    });

    eval(this.imports);

    /**
     * Protocol for rendering a view on the screen.
     * @class ViewRegion
     * @extends StrictProtocol
     */
    var ViewRegion = StrictProtocol.extend({
        /**
         * Renders a controller or view in the region.
         * @method present
         * @param   {Object}  presentation  -  presentation options
         * @returns {Promise} promise reflecting render.
         */                                        
        present: function (presentation) {}
    });

    /**
     * Protocol for rendering a view in an area on the screen.
     * @class PartialRegion
     * @extends {miruken.mvc.ViewRegion}
     */
    var PartialRegion = ViewRegion.extend({
        /**
         * Gets the region's context.
         * @method getContext
         * @returns {miruken.context.Context} region context.
         */
        getContext: function () {},
        /**
         * Gets the region's controller.
         * @method getController
         * @return {miruken.mvc.Controller} region controller.
         */            
        getController: function () {},
        /**
         * Gets the region's controller context.
         * @method getControllerContext
         * @return {miruken.context.Context} region controller context.
         */            
        getControllerContext: function () {}
    });

    CallbackHandler.implement({
        /**
         * Schedules the $digest to run after callback is handled.
         * @method $ngApply
         * @returns {miruken.callback.CallbackHandler}  $digest aspect.
         * @for miruken.callback.CallbackHandler
         */                                                                
        modal: function() {
            return this.decorate({
                handleCallback: function (callback, greedy, composer) {
                    if (callback instanceof InvocationSemantics) {
                        semantics.mergeInto(callback);
                        return true;
                    }
                    return this.base(callback, greedy, composer);
                }
            });
        }
    });
    
    eval(this.exports);
    
}
