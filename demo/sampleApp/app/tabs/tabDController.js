new function () {

    base2.package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabDController"
    });

    eval(this.imports);

    var TabDController = Controller.extend({
        message: "Howdy, y'all!",
        list:    ['D', 'E', 'F'],
    });

    eval(this.exports);

}
