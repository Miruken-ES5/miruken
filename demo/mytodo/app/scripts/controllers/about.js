new function () {
    var AboutController = miruken.ng.Controller.extend({
        awesomeThings: [
           'HTML5 Boilerplate',
           'AngularJS',
           'Karma'
        ]
    });

    angular.module('mytodoApp')
           .controller('AboutController', AboutController);

}
