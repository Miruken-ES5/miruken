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
		fade: function (container, content) {
			return new Promise(function (resolve){
				var current = container.children(),
				    outTime = current.length ? .4 : 0,
				    inTime  = .8,
				    tl      = new TimelineMax({ onComplete: resolve });

					tl.to(current, outTime, {
		            	opacity: 0,
		            	onComplete: function () {
	            			content.css('opacity', 0);
		            		container.html(content);
		            	}
	                })
					.to(content, inTime, {
	                	opacity: 1,
	                	onComplete: resolve
                	});	                
			});
		}
	});

	eval(this.exports);

}
