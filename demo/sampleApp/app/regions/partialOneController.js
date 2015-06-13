new function() {

    var sampleApp = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken,miruken.mvc",
        exports: "PartialOneController"
    });

    eval(this.imports);

    var disposed = 0;
    
    var PartialOneController = Controller.extend(Disposing, {
        constructor: function () {
            var viewTwo = {
                template:     'app/regions/partialTwo.html',
                controller:   'PartialTwoController',
                controllerAs: 'vm'
            };

            this.message = format("Hello - dispoed %1", disposed);
            
            setTimeout(function () {
                ViewRegion(this.context).present(viewTwo);
            }.bind(this), 2000);
        },
        dispose: function () { ++disposed; },
        items: [0,1,2,3]
    });

    eval(this.exports);

}
