var miruken = require('../miruken.js');
              require('../mvc/controller.js');

new function () { // closure

    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.callback",
        exports: "TabProviding,TabController,ModalPolicy,ModalProviding,FadePolicy,FadeProviding"
    });

    eval(this.imports);

    /**
     * Protocol for interacting with a tab provider.
     * @class TabProviding
     * @extends StrictProtocol
     */    
    var TabProviding = StrictProtocol.extend({
        /**
         * Creates the DOM container for the tabs.
         * @method tabContainer
         * @returns {Element} DOM element representing the tab container.
         */        
        tabContainer: function () {}
    });

    /**
     * Controller for managing a set of named tabs.
     * @class TabController
     * @extends miruken.mvc.Controller
     */    
    var TabController = Controller.extend({
        getTab: function (name) {
        },
        addTab: function (name) {
        }
    });

    /**
     * Policy for describing modal presentation.
     * @class ModalPolicy
     * @extends miruken.mvc.PresentationPolicy
     */
    var ModalPolicy = PresentationPolicy.extend({
        $properties: {
            title:      '',
            style:      null,
            chrome:     true,
            header:     false,
            footer:     false,
            forceClose: false,
            buttons:    null
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
         * @param   {miruken.context.Context}  context    -  modal context
         * @returns {Promise} promise representing the modal result.
         */
        showModal: function (container, content, policy, context) {}
    });

    var FadePolicy = PresentationPolicy.extend();

    var FadeProviding = StrictProtocol.extend({
        handle: function (container, content, context) {}
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

        fade: function (options) {
            return this.presenting(new FadePolicy(options));
        }
    });
    
    eval(this.exports);

}
