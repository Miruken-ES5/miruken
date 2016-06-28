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
Using `imports` states that names of package(s) to be available in your closure.

##Exports
Using `exports` states that objects defined in the closure to be available for other closures.

##Naming


##File Separation
