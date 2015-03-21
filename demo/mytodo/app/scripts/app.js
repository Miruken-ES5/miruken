new function () {

    miruken.ng.bootstrap();

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
        }); 
}