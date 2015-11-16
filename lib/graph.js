var miruken = require('./miruken.js');

new function () { // closure

    /**
     * Package containing graph traversal support.
     * @module miruken
     * @submodule graph
     * @namespace miruken.graph
     */
     miruken.package(this, {
        name:    "graph",
        imports: "miruken",
        exports: "TraversingAxis,Traversing,TraversingMixin,Traversal"
    });

    eval(this.imports);

    /**
     * TraversingAxis enum
     * @class TraversingAxis
     * @extends miruken.Enum
     */
    var TraversingAxis = Enum({
        /**
         * Traverse only current node.
         * @property {number} Self
         */
        Self: 1,
        /**
         * Traverse only current node root.
         * @property {number} Root
         */
        Root: 2,
        /**
         * Traverse current node children.
         * @property {number} Child
         */
        Child: 3,
        /**
         * Traverse current node siblings.
         * @property {number} Sibling
         */
        Sibling: 4,
        /**
         * Traverse current node ancestors.
         * @property {number} Ancestor
         */
        Ancestor: 5,
        /**
         * Traverse current node descendants.
         * @property {number} Descendant
         */
        Descendant: 6,
        /**
         * Traverse current node descendants in reverse.
         * @property {number} DescendantReverse
         */
        DescendantReverse: 7,
        /**
         * Traverse current node and children.
         * @property {number} ChildOrSelf
         */
        ChildOrSelf: 8,
        /**
         * Traverse current node and siblings.
         * @property {number} SiblingOrSelf
         */
        SiblingOrSelf: 9,
        /**
         * Traverse current node and ancestors.
         * @property {number} AncestorOrSelf
         */
        AncestorOrSelf: 10,
        /**
         * Traverse current node and descendents.
         * @property {number} DescendantOrSelf
         */
        DescendantOrSelf: 11,
        /**
         * Traverse current node and descendents in reverse.
         * @property {number} DescendantOrSelfReverse
         */
        DescendantOrSelfReverse: 12,
        /**
         * Traverse current node, ancestors and siblings.
         * @property {number} AncestorSiblingOrSelf 
         */
        AncestorSiblingOrSelf: 13
    });

    /**
     * Protocol for traversing an abitrary graph of objects.
     * @class Traversing
     * @extends miruken.Protocol
     */
    var Traversing = Protocol.extend({
        /**
         * Traverse a graph of objects.
         * @method traverse
         * @param {miruken.graph.TraversingAxis} axis        -  axis of traversal
         * @param {Function}                     visitor     -  receives visited nodes
         * @param {Object}                       [context]   -  visitor callback context
         */
        traverse: function (axis, visitor, context) {}
    });

    /**
     * Mixin for Traversing functionality.
     * @class TraversingMixin
     * @uses miruken.graph.Traversing
     * @extends Module
     */
    var TraversingMixin = Module.extend({
        traverse: function (object, axis, visitor, context) {
            if ($isFunction(axis)) {
                context = visitor;
                visitor = axis;
                axis    = TraversingAxis.Child;
            }
            if (!$isFunction(visitor)) return;
            switch (axis) {
            case TraversingAxis.Self:
                _traverseSelf.call(object, visitor, context);
                break;
                
            case TraversingAxis.Root:
                _traverseRoot.call(object, visitor, context);
                break;
                
            case TraversingAxis.Child:
                _traverseChildren.call(object, visitor, false, context);
                break;

            case TraversingAxis.Sibling:
                _traverseAncestorSiblingOrSelf.call(object, visitor, false, false, context);
                break;
                
            case TraversingAxis.ChildOrSelf:
                _traverseChildren.call(object, visitor, true, context);
                break;

            case TraversingAxis.SiblingOrSelf:
                _traverseAncestorSiblingOrSelf.call(object, visitor, true, false, context);
                break;
                
            case TraversingAxis.Ancestor:
                _traverseAncestors.call(object, visitor, false, context);
                break;
                
            case TraversingAxis.AncestorOrSelf:
                _traverseAncestors.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.Descendant:
                _traverseDescendants.call(object, visitor, false, context);
                break;
  
            case TraversingAxis.DescendantReverse:
                _traverseDescendantsReverse.call(object, visitor, false, context);
                break;
              
            case TraversingAxis.DescendantOrSelf:
                _traverseDescendants.call(object, visitor, true, context);
                break;

            case TraversingAxis.DescendantOrSelfReverse:
                _traverseDescendantsReverse.call(object, visitor, true, context);
                break;
                
            case TraversingAxis.AncestorSiblingOrSelf:
                _traverseAncestorSiblingOrSelf.call(object, visitor, true, true, context);
                break;

            default:
                throw new Error(format("Unrecognized TraversingAxis %1.", axis));
            }
        }
    });

    function checkCircularity(visited, node) {
        if (visited.indexOf(node) !== -1) {
            throw new Error(format("Circularity detected for node %1", node));
        }
        visited.push(node);
        return node;
    }

    function _traverseSelf(visitor, context) {
        visitor.call(context, this);
    }

    function _traverseRoot(visitor, context) {
        var parent, root = this, visited = [this];
        while (parent = root.parent) {
            checkCircularity(visited, parent);
            root = parent;   
        }
        visitor.call(context, root);
    }

    function _traverseChildren(visitor, withSelf, context) {
        if ((withSelf && visitor.call(context, this))) {
            return;
        }
        var children = this.children;
        for (var i = 0; i < children.length; ++i) {
            if (visitor.call(context, children[i])) {
                return;
            }
        }
    }

    function _traverseAncestors(visitor, withSelf, context) {
        var parent = this, visited = [this];
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        while ((parent = parent.parent) && !visitor.call(context, parent)) {
            checkCircularity(visited, parent);
        }
    }

    function _traverseDescendants(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.levelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.levelOrder(this, function (node) {
                if (!$equals(self, node)) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseDescendantsReverse(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.reverseLevelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.reverseLevelOrder(this, function (node) {
                if (!$equals(self, node)) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        var self = this, parent = this.parent;
        if (parent) {
            var children = parent.children;
            for (var i = 0; i < children.length; ++i) {
                var sibling = children[i];
                if (!$equals(self, sibling) && visitor.call(context, sibling)) {
                    return;
                }
            }
            if (withAncestor) {
                _traverseAncestors.call(parent, visitor, true, context);
            }
        }
    }
    
    /**
     * Helper class for traversing a graph.
     * @static
     * @class Traversal
     * @extends Abstract
     */
    var Traversal = Abstract.extend({}, {
        /**
         * Performs a pre-order graph traversal.
         * @static
         * @method preOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        preOrder: function (node, visitor, context) {
            return _preOrder(node, visitor, context, []);
        },
        /**
         * Performs a post-order graph traversal.
         * @static
         * @method postOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        postOrder: function (node, visitor, context) {
            return _postOrder(node, visitor, context, []);
        },
        /**
         * Performs a level-order graph traversal.
         * @static
         * @method levelOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        levelOrder: function (node, visitor, context) {
            return _levelOrder(node, visitor, context, []);
        },
        /**
         * Performs a reverse level-order graph traversal.
         * @static
         * @method levelOrder
         * @param  {miruken.graph.Traversing}  node       -  node to traverse
         * @param  {Function}                  visitor    -  receives visited nodes
         * @param  {Object}                    [context]  -  visitor calling context
         */
        reverseLevelOrder: function (node, visitor, context) {
            return _reverseLevelOrder(node, visitor, context, []);
        }
    });

    function _preOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.preOrder(child, visitor, context);
            });
        return false;
    }

    function _postOrder(node, visitor, context, visited) {
        checkCircularity(visited, node);
        if (!node || !$isFunction(visitor)) {
            return true;
        }
        if ($isFunction(node.traverse))
            node.traverse(function (child) {
                return Traversal.postOrder(child, visitor, context);
            });
        return visitor.call(context, node);
    }

    function _levelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            if (visitor.call(context, next)) {
                return;
            }
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) queue.push(child);
                });
        }
    }

    function _reverseLevelOrder(node, visitor, context, visited) {
        if (!node || !$isFunction(visitor)) {
            return;
        }
        var queue = [node],
            stack = [];
        while (queue.length > 0) {
            var next = queue.shift();
            checkCircularity(visited, next);
            stack.push(next);
            var level = [];
            if ($isFunction(next.traverse))
                next.traverse(function (child) {
                    if (child) level.unshift(child);
                });
            queue.push.apply(queue, level);
        }
        while (stack.length > 0) {
            if (visitor.call(context, stack.pop())) {
                return;
            }
        }
    }

    eval(this.exports);

}
