var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');

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
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Controller,MasterDetail,MasterDetailAware"
    });

    eval(this.imports);
    
    /**
     * Base class for controllers.
     * @class Controller
     * @constructor
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.context.$contextual
     * @uses miruken.validate.$validateThat
     * @uses miruken.validate.Validating
     */
    var Controller = CallbackHandler.extend(
        $contextual, $validateThat, Validating, {
        validate: function (target, scope) {
            return _validateController(this, target, 'validate', scope);
        },
        validateAsync: function (target, scope) {
            return _validateController(this, target, 'validateAsync', scope);
        }
    });

    function _validateController(controller, target, method, scope) {
        var context = controller.context;
        if (!context) {
            throw new Error("Validation requires a context to be available.");
        }
        var validator = Validator(context);
        return validator[method].call(validator, target || controller, scope);
    }

    /**
     * Protocol for managing master-detail relationships.
     * @class MasterDetail
     * @extends miruken.Protocol     
     */    
    var MasterDetail = Protocol.extend({
        /**
         * Gets the selected detail.
         * @method getSelectedDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object} selected detail.  Could be a Promise.
         */
        getSelectedDetail: function (detailClass) {},
        /**
         * Gets the selected details.
         * @method getSelectedDetails
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  selected details.  Could be a Promise.
         */
        getSelectedDetails: function (detailClass) {},
        /**
         * Selects the detail
         * @method selectDetail
         * @param   {Object} detail  -  selected detail
         */
        selectDetail: function (detail) {},
        /**
         * Unselects the detail
         * @method deselectDetail
         * @param   {Object} detail  -  unselected detail
         */
        deselectDetail: function (detail) {},
        /**
         * Determines if a previous detail exists.
         * @method hasPreviousDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {boolean} true if a previous detail exists.
         */
        hasPreviousDetail: function (detailClass) {},
        /**
         * Determines if a next detail exists.
         * @method hasNextDetail.
         * @param   {Function} detailClass  -  type of detail
         * @returns {boolean} true if a next detail exists.
         */
        hasNextDetail: function (detailClass) {},
        /**
         * Gets the previous detail.
         * @method getPreviousDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  previous detail or undefined..
         */
        getPreviousDetail: function (detailClass) {},
        /**
         * Gets the next detail.
         * @method getNextDetail
         * @param   {Function} detailClass  -  type of detail
         * @returns {Object}  next detail or undefined.
         */
        getNextDetail: function (detailClass) {},
        /**
         * Adds the detail to the master.
         * @method addDetail
         * @param   {Object} detail  -  added detail
         */
        addDetail: function (detail) {},
        /**
         * Updates the detail in the master.
         * @method updateDetail
         * @param   {Object} detail  -  updated detail
         */
        updateDetail: function (detail) {},
        /**
         * Removes the detail from the master.
         * @method removeDetail
         * @param   {Object}  detail   -  removed detail
         * @param   {boolean} deleteIt -  true to delete it
         */
        removeDetail: function (detail, deleteIt) {}
    });
    
    /**
     * Protocol for receiving master-detail notifications.
     * @class MasterDetailAware
     * @extends miruken.Protocol     
     */    
    var MasterDetailAware = Protocol.extend({
        /**
         * Informs the master has changed.
         * @method masterChanged
         * @param  {Object}  master  -  master
         */
        masterChanged: function (master) {},
        /**
         * Informs a detail was selected.
         * @method detailSelected
         * @param  {Object}  detail  -  selected detail
         * @param  {Object}  master  -  master
         */
        detailSelected: function (detail, master) {},
        /**
         * Informs a detail was unselected.
         * @method detailUnselected
         * @param  {Object} detail  -  unselected detail
         * @param  {Object} master  -  master
         */
        detailUnselected: function (detail, master) {},
        /**
         * Informs a detail was added to the master.
         * @method detailAdded
         * @param  {Object} detail  -  added detail
         * @param  {Object} master  -  master
         */
        detailAdded: function (detail, master) {},
        /**
         * Informs a detail was updated in the master.
         * @method detailUpdated
         * @param  {Object} detail  -  updated detail
         * @param  {Object} master  -  master
         */
        detailUpdated: function (detail, master) {},
        /**
         * Informs a detail was removed from the master.
         * @method detailRemoved
         * @param  {Object} detail  -  removed detail
         * @param  {Object} master  -  master
         */
        detailRemoved: function (detail, master) {}
    });

    eval(this.exports);
    
}
