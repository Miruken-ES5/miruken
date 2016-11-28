#Context and Callbacks


##Protocols

The concept of a protocol is inspired by protocols in Objective-C and is loosely comparable to interfaces in C# or Java.
A protocol describes a set of expected behaviors by defining functions and parameters.
Protocols only define functions and properties they do not implement them.
Other objects called CallbackHandlers will implement protocols, and we will discuss them next.
I say protocols are loosly comparable to interfaces because in Miruken objects are not required to implement all the functions of a protocol.
Objects can choose to only implement one or more functions and the actual implementation can be spread across many objects.

As an example lets create a logging protocol with two methods: debug and error. Both methods take a message as the parameter.

    const loggingProtocol = Protocol.extend({
        debug(message){},
        error(message){}
    });

##Callback Handlers
Now that we know all about protocols, we need to provide actual implementations and that is where CallbackHandlers come in.

##Context
