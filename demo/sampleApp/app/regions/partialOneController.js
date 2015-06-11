new function() {

    var calendarPricing = new base2.Package(this, {
        name: "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialOneController"
    });

    eval(this.imports);

    var PartialOneController = Controller.extend({
        message: "hello",
        items: [0,1,2,3]
    });

    eval(this.exports);

}
