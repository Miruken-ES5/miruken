new function() {

	base2.package(this, {
		name    : "implementDemo",
		imports : "miruken",
		exports : "Logger"
	});

	eval(this.imports);

	const Logger = Base.extend({
	}, {
	});

	eval(this.exports);
};

