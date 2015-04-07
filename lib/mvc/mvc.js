var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');

new function () { // closure

    /**
     * @namespace miruken.mvc
     */
    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context",
        exports: "Model,Controller,MasterDetail,MasterDetailAware"
    });

    eval(this.imports);

    /**
     * @class {Model}
     */
    var Model = Base.extend(
        $properties, $inferProperties, $inheritStatic, {
        constructor: function (data) {
            var meta    = this.$meta,
                getType = meta && meta.getPropertyType;
            for (var key in data) {
                var value = data[key],
                    type  = getType && getType(key);
                if (key in this) {
                    this[key] = type ? type.map(value) : value;
                } else {
                    var lkey = key.toLowerCase();
                    for (var k in this) {
                        if (k.toLowerCase() === lkey) {
                            this[k] = type ? type.map(value) : value;
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
        map: function (value) {
            if (value) {
                return typeof value.length == "number"
                     ? mapping = Array2.map(value, this.new, this)
                     : mapping = this.new.call(this, value);
            }
        }
    });

    /**
     * @class {Controller}
     */
    var Controller = CallbackHandler.extend(
        $properties, $inferProperties, $contextual);

    /**
     * @protocol {MasterDetail}
     */
    var MasterDetail = Protocol.extend({
        getSelectedDetail: function (detailClass) {},
        getSelectedDetails: function (detailClass) {},
        selectDetail: function (selectedDetail) {},
        deselectDetail: function (selectedDetail) {},
        hasPreviousDetail: function (detailClass) {},
        hasNextDetail: function (detailClass) {},
        getPreviousDetail: function (detailClass) {},
        getNextDetail: function (detailClass) {},
        addDetail: function (detail) {},
        updateDetail: function (detail) {},
        removeDetail: function (detail, deleteIt) {}
    });
    
    /**
     * @protocol {MasterDetailAware}
     */
    var MasterDetailAware = Protocol.extend({
        masterChanged: function (master) {},
        didSelectDetail: function (detail, master) {},
        didDeselectDetail: function (detail, master) {},
        didRemoveDetail: function (detail, master) {}
    });

    eval(this.exports);
}
