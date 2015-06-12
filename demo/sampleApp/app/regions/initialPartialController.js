new function() {

    var calendarPricing = new base2.Package(this, {
        name: "sampleApp",
        imports: "miruken.mvc",
        exports: "InitialPartialController"
    });

    eval(this.imports);

    var InitialPartialController = Controller.extend({
        message: "Hi, y'all from the initial partial view",
        list: [1,2,3]
    });

    eval(this.exports);

}
