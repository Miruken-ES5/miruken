========
Packages
========

Packages is the means to provide inversion of control. The basic package simply has:

1. A name
2. A list of names to import
3. The list of objects to export

For example:

.. code-block:: js

    new function() {
        base2.package(this, {
            name:       "zoo",
            imports:    "miruken",
            exports:    "Animal,Eagle,Mouse"
        });

        eval(imports);

        const Animal = Base.extend({
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

        eval(exports);
    };

Imports
=======

Using `imports` states that *names* of package(s) to be available in your closure. This is in essence makes classes defined in packages available in the closure. To start, you will need to bring in *miruken*. You will also need to run the `eval` function to actually import those classes.

For example:

.. code-block:: js

    new function() {
        base2.package(this, {
            name: "logging",
            imports: "miruken"
        });

        eval(this.imports);
    }

If you need to import multiple names under the `imports` property, just separate them with a comma. Order does not matter.

Exports
=======

Using `exports` states that *classes* defined in the closure to be available for other closures. Similar to imports, you need to call the `eval` to actually export the classes.

For example:

.. code-block:: js

    new function() {
        base2.package(this, {
            name: "logging",
            imports: "miruken"
        });

        eval(this.imports);

        const loggingProtocol = Protocol.extend({
            debug(){},
            error(){}
        });

        const NullLogger = Base.extend(loggingProtocol, {
            debug(){},
            error(){}
        });

        let nullLogger = new NullLogger();
        const Logger = Base.extend(loggingProtocol, {
            debug(message){
                console.log(`DEBUG: ${message}`);
            },
            error(message){
                console.log(`ERROR: ${message}`);
            }

        }, {
            get NullLogger(){
                return nullLogger
            }
        }); 

        eval(this.exports);
    }

When you list your objects under the `exports` property, just separate them with a comma. Order does not matter.

Naming
======

The name is similar to namespace, meaning how would you organize or categorize your objects. The name is used during import to get a collection of objects for a given namespace and make them available for the particular closure.

For example:

    name: company.security
    name: company.http
    name: company.accounting
    name: company.security.cookies

Once you create the name, you can import as shown above.

.. code-block:: js

    new function() {

        base2.package(this, {
            name    : "company.security.cookies",
            imports : "miruken,company.security,company.http"
        });

        eval(this.imports);
    });



File Separation
===============

A file can have one object defined for a package or group objects. It is often best practice to keep objects in separate files. If you choose to use separate files for your objects, the name of the package is the same. When you call `eval`, it searches for all the files for a given package name.

Person.js

.. code-block:: js

    new function() {

        base2.package(this, {
            name   : "person",
            exports: "Person"
        });

        eval(this.imports);

        const Person = Base.extend({
            $properties: {
                firstName: null,
                lastName : null,
                gender   : null
            },
            get fullName(){
                return `${this.firstName} ${this.lastName}`
            }
        }, {
            male          : "MALE",
            female        : "FEMALE",
            itsComplicated: "ITSCOMPLICATED"
        });

        eval(this.exports);
    };

Patient.js

.. code-block:: js

    new function() {
        base2.package(this, {
            name    : "person",
            imports : "person",
            exports : "Patient"
        });

        eval(this.imports);

        const Patient = Person.extend({
            $properties: {
                exams: []
            }
        });

        eval(this.exports);
    };

Student.js

.. code-block:: js

    new function() {
        base2.package(this, {
            name    : "person",
            imports : "person",
            exports : "Student"
        });

        eval(this.imports);

        const Student = Person.extend({
            $properties: {
                grade: 0
            }
        });S

        eval(this.exports);
    };
