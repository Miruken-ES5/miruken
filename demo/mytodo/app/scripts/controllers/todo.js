new function () {

    var todo = new base2.Package(this, {
        name:    "todo",
        parent:  mytodoApp,
        imports: "miruken,miruken.mvc",
        exports: "TodoController"
    });

    eval(this.imports);

    var TodoFeature = Protocol.extend({
        fetchTodos: function () {}
    });

    var TodoController =  Controller.extend({
        getTodos: function () {
            return TodoFeature(this.context).fetchTodos();
        },

        fetchTodos: function () {
            return [ 'Item 1', 'Item 2', 'Item 3' ];
        }
    });

    eval(this.exports);
}
