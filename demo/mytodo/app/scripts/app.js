new function () {

    miruken.ng.$bootstrap();

    angular
        .module('mytodoApp', [
            'ngAnimate',
            'ngCookies',
            'ngResource',
            'ui.router',
            'ngRoute',
            'ngSanitize',
            'ngTouch',
            'ui.sortable'
        ])
        .config(function ($routeProvider) {
            $routeProvider
                .when('/', {
                    templateUrl:  'views/todo.html',
                    controller:   'TodoController',
                    controllerAs: 'ctrl'
                 })
                .when('/about', {
                    templateUrl:  'views/about.html',
                    controller:   'AboutController',
                    controllerAs: 'ctrl'
                })
                .otherwise({
                    redirectTo: '/'
                });
        }); 
}