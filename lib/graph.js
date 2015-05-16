var miruken = require('./miruken.js');

new function () { // closure

    /**
     * Definition goes here
     * @module miruken
     * @submodule callback
     * @namespace miruken.graph
     */
    var grpah = new base2.Package(this, {
        name:    "graph",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken",
        exports: "TraversingAxis,Traversing,TraversingMixin,Traversal"
    });

    eval(this.imports);

    // =========================================================================
    // Traversing
    // =========================================================================

    /**
     * Traversing enum
     * @property TraversingAxis
     * @type Enum
     */
    var TraversingAxis = Enum({
        Self:                    1,
        Root:                    2,
        Child:                   3,
        Sibling:                 4,
        Ancestor:                5,
        Descendant:              6,
        DescendantReverse:       7,
        ChildOrSelf:             8,
        SiblingOrSelf:           9,
        AncestorOrSelf:          10,
        DescendantOrSelf:        11,
        DescendantOrSelfReverse: 12,
        AncestorSiblingOrSelf:   13
    });

    /**
     * Description goes here
     * @class Traversing
     * @extends Protocol
     */
    var Traversing = Protocol.extend({
        /**
         * Traverse a graph of objects.
         * @method traverse
         * @param {TraversingAxis} axis       - axis of traversal
         * @param {Function}       visitor    - receives visited nodes
         * @param {Object}         context    - visitor callback context
         */
        traverse: function (axis, visitor, context) {}
    });

    /**
     * Traversing mixin
     * @class TraversingMixin
     * @extends Module
     */
    var TraversingMixin = Module.extend({
        /**
         * Traverse a graph of objects.
         * @method traverse
         * @param {Object}      object      -   axis of traversal
         * @param {Axis}        axis        -   receives visited nodes
         * @param {Visitor}     visitor     -   receives visited nodes
         * @param {Object}      context     -   visitor callback context
         */
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
        while ($isFunction(root.getParent) && (parent = root.getParent())) {
            checkCircularity(visited, parent);
            root = parent;   
        }
        visitor.call(context, root);
    }

    function _traverseChildren(visitor, withSelf, context) {
        if ((withSelf && visitor.call(context, this)) || !$isFunction(this.getChildren)) {
            return;
        }
        var children = this.getChildren();
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
        while ($isFunction(parent.getParent) && (parent = parent.getParent()) &&
               !visitor.call(context, parent)) {
            checkCircularity(visited, parent);
        }
    }

    function _traverseDescendants(visitor, withSelf, context) {
        if (withSelf) {
            Traversal.levelOrder(this, visitor, context);
        } else {
            var self = this;
            Traversal.levelOrder(this, function (node) {
                if (node != self) {
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
                if (node != self) {
                    return visitor.call(context, node);
                }
            }, context);
        }
    }

    function _traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
        if (withSelf && visitor.call(context, this) || !$isFunction(this.getParent)) {
            return;
        }
        var self = this, parent = this.getParent();
        if (parent) {
            if ($isFunction(parent.getChildren)) {
                var children = parent.getChildren();
                for (var i = 0; i < children.length; ++i) {
                    var sibling = children[i];
                    if (sibling != self && visitor.call(context, sibling)) {
                        return;
                    }
                }
            }
            if (withAncestor) {
                _traverseAncestors.call(parent, visitor, true, context);
            }
        }
    }

    /**
     * Description goes here
     * @class Traversal
     * @extends Abstract
     */
    var Traversal = Abstract.extend({}, {
        /**
         * Description goes here
         * @method preOrder
         * @param  {Node}       node       -   description
         * @param  {Visitor}    visitor    -   description
         * @param  {Context}    context    -   description
         * @return {Array}      preOrder   -   description
         */
        preOrder: function (node, visitor, context) {
            return _preOrder(node, visitor, context, []);
        },
        /**
         * Description goes here
         * @method postOrder
         * @param  {Node}       node        -   description
         * @param  {Visitor}    visitor     -   description
         * @param  {Context}    context     -   description
         * @return {Array}      postOrder   -   description
         */
        postOrder: function (node, visitor, context) {
            return _postOrder(node, visitor, context, []);
        },
        /**
         * Description goes here
         * @method levelOrder
         * @param  {Node}       node        -   description
         * @param  {Visitor}    visitor     -   description
         * @param  {Context}    context     -   description
         * @return {Array}      levelOrder  -   description
         */
        levelOrder: function (node, visitor, context) {
            return _levelOrder(node, visitor, context, []);
        },
        /**
         * Description goes here
         * @method reverseLevelOrder
         * @param  {Node}       node                -   description
         * @param  {Visitor}    visitor             -   description
         * @param  {Context}    context             -   description
         * @return {Array}      reverseLevelOrder   -   description
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
