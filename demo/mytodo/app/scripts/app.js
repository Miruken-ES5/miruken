new function () {

    var mytodoApp = new base2.Package(this, {
        name:     'mytodoApp',
        ngModule: [ 'ngAnimate',
                    'ngCookies',
                    'ngResource',
                    'ui.router',
                    'ngRoute',
                    'ngSanitize',
                    'ngTouch',
                    'ui.sortable'
        ]
    });

    eval(this.imports);

    mytodoApp.ngModule
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