new function () {

    miruken.ng.createModulePackages();

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
        .run(['$rootScope', '$injector', miruken.ng.bootstrapMiruken]);
 
}