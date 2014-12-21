var miruken = require('../miruken.js')
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);

new function () { // closure

    var miruken_test = new base2.Package(this, {
        name:    "miruken_test",
        exports: "Animal,Tricks,CircusAnimal,Dog,Elephant,AsianElephant,Tracked,TreeNode"
    });

    eval(this.imports);

    var Animal = Protocol.extend({
        talk: function () {},
        eat:  function (food) {}
    });
    
    var Tricks = Protocol.extend({
        fetch: function (item) {}
    });
    
    var CircusAnimal = Animal.extend(Tricks, {
    });
    
    var Dog = Base.extend(Animal, Tricks, {
        talk: function () { return 'Ruff Ruff'; },
        fetch: function (item) { return 'Fetched ' + item; }
    });
    
    var Elephant = Base.extend(CircusAnimal, {
    });
    
    var AsianElephant = Elephant.extend({});

	var Tracked = Protocol.extend({
		getTag: function () {}
	});
    
    var TreeNode = Base.extend({
        constructor: function (data) { 
            var _children = [];
            this.extend({
                getParent:   function () { return null; },
                getData:     function () { return data; },
                getChildren: function () { return _children; },
                addChild:    function (nodes) {
                    var parent = this;
                    Array2.forEach(arguments, function (node) {
                        node.extend({getParent: function () { return parent; }});
                        _children.push(node);
                    });
                    return this;
                }
            });
        }});
    TreeNode.implement(Traversing);

    eval(this.exports);
};

eval(base2.miruken_test.namespace);

describe("$isClass", function () {
    it("should identify miruken classes", function () {
    expect($isClass(Dog)).to.be.true;
    });

    it("should reject non-miruken classes", function () {
    var SomeClass = function () {};
    expect($isClass(SomeClass)).to.be.false;
    });
});

describe("Modifier", function () {
    describe("$createModifier", function () {
        it("should create a new modifier", function () {
            var wrap    = $createModifier('wrap');
        expect(wrap.prototype).to.be.instanceOf(Modifier);
        });

        it("should apply a  modifier using function call", function () {
            var wrap    = $createModifier('wrap'),
                wrapped = wrap(22);
            expect(wrap.test(wrapped)).to.be.true;
            expect(wrapped.getSource()).to.equal(22);
        });
        
        it("should not apply a modifier the using new operator", function () {
            var wrap    = $createModifier('wrap');
            expect(function () { 
        new wrap(22);
            }).to.throw(Error, /Modifiers should not be called with the new operator./);
        });
        
        it("should ignore modifier if already present", function () {
            var wrap    = $createModifier('wrap'),
                wrapped = wrap(wrap("soccer"));
            expect(wrapped.getSource()).to.equal("soccer");
        });
    })

    describe("#test", function () {
        it("should test chained modifiers", function () {
            var shape = $createModifier('shape'),
                wrap  = $createModifier('wrap'),
                roll  = $createModifier('roll'),
                chain = shape(wrap(roll(19)));
            expect(shape.test(chain)).to.be.true;
            expect(wrap.test(chain)).to.be.true;
            expect(roll.test(chain)).to.be.true;
        });
    });

    describe("#unwrap", function () {
        it("should unwrap source when modifiers chained", function () {
            var shape = $createModifier('shape'),
                wrap  = $createModifier('wrap'),
                roll  = $createModifier('roll'),
                chain = shape(wrap(roll(19)));
            expect(Modifier.unwrap(chain)).to.equal(19);
        });
    });
});

describe("Protocol", function () {
    describe("#isProtocol", function () {
        it("should determine if type is a protocol", function () {
            expect(Protocol.isProtocol(Animal)).to.be.true;
            expect(Protocol.isProtocol(CircusAnimal)).to.be.true;
            expect(Protocol.isProtocol(Dog)).to.be.false;
            expect(Protocol.isProtocol(AsianElephant)).be.false;
        });

        it("should not consider Protocol a protocol", function () {
            expect(Protocol.isProtocol(Protocol)).to.be.false;
        });
    });

    describe("#getProtocols", function () {
        it("should determine if type is a protocol", function () {
            expect(Dog.getProtocols()).to.eql([Animal, Tricks]);
            expect(TreeNode.getProtocols()).to.eql([]);
        });
    });

    describe("#conformsTo", function () {
        it("should conform to protocols by class", function () {
            expect(Dog.conformsTo()).to.be.false;
			expect(Dog.conformsTo(Animal)).to.be.true;
		    expect(Dog.conformsTo(Tricks)).to.be.true;
            expect(TreeNode.conformsTo(Animal)).to.be.false;
        });

        it("should conform to protocols by protocol", function () {
            expect(CircusAnimal.conformsTo(Animal)).to.be.true;
            expect(CircusAnimal.conformsTo(Tricks)).to.be.true;
            expect(Animal.conformsTo(Tricks)).to.be.false;
            expect(CircusAnimal.conformsTo(CircusAnimal)).to.be.false;
        });

        it("should conform to protocols by object", function () {
            var dog = new Dog;
            expect(dog.conformsTo(Animal)).to.be.true;
            expect(dog.conformsTo(Tricks)).to.be.true;
        });

        it("should only list protocol once", function () {
            var Cat = Base.extend(Animal, Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect(Cat.getProtocols()).to.eql([Animal]);
        });

        it("should only list protocol once if extended", function () {
            var Cat = Animal.extend(Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect(Cat.getProtocols()).to.eql([Animal]);
        });

        it("should support protocol inheritance", function () {
            expect(Elephant.conformsTo(Animal)).to.be.true;
            expect(CircusAnimal.getProtocols()).to.eql([Animal, Tricks]);
        });

        it("should inherit protocol conformance", function () {
            expect(AsianElephant.conformsTo(Animal)).to.be.true;
            expect(AsianElephant.conformsTo(Tricks)).to.be.true;
        });

        it("should allow redefining method", function () {
            var SmartTricks = Tricks.extend({
                    fetch: function (item) {}
                }),
                SmartDog = Dog.extend({
                    fetch: function (item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog;
            expect(SmartTricks(dog).fetch('bone')).to.equal('Buried bone');
        });

        it("should support strict when redefing method", function () {
            var SmartTricks = Tricks.extend({
                    constructor: function (proxy) {
                        this.base(proxy, true);
                    },
                    fetch: function (item) {}
                }),
                SmartDog = Dog.extend({
                    fetch: function (item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog;
            expect(Tricks(dog).fetch('bone')).to.equal('Buried bone');
            expect(SmartTricks(dog).fetch('bone')).to.be.undefined;
        });
    });

    describe("#adoptedBy", function () {
        it("should determine if protocol adopted by class", function () {
            expect(Animal.adoptedBy(Dog)).to.be.true;
        });

        it("should determine if protocol adopted by protocol", function () {
            expect(Protocol.adoptedBy(Animal)).to.be.true;
            expect(Tricks.adoptedBy(Animal)).to.be.false;
            expect(Animal.adoptedBy(CircusAnimal)).to.be.true;
        });

        it("should determine if protocol adopted by object", function () {
            expect(Animal.adoptedBy(new Dog)).to.be.true;
            expect(Animal.adoptedBy(new TreeNode)).to.be.false;
        });
    });

    describe("#addProtocol", function () {
        it("should add protocol to class", function () {
            var Bird  = Base.extend(Animal),
                eagle = (new Bird).extend({
                   getTag : function () { return "Eagle"; }
				});
            Bird.addProtocol(Tracked);
            expect(Bird.conformsTo(Tracked)).to.be.true;
			expect(eagle.getTag()).to.equal("Eagle");
        });

        it("should add protocol to protocol", function () {
            var Bear      = Base.extend(Animal),
                polarBear = (new Bear).extend({
                getTag : function () { return "Polar Bear"; }
            });
			Animal.addProtocol(Tracked);
            expect(polarBear.conformsTo(Tracked)).to.be.true;
			expect(polarBear.getTag()).to.equal("Polar Bear");
			expect(Animal(polarBear).getTag()).to.equal("Polar Bear");
        });
    })
});

describe("Proxy", function () {
    describe("#proxyMethod", function () {
        it("should proxy calls to normal objects", function () {
            var dog = Animal(new Dog);
            expect(dog.talk()).to.equal('Ruff Ruff');
        });

        it("should ignore null or undefined target", function () {
            Animal().talk();
            Animal(null).talk();
        });

        it("should ignore missing methods", function () {
            var dog = Animal(new Dog);
            dog.eat('bug');
        });

        it("should support specialization", function () {
            expect(CircusAnimal(new Dog).fetch("bone")).to.equal('Fetched bone');
        });

        it("should ignore if strict and protocol not adopted", function () {
            var Toy = Base.extend({
                talk: function () { return 'To infinity and beyond'; }
            });
            expect(Animal(new Toy).talk()).to.equal('To infinity and beyond');
            expect(Animal(new Toy, true).talk()).to.be.undefined;
        });
    });
});

describe("Traversing", function () {
    describe("#traverse", function () {
        it("should traverse self", function () {
            var root    = new TreeNode('root'),
                visited = [];
            root.traverse(TraversingAxis.Self, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([root]);
        });

        it("should traverse root", function () {
            var root    = new TreeNode('root'),
                child1  = new TreeNode('child 1'),
                child2  = new TreeNode('child 2'),
                child3  = new TreeNode('child 3');
                visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Root, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([root]);
        });

        it("should traverse children", function () {
            var root    = new TreeNode('root'),
                child1  = new TreeNode('child 1'),
                child2  = new TreeNode('child 2'),
                child3  = new TreeNode('child 3')
                .addChild(new TreeNode('child 3 1'))
            visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Child, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child2, child3]);
        });

        it("should traverse siblings", function () {
            var root    = new TreeNode('root'),
                child1  = new TreeNode('child 1'),
                child2  = new TreeNode('child 2'),
                child3  = new TreeNode('child 3')
                .addChild(new TreeNode('child 3 1'))
            visited = [];
            root.addChild(child1, child2, child3);
            child2.traverse(TraversingAxis.Sibling, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child3]);
        });

        it("should traverse children and self", function () {
            var root    = new TreeNode('root'),
                child1  = new TreeNode('child 1'),
                child2  = new TreeNode('child 2'),
                child3  = new TreeNode('child 3')
                .addChild(new TreeNode('child 3 1'))
            visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.ChildOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([root, child1, child2, child3]);
        });

        it("should traverse siblings and self", function () {
            var root    = new TreeNode('root'),
                child1  = new TreeNode('child 1'),
                child2  = new TreeNode('child 2'),
                child3  = new TreeNode('child 3')
                .addChild(new TreeNode('child 3 1'))
            visited = [];
            root.addChild(child1, child2, child3);
            child2.traverse(TraversingAxis.SiblingOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child2, child1, child3]);
        });

        it("should traverse ancestors", function () {
            var root       = new TreeNode('root'),
                child      = new TreeNode('child'),
                grandChild = new TreeNode('grandChild'),
                visited    = [];
            root.addChild(child);
            child.addChild(grandChild);
            grandChild.traverse(TraversingAxis.Ancestor, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child, root]);
        });

        it("should traverse ancestors or self", function () {
            var root       = new TreeNode('root'),
                child      = new TreeNode('child'),
                grandChild = new TreeNode('grandChild'),
                visited    = [];
            root.addChild(child);
            child.addChild(grandChild);
            grandChild.traverse(TraversingAxis.AncestorOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([grandChild, child, root]);
        });

        it("should traverse descendants", function () {
            var root     = new TreeNode('root'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Descendant, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child2, child3, child3_1]);
        });

        it("should traverse descendants reverse", function () {
            var root     = new TreeNode('root'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.DescendantReverse, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child3_1, child1, child2, child3]);
        });

        it("should traverse descendants or self", function () {
            var root     = new TreeNode('root'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.DescendantOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([root, child1, child2, child3, child3_1]);
        });

        it("should traverse descendants or self reverse", function () {
            var root     = new TreeNode('root'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.DescendantOrSelfReverse, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child3_1, child1, child2, child3, root]);
        });

        it("should traverse parent, siblings or self", function () {
            var root     = new TreeNode('root'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            child3.traverse(TraversingAxis.ParentSiblingOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child3, child1, child2, root]);
        });

        it("should detect circular references", function () {
            var CircularParent = Base.extend({
                constructor: function (data) { 
                    this.extend({
                        getParent:   function () { return this; },
                        getChildren: function () { return []; },
                    });
                }});
            CircularParent.implement(Traversing);

            var CircularChildren = Base.extend({
                constructor: function (data) { 
                    this.extend({
                        getParent:   function () { return null; },
                        getChildren: function () { return [this]; },
                    });
                }});
            CircularChildren.implement(Traversing);

            var circularParent = new CircularParent();
            expect(function () { 
                circularParent.traverse(TraversingAxis.Ancestor, function (node) {})
            }).to.throw(Error, /Circularity detected/);

            var circularChildren = new CircularChildren();
            expect(function () { 
                circularChildren.traverse(TraversingAxis.Descendant, function (node) {})
            }).to.throw(Error, /Circularity detected/);
        });
    });
});

describe("Package", function () {
    describe("#getProtocols", function () {
        it("should expose protocol definitions", function () {
            var protocols = [];
            miruken_test.getProtocols(function (protocol) {
                protocols.push(protocol);
            });
            expect(protocols).to.have.length(4);
            expect(protocols).to.have.members([Animal, Tricks, CircusAnimal, Tracked]);
        });
    });

    describe("#getClasses", function () {
        it("should expose class definitions", function () {
            var classes = [];
            miruken_test.getClasses(function (cls) {
                classes.push(cls);
            });
            expect(classes).to.have.length(4);
            expect(classes).to.have.members([Dog, Elephant, AsianElephant, TreeNode]);
        });
    });
});

describe("Traversal", function () {
    var root     = new TreeNode('root'),
        child1   = new TreeNode('child 1'),
        child1_1 = new TreeNode('child 1 1'),
        child2   = new TreeNode('child 2'),
        child2_1 = new TreeNode('child 2 1');
        child2_2 = new TreeNode('child 2 2');
        child3   = new TreeNode('child 3'),
        child3_1 = new TreeNode('child 3 1');
        child3_2 = new TreeNode('child 3 2');
        child3_3 = new TreeNode('child 3 3');
        child1.addChild(child1_1);
        child2.addChild(child2_1, child2_2);
        child3.addChild(child3_1, child3_2, child3_3);
    root.addChild(child1, child2, child3);

    describe("#preOrder", function () {
        it("should traverse graph in pre-order", function () {
            var visited  = [];
            Traversal.preOrder(root, function (node) { visited.push(node); });
            expect(visited).to.eql([root,     child1, child1_1, child2,  child2_1,
                                    child2_2, child3, child3_1, child3_2,child3_3]);
        });
    });

    describe("#postOrder", function () {
        it("should traverse graph in post-order", function () {
            var visited  = [];
            Traversal.postOrder(root, function (node) { visited.push(node); });
            expect(visited).to.eql([child1_1, child1,   child2_1, child2_2, child2,
                                    child3_1, child3_2, child3_3, child3,   root]);
        });
    });

    describe("#levelOrder", function () {
        it("should traverse graph in level-order", function () {
            var visited  = [];
            Traversal.levelOrder(root, function (node) { visited.push(node); });
            expect(visited).to.eql([root,     child1,   child2,   child3,   child1_1,
                                    child2_1, child2_2, child3_1, child3_2, child3_3]);
        });
    });

    describe("#reverseLevelOrder", function () {
        it("should traverse graph in reverse level-order", function () {
            var visited  = [];
            Traversal.reverseLevelOrder(root, function (node) { visited.push(node); });

            expect(visited).to.eql([child1_1, child2_1, child2_2, child3_1, child3_2,
                                    child3_3, child1,   child2,   child3,   root]);
        });
    });
});
