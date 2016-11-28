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
                    var composer   = $composer,
                        navigation = composer.resolve(Navigation);
                    
                    if (!(navigation && navigation.controller)) {
                        return $q.reject(new Error("A Controller could not be inferred"));
                    }
                    
                    var template, templateUrl,
                        controller = navigation.controller;
                    
                    if ($isString(view)) {
                        templateUrl = view;
                    } else if (view) {
                        template     = view.template;
                        templateUrl  = view.templateUrl;
                    }

                    if (template) {
                        return replaceContent(template);
                    } else if (templateUrl) {
                        if (templateUrl.lastIndexOf(".") < 0) {
                            templateUrl = templateUrl + ".html";
                        }
                        return $templates(templateUrl, true).then(function (template) {
                            return replaceContent(template);
                        });
                    } else {
                        return $q.reject(new Error("A template or templateUrl must be specified"));
                    }
                    
                    function replaceContent(template) {
                        var policy = new RegionPolicy();
                        composer.handle(policy, true);                        
                        if (_layers.length === 0 || policy.push) {
                            var Layer = Base.extend(ViewLayer, DisposingMixin, {
                                transitionTo: function (controller, template, policy, composer) {
                                    var content = this._replaceContent(controller, template),
                                        modal   = policy.modal;
                                    if (modal) {
                                        var provider = modal.style || ModalProviding;
                                        return $q.when(provider(composer)
                                            .showModal(container, content, modal, this._layerScope.context));
                                    }                                                            
                                    return $timeout(function () {
                                        container.html(content);
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
                                _replaceContent: function (controller, template) {
                                    var context    = controller.context,
                                        scope      = context.resolve("$scope"),                                    
                                        layerScope = scope.$new();
                                    layerScope["ctrl"] = controller;
                                    this._content = $compile(template)(layerScope);
                                    if (this._layerScope) {
                                        this._layerScope.$destroy();
                                    }
                                    this._layerScope = layerScope;
                                    return this._content;
                                },
                                _dispose: function () {
                                    var index = _layers.indexOf(this);
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
        scope:      false,        
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
                        owner.viewRegionCreated(region);
                    }                    
                }
            }); 
        },
        createRegion: function (tag, element, $templates, $compile, $q, $timeout)
        {
            return new PartialRegion(tag, element, $templates, $compile, $q, $timeout);
        }
    });

    eval(this.exports);
    
}
