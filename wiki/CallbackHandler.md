#CallbackHandler
**Namespace**
>miruken.callback 

CallbackHandlers play a key role in the polymorphic behavior of miruken.  They are where you implement the lion's share of your business logic.
To say it another way, you can have many different CallbackHandlers registered in miruken, and the right one will be chosen at runtime base on
the current application context.

It is often said that the difference between a **framework** and a **library** is that a library is something you call in your code and a framework
is something that calls your code.  Miruken is definatly a framework.  Miruken calls your code, and the code that it calls resides in 
CallbackHandlers.

```Javascript

let Logging = Protocol.extend({
    debug(message){}
});

let LoggingHandler = CallbackHandler.extend(Logging, {
    debug(message) {
        //log message here 
    };
});

```

Here we are creating a LoggingHandler and there are several things to notice.  CallbackHandlers extend from CallbackHandler.
They can explicitly adopt a Protocol by passing in that Protocol to the extend function. Here LoggingHandler explicitly 
adopts the Logging protocol by passing it in to extends. The implementation for the debug method is done on an object
literal that is passed in to the extend method.

We can now have multiple implementations for logging in our applications.  We could have a NullLogger that is simply a noop.
This could be handly for running in production where you don't want the app logging to the browser console.

```Javascript

let NullLoggingHandler = CallbackHandler.extend(Logging, {
    debug(message) {};
});

```

We could also create an ObservableLoggingHandler to use during unit testing.

```Javascript
let debugCalled = false;
let NullLoggingHandler = CallbackHandler.extend(Logging, {
    debug(message) {
        debugCalled = true; 
    };
});

```
 
During development and debugging you will probably want a ConsoleLoggingHandler that just
logs out to the browser console.

```Javascript

let NullLoggingHandler = CallbackHandler.extend(Logging, {
    debug(message) {
        console.log(message);
    };
});

```

Also, handy in Production would be an HttpLoggingHandler that sends errors to the server to be logged.

```Javascript

let Logging = Protocol.extend({
    debug(message){},
    error(message){}
});

let HttplLoggingHandler = CallbackHandler.extend(Logging, {
    error(message) {
        return $http.post("/api/log", {
            level  : "error",
            message: message
        })
    };
});

```

Now in the setup portion of our application we could set up different loggers depending on the environment.

```JavaScript

if (env = "PROD") {
    rootContext.addHandler(new NullLoggingHandler());
    rootContext.addHandler(new HttpLoggingHandler());
}

```

Calling `Logging(context).debug("My debug message")` would call the debug method on the NullLoggingHandler, but calling
`Logging(context).error("Something really bad happened")` would call the error method on the HttpLoggingHandler.


