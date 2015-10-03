var miruken = require('../lib/miruken.js'),
    graph   = require('../lib/graph.js'),
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(graph.namespace);

new function () { // closure

    var grpah_test = new base2.Package(this, {
        name:    "graph_test",
        exports: "TreeNode"
    });

    eval(this.imports);
    
    var TreeNode = Base.extend(Traversing, TraversingMixin, {
        constructor: function (data) { 
            var _children = [];
            this.extend({
                get parent() { return null; },
                get children() { return _children; },                
                get data() { return data; },
                addChild: function (nodes) {
                    var parent = this;
                    Array2.forEach(arguments, function (node) {
                        node.extend({get parent() { return parent; }});
                        _children.push(node);
                    });
                    return this;
                }
            });
        }});

    eval(this.exports);
};

eval(base2.graph_test.namespace);

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

        it("should traverse ancestor, siblings or self", function () {
            var root     = new TreeNode('root'),
                parent   = new TreeNode('parent'),
                child1   = new TreeNode('child 1'),
                child2   = new TreeNode('child 2'),
                child3   = new TreeNode('child 3'),
                child3_1 = new TreeNode('child 3 1'),
                visited  = [];
            child3.addChild(child3_1);
            parent.addChild(child1, child2, child3);
            root.addChild(parent);
            child3.traverse(TraversingAxis.AncestorSiblingOrSelf, function (node) {
                visited.push(node);
            });
            expect(visited).to.eql([child3, child1, child2, parent, root]);
        });

        it("should detect circular references", function () {
            var CircularParent = Base.extend(TraversingMixin, {
                constructor: function (data) { 
                    this.extend({
                        get parent() { return this; },
                        get children() { return []; },
                    });
                }});

            var CircularChildren = Base.extend(TraversingMixin, {
                constructor: function (data) { 
                    this.extend({
                        get parent() { return null; },
                        get children() { return [this]; },
                    });
                }});

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
