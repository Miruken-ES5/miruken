var miruken  = require('../lib/miruken.js'),
    ioc      = require('../lib/ioc.js'),
    config   = require('../lib/ioc-config.js'),
    Q        = require('q'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(ioc.namespace);
eval(ioc.config.namespace);

new function () { // closure

    var ioc_config_test = new base2.Package(this, {
        name:    "ioc_config_test",
        exports: ""
    });

    eval(this.imports);

    eval(this.exports);
};

eval(base2.ioc_config_test.namespace);
