#Packages
Packages is the means to provide inversion of control. The basic package simply has:

1. A name
2. A list of names to import
3. The list of objects to export

For example:

    new function() {
        base2.package(this, {
            name:       "zoo",
            imports:    "miruken",
            exports:    "Animal,Eagle,Mouse"
        });

        eval(imports);

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

        eval(exports);
    };

##Imports
Using `imports` states that *names* of package(s) to be available in your closure. This is in essence makes classes defined in packages available in the closure. To start, you will need to bring in *miruken*. You will also need to run the `eval` function to actually import those classes.

For example:

    new function() {
        base2.package({
            name: "logging",
            imports: "miruken"
        });

        eval(this.imports);
    }

##Exports
Using `exports` states that *classes* defined in the closure to be available for other closures. Similar to imports, you need to call the `eval` to actually export the classes.

For example:

    new function() {
        base2.package({
            name: "logging",
            imports: "miruken"
        });

        eval(this.imports);

        const loggingProtocol = Protocol.extend({
            debug(){},
            error(){}
        });

        const NullLogger = Base.extend(loggingProtocol, {
            debug(){},
            error(){}
        });

        let nullLogger = new NullLogger();
        const Logger = Base.extend(loggingProtocol, {
            debug(message){
                console.log(`DEBUG: ${message}`);
            },
            error(message){
                console.log(`ERROR: ${message}`);
            }

        }, {
            get NullLogger(){
                return nullLogger
            }
        }); 

        eval(this.exports);
    }

##Naming


##File Separation
