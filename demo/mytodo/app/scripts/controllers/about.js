/*
eval(miruken.mvc.namespace);

mytodoApp.export(
    "AboutController",
    Controller.extend({
        awesomeThings: [
           'HTML5 Boilerplate',
           'AngularJS',
           'Karma'
        ]
    }));
*/

new function () {

    var todo = new base2.Package(this, {
        name:    "todo",
        parent:  mytodoApp,
        imports: "miruken,miruken.mvc",
        exports: "AboutController"
    });

    eval(this.imports);

    var AboutController = Controller.extend({
        awesomeThings: [
           'HTML5 Boilerplate',
           'AngularJS',
           'Karma'
        ]
    });

    eval(this.exports);

}