    new function () {

        base2.package(this, {
        name:    "sampleApp",
        imports: "miruken,miruken.mvc",
        exports: "FullModalController"
    });

    eval(this.imports);

    var disposed = 0;
    
    var FullModalController = Controller.extend(Disposing, {
        dispose: function () { ++disposed; },
        message: 'Hello', 
        items: [1,2,3],
        getDisposed: function(){
            return disposed;
        }
    });

    eval(this.exports);

}
