var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../mvc/view.js');

new function () { // closure

    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.mvc",
        exports: "Bootstrap,BootstrapModal"
    });

    eval(this.imports);

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
            var deferred = Promise.defer(),
                result   = controller || {};

            if (policy.wrap) {    
                $('body').append(this.wrapper(policy));
                $('.modal-body').append(content);
            } else {
                $('body').append(content);
            }

            if (controller && controller.context) {
                var cancel = controller.context.observe({
                    contextEnding: function (context) {
                        if (context === controller.context) {
                            close();
                        }
                        cancel();
                    }
                });    
            }

            var modal = $('.modal');
            modal.modal();
            modal.on('hidden.bs.modal', function (e){
                close();
            });
            
            $('.modal .js-close').click(function (e){
                var buttonText = e.target.innerText;
                if (buttonText != '\u00d7') {
                    result.modalResult = buttonText;     
                }
                close()
            });

            return deferred.promise;

            function close() {
                if (controller) {
                    controller.endContext();
                };

                modal.modal('hide');
                modal.remove();
                $('.modal-backdrop').remove()
                $('body').removeClass('modal-open');    
                
                deferred.resolve(result);
            }
        },
        wrapper: function (policy){
            var wrapper = ''; 
            wrapper += format('<div class="modal" %1>', policy.forceResponse ? 'data-backdrop="static"' : '')
            wrapper +=     '<div class="modal-dialog">'
            wrapper +=         '<div class="modal-content">'

            buildHeader();

            wrapper +=             '<div class="modal-body">'
            wrapper +=             '</div>'

            buildFooter();

            wrapper +=         '</div>'
            wrapper +=     '</div>'
            wrapper += '</div>'

            function buildHeader() {
                if (policy.header || policy.title) {
                    wrapper += '<div class="modal-header">'

                    if (!policy.forceResponse) {
                        wrapper += '<button type="button" class="close js-close">&times;</button>'
                    }

                    wrapper += format('<h4 class="modal-title"> %1 &nbsp</h4>', policy.title);
                    wrapper += '</div>'
                }    
            }

            function buildFooter() {
                if (policy.footer || policy.buttons) {
                    wrapper += '<div class="modal-footer text-right">'
                    if (policy.buttons) {
                        Array2.forEach(policy.buttons, function (button){
                            if ($isString(button)){
                                wrapper += format('<button class="btn btn-default btn-sm js-close">%1</button>', button);
                            } else if ($isObject(button)) {
                                wrapper += format('<button class="btn js-close %1">%2</button>', button.css, button.text);
                            }
                        });
                    } else {
                        wrapper += '<button class="btn btn-primary btn-sm js-close">Close</button>'
                    }
                    wrapper += '</div>'
                }
            }

            return wrapper;
        }
    });
    
    eval(this.exports);
    
}
