==========
ViewRegion
==========

show()
------

Controllers are responsible for choosing and showing one or more views. 

.. code-block:: js

     showTeams() {
         return ViewRegion(this.io).show("app/team/teams");
     },

.. code-block:: js

     choosePlayer() {
         return ViewRegion(this.io.modal({
             title:   "Select Your Players",
             buttons: [
                 { text: "Ok",     css: "btn-sm btn-primary" },
                 { text: "Cancel", css: "btn-sm", tag: -1 }
             ]
         })).show("app/player/choosePlayer")
            .then(layer => layer.modalResult.then(result => {
                if (result && result.button.tag != -1) {
                    return this.selectedPlayers;
                }
            })).finally(() => this.endContext());
     }
