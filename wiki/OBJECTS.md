#Objects
Miruken's object-oriented approach gives power to development teams who have worked with class-based languages to quickly build and manage models and controllers in MVC applications. Miruken's goal is to simplify development using the existing protypical nature of the JavaScript framework, but use simple syntax and common understanding of object-oriented programming.

To begin, it is important to understand how JavaScript objects work compared to other object-oriented languages. If you are not familiar how JavaScript is a classless object-oriented programming language, refer to [Introduction to Object-Oriented JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript).

##Base Objects
**Base** is the base class for all objects in Miruken. This object is what provides the object-oriented features in Miruken. For now, let's discuss the two (2) functions Base provides: **extend** and **implement**.

---

##Extend Function
**Extend** is the function which derived classes and objects are created. You can use it to extend *classes* and *instances*.  Extend can receive many arguments as you will see, but it's most frequently use is one to two arguments

1. An object whose members are available on instances.
2. An object whose members are available on the class itself.

The second argument is *optional* and will be explained later in this section.

**NOTE:** This is *not* to be confused with the ECMAScript 6 [`extends`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Sub_classing_with_extends) keyword. Miruken provides additional functionality that is not available with `extends`.

###Classes
To begin, you can `extend` classes. **Base** is a class, therefore you should start by extending **Base** to create your classes. Afterwards, you can keep extending your classes to create additional classes as you would traditionally in class-based programming languages.

We are going to create a zoo package where you start with an **Animal** class and extend it to be more specific, such as an **Eagle** and a **Mouse**.  Packages will be described later.

For example, we will create a `Logger` object. Then extend it to be a `ConsoleLogger` and a `NotificationLogger`.

    // we need a base logger to capture all the messages
    const Logger = Base.extend({
    });

    // now extend to create a console logger
    const ConsoleLogger = Logger.extend({
    });

    // now extend to create a notification logger
    const NotificationLogger = Logger.extend({
    });

As you can see, creating and extending classes is very straight forward. Provide a class name and use `extend`.

###Instances
Extend doesn't just help define additional attributes of classes. Because you can leverage the dynamic nature of JavaScript, you can `extend` instances after construction and it will not affect other instances of that class.

For example, we have a `Logger` class that takes a name, just to differientiate the instances. You could theoretically have one logger that only does console logging while you create another instance to add an alert capability.

    new function () {

      base2.package(this, {
        name   : "instances",
        exports: "Logger" 
      });

      eval(this.imports);

      const Logger = Base.extend({
        // hold the name for this logger
        name: "",

        constructor: function(name) {
          this.name = name;
        }

      });

      eval(this.exports);

    };

    new function() {

        base2.package(this, {
            name:       "instrumentation",
            imports:    "miruken,instances"
        });

        let myLogger = new Logger("console");
        let alertLogger = new Logger("alert");

        alertLogger.extend({
          alert: function(message) {
            alert(message);
          }
        });
    };

###Static
You can also `extend` objects with functions that are static and accessible to all instances of that class. As mentioned above, this is the second argument you can pass into the `extend` function.

For example, using pseudo-code:

    const Animal = Base.extend({
        let id = 0;
        let name = '';

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
    },{
        Count: function(){
            return Animal.prototype.count;
        };
    });

    let Tom = new Animal('Tom');
    let Jerry = new Animal('Jerry');

    // static values
    Animal.Count()  // returns 2

    // instance values
    Tom.Id()        // returns 1
    Jerry.Id()      // returns 2

---

##Implement Function
Mixins provides a clean way for code reuse without inheritance.

**Implement** lets you add additional functionality to your objects in a manner that is dynamic. Implement only takes in a function as its argument. This means you can add that function to new instances as needed.

###Classes
*Find Ruby Mixin definition*

    class.foo()
    class2.foo() { this.foo(), foo()}

Like C# static methods...

    const myMixin = Module.extend({
        foo(object){
        };
    });
    const someClass = Base.extend(MyMixin, {

    });

    For Example 1
    const s = new SomeClass();

    For Example 2
    SomeClass().implement(MyMixin);

    For Example 2 Class
    const myMixin = Base.extend({
        foo(){
        };
    });

    implements functions on classes or modules.

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

##Modules Mixins
Another way to create a mixin is to use **Module**. Module is abstract, therefore you cannot create an instance, but you leverage the nature of abstract to modify other objects.

For example:

    const Person = Base2.extend({
        $properties: {
            id: 0,
            personName: ""
        }
        constructor: (name) {
            personName = name;
            id = Count()++;
        };
        private count = 0;
        private Count() {
            return count;
        };
    });

    const Relationship = Base2.extend({
        var entity1Id: 0;
        var entity2Id: 0;
        constructor: (entity1, entity2){
            entity1Id = entity1.Id;
            entity2Id = entity2.Id;
        };
    });

    var person = new Person();
    var doctor = new Person();
    var relationship = new Relationship(person, doctor);

    const IsEntityMixin = Module.extend({
        IsEntity(object) {
            object.Destination = "JFK";
        };
    });

##Properties
One of the features of Miruken is `$properties`. As the name implies, it creates the get/set operations for a given key and type.

For example, using pseudo-code:

    const Person = Base.extend({
        $properties: {
            firstName: '',
            lastName: '',
            active: true,
            id: 0
        }
    });

##References:
1. [A Base Class for JavaScript Inheritance](http://dean.edwards.name/weblog/2006/03/base/)
2. [base2: An Introduction](http://dean.edwards.name/weblog/2007/12/base2-intro/)
3. [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript)