new function(){
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'ModalsController'
	});

	eval(this.imports);

	var ModalsController = Controller.extend({
		showWrappedModal: function () {
            ViewRegion(this.context.modal({
            	title: 'Hooray!', 
        		footer: true }))
            .present({
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            });
		},
		showWrappedModalWithHeader: function () {
            ViewRegion(this.context.modal({
        		header: true}))
            .present({
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            });
		},
		showWrappedModalWithFooter: function () {
            ViewRegion(this.context.modal({
        		footer: true}))
            .present({
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            });
		},
		showFullModal: function () {
            ViewRegion(this.context.modal({ wrap: false }))
            	.present({
	                templateUrl: 'app/modals/fullModal.html',
	                controller:  'FullModalController as vm'
	            });
		},
		showSelfClosingModal: function () {
            ViewRegion(this.context.modal({ forceResponse: true }))
            	.present({
	                templateUrl: 'app/modals/selfClosingModal.html',
	                controller:  'SelfClosingModalController as vm'
	            });
		},
        showConfirmModal: function () {
            ViewRegion(this.context.modal({ 
                forceResponse: true,
                title: 'Confirm',
                buttons: [
                    'Yes',
                    'No'
                ] }))
                .present({ template: '<p>Are you sure you want to...?</p>' }).then(function(controller){
                    alert(format('Result: %1', controller.modalResult));
                });
        }
	});

	eval(this.exports);
    
}
