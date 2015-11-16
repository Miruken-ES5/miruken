new function() {

    sampleApp.package(this, {
        name:    "domain",
        imports: "miruken.mvc",
        exports: "Person"
    });

    eval(this.imports);

    var Person = Model.extend({
        $properties: {
            firstName: '',
            lastName:  ''
        }
    });

    eval(this.exports);

}
