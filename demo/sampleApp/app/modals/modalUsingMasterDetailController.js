new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken,miruken.mvc,sampleApp.domain", 
        exports: "ModalUsingMasterDetailController"
    });

    eval(this.imports);

    var ModalUsingMasterDetailController = Controller.extend({
        $properties: {
            person: { map: Person }
        },
        constructor: function(){
            debugger;
            this.person = MasterDetail(this.context).getSelectedDetail(Person);
        }
    });

    eval(this.exports);

}
