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
        exports: "Model,Controller,MasterDetail,MasterDetailAware,$root"
    });

    eval(this.imports);

    var $root = $createModifier();

    /**
     * @class {Model}
     */
    var Model = Base.extend(
        $inferProperties, {
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
                return typeof value.length == "number"
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
    var Controller = CallbackHandler.extend($inferProperties, $contextual);

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
