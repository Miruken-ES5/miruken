new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabBController"
    });

    eval(this.imports);

    var TabBController = Controller.extend({
        message: "Howdy",
        items:   ["B", "C", "D"]
    });

    eval(this.exports);

}
