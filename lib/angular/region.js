var miruken = require('../miruken');
              require('../mvc');

new function () { // closure

    /**
     * Package providing [Angular](https://angularjs.org) integration.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "mvc"}}{{/crossLinkModule}},
     * @module miruken
     * @submodule ng
     * @namespace miruken.ng
     */
    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.mvc",
        exports: "PartialRegion,RegionDirective"
    });

    eval(this.imports);

    var PartialRegion = Base.extend(ViewRegion, {
        constructor: function (tag, container, $templates, $compile, $q, $timeout) {
            var _partialScope, _layers = [];
            this.extend({
                show: function (view) {
                    var composer = $composer,
                        policy   = new RegionPolicy();

                    if (composer.handle(policy, true) &&
                        (policy.tag && !$equals(policy.tag, tag))) {
                        return $NOT_HANDLED;
                    }

                    var controller = composer.resolve(Controller);                    
                    if (!controller) {
                        return $q.reject(new Error("A Controller could not be inferred"));
                    }

                    var navigation = composer.resolve(Navigation);
                    
                    var template, templateUrl;
                    
                    if ($isString(view)) {
                        templateUrl = view;
                    } else if (view) {
                        template     = view.template;
                        templateUrl  = view.templateUrl;
                    }

                    if (template) {
                        return renderTemplate(template);
                    } else if (templateUrl) {
                        if (templateUrl.lastIndexOf(".") < 0) {
                            templateUrl = templateUrl + ".html";
                        }
                        return $templates(templateUrl, true).then(function (template) {
                            return renderTemplate(template);
                        });
                    } else {
                        return $q.reject(new Error("A template or templateUrl must be specified"));
                    }
                    
                    function renderTemplate(template) {
                        var modal = policy.modal,
                            push  = modal || policy.push || _layers.length === 0;
                        
                        if (push) {
                            var Layer = Base.extend(ViewLayer, DisposingMixin, {
                                get index() {
                                    return _layers.indexOf($decorated(this, true));
                                },
                                transitionTo: function (controller, template, policy, composer) {
                                    var content = this._expandTemplate(template, controller);
                                    if (content.length > 1) {
                                        content = angular.element('<div/>').html(content);
                                    }
                                    if (modal) {
                                        var provider     = modal.style || ModalProviding,
                                            modalScope   = this._layerScope,
                                            modalContext = modalScope.context,
                                            modalResult  = provider(composer)
                                                .showModal(container, content, modal, modalContext);
                                        var modalLayer = $decorate(this, {
                                            modalContext: modalContext,
                                            modalResult: modalResult.closed,
                                            _dispose: function () {
                                                modalContext.end();
                                                if (navigation && navigation.push) {
                                                    controller.context.end();
                                                }
                                                this.base();
                                            }
                                        });
                                        modalScope.layer = modalLayer;                                        
                                        modalContext.onEnding(function () { modalLayer.dispose() });
                                        return modalResult.visible.then(function () {
                                            return modalLayer;
                                        });
                                    }
                                    this._layerScope.layer = this;                                    
                                    return $timeout(function () {
                                        if (this._content) {
                                            this._content.replaceWith(content);
                                        } else {
                                            container.html(content);
                                        }
                                        this._content = content;
                                        return this;
                                    }.bind(this));
                                },
                                transitionFrom: function () {
                                    if (this._content) {
                                        this._content.remove();
                                        this._content = null;
                                    }
                                    if (this._layerScope) {
                                        this._layerScope.$destroy();
                                        this._layerScope = null;                                        
                                    }
                                },
                                _expandTemplate: function (template, controller) {
                                    var context    = controller.context,
                                        scope      = context.resolve("$scope"),                                    
                                        layerScope = scope.$new();
                                    layerScope["ctrl"] = controller;
                                    var content = $compile(template)(layerScope);
                                    if (this._layerScope) {
                                        this._layerScope.$destroy();
                                    }
                                    this._layerScope = layerScope;
                                    return content;
                                },
                                _dispose: function () {
                                    var index = this.index;
                                    if (index < 0) { return; }
                                    _layers.splice(index, 1);
                                    this.transitionFrom();
                                }
                            });
                            
                            var layer = new Layer();
                            _layers.push(layer);
                            controller.context.onEnding(function () {
                                layer.dispose();
                            });
                        }

                        var activeLayer = _layers.slice(-1)[0];
                        return activeLayer.transitionTo(controller, template, policy, composer);
                    }
                }
            });
        }
    });

    /**
     * Angular directive marking a view region.
     * @class RegionDirective
     * @constructor
     * @extends miruken.ng.Directive     
     */
    var RegionDirective = Directive.extend({
        restrict:   "A",
        scope:      true,
        priority:   -1000,
        $inject:    ["$templateRequest", "$compile", "$q", "$timeout"],
        constructor: function ($templates, $compile, $q, $timeout) {
            this.extend({
                link: function (scope, element, attr) {
                    var tag     = attr.region,
                        context = scope.context,
                        owner   = context.resolve(Controller),
                        region  = this.createRegion(tag, element, $templates, $compile, $q, $timeout);
                    context.addHandlers(region);
                    if (owner && $isFunction(owner.viewRegionCreated)) {
                        owner.viewRegionCreated(tag, context);
                    }                    
                }
            }); 
        },
        createRegion: function (tag, element, $templates, $compile, $q, $timeout) {
            return new PartialRegion(tag, element, $templates, $compile, $q, $timeout);
        }
    });

    eval(this.exports);
    
}
