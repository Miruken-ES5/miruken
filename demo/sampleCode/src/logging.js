new function(){

	base2.package(this, {
		name   : "logging",
		exports: "Logger",
		imports: "miruken"
	});

	eval(this.imports);

	const loggingProtocol = Protocol.extend({
		debug(){},
		error(){}
	});

	const NullLogger = Base.extend(loggingProtocol, {
		debug(){},
		error(){}
	});

	let nullLogger = new NullLogger();
	const Logger = Base.extend(loggingProtocol, {
		debug(message){
			console.log(`DEBUG: ${message}`);
		},
		error(message){
			console.log(`ERROR: ${message}`);
		}

	}, {
		get NullLogger(){
			return nullLogger
		}
	}); 

	eval(this.exports);

};