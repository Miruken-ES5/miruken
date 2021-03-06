var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('./view.js');

new function () { // closure

    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.mvc",
        exports: "Bootstrap,BootstrapProvider"
    });

    eval(this.imports);

    /**
     * Marker for Bootstrap providers.
     * @class Bootstrap
     * @extends miruken.mvc.ModalProviding
     */    
    var Bootstrap = ModalProviding.extend();
    
    /**
     * Bootstrap provider.
     * @class BootstrapProvider
     * @extends Base
     * @uses miruken.mvc.Bootstrap
     */    
    var BootstrapProvider = Base.extend(Bootstrap, {
        showModal: function (container, content, policy, context) {
            $('.modal').modal('hide');            

            if (policy.chrome) {
                $('body').append(_buildChrome(policy));
                $('.modal-body').append(content);
            } else {
                $('body').append(content);
            }

            var modal = $('.modal').modal()
                .on('hidden.bs.modal', remove);

            function remove() {
                modal.remove();
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
                context.end();
            }

            return {
                visible: new Promise(function (resolve, reject) {
                    modal.on('shown.bs.modal', function () {
                        resolve(modal);
                    });
                }),

                closed: new Promise(function (resolve, reject) {
                    function close(result) {
                        if (resolve) {
                            if (result != null) {
                                resolve(result);
                            } else {
                                reject();
                            }
                            resolve = null;
                            remove();
                        }
                    }

                    if (context) {
                        context.onEnding(function () { close(); } );
                    }

                    $('.modal .js-close').click(function (e) {
                        var result;
                        if (e.target.innerText != '\u00d7') {
                            var index = $(e.target).index();
                            if (policy.buttons && policy.buttons.length > index) {
                                result = new ButtonClicked(policy.buttons[index], index);
                            }
                        }
                        close(result)
                    });
                })
            };
        }  
    });

    function _buildChrome(policy) {
        var chrome = ''; 
        chrome += format('<div class="modal fade" role="dialog" %1>', policy.forceClose ? 'data-backdrop="static"' : '');
        chrome +=     '<div class="modal-dialog" role="document">';
        chrome +=         '<div class="modal-content">';
        
        chrome = _buildHeader(chrome, policy);
        
        chrome +=             '<div class="modal-body">';
        chrome +=             '</div>';
        
        chrome = _buildFooter(chrome, policy);
        
        chrome +=         '</div>';
        chrome +=     '</div>';
        chrome += '</div>';
        
        return chrome;
    }

    function _buildHeader(chrome, policy) {
        if (policy.header || policy.title) {
            chrome += '<div class="modal-header">';
            
            if (!policy.forceClose) {
                chrome += '<button type="button" class="close js-close">&times;</button>';
            }
            
            chrome += format('<h4 class="modal-title"> %1 &nbsp</h4>', policy.title);
            chrome += '</div>';
        }
        return chrome;
    }

    function _buildFooter(chrome, policy) {
        if (policy.footer || policy.buttons) {
            chrome += '<div class="modal-footer text-right">';
            if (policy.buttons) {
                Array2.forEach(policy.buttons, function (button) {
                    if ($isString(button)) {
                        chrome += format('<button class="btn btn-default btn-sm js-close">%1</button>', button);
                    } else if ($isObject(button)) {
                        chrome += format('<button class="btn js-close %1">%2</button>', button.css, button.text);
                    }
                });
            } else {
                chrome += '<button class="btn btn-primary btn-sm js-close">Close</button>';
            }
            chrome += '</div>';
        }
        return chrome;
    }

    eval(this.exports);
    
}
