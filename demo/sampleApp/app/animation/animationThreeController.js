new function() {

    var sampleApp = new base2.Package(this, {
        name:    'sampleApp',
        imports: 'miruken.mvc',
        exports: 'AnimationThreeController'
    });

    eval(this.imports);

    var AnimationThreeController = Controller.extend({
        list: [3,4,5],
    });

    eval(this.exports);

}
