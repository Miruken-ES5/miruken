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
    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Model,Controller,MasterDetail,MasterDetailAware,$root"
    });

    eval(this.imports);

    var $root = $createModifier();

    /**
     * Base class for modelling concepts using one or more 
     * {{#crossLink "miruken.$properties"}}{{/crossLink}}
     * <pre>
     *    var Child = Model.extend({
     *       $properties: {
     *           firstName: { validate: { presence: true } },
     *           lastNane:  { validate: { presence: true } },
     *           age:       { validate {
     *                            numericality: {
     *                                onlyInteger:       true,
     *                                lessThanOrEqualTo: 12
     *                            }
     *                      }}
     *       }
     *    })
     * </pre>
     * @class Model
     * @constructor
     * @param {Object} [data]  -  json structured data 
     * @extends Base
     */
    var Model = Base.extend(
        $inferProperties, $validateThat, {
        constructor: function (data) {
            this.fromData(data);
        },
        /**
         * Maps json structured data into the model.
         * @method fromData
         * @param   {Object}  data  -  json structured data
         */            
        fromData: function (data) {
            if ($isNothing(data)) {
                return;
            }
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            if (descriptors) {
                for (var key in descriptors) {
                    var descriptor = descriptors[key];
                    if (descriptor && descriptor.root && descriptor.map) {
                        this[key] = descriptor.map(data); 
                    }
                }
            }
            for (var key in data) {
                var descriptor = descriptors && descriptors[key],
                    mapper     = descriptor && descriptor.map;
                if (mapper && descriptor.root) {
                    continue;  // already rooted
                }
                var value = data[key];
                if (key in this) {
                    this[key] = mapper ? Model.map(value, mapper, descriptor) : value;
                } else {
                    var lkey = key.toLowerCase();
                    for (var k in this) {
                        if (k.toLowerCase() === lkey) {
                            this[k] = mapper ? Model.map(value, mapper, descriptor) : value;
                        }
                    }
                }
            }
            return this;
        },
        /**
         * Maps the model into json structured data.
         * @method toData
         * @param   {Object}  spec    -  filters data to map
         * @param   {Object}  [data]  -  receives mapped data
         * @returns {Object} json structured data.
         */                        
        toData: function (spec, data) {
            data = data || {};
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            if (descriptors) {
                var all = $isNothing(spec);
                for (var key in descriptors) {
                    if (all || (key in spec)) {
                        var keyValue   = this[key],
                            descriptor = descriptors[key],
                            keySpec    = all ? spec : spec[key];
                        if (!(all || keySpec)) {
                            continue;
                        }
                        if (descriptor.root) {
                            if (keyValue && $isFunction(keyValue.toData)) {
                                keyValue.toData(keySpec, data);
                            }
                        } else if (keyValue && $isFunction(keyValue.toData)) {
                            data[key] = keyValue.toData(keySpec);
                        } else {
                            data[key] = keyValue;
                        }
                    }
                }
            }            
            return data;
        }
    }, {
        /**
         * Maps the model value into json using the mapper.
         * @method toData
         * @param   {Any}      value      -  model value
         * @param   {Fnction}  mapper     -  mapping function or class
         * @param   {Object}   [options]  -  mapping options
         * @returns {Object} json structured data.
         */                                
        map: function (value, mapper, options) {
            if (value) {
                return value instanceof Array
                     ? Array2.map(value, function (elem) {
                         return Model.map(elem, mapper, options)
                       })
                     : mapper(value, options);
            }
        },
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });

    /**
     * Base class for controllers.
     * @class Controller
     * @constructor
     * @extends miruken.callback.CallbackHandler
     * @uses miruken.context.Contextual
     * @uses miruken.validate.Validating
     */    
    var Controller = CallbackHandler.extend(
        $inferProperties, $contextual, $validateThat, Validating, {
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
         * @method didSelectDetail
         * @param  {Object}  detail  -  selected detail
         * @param  {Object}  master  -  master
         */
        didSelectDetail: function (detail, master) {},
        /**
         * Informs a detail was unselected.
         * @method didDeselectDetail
         * @param  {Object} detail  -  unselected detail
         * @param  {Object} master  -  master
         */
        didDeselectDetail: function (detail, master) {},
        /**
         * Informs a detail was added to the master.
         * @method didAddDetail
         * @param  {Object} detail  -  added detail
         * @param  {Object} master  -  master
         */
        didAddDetail: function (detail, master) {},
        /**
         * Informs a detail was updated in the master.
         * @method didUpdateDetail
         * @param  {Object} detail  -  updated detail
         * @param  {Object} master  -  master
         */
        didUpdateDetail: function (detail, master) {},
        /**
         * Informs a detail was removed from the master.
         * @method didRemoveDetail
         * @param  {Object} detail  -  removed detail
         * @param  {Object} master  -  master
         */
        didRemoveDetail: function (detail, master) {}
    });

    eval(this.exports);
}
