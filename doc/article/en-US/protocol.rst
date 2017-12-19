========
Protocol
========

**Namespace**
>miruken

A **Protocol** describes a set of expected behavior.  Protocols declarations are independent of any class and only receive implementations when **adopted** by a specific class.

The concept of Protocols was inspired by Objective-C and is loosely comparable to interfaces in C# or Java.

I say protocols are loosly comparable to interfaces because unlike interfaces, members of a Protocol are optional. Classes are not required to implement all the members of a Protocol.  In fact, implementations of a Protocol can be spread across many classes.


Methods
=======

As an example lets create a Logging Protocol with a debug method.

.. code-block:: js

    const Logging = Protocol.extend({
        debug(message) {}
    });

Parameters included in the Protocol definitions are not actually used, but are very helpful in describing how the member should be called.

Now lets adopt the Logging Protocol by a class

.. code-block:: js

    let debugCalled = false;
    let ObservableLoggingHandler = Base.extend(Logging, {
        debug(message) {
            debugCalled = true;
        }
    });  

In addition to representing a contract, Protocols are first class objects with behavior of their own.  Protocols work in conjunction with a Delegate to provide a flexible layer of indirection allowing the "magic" can happen.

For example, here I am passing an instance of the ObservableLoggingHandler, into the Logging Protocol
and when the debug method is called on the protocol
the debug method on ObservableLoggingHandler will be called.

.. code-block:: js

    const handler = new ObservableLoggingHandler();
    Logging(handler).debug("message");

Properties
==========

Protocols also support properties using standard getter and setter methods.

.. code-block:: js

    let Logging  = Protocol.extend({
        get level() {},
        set level(value) {}
    });

    let logLevel = "debug";
    let LoggingHandler = Base.extend(Logging, {
        get level() { return logLevel; },
        set level(value) { logLevel = value; }
    });


.. code-block:: js

    describe("Protocols with getter and setter properties", () => {
        var handler = new LoggingHandler();

        it("returns the property value", () => {
            Logging(handler).level
                .should.equal("debug");
        });

        it("sets and returns values", () => {
            Logging(context).level = "error";

            Logging(handler).level
                .should.equal("error");
        });
    });

StrictProtocol
==============

StrictProtocols restrict invocations to implementations conforming to the StrictProtocol.  In other words, calling a member of StrictProtocol with only succeed if both the name of the member matches and the class adopted the StrictProtocol.

Here is a new Loggin Protocol and this time it extends from StrictProtocol.

.. code-block:: js

    const Logging = StrictProtocol.extend({
        debug(message) {}
    });

    const ObservableLoggingHandler = Base.extend(Logging, {
        debug(message) {
            debugCalled = true;
        }
    });   

    Logging.adoptedBy(ObservableLoggingHandler).should.be.true;

Benefits of Protocols
=====================

**Polymorphism**
>Polymorphism means that the receiver of a call decides the implementation. 
>Poly meaning many and morph meaning shape or form.

Protocols enable polymorphic behavior in javascript. A single protocol can be implemented in many forms.
For the Logging protocol defined above, we may have a NullLogger that does nothing, a ConsoleLogger that logs to the local console window, 
and an HttpLogger that logs back to the web server. Each of them can choose to implement part or all of the Logging protocol.  

Combining Protocols with Contexts and CallbackHandlers gives application developers complete control over application behavior.  
It gives the ability to override, modify, and extend behavior at any level of the application.

Methods for working with Protocols
==================================

Given the following Protocols and instances

.. code-block:: js

    let Logging = Protocol.extend({
        debug(message) {}
    });
            
    let debugCalled = false;
    let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {
            debugCalled = true;
        }
    });   

    let handler = new ObservableLoggingHandler();

$isProtocol(target) 
-------------------

A function in miruken that returns true if the target is a Protocol

.. code-block:: js

    $isProtocol(Logging)
        .should.be.true;

Protocol.isProtocol(target)
---------------------------

A method on Protocol that return true if the target is a Protocol

.. code-block:: js

    Protocol.isProtocol(Logging)
        .should.be.true;

Protocol.adoptedBy(target)
--------------------------

Returns true if the Protocol is impmented by the target.

.. code-block:: js

    Logging.adoptedBy(ObservableLoggingHandler)
        .should.be.true;

object.conformsTo(protocol)
---------------------------

Returns true if the object implements the Protocol.

.. code-block:: js

    ObservableLoggingHandler.conformsTo(Logging)
        .should.be.true;
