==========
Navigation
==========

Controllers are in charge of navigation.  They communicate with each other using the 
Navigate protocol. Navigate has two methods :code:`push()` and :code:`next()`.  

The push method transitions to a new view adding it to the stack of existing views in a new context.
As contexts end the views will be popped of the stack returning to the previous views. 

The next nethod transitions to a new view by unwinding the stack and then adding the view. 

In this simplified example:

.. code-block:: js

    const TeamsController= Controller.extend({
        goToTeam(team) {
            TeamController(this.io)
                .next(ctrl => ctrl.showTeam({ id: team.id }));
        },
        createTeam() {
            CreateTeamController(this.io)
                .next(ctrl => ctrl.createTeam());
        }
    });

The TeamsController's goToTeam() method passes the current context :code:`this.io` into the TeamController.  TeamController is being use here as you would use a protocol. This returns a 
Navigation delegate with the next and push methods.  Both methods take a function that will be 
passed an instance of the controller.  We are calling the showTeam method on the TeamController
and passing in the the team id that we want shown.

The createTeam method is very simular.  It is calling the createTeam method on the CreateTeamController, but it does not need to pass along any data.

This example uses push:

.. code-block:: js

    const EditTeamController = Controller.extend({
        addPlayer() {
            const io = this.io;
            ChoosePlayerController(io)
                .push(ctrl => ctrl.choosePlayer())
                .then(players => {
                    if (players) {
                        TeamFeature(io).addPlayers(players, this.team);
                    }
                });
        }
    });

Here we are asking ChoosePlayerController to push the choosePlayer view on top of us. Push returns a promise that will be resolved with the context has ended. The user will then select a player and the chosen player will be returned to us when the promise resolves.  If the user did select a player, we call the TeamFeature protocol to add the player to our team. 

