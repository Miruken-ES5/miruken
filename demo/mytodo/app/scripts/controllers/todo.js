new function () {

    var todo = new base2.Package(this, {
        name:    "todo",
        parent:  mytodoApp,
        imports: "miruken,miruken.mvc,miruken.ioc,miruken.ioc.config",
        exports: "TodoController,TodoInstaller,TodoRunner,TodoStartup"
    });

    eval(this.imports);

    var Scheduling = Protocol.extend({
        schedule: function (todo) {},
        unschedule: function (todo) {}
    });

    var Scheduler = Base.extend(Scheduling, {
        schedule: function (todo) {
            console.log("Scheduled '" + todo + "'");
        },
        unschedule: function (todo) {
            console.log("Unscheduled '" + todo + "'");
        }
    });

    var TodoController =  Controller.extend({
        $inject: ['$scope', '$http', Scheduling],
        constructor: function ($scope, $http, scheduling) {
            var _todos = [ 'Item 1', 'Item 2', 'Item 3' ];
            this.extend({
                getTodos: function () { return _todos; },
                addTodo: function (todo) { 
                    _todos.push(todo);
                    scheduling.schedule(todo);
                },
                removeTodoAt: function (index) {
                    scheduling.unschedule(_todos.splice(index, 1)); 
                }        
            });
        }
    });

    var TodoInstaller = Installer.extend({
        $inject: ['$module', '$rootContext'],
        constructor: function ($module, $rootContext) {
            this.extend({
                register: function(container, composer) {
                   return container.register($component(Scheduling).boundTo(Scheduler));
                }
            });
    }});

    var TodoRunner = ng.Runner.extend({
        $inject: ['$module', '$rootContext', '$log'],
        constructor: function ($module, $rootContext, $log) {
            this.extend({
                run: function() {
                    $log.info("todo ran");
                }
            });
    }});

    var TodoStartup = Startup.extend({
        $inject: ['$rootContext', '$log'],
        constructor: function ($rootContext, $log) {
            this.extend({
                start: function() {
                    $log.info("todo started");
                }
            });
    }});

    eval(this.exports);

}
