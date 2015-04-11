var miruken  = require('../../lib/miruken.js'),
    context  = require('../../lib/context.js')
    validate = require('../../lib/validate'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(validate.namespace);

new function () { // closure

    var validate_test = new base2.Package(this, {
        name:    "validate_test",
        exports: "Player,Coach,Team"
    });

    eval(this.imports);

    var Player = Base.extend({
        constructor: function (firstName, lastName, dob) {
            this.extend({
                getFirstName: function () { return firstName; },
                setFirstName: function (value) { firstName = value; },
                getLastName:  function () { return lastName; },
                setLastName:  function (value) { lastName = value; },
                getDOB:       function () { return dob; },
                setDOB:       function (value) { dob = value; }
            });
        }});

    var Coach = Base.extend({
        constructor: function (firstName, lastName, license) {
            this.extend({
                getFirstName: function () { return firstName; },
                setFirstName: function (value) { firstName = value; },
                getLastName:  function () { return lastName; },
                setLastName:  function (value) { lastName = value; },
                getLicense:   function () { return license; },
                setLicense:   function (value) { license = value; }
            });
        }});
    
    var Team = CallbackHandler.extend({
        constructor: function (name, division) {
            this.extend({
                getName:     function () { return name; },
                setName:     function (value) { name = value; },
                getDivision: function () { return division; },
                setDivision: function (value) { division = value; }
            });
        },
        $validate:[
            Player, function (validation, composer) {
                var player = validation.getObject();
                if (!player.getFirstName() || player.getFirstName().length == 0) {
                    validation.required("FirstName", "First name required");
                }
                if (!player.getLastName()  || player.getLastName().length == 0) {
                    validation.required("LastName", "Last name required");
                }
                if ((player.getDOB() instanceof Date) === false) {
                    validation.invalid("DOB", player.getDOB(), "Valid Date-of-birth required");
                }
            },
            Team, function (validation, composer) {
                var coach = validation.getObject();
                if (!coach.getFirstName() || coach.getFirstName().length == 0) {
                    validation.required("FirstName", "First name required");
                }
                if (!coach.getLastName()  || coach.getLastName().length == 0) {
                    validation.required("LastName", "Last name required");
                }
                if (["D", "E", "F"].indexOf(coach.getLicense()) < 0) {
                    validation.invalid("License", coach.getLicense(), "License must be D, E or F");
                }
                return Promise.delay(true, 50);
            }]
    });
    
    eval(this.exports);

};

eval(base2.validate_test.namespace);

describe("ValidationResult", function () {
    describe("#getObject", function () {
        it("should get the validated object", function () {
            var team       = new Team("Aspros"),
                validation = new ValidationResult(team);
            expect(validation.getObject()).to.equal(team);
        });
    });

    describe("#getScope", function () {
        it("should get the validation scope", function () {
            var team       = new Team("Aspros"),
                validation = new ValidationResult(team, "players");
            expect(validation.getScope()).to.equal("players");
        });
    });

    describe("#addKeyError", function () {
        it("should add validation errors", function () {
            var team       = new Team,
                validation = new ValidationResult(team);
            validation.addKeyError("Name", new ValidationError("Team name required", {
                key:  "Name",
                code: ValidationErrorCode.Required
            }));
            expect(validation.getKeyErrors("Name")).to.eql([
                new ValidationError("Team name required", {
                    key:  "Name",
                    code: ValidationErrorCode.Required
                })
            ]);
        });

        it("should add invalid child validation results", function () {
            var team            = new Team,
                player          = new Player,
                validation      = new ValidationResult(team),
   	            childValidation = new ValidationResult(player);
                childValidation.addKeyError("FirstName", new ValidationError("First name required", {
                    key:  "FirstName",
                    code: ValidationErrorCode.Required
                }));
	        validation.addKeyError("Player", childValidation);
	        expect(validation.isValid()).to.be.false;
            expect(validation.getKeyErrors("Player")[0].getKeyErrors("FirstName")).to.eql([
                new ValidationError("First name required", {
                    key:  "FirstName",
                    code: ValidationErrorCode.Required
                })
	        ]);
	    });

        it("should not add valid child validation results", function () {
            var team            = new Team,
                player          = new Player,
                validation      = new ValidationResult(team),
                childValidation = new ValidationResult(player);
            validation.addKeyError("Player", childValidation);
            expect(validation.isValid()).to.be.true;
            expect(validation.getKeyErrors("Player")).to.be.undefined;
        });

        it("should add anonymous invalid child validation results", function () {
            var team            = new Team,
                player          = new Player,
                validation      = new ValidationResult(team),
                childValidation = new ValidationResult(player);
            childValidation.addKeyError("FirstName", new ValidationError("First name required", {
                key:  "FirstName",
                code: ValidationErrorCode.Required
            }));
            validation.addChildResult(childValidation);
            expect(validation.isValid()).to.be.false;
            expect(validation.getKeyCulprits()).to.eql([]);
            expect(validation.getChildResults()[0].getKeyErrors("FirstName")).to.eql([
                new ValidationError("First name required", {
                    key:  "FirstName",
                    code: ValidationErrorCode.Required
                })
		    ]);
	    });
    });
});

describe("ValidationCallbackHandler", function () {
    describe("#validate", function () {
        it("should invalidate object", function () {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player = new Player;
            expect(Validator(league).validate(player).isValid()).to.be.false;
        });

        it("should be valid if no validators", function () {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                player = new Player;
            expect(Validator(league).validate(player).isValid()).to.be.true;
        });

        it("should provide invalid keys", function () {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player("Matthew");
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
		    expect(results.getKeyCulprits()).to.eql(["LastName", "DOB"]);
        });

        it("should provide key errors", function () {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player("Matthew");
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
            expect(results.getKeyErrors("LastName")).to.eql([
                new ValidationError("Last name required", {
                    key:  "LastName",
                    code: ValidationErrorCode.Required
                })
            ]);
            expect(results.getKeyErrors("DOB")).to.eql([
                new ValidationError("Valid Date-of-birth required", {
                    key:  "DOB",
                    code: ValidationErrorCode.Invalid
                })
            ]);
        });

        it("should dynamically add validation", function () {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player = new Player("Diego", "Morales", new Date(2006, 7, 19));
            $validate(league, Player, function (validation, composer) {
                var player = validation.getObject(),
                    start  = new Date(2006, 8, 1),
                    end    = new Date(2007, 7, 31);
                if (player.getDOB() < start) {
                    validation.addKeyError("DOB", new ValidationError(
                        "Player too old for division " + team.getDivision(), {
                            key:    "DOB",
                            code:   ValidationErrorCode.DateTooSoon,
                            source: player.getDOB()
                    }));
                } else if (player.getDOB() > end) {
                    validation.addKeyError("DOB", new ValidationError(
                        "Player too young for division " + team.getDivision(), {
                            key:    "DOB",
                            code:   ValidationErrorCode.DateTooLate,
                            source: player.getDOB()
                    }));
                }
            });
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
            expect(results.getKeyErrors("DOB")).to.eql([
                new ValidationError("Player too old for division U8", {
                    key:    "DOB",
                    code:   ValidationErrorCode.DateTooSoon,
                    source: new Date(2006, 7, 19)
                })
            ]);
        });

        it("should validate unknown sources", function () {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler);
            $validate(league, null, function (validation, composer) {
                var source = validation.getObject();
                if ((source instanceof Team) &&
                    (!source.getName() || source.getName().length == 0)) {
                    validation.addKeyError("Name", new ValidationError("Team name required", {
                        key:    "Name",
                        code:   ValidationErrorCode.Required,
                        source: source.getName()
                    }));
                }
            });
            var results = Validator(league).validate(new Team);
            expect(results.isValid()).to.be.false;
            expect(results.getKeyErrors("Name")).to.eql([
                new ValidationError("Team name required", {
                    key:    "Name",
                    code:   ValidationErrorCode.Required,
                    source: undefined
                })
            ]);
        });
    });

    describe("#validateAsync", function () {
        it("should invalidate object", function (done) {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                coach  = new Coach;
            Promise.resolve(Validator(league).validateAsync(coach)).then(function (results) {
                expect(results.isValid()).to.be.false;
                done();
            });
        });

        it("should be valid if no validators", function (done) {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                coach  = new Coach;
            Promise.resolve(Validator(league).validateAsync(coach)).then(function (results) {
                expect(results.isValid()).to.be.true;
                done();
            });
        });

        it("should provide invalid keys", function (done) {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                coach      = new Coach("Jonathan")
            Promise.resolve(Validator(league).validateAsync(coach)).then(function (results) {
                expect(results.isValid()).to.be.false;
                expect(results.getKeyCulprits()).to.eql(["LastName", "License"]);
                done();
            });
        });

        it("should provide key errors", function (done) {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                coach      = new Coach("Jonathan");
            Promise.resolve(Validator(league).validateAsync(coach)).then(function (results) {
                expect(results.isValid()).to.be.false;
                expect(results.getKeyErrors("LastName")).to.eql([
                    new ValidationError("Last name required", {
                        key:  "LastName",
                        code: ValidationErrorCode.Required
                    })
                ]);
                var i = 0;
                expect(results.getKeyErrors("License")).to.eql([
                    new ValidationError("License must be D, E or F", {
                        key:  "License",
                        code: ValidationErrorCode.Invalid
                    })
                ]);
                done();
            });
        });
    });
});
