new function () {

    var infrastructure = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.ng",
        exports: "Region"
    });

    eval(this.imports);

    var Region = Directive.extend({
      $inject: ['$templateRequest', '$controller', '$compile'],
      constructor: function($templateRequest, $controller, $compile){
          this.extend({
              restrict: 'A',
              priority: 1200,
              transclude: 'element',
              link: function (scope, element, attr, ctrl, transclude) {
                  var currentScope,
                      previousElement;

                  var options = scope.$eval(attr.region);
                  if(options){
                    loadRegion(options);
                  } else {
                    var newScope = scope.$new();
                    var clone = transclude(newScope, function (clone) {
                        previousElement = clone;
                        currentScope = newScope;
                        element.after(clone);
                    });
                  }

                  function loadRegion(options) {
                      $templateRequest(options.template, true).then(function (response) {
                          cleanupLastIncludeContent();
                          var newScope = scope.$new();
                          currentScope = newScope;

                          if(options.controller){
                            var controller = $controller(options.controller, { $scope: newScope });
                            if (options.controllerAs) {
                                scope[options.controllerAs] = controller;
                            }
                          }

                          var template = $compile(response);
                          var bound  = template(newScope)
                          previousElement = bound;
                          element.after(bound);
                      });
                  };

                  var cleanupLastIncludeContent = function () {
                      if (previousElement) {
                          previousElement.remove();
                          previousElement = null;
                      }
                      if (currentScope) {
                          currentScope.$destroy();
                          currentScope = null;
                      }
                  };

                  var viewOne = {
                        template: 'app/regions/partialOne.html',
                        controller: 'PartialOneController',
                        controllerAs: 'vm'
                    };
                    var viewTwo = {
                        template: 'app/regions/partialTwo.html',
                        controller: 'PartialTwoController',
                        controllerAs: 'vm'
                    };
                    var loaded;
                    setInterval(function () {
                        load = loaded === viewOne ? viewTwo : viewOne;
                        loadRegion(load);
                        loaded = load;
                    }.bind(this), 2000);
              }
          });
      }
    });
    
    eval(this.exports);
}
