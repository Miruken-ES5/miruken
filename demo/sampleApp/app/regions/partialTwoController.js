new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialTwoController"
    });

    eval(this.imports);

    var PartialTwoController = Controller.extend({
        constructor: function () {
            var initialView = {
                template:     'app/regions/initialPartial.html',
                controller:   'InitialPartialController',
                controllerAs: 'vm'
            };            
            setTimeout(function () {
                ViewRegion(this.context).present(initialView);
            }.bind(this), 2000);
        },
        message: "howdy"
    });

    eval(this.exports);

}
