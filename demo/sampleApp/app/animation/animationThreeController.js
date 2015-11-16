new function () {

    base2.package(this, {
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
