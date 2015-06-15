new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabEController"
    });

    eval(this.imports);

    var TabEController = Controller.extend({
        message: "Good Day",
        list:    ['E', 'F', 'G'],
    });

    eval(this.exports);

}
