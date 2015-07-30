var miruken = require('../miruken.js');
              require('../mvc/controller.js');

new function () { // closure

    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken.mvc",
        exports: "TabController"
    });

    eval(this.imports);

    var TabController = Controller.extend({
        getTab: function (name) {
        },
        addTab: function (name, index) {
        }
    });
    
    eval(this.exports);
    
}
