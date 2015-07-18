new function(){
	var sampleApp = new base2.Package(this, {
		name:    'sampleApp',
		imports: 'miruken.mvc',
		exports: 'ModalsController'
	});

	eval(this.imports);

	var ModalsController = Controller.extend({
		showWrappedModal: function () {
            var viewModal = {
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            };
            ViewRegion(this.context
            	.modal({
            		title: 'Hooray!', 
            		header: true,
            		footer: true }))
            .present(viewModal).then(function(controller){
            	alert(controller.message);
            });
		},
		showWrappedModalWithHeader: function () {
            var viewModal = {
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            };
            ViewRegion(this.context
            	.modal({
            		title: 'Hooray!', 
            		header: true}))
            .present(viewModal).then(function(controller){
            	alert(controller.message);
            });
		},
		showWrappedModalWithFooter: function () {
            var viewModal = {
                templateUrl: 'app/modals/wrappedModal.html',
                controller:  'WrappedModalController as vm'
            };
            ViewRegion(this.context
            	.modal({
            		footer: true}))
            .present(viewModal).then(function(controller){
            	alert(controller.message);
            });
		},
		showFullModal: function () {
            ViewRegion(this.context.modal({ wrap: false }))
            	.present({
	                templateUrl: 'app/modals/fullModal.html',
	                controller:  'FullModalController as vm'
	            }).then(function(controller){
            		alert(controller.message);
            	});
		},
		showSelfClosingModal: function () {
            ViewRegion(this.context.modal({ forceClose: true }))
            	.present({
	                templateUrl: 'app/modals/selfClosingModal.html',
	                controller:  'SelfClosingModalController as vm'
	            }).then(function(controller){
            	alert(controller.message);
            });
		}
	});

	eval(this.exports);
    
}
