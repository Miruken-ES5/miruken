new function () {

    var mytodoApp = new base2.Package(this, {
        name:     'mytodoApp',
        imports:  'miruken.ng',
        exports:  'ReverseFilter',
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

    var ReverseFilter = Filter.extend({
        filter: function (input, uppercase) {
            var output = "";
            input = input || '';
            for (var i = 0; i < input.length; i++) {
                output = input.charAt(i) + output;
            }
            if (uppercase) {
                output = output.toUpperCase();
            }
            return output;
        }
    });
    
    eval(this.exports);
    
}
