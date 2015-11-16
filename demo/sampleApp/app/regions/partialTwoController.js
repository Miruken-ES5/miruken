new function () {

    base2.package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialTwoController"
    });

    eval(this.imports);

    var PartialTwoController = Controller.extend({
        constructor: function () {
            setTimeout(function () {
                ViewRegion(this.context).present('app/regions/partialThree.html');
            }.bind(this), 2000);
        },
        message: "Howdy!",
        items: [2,3,4]
    });

    eval(this.exports);

}
