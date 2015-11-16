var miruken = require('../miruken.js'),
    Promise = require('bluebird');

new function () {

	miruken.package(this, {
		name:   'mvc',
		imports: 'miruken',
		exports: 'GreenSockFadeProvider'
	});

	eval(this.imports);

	var outTime = .4,
		inTime  = .8;

	var BaseAnimationProvider = Base.extend(FadeProviding, {
		handle: function(container, content, context){
				
			var _current = container.children(),
			    _removed = false;

				if (context) {
                	context.onEnding(function(_context){
                		if(context === _context && !_removed){
                			_removed = true;
                			this.animateOut(content, container).then(function(){
                				content.remove();
                			});
                		}
            		}.bind(this));
				}

			    if(!container.__miruken_animate_out){
			    	if(_current.length){
			    		return this.animateOut(_current, container).then(function(){
				    		return this.animateIn(content, container);
				    	}.bind(this));	
			    	} else {
			    		return this.animateIn(content, container);
			    	}
			    } else {
			    	return container.__miruken_animate_out(content, container).then(function(){
			    		_removed = true;
			    		return this.animateIn(content, container).then(function(){
			    			return container.__miruken_animate_out = function(){
			    				this.animateOut(content, container);
			    			}	
			    		}.bind(this));
			    	}.bind(this));
			    }
		}
	});

	var GreenSockFadeProvider = BaseAnimationProvider.extend(FadeProviding, {
		animateIn: function(content, container){
			return new Promise(function(resolve){
	    		content.css('opacity', 0);
    			container.html(content);
			    TweenMax.to(content, inTime, {
                	opacity: 1,
                	onComplete: resolve
            	})
	    	});
		},
		animateOut: function(content, container){
			return new Promise(function(resolve){
	    		TweenMax.to(content, outTime, {
	    			opacity: 0,
	    			onComplete: resolve
	    		});
	    	});
		}
	});

	eval(this.exports);

}
