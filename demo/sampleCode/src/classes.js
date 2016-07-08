new function () {

	base2.package(this, {
		name: "instrumentation",
		imports: "miruken",
		exports: "Logger,ConsoleLogger,NotificationLogger"
	});

	eval(this.imports);

	// we need a base logger to capture all the messages
	const Logger = Base.extend({
	});

	// now extend to create a console logger
	const ConsoleLogger = Logger.extend({
	});

	// now extend to create a notification logger
	const NotificationLogger = Logger.extend({
	});

	eval(this.exports);
};