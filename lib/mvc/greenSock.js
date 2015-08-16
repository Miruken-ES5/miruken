var miruken = require('../miruken.js'),
    Promise = require('bluebird');

new function () {

	var mvc = new base2.Package({
		name:   'mvc',
		parent:  miruken,
		imports: 'miruken',
		exports: 'GreenSock'
	});

	eval(this.imports);

	var GreenSock = Base.extend(AnimationProviding, {
		fade: function(from, to){
			return new Promise(function(resolve, reject){

			});
		}
	});

	eval(this.exports);

}