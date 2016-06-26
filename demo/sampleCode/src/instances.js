new function () {

	base2.package(this, {
		name   : "instances",
		exports: "Ticket" 
	});

	eval(this.imports);

	const Ticket = Base.extend({

	});

	var ticket = new Ticket();
	ticket.extend({
	    Open: function(){
	    }
	});

	// open ticket
	ticket.Open();

	// do some work
	const passValidation = true;
	if (passValidation)
	{
	    ticket.extend({
	        Close: function(){
	        }
	    });
	}

	// close ticket
	ticket.Close();

	eval(this.exports);

};