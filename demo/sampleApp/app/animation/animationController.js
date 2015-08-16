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
            ViewRegion(this.content.context).present({
                templateUrl:  'app/animation/animationOne.html',
                controller:   'PartialOneController as vm'
            });
        },
        partialTwo: function () {
            ViewRegion(this.content.context).present({
                templateUrl:  'app/animation/animationTwo.html',
                controller:   'PartialTwoController as vm'
            });
        },
        partialThree: function () {
            ViewRegion(this.content.context).present({
                templateUrl:  'app/animation/animationThree.html',
                controller:   'PartialThreeController as vm'
            });
        }
	});

	eval(this.exports);
        
}
