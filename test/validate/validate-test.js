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
eval(miruken.validate.namespace);
eval(validate.namespace);

new function () { // closure

    var validate_test = new base2.Package(this, {
        name:    "validate_test",
        exports: "Player,Coach,Team,HttpClient"
    });

    eval(this.imports);

    var HttpClient = Base.extend({
    });

    var Player = Base.extend({
        $properties: {
            firstName: '',
            lastName:  '',
            dob:       null
        }
    });

    var Coach = Base.extend($validateThat, {
        $properties: {
            firstName: '',
            lastName:  '',
            license:   ''
        },
        $validateThat: {
            coachPassedBackgroundCheck: [HttpClient, function (http, validation) {
                return Promise.delay(10).then(function () {
                    if (validation.object.lastName === 'Smith') {
                        validation.results.addError('coachPassedBackgroundCheck', { 
                            message: 'Coach failed background check'
                        });
                    }
                });
            }]
        }
    });
 
    var Team = Base.extend(
        $callbacks, $validateThat, {
        $properties: {
            name:     '',
            division: '',
            players:  []
        },
        $validateThat: {
            teamHasDivision: function (validation) {
                if (this.name === 'Liverpool' && this.division !== 'U8') {
                    validation.results.addKey('division')
                        .addError('teamHasDivision', { 
                            message: this.name + ' does not have division ' + this.division
                        });
                }
            }
        },
        $validate:[
            Player, function (validation, composer) {
                var player = validation.object;
                if (!player.firstName || player.firstName.length == 0) {
                    validation.results.addKey('firstName')
                        .addError('required', { message: 'First name required' });
                }
                if (!player.lastName  || player.lastName.length == 0) {
                    validation.results.addKey('lastName')
                        .addError('required', { message: 'Last name required' });
                }
                if ((player.dob instanceof Date) === false) {
                    validation.results.addKey('dob')
                        .addError('required', { message: 'DOB required' });
                }
            },
            Coach, function (validation, composer) {
                var coach = validation.object;
                if (!coach.firstName || coach.firstName.length == 0) {
                    validation.results.addKey('firstName')
                        .addError('required', { message: 'First name required' });
                }
                if (!coach.lastName  || coach.lastName.length == 0) {
                    validation.results.addKey('lastName')
                        .addError('required', { message: 'Last name required' });
                }
                if (["D", "E", "F"].indexOf(coach.license) < 0) {
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
    describe("#object", function () {
        it("should get the validated object", function () {
                var team       = new Team({name: "Aspros"}),
                validation = new Validation(team);
            expect(validation.object).to.equal(team);
        });
    });

    describe("#scope", function () {
        it("should get the validation scope", function () {
                var team       = new Team({name: "Aspros"}),
                validation = new Validation(team, false, "players");
            expect(validation.scope).to.equal("players");
        });
    });
});

describe("ValidationResult", function () {
    describe("#addKey", function () {
        it("should add key", function () {
            var validation = new ValidationResult;
            validation.addKey("name");
            expect(validation).to.have.ownProperty("name");
            expect(validation["name"].valid).to.be.true;
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
            expect(validation.valid).to.be.false;
            validation.reset();
            expect(validation).to.not.have.ownProperty("name");
            expect(validation.valid).to.be.true;
        });
    });
});

describe("ValidationCallbackHandler", function () {
    describe("#validate", function () {
        it("should invalidate object", function () {
            var team   = new Team({name: "Liverpool", division: "U8"}),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player = new Player;
            expect(Validator(league).validate(player).valid).to.be.false;
        });

        it("should be valid if no validators", function () {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler),
                player = new Player;
            expect(Validator(league).validate(player).valid).to.be.true;
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
            var team       = new Team({name: "Liverpool", division: "U8"}),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player({firstName: "Matthew"});
            var results = Validator(league).validate(player);
            expect(results.valid).to.be.false;
            expect(results.lastName.errors.required).to.eql([{
                message: "Last name required"
            }]);
            expect(results.dob.errors.required).to.eql([{
                message: "DOB required"
            }]);
        });

        it("should dynamically add validation", function () {
            var team   = new Team({name: "Liverpool", division: "U8"}),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player = new Player({firstName: "Diego", lastName: "Morales", dob: new Date(2006, 7, 19)});
            $validate(league, Player, function (validation, composer) {
                var player = validation.object,
                    start  = new Date(2006, 8, 1),
                    end    = new Date(2007, 7, 31);
                if (player.dob < start) {
                    validation.results.addKey('dob')
                        .addError('playerAge', { 
                            message: "Player too old for division " + team.division,
                            value:   player.dob
                         });
                } else if (player.dob > end) {
                    validation.results.addKey('dob')
                        .addError('playerAge', { 
                            message: "Player too young for division " + team.division,
                            value:   player.dob
                         });
                }
            });
            var results = Validator(league).validate(player);
            expect(results.valid).to.be.false;
            expect(results.dob.errors.playerAge).to.eql([{
                message: "Player too old for division U8",
                value:   new Date(2006, 7, 19)
            }]);
        });

        it("should validateThat instance", function () {
            var team       = new Team({name: "Liverpool", division: "U7"}),
                league     = new Context()
                    .addHandlers(new ValidationCallbackHandler);
            var results = Validator(league).validate(team);
            expect(results.valid).to.be.false;
            expect(results.division.errors.teamHasDivision).to.eql([{
                message: "Liverpool does not have division U7"
            }]);
        });

        it("should validateThat instance with dependencies", function () {
            var coach      = new Coach({firstName: "Jordan", license: "D"}),
                httpClient = new HttpClient,
                league     = new Context()
                    .addHandlers(new ValidationCallbackHandler,
                                 new (CallbackHandler.extend(Invoking, {
                                     invoke: function (fn, dependencies, ctx) {
                                         expect(dependencies[0]).to.equal(HttpClient);
                                         dependencies[0] = httpClient;
                                         for (var i = 1; i < dependencies.length; ++i) {
                                             dependencies[i] = Modifier.unwrap(dependencies[i]);
                                         }
                                         return fn.apply(ctx, dependencies);
                                 }
            })));
            var results = Validator(league).validate(coach);
            expect(results.valid).to.be.true;
        });

        it("should validate unknown sources", function () {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler);
            $validate(league, null, function (validation, composer) {
                var source = validation.object;
                if ((source instanceof Team) &&
                    (!source.name || source.name.length == 0)) {
                    validation.results.addKey('name')
                        .addError('required', { message: "Team name required" });
                }
            });
            var results = Validator(league).validate(new Team);
            expect(results.valid).to.be.false;
            expect(results.name.errors.required).to.eql([{
                message: "Team name required"
            }]);
        });

        it("should roll up errors", function () {
            var team       = new Team({name: "Liverpool", division: "U8"}),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler),
                player     = new Player;
            var results = Validator(league).validate(player);
            expect(results.valid).to.be.false;
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
        var league,
            httpClient = new HttpClient;
        beforeEach(function() {
            league = new Context()
                .addHandlers(new ValidationCallbackHandler,
                             new (CallbackHandler.extend(Invoking, {
                                 invoke: function (fn, dependencies, ctx) {
                                     expect(dependencies[0]).to.equal(HttpClient);
                                     dependencies[0] = httpClient;
                                     for (var i = 1; i < dependencies.length; ++i) {
                                          dependencies[i] = Modifier.unwrap(dependencies[i]);
                                     }
                                     return fn.apply(ctx, dependencies);
                                 }
                             })));
        });

        it("should invalidate object", function (done) {
            var team   = new Team({name: "Liverpool", division: "U8"}),
                coach  = new Coach;
            league.addHandlers(team);
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.valid).to.be.false;
                done();
            });
        });

        it("should be valid if no validators", function (done) {
            var coach = new Coach;
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.valid).to.be.true;
                done();
            });
        });

        it("should provide key errors", function (done) {
            var team  = new Team({name: "Liverpool", division: "U8"}),
                coach = new Coach("Jonathan");
            league.addHandlers(team);
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.valid).to.be.false;
                expect(results.license.errors.license).to.eql([{
                    message: "License must be D, E or F"
                }]);
                done();
            });
        });

        it("should validateThat instance", function (done) {
            var team   = new Team({name: "Liverpool", division: "U8"}),
                coach  = new Coach({firstName: "John", lastName: "Smith"});
            league.addHandlers(team);
            Validator(league).validateAsync(coach).then(function (results) {
                expect(results.valid).to.be.false;
                expect(results.errors.coachPassedBackgroundCheck).to.eql([{
                    message: "Coach failed background check"
                }]);
                done();
            });
        });
    });
});

describe("$validateThat", function () {
    it("should create validatorThat methods", function () {
        var team       = new Team({name: "Liverpool", division: "U9"}),
            validation = new Validation(team);
        team.validateThatTeamHasDivision(validation);
        expect(validation.results.valid).to.be.false;
        expect(validation.results.division.errors.teamHasDivision).to.eql([{
            message: "Liverpool does not have division U9"
        }]);
    });

    it("should extend validatorThat methods on instances", function () {
        var team   = new Team({name: "Liverpool", division: "U9"}),
            league = new Context()
                .addHandlers(team, new ValidationCallbackHandler);
        team.extend({
            $validateThat: {
                teamHasAtLeastSevenPlayerWhenU9: function (validation) {
                    if (this.division === "U9" && this.players.length < 7) {
                        validation.results.addKey('players')
                            .addError('teamHasAtLeastSevenPlayerWhenU9', { 
                                message: this.name + ' must have at lease 7 players for division ' + this.division
                                });
                    }
                }
            }
        });
        var results = Validator(league).validate(team);
        expect(results.valid).to.be.false;
        expect(results.players.errors.teamHasAtLeastSevenPlayerWhenU9).to.eql([{
            message: "Liverpool must have at lease 7 players for division U9"
        }]);
    });
});

