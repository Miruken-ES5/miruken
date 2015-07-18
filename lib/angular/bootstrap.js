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
        exports: "Bootstrap,BootstrapModal",
        ngModule: []
    });

    eval(this.imports);

    angular.module('miruken.bootstrap').run(['$rootContext',
        function ($rootContext) {
            $rootContext.addHandlers(new BootstrapModal);
            
    }]);

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
        showModal: function (container, content, policy, controller, scope) {
                    if(policy.wrap){    
                        var wrapper = ''; 
                        wrapper += format('<div class="modal" %1>', policy.forceClose ? 'data-backdrop="static"' : '')
                        wrapper +=     '<div class="modal-dialog">'
                        wrapper +=         '<div class="modal-content">'

                        if(policy.header){
                            wrapper +=         '<div class="modal-header">'
                            wrapper +=             '<button type="button" class="close js-close">X</button>'
                            wrapper +=             format('<h4 class="modal-title">%1</h4>', policy.title);
                            wrapper +=         '</div>'
                        }

                        wrapper +=             '<div class="modal-body">'
                        wrapper +=             '</div>'

                        if(policy.footer){
                            wrapper +=         '<div class="modal-footer text-right">'
                            wrapper +=             '<button class="btn btn-primary btn-sm js-close">Close</button>'
                            wrapper +=         '</div>'
                        }
                        wrapper +=         '</div>'
                        wrapper +=     '</div>'
                        wrapper += '</div>'

                        $('body').append(wrapper);
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

                    var modal = $('.modal');
                    modal.modal();
                    modal.on('hidden.bs.modal', function(){
                        close();
                    });
                    $('.js-close').click(function(){
                        controller.endContext();
                    });

                    return deferred.promise;

                    function close(){
                        if(controller && controller.context){
                            controller.endContext();
                        };

                        modal.modal('hide');
                        modal.remove();
                        $('.modal-backdrop').remove()
                        $('body').removeClass('modal-open');    
                        
                        deferred.resolve(controller);
                    }
                }
    });
    
    eval(this.exports);
    
}
