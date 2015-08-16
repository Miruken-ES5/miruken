var miruken = require('../miruken.js'),
    Promise = require('bluebird');

new function () {

	var mvc = new base2.Package(this, {
		name:   'mvc',
		version: miruken.version,
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