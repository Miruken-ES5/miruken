new function() {
    
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'AnimationController'
	});

	eval(this.imports);

	var AnimationController = Controller.extend({
		$properties:{
            content: null,
			message: 'Hello, Animations!'
		},
        partialOne: function () {
            ViewRegion(this.content.context.animate({ fade: true })).present({
                templateUrl:  'app/animation/animationOne.html',
                controller:   'AnimationOneController as vm'
            });
        },
        partialTwo: function () {
            ViewRegion(this.content.context.animate({ fade: true })).present({
                templateUrl:  'app/animation/animationTwo.html',
                controller:   'AnimationTwoController as vm'
            });
        },
        partialThree: function () {
            ViewRegion(this.content.context.animate({ fade: true })).present({
                templateUrl:  'app/animation/animationThree.html',
                controller:   'AnimationThreeController as vm'
            });
        }
	});

	eval(this.exports);
        
}
