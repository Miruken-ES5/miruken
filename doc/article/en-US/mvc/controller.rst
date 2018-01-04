==========
Controller
==========

Controllers extend from the Controller class.

.. code-block:: js

    const TeamsController = Controller.extend({
    });

Properties
==========

context
-------

Controllers are contextual and have a context property. It is recommended that you use io instead of context.

io
---

io is a more specialized context on the controller that has extra contextual information for MVC.  io is the recomended context to use in a controller.
