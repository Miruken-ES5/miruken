var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../mvc/view.js');
              require('./ng');


new function () { // closure

    var bootstrap = new base2.Package(this, {
        name:    "bootstrap",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken.callback,miruken.mvc,miruken.ng",
        exports: "Bootstrap,BootstrapModal,BootstrapModalWrapperController",
        ngModule: []
    });

    eval(this.imports);

    angular.module('miruken.bootstrap').run(['$rootContext', '$controller', '$compile',
        function ($rootContext, $controller, $compile) {
            $rootContext.addHandlers(new BootstrapModal($controller, $compile));
            
    }]);

    var BootstrapModalWrapperController = Controller.extend({
        close: function(){
            this.endContext();
        }
    });

    /**
     * Marker for Bootstrap providers.
     * @class Bootstrap
     * @extends miruken.mvc.ModalProviding
     */    
    var Bootstrap = ModalProviding.extend();
    
    /**
     * Bootstrap modal provider..
     * @class BootstrapModal
     * @extends Base
     * @uses miruken.mvc.Bootstrap
     */    
    var BootstrapModal = Base.extend(Bootstrap, {
        constructor: function($controller, $compile){
            this.extend({
                showModal: function (container, content, policy, controller, scope) {
                    var partialScope,
                        wrapperController,
                        wrapperElement;

                    if(policy.wrap){

                        var wrapper = ''; 
                        wrapper += '<div class="modal" ng-controller="BootstrapModalWrapperController as vm">'
                        wrapper +=     '<div class="modal-dialog">'
                        wrapper +=         '<div class="modal-content">'

                        if(true){
                            wrapper +=         '<div class="modal-header">'
                            wrapper +=             '<button type="button" class="close" ng-click="vm.close()">X</button>'
                            wrapper +=             '<h4 class="modal-title">Title</h4>'
                            wrapper +=         '</div>'
                        }

                        wrapper +=             '<div class="modal-body">'
                        wrapper +=             '</div>'

                        if(true){
                            wrapper +=         '<div class="modal-footer text-right">'
                            wrapper +=             '<button class="btn btn-primary btn-sm "ng-click="vm.close()">Close</button>'
                            wrapper +=         '</div>'
                        }
                        wrapper +=         '</div>'
                        wrapper +=     '</div>'
                        wrapper += '</div>'

                        partialScope = scope.$new();
                        wrapperController = $controller('BootstrapModalWrapperController', { $scope: partialScope });
                        partialScope['vm'] = wrapperController;
                        wrapperElement = $compile(wrapper)(partialScope);

                        var wrapperCancel = wrapperController.context.observe({
                            contextEnding: function (context) {
                                if (wrapperController && (context === wrapperController.context)) {
                                    close();
                                    if (wrapperElement) {
                                        wrapperElement.remove();
                                        
                                    }
                                    if(partialScope){
                                        partialScope.$destroy();
                                    }
                                    wrapperElement    = null;
                                    wrapperController = null;
                                    partialScope      = null;
                                }
                                wrapperCancel();
                            }
                        });
                        
                        $('body').append(wrapperElement);
                        $('.modal-body').append(content);

                    } else {
                        $('body').append(content);
                    }

                    var deferred = Promise.defer();

                    var cancel = controller.context.observe({
                        contextEnding: function (context) {
                            if (controller && (context === controller.context)) {
                                close();
                            }
                            cancel();
                        }
                    });

                    $('.modal').modal();
                    $('.modal').on('hidden.bs.modal', function(){
                        close();
                    });

                    return deferred.promise;

                    function close(){
                        $('.modal').modal('hide');
                        deferred.resolve(controller);

                        if(controller && controller.context){
                            controller.endContext();
                        };

                        if(wrapperController && wrapperController.context){
                            wrapperController.endContext();
                        };
                    }
                }
            });
        }
    });
    
    eval(this.exports);
    
}
