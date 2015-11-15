new function() {

    base2.package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabAController"
    });

    eval(this.imports);

    var TabAController = Controller.extend({
        message: "Hello",
        items:   ['A','B','C']
    });

    eval(this.exports);

}
