var miruken = require('../miruken');
              require('../context');
              require('../mvc');

new function () { // closure

    /**
     * Package providing [Angular](https://angularjs.org) integration.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}},
     * @module miruken
     * @submodule ng
     * @namespace miruken.ng
     */
    miruken.package(this, {
        name:    "ng",
        imports: "miruken,miruken.context,miruken.mvc",
        exports: "PartialRegion,RegionDirective"
    });

    eval(this.imports);

    var PartialRegion = Base.extend(ViewRegion, $contextual, {
        constructor: function (name, container, $templates, $compile, $q, $timeout) {
            var _partialScope;
            this.extend({
                get name() { return name; },
                show: function (view) {
                    var composer = $composer,
                        template,  templateUrl;
                    
                    if ($isString(view)) {
                        templateUrl = view;
                    } else if (view) {
                        template     = view.template;
                        templateUrl  = view.templateUrl;
                    }
                    
                    var controller = composer.resolve(Controller);
                    if (controller == null) {
                        return $q.reject(new Error("A Controller could not be inferred"));
                    }                    
                    
                    if (template) {
                        return replaceContent(template);
                    } else if (templateUrl) {
                        return $templates(templateUrl, true).then(function (template) {
                            return replaceContent(template);
                        });
                    } else {
                        return $q.reject(new Error("A view template or templateUrl must be specified"));
                    }
                    
                    function replaceContent(template) {
                        var modalPolicy  = new ModalPolicy(),
                            isModal      = composer.handle(modalPolicy, true),
                            context      = controller.context;                            
                            scope        = context.resolve("$scope"),
                            partialScope = scope.$new();
                        
                        partialScope["ctrl"] = controller;
                        var content = $compile(template)(partialScope);
                        if (_partialScope) {
                            _partialScope.$destroy();
                        }
                        _partialScope = partialScope;
                        
                        return $timeout(function () {
                            if (isModal) {
                                var provider = modalPolicy.style || ModalProviding;
                                return $q.when(provider(composer)
                                         .showModal(container, content, modalPolicy, context));
                            }                            
                            container.html(content);
                            return context;
                        });
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
                    var name    = attr.region,
                        context = scope.context,
                        owner   = context.resolve(Controller),
                        partial = new PartialRegion(name, element, $templates, $compile, $q, $timeout);
                    context.addHandlers(partial);
                    if (owner && $isFunction(owner.viewRegionCreated)) {
                        owner.viewRegionCreated(partial);
                    }                    
                }
            }); 
        }
    });

    eval(this.exports);
    
}
