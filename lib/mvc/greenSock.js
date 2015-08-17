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
		fade: function(container, content){
			return new Promise(function(resolve){
				var tl = new TimelineMax({ onComplete: resolve });

				tl.to(container.children(), .3, {
	            	opacity: 0,
	            	onComplete: function(){
	            		content.css('opacity', 0);
	            		container.html(content);		
	            	}
                })
				.to(content, .7, {
                	opacity: 1,
                	onComplete: resolve
                });	                
			});
		}
	});

	eval(this.exports);

}