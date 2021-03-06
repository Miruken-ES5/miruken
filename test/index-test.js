var miruken = require('../lib'),
    chai    = require("chai"),
    expect  = chai.expect;

describe("index", function () {
    describe("#namespaces", function () {
        it("should have all namespaces", function () {
            expect(miruken.namespace).to.be.ok;
            expect(miruken.graph.namespace).to.be.ok;
            expect(miruken.callback.namespace).to.be.ok;
            expect(miruken.context.namespace).to.be.ok;
            expect(miruken.ioc.namespace).to.be.ok;
            expect(miruken.validate.namespace).to.be.ok;
            expect(miruken.error.namespace).to.be.ok;
        });
    });
});
