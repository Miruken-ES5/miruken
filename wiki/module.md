#Module
Module provides similar functionality as **Base**, but works with classes. Module provides the same `extend` and `implement` functions, but you need to pass the object you wish to extend.

For example:

    new function() {

        base2.package({
            name    : "logging",
            imports : "miruken",
            exports : "Logger"
        });

        eval(this.imports);

        const Logger = new Base.extend({
        }, {
        });

        let logger = new Logger();
        logger.implement({
            
        });

        eval(this.exports);
    };

