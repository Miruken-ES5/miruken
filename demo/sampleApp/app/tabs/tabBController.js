new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabBController"
    });

    eval(this.imports);

    var TabBController = Controller.extend({
        message: "howdy",
        items:   ["B", "C", "D"]
    });

    eval(this.exports);

}
