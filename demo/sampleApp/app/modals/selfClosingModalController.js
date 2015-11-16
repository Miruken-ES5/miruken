new function() {

    base2.package(this, {
        name:    "sampleApp",
        imports: "miruken,miruken.mvc",
        exports: "SelfClosingModalController"
    });

    eval(this.imports);

    var disposed = 0;
    
    var SelfClosingModalController = Controller.extend(Disposing, {
        dispose: function () { ++disposed; },
        message: 'Howdy',
        items: [1,2,3],
        getDisposed: function(){
            return disposed;
        }
    });

    eval(this.exports);

}
