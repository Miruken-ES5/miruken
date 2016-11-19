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
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.callback",
        exports: "ViewRegion,ViewRegionAware,PresentationPolicy,ButtonClicked"
    });

    eval(this.imports);

    /**
     * Protocol for representing a layer in a 
     * See {{#crossLink "miruken.mvc.ViewRegion"}}{{/crossLink}.
     * @class ViewLayer
     * @extends Protocol
     */
    var ViewLayer = Protocol.extend(Disposing, {
    });
    
    /**
     * Protocol for rendering a view on the screen.
     * @class ViewRegion
     * @extends StrictProtocol
     */
    var ViewRegion = StrictProtocol.extend({
        /**
         * Gets the regions name.
         * @property {string} name
         */
        get name() {},
        /**
         * Renders new view in the region.
         * @method show
         * @param    {Any}      view  -  view details
         * @returns  {Promise}  promise for the layer.
         */                                        
        show: function (view) {}
    });

    /**
     * Protocol for communicating
     * {{#crossLink "miruken.callback.CallbackHandler"}}{{/crossLink}} lifecycle.
     * @class ViewRegionAware
     * @extends Protocol
     */
    var ViewRegionAware = Protocol.extend({
        viewRegionCreated: function (viewRegion) {}
    });
    
    /**
     * Base class for presentation policies.
     * @class PresentationPolicy
     * @extends miruken.mvc.Model
     */
    var PresentationPolicy = Model.extend();

    /**
     * Represents the clicking of a button.
     * @class ButtonClicked
     * @constructor
     * @param  {Any}     button       -  clicked button
     * @param  {number}  buttonIndex  -  index of clicked button 
     * @extends Base
     */
    var ButtonClicked = Base.extend({
        constructor: function (button, buttonIndex) {
            this.extend({
                /**
                 * Gets the clicked button.
                 * @property {Any} button
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
