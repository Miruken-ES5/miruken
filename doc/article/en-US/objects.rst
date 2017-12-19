=======
Objects
=======

Miruken's object-oriented approach gives power to development teams who have worked with class-based languages to quickly build and manage models and controllers in MVC applications. Miruken's goal is to simplify development using the existing protypical nature of the JavaScript framework, but use simple syntax and common understanding of object-oriented programming.

To begin, it is important to understand how JavaScript objects work compared to other object-oriented languages. If you are not familiar how JavaScript is a classless object-oriented programming language, refer to `Introduction to ObjectOriented JavaScript <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript>`_.

Base Objects
============

**Base** is the base class for all objects in Miruken. This object is what provides the object-oriented features in Miruken. For now, let's discuss the two (2) functions Base provides: **extend** and **implement**.

**Extend** is the function with which derived classes and objects are created. You can use it to extend *classes* and *instances*.  Extend can receive many arguments as you will see, but it's most frequently use is one to two arguments

1. An object whose members are available on instances.
2. An object whose members are available on the class itself.

The last argument is *optional* and will be explained later in this section.

**NOTE:** This is *not* to be confused with the ECMAScript 6 `extends <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Sub_classing_with_extends>`_ keyword. Miruken provides additional functionality that is not available with `extends`.

**Implement** is similar to *extend* where all you want to do is add additional static functionality to your class. The difference between `extend` and `implement` is you only need to pass an object with member functions or a single function you wish to add.

Working with Classes
====================

To begin, you can `extend` classes. **Base** is a class, therefore you should start by extending **Base** to create your classes. Afterwards, you can keep extending your classes to create additional classes as you would traditionally in class-based programming languages.

We are going to create a zoo package where you start with an **Animal** class and extend it to be more specific, such as an **Eagle** and a **Mouse**.  Packages will be described later.

For example, we will create a `Logger` object. Then extend it to be a `ConsoleLogger` and a `NotificationLogger`.

.. code-block:: js

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

Working with Instances
======================

Miruken doesn't just help define additional attributes of classes. Because you can leverage the dynamic nature of JavaScript, you can modify instances after construction and it will not affect other instances of that class.

For example, we have a `Logger` class that takes a name, just to differentiate the instances. You could theoretically have one logger that only does console logging while you create another instance to add an alert capability.

.. code-block:: js

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

        alertLogger.implement({
          alert(message) {
            alert(message);
          }
        });

        alertLogger.alert("Whoops!");
    };

Working with Static Methods
===========================

You can also modify objects with functions that are static and accessible to all instances of that class.

For example:

.. code-block:: js

    new function() {

        base2.package({
            name:       "instrumentation",
            imports:    "miruken",
            exports:    "NullLogger"
        });

        eval(this.imports);

        //A null object implementation
        let nullLoggerInstance;
        const NullLogger = Base.extend({
            debug(){},
            error(){}
        }, {
            get instance(){
                return nullLoggerInstance = nullLoggerInstance || new NullLogger();
            }
        });

        eval(this.exports);
    }

    new function() {

        base2.package({
            name:       "logging",
            imports:    "instrumentation"
        });

        eval(this.imports);

        let logger = NullLogger.instance;

        // now just use the logger
        logger.debug();

    };

Creating Mixins
===============

Mixins provides a clean way for code reuse without inheritance. The power of composition makes sense when you have an object that needs a diverse sets of functionality, but you don't want to do this through a lot of extending or inheritance. In this way, Miruken can provide multiple inheritance of various objects.

For example:

.. code-block:: js

    const ErrorIconMixin = Base.extend({
        showErrorIcon(): {
        }
    });

    const ErrorMessageMixin = Base.extend({
        showErrorMessage(message): {
        }
    });

    const Validation = Base.extend(ErrorIconMixin, ErrorMessageMixin, {
        show(): {
            ErrorIconMixin.showErrorIcon();
            ErrorMessageMixin.showErrorMessage();
        }
    });

Creating Properties
===================

One of the features of Miruken is `$properties`. As the name implies, it creates the get/set operations for a given key and type.

For example:

.. code-block:: js

    new function() {

        base2.package(this, {
            name   : "members",
            exports: "Person,Doctor"
        });

        eval(this.imports);

        const Person = Base.extend({
            $properties: {
                firstName: null,
                lastName: null,
                gender: null
            },
            get fullName(){
                return `${this.firstName} ${this.lastName}`
            }
        }, {
            male: "MALE",
            female: "FEMALE",
            itsComplicated: "ITSCOMPLICATED"
        });

        const Doctor = Person.extend({
            $properties: {
                specialty: null
            },
            get fullName(){
                return `Dr. ${this.base()}, ${this.specialty}`
            }
        }, {
            earNoseThroat:  "ENT",
            familyPractice: "FP",
            spinalSurgeon:  "OSS"
        });

        eval(this.exports);
    };

    new function() {

        base2.package({
            name: 'community',
            imports: 'common'
        });

        eval(this.imports);

        let member = new Person({
            firstName: 'John',
            lastName: 'Smith'
        });

        var personName = member.fullName; // "John Smith"

        let specialist = new Doctor({
            firstName: 'John',
            lastName: 'Smith',
            gender: Person.male,
            specialty: Doctor.earNoseThroat
        });

        var specialistName = specialist.fullName; // "Dr. John Smith, ENT"

    };

References
==========

1. `A Base Class for JavaScript Inheritance <http://dean.edwards.name/weblog/2006/03/base/>`_
2. `base2 an Introduction               <http://dean.edwards.name/weblog/2007/12/base2-intro/>`_
3. `Mozilla Developer Network           <https://developer.mozilla.org/en-US/docs/Web/JavaScript>`_
