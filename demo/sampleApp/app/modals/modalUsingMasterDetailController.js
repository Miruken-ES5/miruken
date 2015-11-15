new function () {

    base2.package(this, {
        name:    "sampleApp",
        imports: "miruken.context,miruken.mvc,sampleApp.domain", 
        exports: "ModalUsingMasterDetailController"
    });

    eval(this.imports);

    var ModalUsingMasterDetailController = Controller.extend({
        $properties: {
            person: { map: Person }
        },
        $inject: [Context],
        constructor: function (context) {
            this.person = MasterDetail(context).getSelectedDetail(Person);
        }
    });

    eval(this.exports);

}
