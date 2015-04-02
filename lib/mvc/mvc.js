var miruken = require('../miruken.js');

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
        $inferProperties, {
        constructor: function (state) {
        }
    });

    /**
     * @class {Controller}
     */
    var Controller = CallbackHandler.extend(Contextual, ContextualMixin,
        $inferProperties, {
    });

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
