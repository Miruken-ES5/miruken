new function() {

    var calendarPricing = new base2.Package(this, {
        name: "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialTwoController"
    });

    eval(this.imports);

    var PartialTwoController = Controller.extend({
        message: "howdy"
    });

    eval(this.exports);

}
