new function() {

    var domain = new base2.Package(this, {
        name:    "domain",
        parent:  sampleApp,
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
