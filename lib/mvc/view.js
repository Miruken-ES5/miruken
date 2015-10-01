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
        imports: "miruken,miruken.callback,miruken.context",
        exports: "PresentationPolicy,ViewRegion,PartialRegion,ButtonClicked"
    });

    eval(this.imports);

    /**
     * Base class for presentation policies.
     * @class PresentationPolicy
     * @extends miruken.mvc.Model
     */
    var PresentationPolicy = Model.extend();

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
         * @property {miruken.context.Context} context
         */
        get context() {},
        /**
         * Gets the region's controller.
         * @property {miruken.mvc.Controller} controller
         */            
        get controller() {},
        /**
         * Gets the region's controller context.
         * @property {miruken.context.Context} controllerContext
         */            
        get controllerContext() {}
    });

    /**
     * Represents the clicking of a button.
     * @class ButtonClicked
     * @constructor
     * @param  {Object}  button  -  clicked button 
     * @extends Base
     */
    var ButtonClicked = Base.extend({
        constructor: function (button, buttonIndex) {
            this.extend({
                /**
                 * Gets the clicked button.
                 * @property {Object} button
                 */                                
                get button() { return button; },
                /**
                 * Gets the clicked button index.
                 * @property {number} button index
                 */                                
                get buttonIndex() { return buttonIndex; }
            });
        }
    });
        
    CallbackHandler.implement({
        /**
         * Applies the presentation policy to the handler.
         * @method presenting
         * @returns {miruken.callback.CallbackHandler} presenting handler.
         * @for miruken.callback.CallbackHandler
         */
        presenting: function (policy) {
            return policy ? this.decorate({
                $handle: [PresentationPolicy, function (presenting) {
                    return policy.mergeInto(presenting);
                }]
            }) : this;
        }
    });
    
    eval(this.exports);
    
}
