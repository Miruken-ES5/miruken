new function () {

	base2.package(this, {
		name   : "statics",
		exports: "Animal"
	});

	eval(this.imports);

	const Animal = Base.extend({
    	$properties: {
    		id  : null,
    		name: null
    	},

	    constructor: function(name){
	        this.name = name;
	        Animal.count++;
	        this.id = Animal.count;
	    }
	}, {
		count: 0
	});

	eval(this.exports);
	
};