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
        $inferProperties,
        $propertiesFromFields,
        $inheritStatic, {
            pluck: function (/*values*/) {
                var data = {};
                for (var i = 0; i < arguments.length; ++i) {
                    var key = arguments[i],
                        value = this[key];
                    if (!$isFunction(value)) {
                        data[key] = value;
                    }
                }
                return data;
            }
        }, {
            map: function (data, property, remove) {
                var mapping;
                if (property in data) {
                    var relationship = data[property];
                    if (typeof relationship.length == "number") {
                        mapping = Array2.map(relationship, this.new, this);
                    } else {
                        mapping = this.new.call(this, relationship);
                    }
                    if (remove) {
                        delete data[property];
                    }
                }
                return mapping;
            },
            mapAndDelete: function (data, property) {
                return this.map(data, property, true);
            }
        }
    );

    /**
     * @class {Controller}
     */
    var Controller = CallbackHandler.extend(
        $contextual, $inferProperties);

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
