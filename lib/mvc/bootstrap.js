var miruken = require('../miruken.js');
              require('./view.js');

new function () { // closure

    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken.callback",
        exports: "Bootstrap,BootstrapModal"
    });

    eval(this.imports);

    /**
     * Marker for Bootstrap providers.
     * @class Bootstrap
     * @extends miruken.mvc.ModalProviding
     */    
    var Bootstrap = ModalProviding.extend();
    
    /**
     * Bootstrap modal provider..
     * @class BootstrapModal
     * @extends Base
     * @uses miruken.mvc.Bootstrap
     */    
    var BootstrapModal = Base.extend(Bootstrap, {
        showModal: function (container, content, policy) {
            alert(content.html());
        }
    });
    
    eval(this.exports);
    
}
