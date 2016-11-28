#Protocols

**Namespace**
>miruken

A Protocol describes a set of expected methods and properties.  Protocols are only definitions.
The actual implementation is done in CallbackHandlers.

The concept of a Protocol is inspired by protocols in Objective-C and is loosely comparable to interfaces in C# or Java.

I say protocols are loosly comparable to interfaces because in Miruken CallbackHandlers are not required to implement all the members of a Protocol.
CallbackHandlers can implement one or more functions from the Protocal and the full implementation can be spread across many objects.


##Methods
As an example lets create a Logging Protocol with a debug method.

```JavaScript
let Logging = Protocol.extend({
    debug(message) {}
});
```

Parameters included in the Protocol definition are not actually used, but are very helpful in describing how the Protocol should be called.

Now lets implement the Logging Protocol using a [CallbackHandler](CallbackHandler.md)

```JavaScript
let debugCalled = false;
let ObservableLoggingHandler = CallbackHandler.extend({
    debug(message) {
            debugCalled = true;
    }
});  
```

To execute a method on a Protocol you need to pass a Delegate into the Protocol 
and then call the method.

For example, here I am passing an instance of the ObservableLoggingHandler, into the Logging Protocol
and when the debug method is called on the protocol
the debug method on ObservableLoggingHandler will be called.

```JavaScript
let handler = new ObservableLoggingHandler();
Logging(handler).debug("message");
```
Notice that ObservableLoggingHandler does not explicitly implement the Logging Protocol.
It is simply a CallbackHandler with a debug method.
It was chosen to handle the call to debug because Miruken matches
Protocol methods based on the method name.

Obviously, this is a very simple example so it may be easy to miss how powerful Protocols and CallbackHandlers really are.
In real life applications, CallbackHandlers are added to Contexts that contain many different CallbackHandlers and then contexts are passed into the protocols.

```JavaScript
var context = new Context();
context.addHandler(new ObservableLoggingHandler());
Logging(context).debug("message");

```

##Properties

###$properties

Properties work similarly to methods.  First define a Protocol with properties.

```JavaScript
let Logging  = Protocol.extend({
    $properties: {
        level: null
    }
});
```

and then create a CallbackHandler that implements the properties.

```JavaScript
let LoggingHandler = CallbackHandler.extend(Logging, {
    $properties: {
        level: "debug" 
    }
});
```

Now we can use unit tests to test that the properties work as expected.

```JavaScript
describe("Protocols with properties", () => {
    let handler = new LoggingHandler();

    it("returns the property value", () => {
        Logging(handler).level
            .should.equal("debug");
    });

    it("sets and returns values", () => {
        Logging(handler).level = "error";

        Logging(handler).level
            .should.equal("error");
    });
});
```

###getters and setters

Protocols also support properties using getter and setter methods.

```JavaScript
let Logging  = Protocol.extend({
    get level() {},
    set level(value) {}
});

let logLevel = "debug";
let LoggingHandler = CallbackHandler.extend(Logging, {
    get level() { return logLevel; },
    set level(value) { logLevel = value; }
});

```

```JavaScript
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
```
#StrictProtocol

StrictProtocols have a very simular bevahior to Protocols, 
but give you more control over which CallbackHandlers are given a chance to handle the method call.
Only CallbackHandlers that explicitly implement the StrictProtocol will be given a chance to handle the method call.
A CallbackHandler can explicitly implement a Protocol by passing it in to the extend method before the object literal
that defines the behavior.

Here is a new Loggin Protocol and this time it extends from StrictProtocol.

```JavaScript
let Logging = StrictProtocol.extend({
        debug(message) {}
});
```

It can only be implemented by CallbackHandlers that explicitly handle the Logging Protocol.

```
let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
    debug(message) {
            debugCalled = true;
    }
});   

Logging.adoptedBy(ObservableLoggingHandler)
    .should.be.true;
```

##Benefits of Protocols

**Polymorphism**
>Polymorphism means that the receiver of a call decides the implementation. 
>Poly meaning many and morph meaning shape or form.

Protocols enable polymorphic behavior in javascript. A single protocol can be implemented in many forms.
For the Logging protocol defined above, we may have a NullLogger that does nothing, a ConsoleLogger that logs to the local console window, 
and an HttpLogger that logs back to the web server. Each of them can choose to implement part or all of the Logging protocol.  

Combining Protocols with Contexts and CallbackHandlers gives application developers complete control over application behavior.  
It gives the ability to override, modify, and extend behavior at any level of the application.

##Methods for working with Protocols

Given the following Protocols and instances

```JavaScript
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
```

###$isProtocol(target) 

A function in miruken that returns true if the target is a Protocol

```JavaScript
$isProtocol(Logging)
    .should.be.true;
```

###Protocol.isProtocol(target)

A method on Protocol that return true if the target is a Protocol

```JavaScript
Protocol.isProtocol(Logging)
    .should.be.true;
```

###Protocol.adoptedBy(target)
Returns true if the Protocol is impmented by the target.

```JavaScript
Logging.adoptedBy(ObservableLoggingHandler)
    .should.be.true;
```
###object.conformsTo(protocol)
Returns true if the object implements the Protocol.

```JavaScript
ObservableLoggingHandler.conformsTo(Logging)
    .should.be.true;
```

