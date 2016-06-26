new function(){

	base2.package(this, {
		name   : "zoo",
		exports: "Animal,Eagle,Mouse"
	});

	eval(this.imports);

	const Animal = Base.extend({
	});

	const Eagle = Animal.extend({
	    shriek: function(){
	        // make a sound
	    }
	});

	const Mouse = Animal.extend({
	    squeak: function(){
	        // make a sound
	    }
	});

	eval(this.exports);

};