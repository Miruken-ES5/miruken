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
                templateUrl:  'app/regions/partialTwo.html',
                controller:   'PartialTwoController',
                controllerAs: 'vm'
            };
            setTimeout(function () {
                ViewRegion(this.context).present(viewTwo);
            }.bind(this), 2000);
        },
        dispose: function () { ++disposed; },
        message: 'Hello',
        items: [1,2,3],
        getDisposed: function(){
            return disposed;
        }
    });

    eval(this.exports);

}
