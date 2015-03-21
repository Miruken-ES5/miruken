new function () {

    var MainController = Miruken.extend({
        todos: ['Item 1', 'Item 2', 'Item 3']
    });

    angular.module('mytodoApp')
           .controller('MainController', MainController);

}
