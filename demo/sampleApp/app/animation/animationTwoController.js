new function() {

    var sampleApp = new base2.Package(this, {
        name:    'sampleApp',
        imports: 'miruken.mvc',
        exports: 'AnimationTwoController'
    });

    eval(this.imports);

    var AnimationTwoController = Controller.extend({
        constructor: function () {
            setTimeout(function () {
                ViewRegion(this.context).present('app/regions/animationThree.html');
            }.bind(this), 2000);
        },
        message: "Howdy!",
        items: [2,3,4]
    });

    eval(this.exports);

}
