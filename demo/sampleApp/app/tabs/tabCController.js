new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "TabCController"
    });

    eval(this.imports);

    var TabCController = Controller.extend({
        message: "Hi",
        list:    ['C', 'D', 'E'],
    });

    eval(this.exports);

}
