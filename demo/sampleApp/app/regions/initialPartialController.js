new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "InitialPartialController"
    });

    eval(this.imports);

    var InitialPartialController = Controller.extend({
        constructor: function () {
            var viewOne = {
                template:     'app/regions/partialOne.html',
                controller:   'PartialOneController',
                controllerAs: 'vm'
            };
            setTimeout(function () {
                ViewRegion(this.context).present(viewOne);
            }.bind(this), 2000);
        },
        message: "Hi, y'all from the initial partial view",
        list: [1,2,3],
    });

    eval(this.exports);

}
