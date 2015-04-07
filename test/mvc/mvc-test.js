var miruken  = require('../../lib/miruken.js'),
    mv       = require('../../lib/mvc/mvc.js'),
    chai     = require("chai"),
    expect   = chai.expect;
              
eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.mvc.namespace);

describe("Model", function () {
    var Person  = Model.extend({
        $properties: {
            firstName: '',
            lastName:  '',
            age:       0
        },
        getHobbies: function () { return this._hobbies; },
        setHobbies: function (value) { this._hobbies = value; }
    }),
        Doctor = Person.extend({
            $properties: {
                patient: $type(Person)
            }
    });

    describe("#constructor", function () {
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
            expect(person.lastName).to.equal('Lewis');
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
        it("should map one-to-one", function () {
            var state = {
                firstName: 'Daniel',
                lastName:  'Worrel',
                patient:   {
                    firstName: 'Emitt',
                    lastName:  'Smith'
                }
            }
            var doctor  = new Doctor(state),
                patient = doctor.patient; 
            expect(doctor.firstName).to.equal('Daniel');
            expect(doctor.lastName).to.equal('Worrel');
            expect(patient).to.be.instanceOf(Person);
            expect(patient.firstName).to.equal('Emitt');
            expect(patient.lastName).to.equal('Smith');
        });

        it("should map one-to-many", function () {
            var state = {
                firstName: 'Daniel',
                lastName:  'Worrel',
                patient:   [{
                    firstName: 'Emitt',
                    lastName:  'Smith'
                }, {
                    firstName: 'Tony',
                    lastName:  'Romo'
                }]  
            }
            var doctor   = new Doctor(state),
                patients = doctor.patient; 
            expect(doctor.firstName).to.equal('Daniel');
            expect(doctor.lastName).to.equal('Worrel');
            expect(patients).to.be.instanceOf(Array);
            expect(patients).to.have.length(2);
            expect(patients[0].firstName).to.equal('Emitt');
            expect(patients[0].lastName).to.equal('Smith');
            expect(patients[1].firstName).to.equal('Tony');
            expect(patients[1].lastName).to.equal('Romo');
        });

        it("should ignore case", function () {
            var state = {
                fiRstNamE: 'Bruce',
                LaStNaMe:  'Lee'
            }
            var person = new Person(state);
            expect(person.firstName).to.equal('Bruce');
            expect(person.lastName).to.equal('Lee');
        });

        it("should use $root annotation", function () {
            var PersonModel = Model.extend({
                $properties: {
                    person: $root(Person)
                }
            }),
                state = {
                    firstName: 'Henry',
                    lastName:  'Ford'
            }
            var model = new PersonModel(state);
            expect(model.person.firstName).to.equal('Henry');
            expect(model.person.lastName).to.equal('Ford');
        });
    });
});