new function() {

    var sampleApp = new base2.Package(this, {
        name:    'sampleApp',
        imports: 'miruken.mvc',
        exports: 'AnimationTwoController'
    });

    eval(this.imports);

    var AnimationTwoController = Controller.extend({
        items: [2,3,4]
    });

    eval(this.exports);

}
