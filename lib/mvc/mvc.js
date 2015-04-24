var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');

new function () { // closure

    /**
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
     * @class {Model}
     */
    var Model = Base.extend(
        $inferProperties, $validateThat, {
        constructor: function (data) {
            this.fromData(data);
        },
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
        },
        pluck: function (/*values*/) {
            var data = {};
            for (var i = 0; i < arguments.length; ++i) {
                var key   = arguments[i],
                    value = this[key];
                if (!$isFunction(value)) {
                    data[key] = value;
                }
            }
            return data;
        }
    }, {
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
     * @class {Controller}
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
     * @protocol {MasterDetail}
     * Manages master-detail relationships.
     */
    var MasterDetail = Protocol.extend({
        /**
         * Gets the selected detail.
         * @param   {Function} detailClass  - type of detail
         * @returns {Promise} for the selected detail.
         */
        getSelectedDetail: function (detailClass) {},
        /**
         * Gets the selected details.
         * @param   {Function} detailClass  - type of detail
         * @returns {Promise} for the selected details.
         */
        getSelectedDetails: function (detailClass) {},
        /**
         * Selects the detail.
         * @param   {Object} detail - selected detail
         */
        selectDetail: function (detail) {},
        /**
         * Unselects the detail.
         * @param   {Object} detail - unselected detail
         */
        deselectDetail: function (detail) {},
        /**
         * Determines if a previous detail exists.
         * @param   {Function} detailClass  - type of detail
         * @returns {Boolean} true if a previous detail exists.
         */
        hasPreviousDetail: function (detailClass) {},
        /**
         * Determines if a next detail exists.
         * @param   {Function} detailClass  - type of detail
         * @returns {Boolean} true if a next detail exists.
         */
        hasNextDetail: function (detailClass) {},
        /**
         * Gets the previous detail.
         * @param   {Function} detailClass  - type of detail
         * @returns {Object} the previous detail or undefined..
         */
        getPreviousDetail: function (detailClass) {},
        /**
         * Gets the next detail.
         * @param   {Function} detailClass  - type of detail
         * @returns {Object} the next detail or undefined.
         */
        getNextDetail: function (detailClass) {},
        /**
         * Adds the detail.
         * @param   {Object} detail - added detail
         */
        addDetail: function (detail) {},
        /**
         * Updates the detail.
         * @param   {Object} detail - updated detail
         */
        updateDetail: function (detail) {},
        /**
         * Removes the detail.
         * @param   {Object}  detail   - updated detail
         * @param   {Boolean} deleteIt - true to delete it
         */
        removeDetail: function (detail, deleteIt) {}
    });
    
    /**
     * @protocol {MasterDetailAware}
     */
    var MasterDetailAware = Protocol.extend({
        /**
         * Indicates the master has changed.
         * @param   {Object} master - master
         */
        masterChanged: function (master) {},
        /**
         * Indicates the detail was selected.
         * @param   {Object} detail - selected detail
         * @param   {Object} master - master
         */
        didSelectDetail: function (detail, master) {},
        /**
         * Indicates the detail was unselected.
         * @param   {Object} detail - unselected detail
         * @param   {Object} master - master
         */
        didDeselectDetail: function (detail, master) {},
        /**
         * Indicates the detail was added.
         * @param   {Object} detail - added detail
         * @param   {Object} master - master
         */
        didAddDetail: function (detail, master) {},
        /**
         * Indicates the detail was updated.
         * @param   {Object} detail - updated detail
         * @param   {Object} master - master
         */
        didUpdateDetail: function (detail, master) {},
        /**
         * Indicates the detail was removed.
         * @param   {Object} detail - removed detail
         * @param   {Object} master - master
         */
        didRemoveDetail: function (detail, master) {}
    });

    eval(this.exports);
}
