var miruken = require('../miruken.js');
              require('./view.js');

new function () { // closure

    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken.callback",
        exports: "BootstrapModalProvider"
    });

    eval(this.imports);

    var BootstrapModalProvider = Base.extend(ModalProviding, {
        showModal: function (container, content, policy) {
            alert(content.html());
        }
    });
    
    eval(this.exports);
    
}
