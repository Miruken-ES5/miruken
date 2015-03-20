eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(miruken.ioc.namespace);
eval(miruken.validate.namespace);
eval(miruken.error.namespace);

angular
  .module('mytodoApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl:  'views/main.html',
        controller:   'MainController',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl:  'views/about.html',
        controller:   'AboutController',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function ($rootScope, $injector) {
      var rootContext = new Context;
      rootContext.addHandlers(new IoContainer, new ValidationCallbackHandler, new ErrorCallbackHandler);
      $rootScope.rootContext = $rootScope.context = rootContext;

      var scopeProto   = $rootScope.constructor.prototype,
          newScope     = scopeProto.$new,
          destroyScope = scopeProto.$destroy;
      scopeProto.$new = function () {
          var childScope  = newScope.apply(this, Array.prototype.slice.call(arguments)),
              parentScope = childScope.$parent;
          childScope.context = parentScope && parentScope.context
                             ? parentScope.context.newChild()
                             : new Context;
          return childScope;
      };
      scopeProto.$destroy = function () {
          var context = this.context;
          if (context !== rootContext) {
              context.end();
          }
          destroyScope.apply(this, Array.prototype.slice.call(arguments));
      };
  });
