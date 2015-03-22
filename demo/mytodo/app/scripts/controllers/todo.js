eval(miruken.mvc.namespace);

mytodoApp.export(
    Controller.extend({
        $inject: ['$route', '$location'],
        constructor: function ($route, $location) {
            this.extend({
                todos: [$location.path(), $route.current.controller, $route.current.templateUrl ]
            });
        }
    }),
    "TodoController");

