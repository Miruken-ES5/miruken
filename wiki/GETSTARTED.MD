#Get Started
Miruken's object-oriented approach gives power to development teams who have worked with class-based languages to quickly build and manage models and controllers in MVC applications. Miruken's goal is to simplify development using the existing protypical nature of the JavaScript framework, but use simple syntax and common understanding of object-oriented programming.

To begin, it is important to understand how JavaScript objects work compared to other object-oriented languages. If you are not familiar how JavaScript is a classless object-oriented programming language, refer to [Introduction to Object-Oriented JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript).

##Base Objects
**Base** is the base class for your objects.  For now, let's discuss the two (2) functions Base provides: **extend** and **implement**.

---

##Base Extend
**Extend** is the function that allows the dynamic flexibility in your application. You can use it to extend *classes*, *instances*, or *static* objects.

Extend takes two (2) arguments:

1. An object that you want to extend.
2. An object that will be used to create static methods and properties.

The second argument is *optional* and will be explained later in this section.

###Classes
As shown above, you can `extend` classes. Base is a class, therefore you should start by extending Base to create your classes. Afterwards, you can keep extending your new classes to create additional classes as you would traditionally in class-based programming languages.

For example:

**Zoo.js**

    const Animal = Model.extend({
    });

    const Eagle = Animal.extend({
        shriek: function(){
            // make a sound
        }
    });

    const Mouse = Animal.extend({
        squeak: function(){
            // make a sound
        }
    });

###Instances
Extend doesn't just help define additional attributes of classes. Because you can leverage the dynamic nature of JavaScript, you can `extend` instances after construction.

For example:

    const Ticket = Base.extend({
        
    });

    var ticket = new Ticket();
    ticket.extend({
        Open: function(){
        };
    });

    // open ticket
    ticket.Open();

    // do some work

    if (passValidation)
    {
        ticket.extend({
            Close: function(){
            };
        });
    }

    // close ticket
    ticket.Close();

###Static
You can also `extend` static objects.

    const Animal = Base.extend({
        var id = 0;
        var name = '';

        constructor: function(name){
            Animal.prototype.count = Animal.prototype.count++ || 1;
            id = Count();
            name = name;
        };
        
        Id: function(){
            return id;
        };

        Name: function(){
            return name;
        };
    },
    {
        Count: function(){
            return Animal.prototype.count;
        };
    });

    var Tom = new Animal('Tom');
    var Jerry = new Animal('Jerry');

    // static values
    Animal.Count()  // returns 2

    // instance values
    Tom.Id()        // returns 1
    Jerry.Id()      // returns 2

---

##Base Implement
**Implement** lets you add additional functionality to your objects in a manner that is dynamic. Implement only takes in a function as its argument. This means you can add that function to new instances as needed.

###Classes


###Modules Mixins
Mixins provides a clean way for code reuse without inheritance.

Given you have an object that should have an `id` and `name` property, you can add a verify function to that object and run it to check. The great thing about this is you can do it as if you were in development mode and not release mode.

    var debugMode = true;   // set to false for Release mode

    const Animal = Base.extend({
        var id = 0;
        var name = '';

        constructor: function(name){
            id = id++;
            this.name = name;
        };
    });

    var Verify = function(object){
        return object.hasOwnProperty('id')
            && object.hasOwnProperty('name');
    };

    if (debugMode) {
        Animal.implement(Verify);
    }

    var dog = new Animal('Rover');

    if (!dog.Verify()) {
        console.log('There is problem this with object.');
    }

##$properties


##References:
1. [A Base Class for JavaScript Inheritance](http://dean.edwards.name/weblog/2006/03/base/)
2. [base2: An Introduction](http://dean.edwards.name/weblog/2007/12/base2-intro/)
3. [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript)