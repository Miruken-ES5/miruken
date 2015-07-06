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
        exports: "ViewRegion,PartialRegion,PresentationPolicy,ModalPolicy,ModalProviding"
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

    /**
     * Base class for representing presentation policies.
     * @class PresentationPolicy
     * @extends miruken.mvc.Model
     */
    var PresentationPolicy = Model.extend();

    /**
     * Policy for describing modal presentation.
     * @class ModalPolicy
     * @extends miruken.mvc.PresentationPolicy
     */
    var ModalPolicy = PresentationPolicy.extend({
        $properties: {
            title: ''
        }
    });

    /**
     * Protocol for interacting with a modal provider.
     * @class ModalProviding
     * @extends StrictProtocol
     */
    var ModalProviding = StrictProtocol.extend({
        /**
         * Presents the content in a modal dialog.
         * @method showModal
         * @param   {Element}                  container  -  element modal bound to
         * @param   {Element}                  content    -  modal content element
         * @param   {miruken.mvc.ModalPolicy}  policy     -  modal policy options
         * @returns {Promise} promise representing the modal result.
         */
        showModal: function (container, content, policy) {}
    });
    
    CallbackHandler.implement({
        /**
         * Configures modal presentation options.
         * @method modal
         * @param {Object}  options  -  modal options
         * @returns {miruken.callback.CallbackHandler} modal handler.
         * @for miruken.callback.CallbackHandler
         */                                                                
        modal: function (options) {
            return this.presenting(new ModalPolicy(options));
        },
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
