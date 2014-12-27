var miruken  = require('../lib/miruken.js'),
    ioc      = require('../lib/ioc.js'),
    fluent   = require('../lib/ioc-fluent.js'),
    Q        = require('q'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(ioc.namespace);
eval(ioc.fluent.namespace);

new function () { // closure

    var ioc_fluent_test = new base2.Package(this, {
        name:    "ioc_fluent_test",
        exports: ""
    });

    eval(this.imports);

    eval(this.exports);
};

eval(base2.ioc_fluent_test.namespace);
