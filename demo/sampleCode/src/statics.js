new function () {

	base2.package(this, {
		name   : "statics",
		exports: "Animal,NullLogger"
	});

	eval(this.imports);

	//A null object implementation
    let nullLoggerInstance;
	const NullLogger = Base.extend({
		debug(){},
		error(){}
	}, {
		get instance(){
			return nullLoggerInstance = nullLoggerInstance || new NullLogger();
		}
	});

	const Animal = Base.extend({
    	$properties: {
    		id  : null,
    		name: null
    	},

	    constructor(name) {
	        this.name = name;
	        Animal.count++;
	        this.id = Animal.count;
	    }
	}, {
		count: 0
	});

	eval(this.exports);
	
};