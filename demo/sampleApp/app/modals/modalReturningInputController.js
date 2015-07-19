    new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken,miruken.mvc",
        exports: "ModalReturningInputController"
    });

    eval(this.imports);

    var ModalReturningInputController = Controller.extend({
        $properties: {
            name: ''
        }
    });

    eval(this.exports);

}
