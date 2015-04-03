var miruken  = require('../../lib/miruken.js'),
    mv       = require('../../lib/mvc/mvc.js'),
    chai     = require("chai"),
    expect   = chai.expect;
              
eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.mvc.namespace);

describe("Model", function () {
    var Person  = Model.extend(
        $properties('firstName', 'lastName', 'age'),
    {
        getHobbies: function () { return this._hobbies; },
        setHobbies: function (value) { this._hobbies = value; }
    });

    describe("#constructor", function () {
        it("should create properties", function () {
            var person = new Person;
            person.firstName = 'Sean';
            person.lastName  = 'Smith';
            expect(person.getFirstName()).to.equal('Sean');
            expect(person.getLastName()).to.equal('Smith');
        });

        it("should infer properties", function () {
            var person = new Person;
            person.setHobbies(['Soccer', 'Tennis']);
            expect(person.hobbies).to.eql(['Soccer', 'Tennis']);
        });

        it("should construct model from state", function () {
            var person = new Person({
                firstName: 'Carl',
                lastName:  'Lewis'
            });
            expect(person.firstName).to.equal('Carl');
            expect(person.getFirstName()).to.equal('Carl');
            expect(person.lastName).to.equal('Lewis');
            expect(person.getLastName()).to.equal('Lewis');
        });

        it("should pluck all data from model", function () {
            var person = new Person({
                firstName: 'Lionel',
                lastName:  'Messi',
                age:       24
            });
            var data = person.pluck('firstName');
            expect(data).to.eql({firstName: 'Lionel'});
            data     = person.pluck('firstName', 'lastName');
            expect(data).to.eql({firstName: 'Lionel', lastName: 'Messi'});
            data = person.pluck('fullName');
            expect(data).to.eql({fullName: undefined});
        });
    });

    describe("#map", function () {
        var PersonModel = Model.extend(
            $properties('person')
        );

        it("should map one-to-one", function () {
            var state = {
                firstName: 'Eddie',
                lastName:  'Money',
                mother:    {
                    firstName: 'Leslie',
                    lastName:  'Money'
                }
            }
            var mother = PersonModel.mapAndDelete(state, 'mother');
            var person = new Person(state);
            expect(person.firstName).to.equal('Eddie');
            expect(person.lastName).to.equal('Money');
            expect(mother.firstName).to.equal('Leslie');
            expect(mother.lastName).to.equal('Money');
            expect(person.mother).to.be.undefined;
        });
    });
});