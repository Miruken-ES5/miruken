new function () {

    base2.package(this, {
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
