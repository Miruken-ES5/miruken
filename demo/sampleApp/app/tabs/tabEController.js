new function () {

    base2.package(this, {
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
