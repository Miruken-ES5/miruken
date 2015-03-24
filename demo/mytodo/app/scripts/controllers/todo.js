new function () {

    var todo = new base2.Package(this, {
        name:    "todo",
        parent:  mytodoApp,
        imports: "miruken,miruken.mvc,miruken.ioc.config",
        exports: "TodoController,TodoInstaller,TodoStartup"
    });

    eval(this.imports);

    var TodoController =  Controller.extend({
        $inject: ['$http'],
        constructor: function ($http) {
            var _todos = [ 'Item 1', 'Item 2', 'Item 3' ];
            this.extend({
                getTodos: function () { return _todos; },
                addTodo: function (todo) { _todos.push(todo); }
            });
        }
    });

    var TodoInstaller = Installer.extend({
        $inject: ['$module', '$stateProvider'],
        constructor: function ($module, $stateProvider) {
            this.extend({
                register: function(container, composer) { 
                }
            });
    }});

    var TodoStartup = Startup.extend({
        $inject: ['$http', '$log'],
        constructor: function ($http, $log) {
            this.extend({
                start: function() {
                    $log.info("Starting todo");
                }
            });
    }});

    eval(this.exports);

}
