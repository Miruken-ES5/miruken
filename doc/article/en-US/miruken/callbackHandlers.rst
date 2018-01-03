=================
Callback Handlers
=================
**Namespace**
>miruken.callback 

CallbackHandlers are where you implement the business logic for your Protocols.
They play a key role in the polymorphic behavior of miruken because 
you can have multiple implementations of the same protocol, and the appropriate implementation will be chosen at runtime base on
the current application context.

It is often said that the difference between a **framework** and a **library** is that a library is something you call in your code and a framework
is something that calls your code.  Miruken is definately a framework.  Miruken calls your code, and the code that it calls resides in 
CallbackHandlers.

Throughout this explaination of Callbackhandlers we will be using a very simple Logging Protocol.

.. code-block:: js

    const Logging = Protocol.extend({ 
        debug(message){}
    });


Now lets create a very simple LoggingHandler to discuss.
 
.. code-block:: js

    let LoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {
            //log message here 
        };
    });

Here we are creating a LoggingHandler and there are three things to notice.  First, CallbackHandlers extend from CallbackHandler.
Second, they can explicitly adopt a Protocol by passing in that Protocol to the extend function. Here LoggingHandler explicitly 
adopts the Logging protocol by passing Logging in to extend. Third, the implementation for the debug method is done with an object
literal that is passed in as the second parameter. 

Explicit Protocol Adoption
==========================

Explicit Protocol adoption is done by passing one or more protocols into the extend method, and then implementing
one or more of the members of each protocol. You do not have to implement all the members of a protocol.  The full
implementation can be spread across many CallbackHandlers if it makes sense for your application.

.. code-block:: js

    let LoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {
            //log message here 
        };
    });

    describe("LoggingHandler", () => {
        it("explicitly adopts the Loggin Protocol", () => {
            Logging.adoptedBy(LoggingHandler).should.be.true;
        });
    });

You can see in the test above that Logging is adopted by LoggingHandler.

Implicit Protocol Implementations
=================================

Implicit Protocol implementation does not require you to pass in the Protocols to the extend method.
At runtime methods will be matched by method name only and will be ignored by StrictProtocols and strict method execution.

.. code-block:: js

    let LoggingHandler = CallbackHandler.extend({
        debug(message) {
            //log message here 
        };
    });

    describe("LoggingHandler", () => {
        it("implicitly implements the Loggin Protocol", () => {
            Logging.adoptedBy(LoggingHandler).should.be.false;
        });
    });
 
See the [Protocol](Protocol.md) documentation for more information on StrictProtocols.

Polymorphism
============

You can create multiple implementations for Protocols in your application.
Using the Logging Protocol above, we could have a NullLogger that is simply a noop.
This could be handy for running in production when you don't want the app logging to the browser console.

.. code-block:: js

    let NullLoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {};
    });

We could also create an ObservableLoggingHandler to use during unit testing.

.. code-block:: js

    let debugCalled = false;
    let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {
            debugCalled = true; 
        };
    });

 
During development and debugging you will probably want a ConsoleLoggingHandler that just
logs messages out to the browser console.

.. code-block:: js

    let ConsoleLoggingHandler = CallbackHandler.extend(Logging, {
        debug(message) {
            console.log(message);
        };
    });


Also, handy in production would be an HttpLoggingHandler that sends errors to the server to be logged.
Lets add error to the Logging Protocol and implement http error logging. 

.. code-block:: js

    let Logging = Protocol.extend({
        debug(message){},
        error(message){}
    });

    let HttpLoggingHandler = CallbackHandler.extend(Logging, {
        error(message) {
            return $http.post("/api/log", {
                level  : "error",
                message: message
            })
        };
    });

*$http is the http provider in angular*

Executing CallbackHandler Methods
=================================

Directly
--------

CallbackHandlers have a toDelegate() method, so they can be passed directly into a Protocol and then executed.
This is very usefull for unit testing of your CallbackHandlers.

.. code-block:: js

    let handler = new ObservableLoggingHandler();
    Logging(handler).debug("My Message");

In Context
----------
In production code however, most the time CallbackHandlers will be added to a context, and then
the context will be passed in to the protocol. 

.. code-block:: js

    let context = new Context();
    context.addHandler(new ObservableLoggingHandler());
    Logging(context).debug("My Message");


Now in the setup portion of our application we could set up different loggers depending on the environment.

.. code-block:: js

    switch (env) {
        case "DEV":
            rootContext.addHandler(new ConsoleLoggingHandler());
        case "PROD":
            rootContext.addHandler(new NullLoggingHandler());
            rootContext.addHandler(new HttpLoggingHandler());
            break;
        default:
            rootContext.addHandler(new NullLoggingHandler());
    }


In prod, calling `Logging(context).debug("My debug message")` would call the debug method on the NullLoggingHandler, but calling
`Logging(context).error("Something really bad happened")` would call the error method on the HttpLoggingHandler.

If a Protocol member is called that has no implementation, an error will be thrown. 
For example, if debug is called, but no CallbackHandler is found that implements debug, you will see an error in the console with the following message:

.. code-block:: text

    "CallbackHandler has no method 'debug'"

Composition With $composer
==========================

$composer represents the current execution context.

We just saw that CallbackHandlers are most often executed through a Protocol within a context, but what happens 
when you want to call a Protocol from within a CallbackHandler? What context should you use? That is where the $composer comes in.  

As an example, lets create an Http Protocol whose implementation will post messages to the server.

.. code-block:: js

    const Http = Protocol.extend({
        post(url, data){}
    });

Now we can use the Http Protocol and $composer inside of the HttpLoggingHandler instead of $Http.

.. code-block:: js

    let HttpLoggingHandler = CallbackHandler.extend(Logging, {
        error(message) {
            return Http($composer).post("/api/log", {
                level  : "error",
                message: message
            });
        };
    });

$NOT_HANDLED
============

If for any reason your CallbackHandler cannot handle the request, you can always `return $NOT_HANDLED;`
and miruken will continue looking for another CallbackHandler that can handle the request. 
