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
                  var previousElement,
                      name      = scope.$eval(attr.region),
                      newScope  = scope.$new(),
                      clone     = transclude(newScope, function (clone) {
                                      previousElement = clone;
                                      element.after(clone);
                                 });

                  function loadRegion(options) {
                      if(!options.template) {
                          throw new Error('template must be specified on region options');
                      }

                      $templateRequest(options.template, true).then(function (response) {
                          previousElement.remove();
                          newScope.$destroy();
                          newScope = scope.$new();

                          if (options.controller){
                            var controller = $controller(options.controller, { $scope: newScope });
                            if (options.controllerAs) {
                                scope[options.controllerAs] = controller;
                            }
                          }

                          var template = $compile(response),
                              bound    = template(newScope);
                          previousElement = bound;
                          element.after(bound);
                      }, function(){
                          throw new Error(format('template %1 was not found', options.template));
                      });
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
