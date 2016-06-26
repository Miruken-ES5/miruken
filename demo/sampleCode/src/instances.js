new function () {

	base2.package(this, {
		name   : "instances",
		exports: "Ticket" 
	});

	eval(this.imports);

	const Ticket = Base.extend({

	});

	let ticket = new Ticket();
	
	ticket.extend({
	    Open() {
	    }
	});

	// open ticket
	ticket.Open();

	// do some work
	const passValidation = true;
	if (passValidation)
	{
	    ticket.extend({
	        Close() {
	        }
	    });
	}

	// close ticket
	ticket.Close();

	eval(this.exports);

};