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

	var GreenSock = Base.extend(FadeProviding, {
		handle: function(container, content, context){
				
			var _current = container.children(),
			    outTime = .4,
			    inTime  = .8,
			    _removed = false;

				if (context) {
                	context.onEnding(function(_context){
                		if(context === _context && !_removed){
                			_removed = true;
                			animateOut(content).then(function(){
                				content.remove();
                			});
                		}
            		});
				}

			    if(!container.__miruken_animate_out){
			    	if(_current.length){
			    		return animateOut(_current).then(function(){
				    		return animateIn(content);
				    	});	
			    	} else {
			    		return animateIn(content);
			    	}
			    } else {
			    	return container.__miruken_animate_out().then(function(){
			    		_removed = true;
			    		return animateIn().then(function(){
			    			container.__miruken_animate_out = animateOut;	
			    		});
			    	});
			    }

			    function animateIn(content){
			    	return new Promise(function(resolve){
			    		content.css('opacity', 0);
            			container.html(content);
					    TweenMax.to(content, inTime, {
		                	opacity: 1,
		                	onComplete: resolve
	                	})
			    	});
			    }

			    function animateOut(content){
			    	return new Promise(function(resolve){
			    		TweenMax.to(content, outTime, {
			    			opacity: 0,
			    			onComplete: resolve
			    		});
			    	});
			    }
		}
	});

	eval(this.exports);

}
