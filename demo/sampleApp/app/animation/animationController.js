new function () {
    
	base2.package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'AnimationController'
	});

	eval(this.imports);

	var AnimationController = Controller.extend({
		$properties:{
			message: 'Hello, Animations!'
		},
        animationOne: function () {
            ViewRegion(this.content.context.fade()).present({
                templateUrl:  'app/animation/animationOne.html',
                controller:   'AnimationOneController as vm'
            });
        },
        animationTwo: function () {
            ViewRegion(this.content.context.fade()).present({
                templateUrl:  'app/animation/animationTwo.html',
                controller:   'AnimationTwoController as vm'
            });
        },
        animationThree: function () {
            ViewRegion(this.content.context.fade()).present({
                templateUrl:  'app/animation/animationThree.html',
                controller:   'AnimationThreeController as vm'
            });
        },
        pictureOne: function () {
            ViewRegion(this.pictures.context.fade()).present({
                templateUrl:  'app/animation/pictureOne.html'
            });
        },
        pictureTwo: function () {
            ViewRegion(this.pictures.context.fade()).present({
                templateUrl:  'app/animation/pictureTwo.html'
            });
        },
        pictureThree: function () {
            ViewRegion(this.pictures.context.fade()).present({
                templateUrl:  'app/animation/pictureThree.html'
            });
        },
        viewRegionCreated: function (region) {
            this[region.name] = region;
        }
	});

	eval(this.exports);
        
}
