new function () {

    var infrastructure = new base2.Package(this, {
        name:    "sampleApp",
        imports: "miruken.ng",
        exports: ""
    });

    eval(this.imports);
    
    function isDefined(value) { return typeof value !== 'undefined'; }

    var ngIncludeDirective = ['$templateRequest', '$anchorScroll', '$animate', '$sce',
                      function ($templateRequest, $anchorScroll, $animate, $sce) {
                          return {
                              restrict: 'ECA',
                              priority: 400,
                              terminal: true,
                              transclude: 'element',
                              controller: angular.noop,
                              compile: function (element, attr) {
                                  var srcExp = attr.ngInclude || attr.src,
                                      onloadExp = attr.onload || '',
                                      autoScrollExp = attr.autoscroll;

                                  return function (scope, $element, $attr, ctrl, $transclude) {
                                      var changeCounter = 0,
                                          currentScope,
                                          previousElement,
                                          currentElement;

                                      ////
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

                                      loaded = viewOne;
                                      loadRegion(viewOne);
                                      /////

                                      var cleanupLastIncludeContent = function () {
                                          if (previousElement) {
                                              previousElement.remove();
                                              previousElement = null;
                                          }
                                          if (currentScope) {
                                              currentScope.$destroy();
                                              currentScope = null;
                                          }
                                          if (currentElement) {
                                              $animate.leave(currentElement).then(function () {
                                                  previousElement = null;
                                              });
                                              previousElement = currentElement;
                                              currentElement = null;
                                          }
                                      };

                                      function loadRegion(options) {

                                          ctrl.options = options;
                                          var afterAnimation = function () {
                                              if (isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                                                  $anchorScroll();
                                              }
                                          };
                                          var thisChangeId = ++changeCounter;

                                          if (options.template) {
                                              //set the 2nd param to true to ignore the template request error so that the inner
                                              //contents and scope can be cleaned up.
                                              $templateRequest(options.template, true).then(function (response) {
                                                  if (thisChangeId !== changeCounter) return;
                                                  var newScope = scope.$new();
                                                  ctrl.template = response;

                                                  // Note: This will also link all children of ng-include that were contained in the original
                                                  // html. If that content contains controllers, ... they could pollute/change the scope.
                                                  // However, using ng-include on an element with additional content does not make sense...
                                                  // Note: We can't remove them in the cloneAttchFn of $transclude as that
                                                  // function is called before linking the content, which would apply child
                                                  // directives to non existing elements.
                                                  var clone = $transclude(newScope, function (clone) {
                                                      cleanupLastIncludeContent();
                                                      $animate.enter(clone, null, $element).then(afterAnimation);
                                                  });

                                                  currentScope = newScope;
                                                  currentElement = clone;

                                                  currentScope.$emit('$includeContentLoaded', options.template);
                                                  scope.$eval(onloadExp);
                                              }, function () {
                                                  if (thisChangeId === changeCounter) {
                                                      cleanupLastIncludeContent();
                                                      scope.$emit('$includeContentError', options.template);
                                                  }
                                              });
                                              scope.$emit('$includeContentRequested', options.template);
                                          } else {
                                              cleanupLastIncludeContent();
                                              ctrl.template = null;
                                          }
                                      };
                                  };
                              }
                          };
                      }];

    var ngIncludeFillContentDirective = ['$compile', '$controller',
        function ($compile, $controller) {
          return {
              restrict: 'ECA',
              priority: -400,
              require: 'region',
              link: function (scope, $element, $attr, ctrl) {
                  if (/SVG/.test($element[0].toString())) {
                      // WebKit: https://bugs.webkit.org/show_bug.cgi?id=135698 --- SVG elements do not
                      // support innerHTML, so detect this here and try to generate the contents
                      // specially.
                      $element.empty();
                      $compile(jqLiteBuildFragment(ctrl.template, document).childNodes)(scope,
                          function namespaceAdaptedClone(clone) {
                              $element.append(clone);
                          }, { futureParentElement: $element });
                      return;
                  }

                  var controller = $controller(ctrl.options.controller, { $scope: scope });
                  if (ctrl.options.controllerAs) {
                      scope[ctrl.options.controllerAs] = controller;
                  }

                  $element.html(ctrl.template);
                  $compile($element.contents())(scope);
              }
          };
      }];

    angular
        .module('sampleApp')
        .directive('region', ngIncludeDirective)
        .directive('region', ngIncludeFillContentDirective);


    eval(this.exports);
}
