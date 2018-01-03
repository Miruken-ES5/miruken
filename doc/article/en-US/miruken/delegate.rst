=========
Delegates
=========

Delegates extend from Delegate and implement get, set, and invoke functions.

.. code-block:: js

    var Delegate = Base.extend({
        get: function (protocol, propertyName, strict) {},
        set: function (protocol, propertyName, propertyValue, strict) {},
        invoke: function (protocol, methodName, args, strict) {}
    });

You could make you own if you wanted to, but almost always you will be using
one of mirukens build in delegates. There are several objects in Miruken
that are Delegates.  At the lowest level, there are InvocationDelegate, ObjectDelegate, and
ArrayDelegate. But mostly in your application you will be using a Context which is a Delegate,
and in your testing, you will be using CallbackHandlers, which are also Delegates.

Protocol will also accept an object that has a `toDelegate()` function that returns a delegate.
That is how CallbackHandlers work. They have a toDelegate() function that returns an
InvocationDelegate.
