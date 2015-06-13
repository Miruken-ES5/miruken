new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialOneController"
    });

    eval(this.imports);

    var PartialOneController = Controller.extend({
        constructor: function () {
            var viewTwo = {
                template:     'app/regions/partialTwo.html',
                controller:   'PartialTwoController',
                controllerAs: 'vm'
            };            
            setTimeout(function () {
                ViewRegion(this.context).present(viewTwo);
            }.bind(this), 2000);
        },
        message: "hello",
        items: [0,1,2,3]
    });

    eval(this.exports);

}
