new function() {

	base2.package({
		name    : "logging",
		imports : "miruken",
		exports : "Logger"
	});

	eval(this.imports);

	const Logger = new Base.extend({
	}, {
	});

	eval(this.exports);
};

