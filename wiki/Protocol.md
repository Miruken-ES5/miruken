#Protocols

**Namespace**
>miruken

The concept of a protocol is inspired by protocols in Objective-C and is loosely comparable to interfaces in C# or Java.

I say protocols are loosly comparable to interfaces because in Miruken objects are not required to implement all the functions of a protocol.
Objects can choose to only implement one or more functions from the Protocal and the actual implementation can be spread across many objects.

A protocol describes a set of expected behaviors by defining functions and properties. Parameters included in the Protocol definition are not actually used, but are very helpful in describing how the Protical should be called.
Protocols only define functions they do not implement them.
The actual implementaion is done in CallbackHandlers.

As an example lets create a Logging protocol with a debug method
```JavaScript
let Logging = Protocol.extend({
	debug(message) {}
});
```

and then lets create a [CallbackHandler](CallbackHandler.md) to implement the Logging Protocol and add it to a [Context](Context.md).

```JavaScript
let debugCalled = false;
let ObservableLoggingHandler = CallbackHandler.extend({
	debug(message) {
		debugCalled = true;
	}
});  

let context = new Context();
context.addHandlers([new ObservableLoggingHandler()]);
```
When the debug method is called 

	Logging(context).debug("message");

the debug method implementation on ObservableLoggingHandler will be called, 

Notice that this ObservableLoggingHandler does not explicitly implement the Logging Protocol, 
but will still be chosen to handle a call to debug because Miruken matches
Protocol methods based on name.  This makes the framework very flexible, but sometimes
this is not the behavior that is desired.

##StrictProtocol

StrictProtocols have a very simular bevahior to Protocols, but will only match 
CallbackHandlers that explicitly implement the Protocol.  In general it is recommended to 
create StrictProtocols unless you need the flexibility of Protocols.

Here our protocol extends from StrictProtocol

	let Logging = StrictProtocol.extend({
		debug(message) {}
	});

and can only be implemented by CallbackHandlers that explicitly handle Logging.

	let ObservableLoggingHandler = CallbackHandler.extend(Logging, {
    	debug(message) {
    		debugCalled = true;
    	}
    });   

	let context = new Context();
	context.addHandlers([new ObservableLoggingHandler()]);

