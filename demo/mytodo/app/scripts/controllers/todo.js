new function () {

    var todo = new base2.Package(this, {
        name:    "todo",
        parent:  mytodoApp,
        imports: "miruken,miruken.mvc",
        exports: "TodoController"
    });

    eval(this.imports);

    var TodoController =  Controller.extend({
        constructor: function () {
            var _todos = [ 'Item 1', 'Item 2', 'Item 3' ];
            this.extend({
                getTodos: function () { return _todos; },
                addTodo: function (todo) { _todos.push(todo); }
            });
        }
    });

    eval(this.exports);
}
