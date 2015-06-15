new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.mvc",
        exports: "PartialThreeController"
    });

    eval(this.imports);

    var PartialThreeController = Controller.extend({
        constructor: function () {
            var viewOne = {
                templateUrl:  'app/regions/partialOne.html',
                controller:   'PartialOneController',
                controllerAs: 'vm'
            };
            setTimeout(function () {
                ViewRegion(this.context).present(viewOne);
            }.bind(this), 2000);
        },
        message: "Hi, y'all from partial three!",
        list: [3,4,5],
    });

    eval(this.exports);

}
