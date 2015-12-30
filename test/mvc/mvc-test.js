var miruken  = require('../../lib/miruken.js'),
    mvc      = require('../../lib/mvc'),
    chai     = require("chai"),
    expect   = chai.expect;
              
eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(miruken.validate.namespace);
eval(miruken.mvc.namespace);

new function () { // closure

    var mvc_test = base2.package(this, {
        name:    "mvc_test",
        exports: "Person,Doctor,PersonController"
    });

    eval(this.imports);

    var Person = Model.extend({
        $properties: {
            firstName: { 
                validate: $required 
            },
            lastName:  {
                validate: $required
            },
            age: {
                value: 0,
                validate: {
                    numericality: {
                        onlyInteger: true,
                        greaterThan: 11
                    }
                }
            },
            password: { ignore: true }
        },
        getHobbies: function () { return this._hobbies; },
        setHobbies: function (value) { this._hobbies = value; }
    });
   
    var Doctor = Person.extend({
        $properties: {
            patient: { map: Person }
        }
    });

    var PersonController = Controller.extend({
        $properties: {
            person: {
                map: Person,
                validate: {
                    presence: true,
                    nested:   true
                }
            }
        }
    });

    eval(this.exports);

}

eval(base2.mvc_test.namespace);

describe("Model", function () {
    describe("#constructor", function () {
        it("should infer properties", function () {
            var person = new Person;
            person.setHobbies(['Soccer', 'Tennis']);
            expect(person.hobbies).to.eql(['Soccer', 'Tennis']);
        });

        it("should construct model from data", function () {
            var person = new Person({
                firstName: 'Carl',
                lastName:  'Lewis'
            });
            expect(person.firstName).to.equal('Carl');
            expect(person.lastName).to.equal('Lewis');
        });
    });

    describe("#fromData", function () {
        it("should import from data", function () {
            var person = new Person;
            person.fromData({
                firstName:  'David',
                lastName:   'Beckham',
                occupation: 'soccer'
            });
            expect(person.firstName).to.equal('David');
            expect(person.lastName).to.equal('Beckham');
            expect(person.occupation).to.be.undefined;
        });

        it("should ignore import from data", function () {
            var person = new Person;
            person.fromData({
                password:   '1234'
            });
            expect(person.password).to.be.undefined;
        });
        
        it("should import all from data", function () {
            var person = new Person;
            person.fromData({
                firstName:  'David',
                lastName:   'Beckham',
                occupation: 'soccer'
            }, { dynamic: true });
            expect(person.firstName).to.equal('David');
            expect(person.lastName).to.equal('Beckham');
            expect(person.occupation).to.equal('soccer');
        });

        it("should import all related from data", function () {
            var doctor = new Doctor;
            doctor.fromData({
                firstName: 'Mitchell',
                lastName:  'Moskowitz',
                hobbies:   undefined,
                age:       0,
                patient: {
                    firstName:  'Lionel',
                    lastName:   'Messi',
                    occupation: 'soccer',
                    age:       24
                }
            }, { dynamic: true });
            expect(doctor.patient.firstName).to.equal('Lionel');
            expect(doctor.patient.lastName).to.equal('Messi');
            expect(doctor.patient.occupation).to.equal('soccer');
        });

        it("should import all related from data ignoring case", function () {
            var doctor = new Doctor;
            doctor.fromData({
                FirstNAME: 'Mitchell',
                LASTName:  'Moskowitz',
                patient: {
                    FIRSTName:  'Lionel',
                    lastNAME:   'Messi'
                }
            });
            expect(doctor.firstName).to.equal('Mitchell');
            expect(doctor.lastName).to.equal('Moskowitz');            
            expect(doctor.patient.firstName).to.equal('Lionel');
            expect(doctor.patient.lastName).to.equal('Messi');
        });        
    });

    describe("#toData", function () {
        it("should export all data", function () {
            var person = new Person({
                   firstName: 'Christiano',
                   lastName:  'Ronaldo',
                   age:       23
                }),
                data = person.toData();
            expect(data).to.eql({
                firstName: 'Christiano',
                lastName:  'Ronaldo',
                age:       23
            });
        });

        it("should ignore export some data", function () {
            var person      = new Person;
            person.password = '1234';
            var data        = person.toData();
            expect(data).to.eql({
                age: 0
            });
        });
        
        it("should export partial data", function () {
            var person = new Person({
                    firstName: 'Christiano',
                    lastName:  'Ronaldo',
                    age:       23
                }),
                data = person.toData({lastName: true});
            expect(data).to.eql({
                lastName: 'Ronaldo'
            });
        });
        
        it("should export nested data", function () {
            var person = new Person({
                    firstName: 'Lionel',
                    lastName:  'Messi',
                    age:       24
                }),
                doctor = new Doctor({
                    firstName: 'Mitchell',
                    lastName:  'Moskowitz',
                });
            doctor.patient = person;
            expect(doctor.toData()).to.eql({
                firstName: 'Mitchell',
                lastName:  'Moskowitz',
                age:       0,
                patient: {
                    firstName: 'Lionel',
                    lastName:  'Messi',
                    age:       24
                }
            });
        });

        it("should export partial nested data", function () {
            var person = new Person({
                    firstName: 'Lionel',
                    lastName:  'Messi',
                    age:       24
                }),
                doctor = new Doctor({
                    firstName: 'Mitchell',
                    lastName:  'Moskowitz',
                });
            doctor.patient = person;
            var data = doctor.toData({
                patient: {
                    lastName: true,
                    age: true
                }
            });
            expect(data).to.eql({
                patient: {
                    lastName:  'Messi',
                    age:       24
                }
            });
        });

        it("should export rooted data", function () {
            var PersonWrapper = Model.extend({
                    $properties: {
                        person: { map: Person, root: true }
                    }
                }),
                wrapper = new PersonWrapper({
                    firstName: 'Franck',
                    lastName:  'Ribery',
                    age:       32
                });
            expect(wrapper.person.firstName).to.equal('Franck');
            expect(wrapper.person.lastName).to.equal('Ribery');
            expect(wrapper.toData()).to.eql({
                firstName: 'Franck',
                lastName:  'Ribery',
                age:       32
            });
        });

        it("should export partial rooted data", function () {
            var PersonWrapper = Model.extend({
                    $properties: {
                        person: { map: Person, root: true }
                    }
                }),
                wrapper = new PersonWrapper({
                    firstName: 'Franck',
                    lastName:  'Ribery',
                    age:       32
                });
            expect(wrapper.toData({person: { age: true }})).to.eql({
                age: 32
            });
        });
    });

    describe("#mergeInto", function () {
        it("should merge simple data", function () {
            var person = new Person({
                   firstName: 'Alexi',
                   lastName:  'Sanchez',
                   age:       10
                }),
                other = new Person;
            expect(person.mergeInto(other)).to.be.true;
            expect(other.firstName).to.equal(person.firstName);
            expect(other.lastName).to.equal(person.lastName);
            expect(other.age).to.equal(person.age);
        });

        it("should merge nested data", function () {
            var patient = new Person({
                   firstName: 'Raheem',
                   lastName:  'Sterling',
                   age:       10
                }),
                doctor = new Doctor({
                    firstName: 'Daniel',
                    lastName:  'Worrel',
                }),
                other  = new Doctor({
                    lastName:  'Zigler',
                    patient:   {
                        firstName: 'Brad',
                    }
                });;
            doctor.patient = patient;
            expect(doctor.mergeInto(other)).to.be.true;
            expect(other.firstName).to.equal(doctor.firstName);
            expect(other.lastName).to.equal('Zigler');
            expect(other.patient.firstName).to.equal('Brad');
            expect(other.patient.lastName).to.equal(patient.lastName);
            expect(other.patient.age).to.equal(patient.age);            
        });

        it("should merge contravariantly", function () {
            var person = new Person({
                   firstName: 'Client',
                   lastName:  'Dempsey'
                }),
                doctor = new Doctor;
            expect(person.mergeInto(doctor)).to.be.true;
            expect(doctor.firstName).to.equal(person.firstName);
            expect(doctor.lastName).to.equal(person.lastName);
            expect(doctor.age).to.equal(0);
        });

        it("should not merge unrelated models", function () {
            var person = new Person({
                   firstName: 'Eduardo',
                   lastName:  'Vargas'
                }),
                controller = new PersonController;
            expect(person.mergeInto(controller)).to.be.false;
        });
    });
    
    describe("#map", function () {
        it("should map one-to-one", function () {
            var data = {
                firstName: 'Daniel',
                lastName:  'Worrel',
                patient:   {
                    firstName: 'Emitt',
                    lastName:  'Smith'
                }
            };
            var doctor  = new Doctor(data),
                patient = doctor.patient; 
            expect(doctor.firstName).to.equal('Daniel');
            expect(doctor.lastName).to.equal('Worrel');
            expect(patient).to.be.instanceOf(Person);
            expect(patient.firstName).to.equal('Emitt');
            expect(patient.lastName).to.equal('Smith');
        });

        it("should map one-to-many", function () {
            var data = {
                firstName: 'Daniel',
                lastName:  'Worrel',
                patient:   [{
                    firstName: 'Emitt',
                    lastName:  'Smith'
                }, {
                    firstName: 'Tony',
                    lastName:  'Romo'
                }]  
            };
            var doctor   = new Doctor(data),
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
            var data = {
                fiRstNamE: 'Bruce',
                LaStNaMe:  'Lee'
            };
            var person = new Person(data);
            expect(person.firstName).to.equal('Bruce');
            expect(person.lastName).to.equal('Lee');
        });

        it("should preserve grouping", function () {
            var data = {
                patient:   [[{
                    firstName: 'Abbot',
                    }, {
                    firstName: 'Costello',
                    }],
                    [{
                    firstName: 'Bill'
                    }]
                ]  
            };
            var doctor = new Doctor(data),
                group1 = doctor.patient[0],
                group2 = doctor.patient[1];
            expect(group1[0].firstName).to.equal('Abbot');
            expect(group1[1].firstName).to.equal('Costello');
            expect(group2[0].firstName).to.equal('Bill');
        });

        it("should use root mapping", function () {
            var PersonModel = Model.extend({
                $properties: {
                    person: { map: Person, root: true }
                }
            }),
                data = {
                    firstName: 'Henry',
                    lastName:  'Ford'
            }
            var model = new PersonModel(data);
            expect(model.person.firstName).to.equal('Henry');
            expect(model.person.lastName).to.equal('Ford');
        });

        it("should map arrays", function () {
            var Child = Model.extend({
                    $properties: {
                        name: { map: upper }
                    }
                }),
                Parent = Model.extend({
                    $properties: {
                        name: { map: upper },
                        children: { map: Child }
                    }
                });
            var data = [{
                name: 'John',
                children:   [{
                    name: 'Ralph'
                }, {
                    name: 'Susan'
                }]
                }, {
                name: 'Beth',
                children:   [{
                    name: 'Lisa'
                }, {
                    name: 'Mike'
                }]
                }
            ];
            var parents = Model.map(data, Parent, { dynamic: true });
            expect(parents).to.have.length(2);
            expect(parents[0].name).to.equal("JOHN");
            expect(parents[1].name).to.equal("BETH");
            expect(parents[0].children[0].name).to.equal("RALPH");
            expect(parents[0].children[1].name).to.equal("SUSAN");
            expect(parents[1].children[0].name).to.equal("LISA");
            expect(parents[1].children[1].name).to.equal("MIKE");
            function upper(str) {
                return str.toUpperCase();
            }
        });        
    });
});

describe("Controller", function () {
    var context;
    beforeEach(function() {
        context   = new Context;
        context.addHandlers(new ValidationCallbackHandler, new ValidateJsCallbackHandler);
    });

    describe("#validate", function () {
        it("should require a context", function () {
            var controller = new PersonController;
            expect(function () {
                controller.validate();
            }).to.throw(Error, "Validation requires a context to be available.");
        });

        it("should validate the controller", function () {
            var controller = new PersonController;
            controller.context = context;
            var results = controller.validate();
            expect(results.valid).to.be.false;
            expect(results.person.errors.presence).to.eql([{
                message: "Person can't be blank",
                value:   undefined
            }]);
        });

        it("should validate object", function () {
            var controller     = new PersonController;
            controller.context = context;
            var results = controller.validate(new Person);
            expect(results.valid).to.be.false;
            expect(results.firstName.errors.presence).to.eql([{
                message: "First name can't be blank",
                value:   undefined
            }]);
            expect(results.lastName.errors.presence).to.eql([{
                message: "Last name can't be blank",
                value:   undefined
            }]);
            expect(results.age.errors.numericality).to.deep.include.members([{
                  message: "Age must be greater than 11",
                  value:   0
            }]);
        });

        it("should access validation errors from controller", function () {
            var controller     = new PersonController;
            controller.person  = new Person;
            controller.context = context;
            controller.validate();
            var results = controller.$validation;
            expect(results.valid).to.be.false;
            expect(results.errors.presence).to.deep.have.members([{
                key: "person.firstName",
                message: "First name can't be blank",
                value:   undefined
            }, {
                key: "person.lastName",
                message: "Last name can't be blank",
                value:   undefined
            }]);
            expect(results.errors.numericality).to.deep.include.members([{
                  key:     "person.age",
                  message: "Age must be greater than 11",
                  value:   0
            }]);
        });
    });

    describe("#validateAsync", function () {
        it("should require a context", function () {
            var controller = new PersonController;
            expect(function () {
                controller.validateAsync();
            }).to.throw(Error, "Validation requires a context to be available.");
        });

        it("should validate the controller", function (done) {
            var controller = new PersonController;
            controller.context = context;
            controller.validateAsync().then(function (results) {
                expect(results.valid).to.be.false;
                expect(results.person.errors.presence).to.eql([{
                    message: "Person can't be blank",
                    value:   undefined
                }]);
                done();
            });
        });

        it("should validate object", function (done) {
            var controller     = new PersonController;
            controller.context = context;
            controller.validateAsync(new Person).then(function (results) {
                expect(results.valid).to.be.false;
                expect(results.firstName.errors.presence).to.eql([{
                    message: "First name can't be blank",
                    value:   undefined
                }]);
                expect(results.lastName.errors.presence).to.eql([{
                    message: "Last name can't be blank",
                    value:   undefined
                }]);
                expect(results.age.errors.numericality).to.deep.include.members([{
                    message: "Age must be greater than 11",
                    value:   0
                }]);
                done();
            });
        });

        it("should access validation errors from controller", function (done) {
            var controller     = new PersonController;
            controller.person  = new Person;
            controller.context = context;
            controller.validateAsync().then(function () {
                var results = controller.$validation;
                expect(results.valid).to.be.false;
                expect(results.errors.presence).to.eql([{
                    key: "person.firstName",
                    message: "First name can't be blank",
                    value:   undefined
                }, {
                    key: "person.lastName",
                    message: "Last name can't be blank",
                    value:   undefined
                }]);
                expect(results.errors.numericality).to.deep.include.members([{
                    key:     "person.age",
                    message: "Age must be greater than 11",
                    value:   0
                }]);
                done();
            });
        });

        it("should validate the controller implicitly", function (done) {
            var controller = new PersonController;
            controller.context = context;
            controller.context.$validAsync(controller)
                .resolve(Controller).catch(function (err) {
                    expect(controller.$validation.valid).to.be.false;
                    expect(controller.$validation.person.errors.presence).to.eql([{
                        message: "Person can't be blank",
                        value:   undefined
                    }]);
                    done();
                });
        });

        it("should validate the controller implicitly with traversal", function (done) {
            var controller = new PersonController;
            controller.context = context;
            controller.context.$descendantOrSelf().$validAsync(controller)
                .resolve(Controller).catch(function (err) {
                    expect(controller.$validation.valid).to.be.false;
                    expect(controller.$validation.person.errors.presence).to.eql([{
                        message: "Person can't be blank",
                        value:   undefined
                    }]);
                    done();
                });
        });        
    });

    describe("CallbackHandler", function () {
        describe("#modal", function () {
            it("should define modal policy", function () {
                var modal = context.modal();
                expect(modal.handle(new ModalPolicy)).to.be.true;
            });

            it("should specify modal title", function () {
                var modal   = context.modal({title: 'Hello'}),
                    options = new ModalPolicy;
                expect(modal.handle(options)).to.be.true;
                expect(options.title).to.equal('Hello');
            });
        });
    });
});
