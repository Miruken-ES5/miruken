new function() {

    var sampleApp = new base2.Package(this, {
        name:    'sampleApp',
        imports: 'miruken,miruken.mvc',
        exports: 'AnimationOneController'
    });

    eval(this.imports);

    var disposed = 0;
    
    var AnimationOneController = Controller.extend(Disposing, {
        dispose: function () { ++disposed; },
        items: [1,2,3],
        getDisposed: function(){
            return disposed;
        }
    });

    eval(this.exports);

}
