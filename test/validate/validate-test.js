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
                    validation.results.addKey('firstName')
                        .addError('required', { message: 'First name required' });
                }
                if (!player.getLastName()  || player.getLastName().length == 0) {
                    validation.results.addKey('lastName')
                        .addError('required', { message: 'Last name required' });
                }
                if ((player.getDOB() instanceof Date) === false) {
                    validation.results.addKey('dob')
                        .addError('required', { message: 'DOB required' });
                }
            },
            Coach, function (validation, composer) {
                var coach = validation.getObject();
                if (!coach.getFirstName() || coach.getFirstName().length == 0) {
                    validation.results.addKey('firstName')
                        .addError('required', { message: 'First name required' });
                }
                if (!coach.getLastName()  || coach.getLastName().length == 0) {
                    validation.results.addKey('lastName')
                        .addError('required', { message: 'Last name required' });
                }
                if (["D", "E", "F"].indexOf(coach.getLicense()) < 0) {
                    validation.results.addKey('license')
                        .addError('license', { message: 'License must be D, E or F' });
                }
                return Promise.delay(true, 50);
            }]
    });
    
    eval(this.exports);

};

eval(base2.validate_test.namespace);

describe("Validation", function () {
    describe("#getObject", function () {
        it("should get the validated object", function () {
            var team       = new Team("Aspros"),
                validation = new Validation(team);
            expect(validation.getObject()).to.equal(team);
        });
    });

    describe("#getScope", function () {
        it("should get the validation scope", function () {
            var team       = new Team("Aspros"),
                validation = new Validation(team, false, "players");
            expect(validation.getScope()).to.equal("players");
        });
    });
});

describe("ValidationResult", function () {
    describe("#addKey", function () {
        it("should add key", function () {
            var validation = new ValidationResult;
            validation.addKey("name");
            expect(validation).to.have.ownProperty("name");
            expect(validation["name"].isValid()).to.be.true;
        });
    });

    describe("#addError", function () {
        it("should add validation errors", function () {
            var validation = new ValidationResult;
            validation.addKey("name").addError("required", { message: "Team name required" });
            expect(validation["name"].errors["required"]).to.eql([{
                message: "Team name required"
            }]);
        });
    });

    describe("#reset", function () {
        it("should reset errors", function () {
            var validation = new ValidationResult;
            validation.addKey("name").addError("required", { message: "Team name required" });
            expect(validation.isValid()).to.be.false;
            validation.reset();
            expect(validation).to.not.have.ownProperty("name");
            expect(validation.isValid()).to.be.true;
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

        it("should add $validation to target", function () {
            var league  = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                player  = new Player,
                results = Validator(league).validate(player);
            expect(results).to.equal(player.$validation);
        });

        it("should not enumerate $validation on target", function () {
            var league  = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                player  = new Player;
            Validator(league).validate(player);
            for (var key in player) {
                expect(key).to.not.equal('$validation');
            }
        });

        it("should provide key errors", function () {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player("Matthew");
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
            expect(results.lastName.errors.required).to.eql([{
                message: "Last name required"
            }]);
            expect(results.dob.errors.required).to.eql([{
                message: "DOB required"
            }]);
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
                    validation.results.addKey('dob')
                        .addError('playerAge', { 
                            message: "Player too old for division " + team.getDivision(),
                            value:   player.getDOB()
                         });
                } else if (player.getDOB() > end) {
                    validation.results.addKey('dob')
                        .addError('playerAge', { 
                            message: "Player too young for division " + team.getDivision(),
                            value:   player.getDOB()
                         });
                }
            });
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
            expect(results.dob.errors.playerAge).to.eql([{
                message: "Player too old for division U8",
                value:   new Date(2006, 7, 19)
            }]);
        });

        it("should validate unknown sources", function () {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler);
            $validate(league, null, function (validation, composer) {
                var source = validation.getObject();
                if ((source instanceof Team) &&
                    (!source.getName() || source.getName().length == 0)) {
                    validation.results.addKey('name')
                        .addError('required', { message: "Team name required" });
                }
            });
            var results = Validator(league).validate(new Team);
            expect(results.isValid()).to.be.false;
            expect(results.name.errors.required).to.eql([{
                message: "Team name required"
            }]);
        });

        it("should roll up errors", function () {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player;
            var results = Validator(league).validate(player);
            expect(results.isValid()).to.be.false;
            expect(results.errors.required).to.deep.include.members([{
                  key:     "firstName",
                  message: "First name required"
                }, {
                  key:     "lastName",
                  message: "Last name required"
                }, {
                  key:     "dob",
                  message: "DOB required"
                }
            ]);
        });
    });

    describe("#validateAsync", function () {
        it("should invalidate object", function (done) {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                coach  = new Coach;
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.isValid()).to.be.false;
                done();
            });
        });

        it("should be valid if no validators", function (done) {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                coach  = new Coach;
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.isValid()).to.be.true;
                done();
            });
        });

        it("should provide key errors", function (done) {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                coach      = new Coach("Jonathan")
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.isValid()).to.be.false;
                expect(results.license.errors.license).to.eql([{
                    message: "License must be D, E or F"
                }]);
                done();
            });
        });
    });
});
