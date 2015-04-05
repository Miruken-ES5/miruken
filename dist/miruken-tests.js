(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

// timestamp: Wed, 23 Sep 2009 19:38:55

base2 = {
  name:    "base2",
  version: "1.1 (alpha1)",
  exports:
    "Base,Package,Abstract,Module,Enumerable,Map,Collection,RegGrp," +
    "Undefined,Null,This,True,False,assignID,global",
  namespace: ""
};

new function(_no_shrink_) { ///////////////  BEGIN: CLOSURE  ///////////////

// =========================================================================
// base2/header.js
// =========================================================================

/*@cc_on @*/

var Undefined = K(), Null = K(null), True = K(true), False = K(false), This = function(){return this};

var global = This(), base2 = global.base2;
   
// private
var _IGNORE  = K(),
    _FORMAT  = /%([1-9])/g,
    _LTRIM   = /^\s\s*/,
    _RTRIM   = /\s\s*$/,
    _RESCAPE = /([\/()[\]{}|*+-.,^$?\\])/g,     // safe regular expressions
    _BASE    = /\bbase\b/,
    _HIDDEN  = ["constructor", "toString"],     // only override these when prototyping
    _counter = 1,
    _slice   = Array.prototype.slice;

_Function_forEach(); // make sure this is initialised

function assignID(object, name) {
  // Assign a unique ID to an object.
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object[name]) object[name] = "b2_" + _counter++;
  return object[name];
};

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

var _subclass = function(_instance, _static) {
  // Build the prototype.
  base2.__prototyping = this.prototype;
  var _prototype = new this;
  if (_instance) extend(_prototype, _instance);
  _prototype.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
  delete base2.__prototyping;
  
  // Create the wrapper for the constructor function.
  var _constructor = _prototype.constructor;
  function _class() {
    // Don't call the constructor function when prototyping.
    if (!base2.__prototyping) {
      if (this.constructor == _class || this.__constructing) {
        // Instantiation.
        this.__constructing = true;
        var instance = _constructor.apply(this, arguments);
        delete this.__constructing;
        if (instance) return instance;
      } else {
        // Casting.
	    var target = arguments[0];
	    if (target instanceof _class) return target;
        var cls = _class;
        do {
          if (cls.coerce) {
	        var cast = cls.coerce.apply(_class, arguments);
            if (cast) return cast;
          }
        } while ((cls = cls.ancestor) && (cls != Base));
        return extend(target, _prototype);
      }
    }
    return this;
  };
  _prototype.constructor = _class;
  
  // Build the static interface.
  for (var i in Base) _class[i] = this[i];
  if (_static) extend(_class, _static);
  _class.ancestor = this;
  _class.ancestorOf = Base.ancestorOf;
  _class.base = _prototype.base;
  _class.prototype = _prototype;
  if (_class.init) _class.init();
  
  // introspection (removed when packed)
  ;;; _class["#implements"] = [];
  ;;; _class["#implemented_by"] = [];
  
  return _class;
};

var Base = _subclass.call(Object, {
  constructor: function() {
    if (arguments.length > 0) {
      this.extend(arguments[0]);
    }
  },
  
  extend: delegate(extend),
  
  toString: function() {
    if (this.constructor.toString == Function.prototype.toString) {
      return "[object base2.Base]";
    } else {
      return "[object " + String2.slice(this.constructor, 1, -1) + "]";
    }
  }
}, Base = {
  ancestorOf: function(klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  forEach: function(object, block, context) {
    _Function_forEach(this, object, block, context);
  },

  implement: function(source) {
    if (typeof source == "function") {
      ;;; if (_ancestorOf(Base, source)) {
        // introspection (removed when packed)
        ;;; this["#implements"].push(source);
        ;;; source["#implemented_by"].push(this);
      ;;; }
      source = source.prototype;
    }
    // Add the interface using the extend() function.
    extend(this.prototype, source);
    return this;
  }
});

// =========================================================================
// base2/Package.js
// =========================================================================

var Package = Base.extend({
  constructor: function(_private, _public) {
    var pkg = this, openPkg;
    
    pkg.extend(_public);

    if (pkg.name && pkg.name != "base2") {
      if (_public.parent === undefined) pkg.parent = base2;
      openPkg = pkg.parent && pkg.parent[pkg.name];
      if (openPkg) {
        pkg.namespace = openPkg.namespace;
      } else {
        if (pkg.parent) pkg.parent.addName(pkg.name, pkg);
        pkg.namespace = format("var %1=%2;", pkg.name, String2.slice(pkg, 1, -1));
      }
    }
    
    if (_private) {
      // This next line gets round a bug in old Mozilla browsers
      var jsNamespace = base2.js ? base2.js.namespace : "";
      
      // This string should be evaluated immediately after creating a Package object.
      var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace + jsNamespace;
      var imports = csv(pkg.imports), name;
      for (var i = 0; name = imports[i]; i++) {
        var ns = lookup(name) || lookup("js." + name);
        if (!ns) throw new ReferenceError(format("Object not found: '%1'.", name));
        namespace += ns.namespace;
      }
      if (openPkg) namespace += openPkg.namespace;

      _private.init = function() {
        if (pkg.init) pkg.init();
      };
      _private.imports = namespace + lang.namespace + "this.init();";
      
      // This string should be evaluated after you have created all of the objects
      // that are being exported.
      namespace = "";
      var nsPkg = openPkg || pkg;
      var exports = csv(pkg.exports);
      for (var i = 0; name = exports[i]; i++) {
        var fullName = pkg.name + "." + name;
        nsPkg.namespace += "var " + name + "=" + fullName + ";";
        namespace += "if(!" + fullName + ")" + fullName + "=" + name + ";";
      }
      _private.exports = namespace + "this._label_" + pkg.name + "();";
      
      // give objects and classes pretty toString methods
      var packageName = String2.slice(pkg, 1, -1);
      _private["_label_" + pkg.name] = function() {
        for (var name in nsPkg) {
          var object = nsPkg[name];
          if (object && object.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
            object.toString = K("[" + packageName + "." + name + "]");
          }
        }
      };
    }

    if (openPkg) return openPkg;

    function lookup(names) {
      names = names.split(".");
      var value = base2, i = 0;
      while (value && names[i] != null) {
        value = value[names[i++]];
      }
      return value;
    };
  },

  exports: "",
  imports: "",
  name: "",
  namespace: "",
  parent: null,

  open: function(_private, _public) {
    _public.name   = this.name;
    _public.parent = this.parent;
    return new Package(_private, _public);
  },  

  addName: function(name, value) {
    if (!this[name]) {
      this[name] = value;
      this.exports += "," + name;
      this.namespace += format("var %1=%2.%1;", name, this.name);
      if (value && value.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
        value.toString = K("[" + String2.slice(this, 1, -1) + "." + name + "]");
      }
    }
  },

  addPackage: function(name) {
    var package = new Package(null, {name: name, parent: this});
    this.addName(name, package);
    return package;
  },

  toString: function() {
    return format("[%1]", this.parent ? String2.slice(this.parent, 1, -1) + "." + this.name : this.name);
  }
});

// =========================================================================
// base2/Abstract.js
// =========================================================================

// Not very exciting this.

var Abstract = Base.extend({
  constructor: function() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

var Module = Abstract.extend(null, {
  namespace: "",

  extend: function(_interface, _static) {
    // Extend a module to create a new module.
    var module = this.base();
    var index = _moduleCount++;
    module.namespace = "";
    module.partial = this.partial;
    module.toString = K("[base2.Module[" + index + "]]");
    Module[index] = module;
    // Inherit class methods.
    module.implement(this);
    // Implement module (instance AND static) methods.
    if (_interface) module.implement(_interface);
    // Implement static properties and methods.
    if (_static) {
      extend(module, _static);
      if (module.init) module.init();
    }
    return module;
  },

  forEach: function(block, context) {
    _Function_forEach (Module, this.prototype, function(method, name) {
      if (typeOf(method) == "function") {
        block.call(context, this[name], name, this);
      }
    }, this);
  },

  implement: function(_interface) {
    var module = this;
    var id = module.toString().slice(1, -1);
    if (typeof _interface == "function") {
      if (!_ancestorOf(_interface, module)) {
        this.base(_interface);
      }
      if (_ancestorOf(Module, _interface)) {
        // Implement static methods.
        for (var name in _interface) {
          if (typeof module[name] == "undefined") {
            var property = _interface[name];
            if (typeof property == "function" && property.call && _interface.prototype[name]) {
              property = _createStaticModuleMethod(_interface, name);
            }
            module[name] = property;
          }
        }
        module.namespace += _interface.namespace.replace(/base2\.Module\[\d+\]/g, id);
      }
    } else {
      // Add static interface.
      extend(module, _interface);
      // Add instance interface.
      _extendModule(module, _interface);
    }
    return module;
  },

  partial: function() {
    var module = Module.extend();
    var id = module.toString().slice(1, -1);
    // partial methods are already bound so remove the binding to speed things up
    module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
    this.forEach(function(method, name) {
      module[name] = partial(bind(method, module));
    });
    return module;
  }
});


Module.prototype.base =
Module.prototype.extend = _IGNORE;

function _extendModule(module, _interface) {
  var proto = module.prototype;
  var id = module.toString().slice(1, -1);
  for (var name in _interface) {
    var property = _interface[name], namespace = "";
    if (!proto[name]) {
      if (name == name.toUpperCase()) {
        namespace = "var " + name + "=" + id + "." + name + ";";
      } else if (typeof property == "function" && property.call) {
        namespace = "var " + name + "=base2.lang.bind('" + name + "'," + id + ");";
        proto[name] = _createModuleMethod(module, name);
        ;;; proto[name]._module = module; // introspection
      }
      if (module.namespace.indexOf(namespace) == -1) {
        module.namespace += namespace;
      }
    }
  }
};

function _createStaticModuleMethod(module, name) {
  return function() {
    return module[name].apply(module, arguments);
  };
};

function _createModuleMethod(module, name) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
};

// =========================================================================
// base2/Enumerable.js
// =========================================================================

var Enumerable = Module.extend({
  every: function(object, test, context) {
    var result = true;
    try {
      forEach (object, function(value, key) {
        result = test.call(context, value, key, object);
        if (!result) throw StopIteration;
      });
    } catch (error) {
      if (error != StopIteration) throw error;
    }
    return !!result; // cast to boolean
  },
  
  filter: function(object, test, context) {
    var i = 0;
    return this.reduce(object, function(result, value, key) {
      if (test.call(context, value, key, object)) {
        result[i++] = value;
      }
      return result;
    }, []);
  },
  
  invoke: function(object, method) {
    // Apply a method to each item in the enumerated object.
    var args = _slice.call(arguments, 2);
    return this.map(object, typeof method == "function" ? function(item) {
      return item == null ? undefined : method.apply(item, args);
    } : function(item) {
      return item == null ? undefined : item[method].apply(item, args);
    });
  },
  
  map: function(object, block, context) {
    var result = [], i = 0;
    forEach (object, function(value, key) {
      result[i++] = block.call(context, value, key, object);
    });
    return result;
  },
  
  pluck: function(object, key) {
    return this.map(object, function(item) {
      return item == null ? undefined : item[key];
    });
  },
  
  reduce: function(object, block, result, context) {
    var initialised = arguments.length > 2;
    forEach (object, function(value, key) {
      if (initialised) { 
        result = block.call(context, result, value, key, object);
      } else { 
        result = value;
        initialised = true;
      }
    });
    return result;
  },
  
  some: function(object, test, context) {
    return !this.every(object, not(test), context);
  }
});

// =========================================================================
// base2/Map.js
// =========================================================================

// http://wiki.ecmascript.org/doku.php?id=proposals:dictionary

var _HASH = "#";

var Map = Base.extend({
  constructor: function(values) {
    if (values) this.merge(values);
  },

  clear: function() {
    for (var key in this) if (key.indexOf(_HASH) == 0) {
      delete this[key];
    }
  },

  copy: function() {
    base2.__prototyping = true; // not really prototyping but it stops [[construct]] being called
    var copy = new this.constructor;
    delete base2.__prototyping;
    for (var i in this) if (this[i] !== copy[i]) {
      copy[i] = this[i];
    }
    return copy;
  },

  forEach: function(block, context) {
    for (var key in this) if (key.indexOf(_HASH) == 0) {
      block.call(context, this[key], key.slice(1), this);
    }
  },

  get: function(key) {
    return this[_HASH + key];
  },

  getKeys: function() {
    return this.map(II);
  },

  getValues: function() {
    return this.map(I);
  },

  // Ancient browsers throw an error if we use "in" as an operator.
  has: function(key) {
    key = _HASH + key;
    /*@if (@_jscript_version < 5.5)
      return this[key] !== undefined || $Legacy.has(this, key);
    @else @*/
      return key in this;
    /*@end @*/
  },

  merge: function(values /*, value1, value2, .. ,valueN */) {
    var put = flip(this.put);
    forEach (arguments, function(values) {
      forEach (values, put, this);
    }, this);
    return this;
  },

  put: function(key, value) {
    // create the new entry (or overwrite the old entry).
    this[_HASH + key] = value;
    return value;
  },

  remove: function(key) {
    delete this[_HASH + key];
  },

  size: function() {
    // this is expensive because we are not storing the keys
    var size = 0;
    for (var key in this) if (key.indexOf(_HASH) == 0) size++;
    return size;
  },

  union: function(values) {
    return this.merge.apply(this.copy(), arguments);
  }
});

Map.implement(Enumerable);

Map.prototype.filter = function(test, context) {
  return this.reduce(function(result, value, key) {
    if (!test.call(context, value, key, this)) {
      result.remove(key);
    }
    return result;
  }, this.copy(), this);
};

// =========================================================================
// base2/Collection.js
// =========================================================================

// A Map that is more array-like (accessible by index).

// Collection classes have a special (optional) property: Item
// The Item property points to a constructor function.
// Members of the collection must be an instance of Item.

// The static create() method is responsible for all construction of collection items.
// Instance methods that add new items (add, put, insertAt, putAt) pass *all* of their arguments
// to the static create() method. If you want to modify the way collection items are 
// created then you only need to override this method for custom collections.

var _KEYS = "~";

var Collection = Map.extend({
  constructor: function(values) {
    this[_KEYS] = new Array2;
    this.base(values);
  },
  
  add: function(key, item) {
    // Duplicates not allowed using add().
    // But you can still overwrite entries using put().
    if (this.has(key)) throw "Duplicate key '" + key + "'.";
    return this.put.apply(this, arguments);
  },

  clear: function() {
    this.base();
    this[_KEYS].length = 0;
  },

  copy: function() {
    var copy = this.base();
    copy[_KEYS] = this[_KEYS].copy();
    return copy;
  },

  forEach: function(block, context) {
    var keys = this[_KEYS].concat();
    var length = keys.length;
    for (var i = 0; i < length; i++) {
      block.call(context, this[_HASH + keys[i]], keys[i], this);
    }
  },

  getAt: function(index) {
    var key = this[_KEYS].item(index);
    return (key === undefined)  ? undefined : this[_HASH + key];
  },

  getKeys: function() {
    return this[_KEYS].copy();
  },

  indexOf: function(key) {
    return this[_KEYS].indexOf(String(key));
  },

  insertAt: function(index, key, item) {
    if (this[_KEYS].item(index) == null) throw "Index out of bounds.";
    if (this.has(key)) throw "Duplicate key '" + key + "'.";
    this[_KEYS].insertAt(index, String(key));
    this[_HASH + key] = null; // placeholder
    return this.put.apply(this, _slice.call(arguments, 1));
  },

  item: function(keyOrIndex) {
    return this[typeof keyOrIndex == "number" ? "getAt" : "get"](keyOrIndex);
  },

  put: function(key, item) {
    var klass = this.constructor;
    if (klass.Item && !instanceOf(item, klass.Item)) {
      item = klass.create.apply(klass, arguments);
    }
    if (!this.has(key)) {
      this[_KEYS].push(String(key));
    }
    this[_HASH + key] = item;
    return item;
  },

  putAt: function(index, item) {
    arguments[0] = this[_KEYS].item(index);
    if (arguments[0] == null) throw "Index out of bounds.";
    return this.put.apply(this, arguments);
  },

  remove: function(key) {
    // The remove() method of the Array object can be slow so check if the key exists first.
    if (this.has(key)) {
      this[_KEYS].remove(String(key));
      delete this[_HASH + key];
    }
  },

  removeAt: function(index) {
    var key = this[_KEYS].item(index);
    if (key !== undefined) {
      this[_KEYS].removeAt(index);
      delete this[_HASH + key];
    }
  },

  reverse: function() {
    this[_KEYS].reverse();
    return this;
  },

  size: function() {
    return this[_KEYS].length;
  },

  slice: function(start, end) {
    var sliced = this.copy();
    if (arguments.length > 0) {
      var keys = this[_KEYS], removed = keys;
      sliced[_KEYS] = Array2(_slice.apply(keys, arguments));
      if (sliced[_KEYS].length) {
        removed = removed.slice(0, start);
        if (arguments.length > 1) {
          removed = removed.concat(keys.slice(end));
        }
      }
      for (var i = 0; i < removed.length; i++) {
        delete sliced[_HASH + removed[i]];
      }
    }
    return sliced;
  },

  sort: function(compare) { // optimised (refers to _HASH)
    if (compare) {
      this[_KEYS].sort(bind(function(key1, key2) {
        return compare(this[_HASH + key1], this[_HASH + key2], key1, key2);
      }, this));
    } else this[_KEYS].sort();
    return this;
  },

  toString: function() {
    return "(" + (this[_KEYS] || "") + ")";
  }
}, {
  Item: null, // If specified, all members of the collection must be instances of Item.
  
  create: function(key, item) {
    return this.Item ? new this.Item(key, item) : item;
  },
  
  extend: function(_instance, _static) {
    var klass = this.base(_instance);
    klass.create = this.create;
    if (_static) extend(klass, _static);
    if (!klass.Item) {
      klass.Item = this.Item;
    } else if (typeof klass.Item != "function") {
      klass.Item = (this.Item || Base).extend(klass.Item);
    }
    if (klass.init) klass.init();
    return klass;
  }
});

// =========================================================================
// base2/RegGrp.js
// =========================================================================

// A collection of regular expressions and their associated replacement values.
// A Base class for creating parsers.

var _RG_BACK_REF        = /\\(\d+)/g,
    _RG_ESCAPE_CHARS    = /\\./g,
    _RG_ESCAPE_BRACKETS = /\(\?[:=!]|\[[^\]]+\]/g,
    _RG_BRACKETS        = /\(/g,
    _RG_LOOKUP          = /\$(\d+)/,
    _RG_LOOKUP_SIMPLE   = /^\$\d+$/;

var RegGrp = Collection.extend({
  constructor: function(values, ignoreCase) {
    this.base(values);
    this.ignoreCase = !!ignoreCase;
  },

  ignoreCase: false,

  exec: function(string, override) { // optimised (refers to _HASH/_KEYS)
    string += ""; // type-safe
    var items = this, keys = this[_KEYS];
    if (!keys.length) return string;
    if (override == RegGrp.IGNORE) override = 0;
    return string.replace(new RegExp(this, this.ignoreCase ? "gi" : "g"), function(match) {
      var item, offset = 1, i = 0;
      // Loop through the RegGrp items.
      while ((item = items[_HASH + keys[i++]])) {
        var next = offset + item.length + 1;
        if (arguments[offset]) { // do we have a result?
          var replacement = override == null ? item.replacement : override;
          switch (typeof replacement) {
            case "function":
              return replacement.apply(items, _slice.call(arguments, offset, next));
            case "number":
              return arguments[offset + replacement];
            default:
              return replacement;
          }
        }
        offset = next;
      }
      return match;
    });
  },

  insertAt: function(index, expression, replacement) {
    if (instanceOf(expression, RegExp)) {
      arguments[1] = expression.source;
    }
    return this.base.apply(this, arguments);
  },

  test: function(string) {
    // The slow way to do it. Hopefully, this isn't called too often. :-)
    return this.exec(string) != string;
  },
  
  toString: function() {
    var offset = 1;
    return "(" + this.map(function(item) {
      // Fix back references.
      var expression = (item + "").replace(_RG_BACK_REF, function(match, index) {
        return "\\" + (offset + Number(index));
      });
      offset += item.length + 1;
      return expression;
    }).join(")|(") + ")";
  }
}, {
  IGNORE: "$0",
  
  init: function() {
    forEach ("add,get,has,put,remove".split(","), function(name) {
      this[name] = _override(this, name, function(expression) {
        if (instanceOf(expression, RegExp)) {
          arguments[0] = expression.source;
        }
        return this.base.apply(this, arguments);
      });
    }, this.prototype);
  },
  
  Item: {
    constructor: function(expression, replacement) {
      if (replacement == null) replacement = RegGrp.IGNORE;
      else if (replacement.replacement != null) replacement = replacement.replacement;
      else if (typeof replacement != "function") replacement = String(replacement);
      
      // does the pattern use sub-expressions?
      if (typeof replacement == "string" && _RG_LOOKUP.test(replacement)) {
        // a simple lookup? (e.g. "$2")
        if (_RG_LOOKUP_SIMPLE.test(replacement)) {
          // store the index (used for fast retrieval of matched strings)
          replacement = parseInt(replacement.slice(1), 10);
        } else { // a complicated lookup (e.g. "Hello $2 $1")
          // build a function to do the lookup
          // Improved version by Alexei Gorkov:
          var Q = '"';
          replacement = replacement
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\x22")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\$(\d+)/g, Q + "+(arguments[$1]||" + Q+Q + ")+" + Q)
            .replace(/(['"])\1\+(.*)\+\1\1$/, "$1");
          replacement = new Function("return " + Q + replacement + Q);
        }
      }
      
      this.length = RegGrp.count(expression);
      this.replacement = replacement;
      this.toString = K(expression + "");
    },

    disabled: false,
    length: 0,
    replacement: ""
  },
  
  count: function(expression) {
    // Count the number of sub-expressions in a RegExp/RegGrp.Item.
    expression = (expression + "").replace(_RG_ESCAPE_CHARS, "").replace(_RG_ESCAPE_BRACKETS, "");
    return match(expression, _RG_BRACKETS).length;
  }
});

// =========================================================================
// lang/package.js
// =========================================================================

var lang = {
  name:      "lang",
  version:   base2.version,
  exports:   "assert,assertArity,assertType,bind,copy,extend,forEach,format,instanceOf,match,pcopy,rescape,trim,typeOf",
  namespace: "" // Fixed later.
};

// =========================================================================
// lang/assert.js
// =========================================================================

function assert(condition, message, ErrorClass) {
  if (!condition) {
    throw new (ErrorClass || Error)(message || "Assertion failed.");
  }
};

function assertArity(args, arity, message) {
  if (arity == null) arity = args.callee.length; //-@DRE
  if (args.length < arity) {
    throw new SyntaxError(message || "Not enough arguments.");
  }
};

function assertType(object, type, message) {
  if (type && (typeof type == "function" ? !instanceOf(object, type) : typeOf(object) != type)) {
    throw new TypeError(message || "Invalid type.");
  }
};

// =========================================================================
// lang/copy.js
// =========================================================================

function copy(object) { // A quick copy.
  var copy = {};
  for (var i in object) {
    copy[i] = object[i];
  }
  return copy;
};

function pcopy(object) { // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy;
};

function _dummy(){};

// =========================================================================
// lang/extend.js
// =========================================================================

function extend(object, source) { // or extend(object, key, value)
  if (object && source) {
    var useProto = base2.__prototyping;
    if (arguments.length > 2) { // Extending with a key/value pair.
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    //var proto = (typeof source == "function" ? Function : Object).prototype;
    var proto = global[(typeof source == "function" ? "Function" : "Object")].prototype;
    // Add constructor, toString etc
    if (useProto) {
      var i = _HIDDEN.length, key;
      while ((key = _HIDDEN[--i])) {
        var value = source[key];
        if (value != proto[key]) {
          if (_BASE.test(value)) {
            object[key] = _override(object, key, value);
          } else {
            object[key] = value;
          }
        }
      }
    }
    // Copy each of the source object's properties to the target object.
    for (key in source) {
      if (typeof proto[key] == "undefined") {
        value = source[key];
        if (value != _IGNORE) {
          // Check for method overriding.
          var ancestor = object[key];
          if (ancestor && typeof value == "function") {
            if (value != ancestor) {
              if (_BASE.test(value)) {
                object[key] = _override(object, key, value);
              } else {
                value.ancestor = ancestor;
                object[key] = value;
              }
            }
          } else {
            object[key] = value;
          }
        }
      }
    }
  }
  // http://www.hedgerwow.com/360/dhtml/ie6_memory_leak_fix/
  /*@if (@_jscript) {
    try {
      return object;
    } finally {
      object = null;
    }
  }
  @else @*/
    return object;
  /*@end @*/
};

function _ancestorOf(ancestor, fn) {
  // Check if a function is in another function's inheritance chain.
  while (fn) {
    if (!fn.ancestor) return false;
    fn = fn.ancestor;
    if (fn == ancestor) return true;
  }
  return false;
};

function _override(object, name, method) {
  // Return a method that overrides an existing method.
  var ancestor = object[name];
  var superObject = base2.__prototyping; // late binding for prototypes
  if (superObject && ancestor != superObject[name]) superObject = null;
  function _base() {
    var previous = this.base;
    this.base = superObject ? superObject[name] : ancestor;
    var returnValue = method.apply(this, arguments);
    this.base = previous;
    return returnValue;
  };
  _base.method = method;
  _base.ancestor = ancestor;
  // introspection (removed when packed)
  ;;; _base.toString = K(method + "");
  return _base;
};

// =========================================================================
// lang/forEach.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/07/enum/

if (typeof StopIteration == "undefined") {
  StopIteration = new Error("StopIteration");
}

function forEach(object, block, context, fn) {
  if (object == null) return;
  if (!fn) {
    if (typeof object == "function" && object.call) {
      // Functions are a special case.
      fn = Function;
    } else if (typeof object.forEach == "function" && object.forEach != forEach) {
      // The object implements a custom forEach method.
      object.forEach(block, context);
      return;
    } else if (typeof object.length == "number") {
      // The object is array-like.
      _Array_forEach(object, block, context);
      return;
    }
  }
  _Function_forEach(fn || Object, object, block, context);
};

forEach.csv = function(string, block, context) {
  forEach (csv(string), block, context);
};

// These are the two core enumeration methods. All other forEach methods
//  eventually call one of these two.

function _Array_forEach(array, block, context) {
  if (array == null) array = global;
  var length = array.length || 0, i; // preserve length
  if (typeof array == "string") {
    for (i = 0; i < length; i++) {
      block.call(context, array.charAt(i), i, array);
    }
  } else { // Cater for sparse arrays.
    for (i = 0; i < length; i++) {
    /*@if (@_jscript_version < 5.2)
      if (array[i] !== undefined && $Legacy.has(array, i))
    @else @*/
      if (i in array)
    /*@end @*/
        block.call(context, array[i], i, array);
    }
  }
};

function _Function_forEach(fn, object, block, context) {
  // http://code.google.com/p/base2/issues/detail?id=10
  // Run the test for Safari's buggy enumeration.
  var Temp = function(){this.i=1};
  Temp.prototype = {i:1};
  var count = 0;
  for (var i in new Temp) count++;

  // Overwrite the main function the first time it is called.
  _Function_forEach = count > 1 ? function(fn, object, block, context) {
    // Safari fix (pre version 3)
    var processed = {};
    for (var key in object) {
      if (!processed[key] && fn.prototype[key] === undefined) {
        processed[key] = true;
        block.call(context, object[key], key, object);
      }
    }
  } : function(fn, object, block, context) {
    // Enumerate an object and compare its keys with fn's prototype.
    for (var key in object) {
      if (typeof fn.prototype[key] == "undefined") {
        block.call(context, object[key], key, object);
      }
    }
  };

  _Function_forEach(fn, object, block, context);
};

// =========================================================================
// lang/instanceOf.js
// =========================================================================

function instanceOf(object, klass) {
  // Handle exceptions where the target object originates from another frame.
  // This is handy for JSON parsing (amongst other things).
  
  if (typeof klass != "function") {
    throw new TypeError("Invalid 'instanceOf' operand.");
  }

  if (object == null) return false;
   
  if (object.constructor == klass) return true;
  if (klass.ancestorOf) return klass.ancestorOf(object.constructor);
  /*@if (@_jscript_version < 5.1)
    // do nothing
  @else @*/
    if (object instanceof klass) return true;
  /*@end @*/

  // If the class is a base2 class then it would have passed the test above.
  if (Base.ancestorOf == klass.ancestorOf) return false;
  
  // base2 objects can only be instances of Object.
  if (Base.ancestorOf == object.constructor.ancestorOf) return klass == Object;
  
  switch (klass) {
    case Array:
      return _toString.call(object) == "[object Array]";
    case Date:
      return _toString.call(object) == "[object Date]";
    case RegExp:
      return _toString.call(object) == "[object RegExp]";
    case Function:
      return typeOf(object) == "function";
    case String:
    case Number:
    case Boolean:
      return typeOf(object) == typeof klass.prototype.valueOf();
    case Object:
      return true;
  }
  
  return false;
};

var _toString = Object.prototype.toString;

// =========================================================================
// lang/typeOf.js
// =========================================================================

// http://wiki.ecmascript.org/doku.php?id=proposals:typeof

function typeOf(object) {
  var type = typeof object;
  switch (type) {
    case "object":
      return object == null
        ? "null"
        : typeof object.constructor == "function"
          && _toString.call(object) != "[object Date]"
             ? typeof object.constructor.prototype.valueOf() // underlying type
             : type;
    case "function":
      return typeof object.call == "function" ? type : "object";
    default:
      return type;
  }
};

// =========================================================================
// js/package.js
// =========================================================================

var js = {
  name:      "js",
  version:   base2.version,
  exports:   "Array2,Date2,Function2,String2",
  namespace: "", // fixed later
  
  bind: function(host) {
    var top = global;
    global = host;
    forEach.csv(this.exports, function(name2) {
      var name = name2.slice(0, -1);
      extend(host[name], this[name2]);
      this[name2](host[name].prototype); // cast
    }, this);
    global = top;
    return host;
  }
};

function _createObject2(Native, constructor, generics, extensions) {
  // Clone native objects and extend them.

  // Create a Module that will contain all the new methods.
  var INative = Module.extend();
  var id = INative.toString().slice(1, -1);
  // http://developer.mozilla.org/en/docs/New_in_JavaScript_1.6#Array_and_String_generics
  forEach.csv(generics, function(name) {
    INative[name] = unbind(Native.prototype[name]);
    INative.namespace += format("var %1=%2.%1;", name, id);
  });
  forEach (_slice.call(arguments, 3), INative.implement, INative);

  // create a faux constructor that augments the native object
  var Native2 = function() {
    return INative(this.constructor == INative ? constructor.apply(null, arguments) : arguments[0]);
  };
  Native2.prototype = INative.prototype;

  // Remove methods that are already implemented.
  for (var name in INative) {
    var method = Native[name];
    if (method && name != "prototype" && name != "toString" && method != Function.prototype[name]) {
      INative[name] = method;
      delete INative.prototype[name];
    }
    Native2[name] = INative[name];
  }
  Native2.ancestor = Object;
  delete Native2.extend;
  
  // remove "lang.bind.."
  Native2.namespace = Native2.namespace.replace(/(var (\w+)=)[^,;]+,([^\)]+)\)/g, "$1$3.$2");
  
  return Native2;
};

// =========================================================================
// js/~/Date.js
// =========================================================================

// Fix Date.get/setYear() (IE5-7)

if ((new Date).getYear() > 1900) {
  Date.prototype.getYear = function() {
    return this.getFullYear() - 1900;
  };
  Date.prototype.setYear = function(year) {
    return this.setFullYear(year + 1900);
  };
}

// https://bugs.webkit.org/show_bug.cgi?id=9532

var _testDate = new Date(Date.UTC(2006, 1, 20));
_testDate.setUTCDate(15);
if (_testDate.getUTCHours() != 0) {
  forEach.csv("FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds", function(type) {
    extend(Date.prototype, "setUTC" + type, function() {
      var value = this.base.apply(this, arguments);
      if (value >= 57722401000) {
        value -= 3600000;
        this.setTime(value);
      }
      return value;
    });
  });
}

// =========================================================================
// js/~/Function.js
// =========================================================================

// Some browsers don't define this.
Function.prototype.prototype = {};

// =========================================================================
// js/~/String.js
// =========================================================================

// A KHTML bug.
if ("".replace(/^/, K("$$")) == "$") {
  extend(String.prototype, "replace", function(expression, replacement) {
    if (typeof replacement == "function") {
      var fn = replacement;
      replacement = function() {
        return String(fn.apply(null, arguments)).split("$").join("$$");
      };
    }
    return this.base(expression, replacement);
  });
}

// =========================================================================
// js/Array2.js
// =========================================================================

var Array2 = _createObject2(
  Array,
  Array,
  "concat,join,pop,push,reverse,shift,slice,sort,splice,unshift", // generics
  Enumerable, {
    batch: function(array, block, timeout, oncomplete, context) {
      var index = 0,
          length = array.length;
      var batch = function() {
        var now = Date2.now(), start = now, k = 0;
        while (index < length && (now - start < timeout)) {
          block.call(context, array[index], index++, array);
          if (k++ < 5 || k % 50 == 0) now = Date2.now();
        }
        if (index < length) {
          setTimeout(batch, 10);
        } else {
          if (oncomplete) oncomplete.call(context);
        }
      };
      setTimeout(batch, 1);
    },

    combine: function(keys, values) {
      // Combine two arrays to make a hash.
      if (!values) values = keys;
      return Array2.reduce(keys, function(hash, key, index) {
        hash[key] = values[index];
        return hash;
      }, {});
    },

    contains: function(array, item) {
      return Array2.indexOf(array, item) != -1;
    },

    copy: function(array) {
      var copy = _slice.call(array);
      if (!copy.swap) Array2(copy); // cast to Array2
      return copy;
    },

    flatten: function(array) {
      var i = 0;
      var flatten = function(result, item) {
        if (Array2.like(item)) {
          Array2.reduce(item, flatten, result);
        } else {
          result[i++] = item;
        }
        return result;
      };
      return Array2.reduce(array, flatten, []);
    },
    
    forEach: _Array_forEach,
    
    indexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = 0;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i < length; i++) {
        if (array[i] === item) return i;
      }
      return -1;
    },
    
    insertAt: function(array, index, item) {
      Array2.splice(array, index, 0, item);
    },
    
    item: function(array, index) {
      if (index < 0) index += array.length; // starting from the end
      return array[index];
    },
    
    lastIndexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = length - 1;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i >= 0; i--) {
        if (array[i] === item) return i;
      }
      return -1;
    },
  
    map: function(array, block, context) {
      var result = [];
      _Array_forEach (array, function(item, index) {
        result[index] = block.call(context, item, index, array);
      });
      return result;
    },

    remove: function(array, item) {
      var index = Array2.indexOf(array, item);
      if (index != -1) Array2.removeAt(array, index);
    },

    removeAt: function(array, index) {
      Array2.splice(array, index, 1);
    },

    swap: function(array, index1, index2) {
      if (index1 < 0) index1 += array.length; // starting from the end
      if (index2 < 0) index2 += array.length;
      var temp = array[index1];
      array[index1] = array[index2];
      array[index2] = temp;
      return array;
    }
  }
);

Array2.forEach = _Array_forEach;
Array2.reduce = Enumerable.reduce; // Mozilla does not implement the thisObj argument

Array2.like = function(object) {
  // is the object like an array?
  return typeOf(object) == "object" && typeof object.length == "number";
};

// introspection (removed when packed)
;;; Enumerable["#implemented_by"].pop();
;;; Enumerable["#implemented_by"].push(Array2);

// =========================================================================
// js/Date2.js
// =========================================================================

// http://developer.mozilla.org/es4/proposals/date_and_time.html

// big, ugly, regular expression
var _DATE_PATTERN = /^((-\d+|\d{4,})(-(\d{2})(-(\d{2}))?)?)?T((\d{2})(:(\d{2})(:(\d{2})(\.(\d{1,3})(\d)?\d*)?)?)?)?(([+-])(\d{2})(:(\d{2}))?|Z)?$/;
var _DATE_PARTS = { // indexes to the sub-expressions of the RegExp above
  FullYear: 2,
  Month: 4,
  Date: 6,
  Hours: 8,
  Minutes: 10,
  Seconds: 12,
  Milliseconds: 14
};
var _TIMEZONE_PARTS = { // idem, but without the getter/setter usage on Date object
  Hectomicroseconds: 15, // :-P
  UTC: 16,
  Sign: 17,
  Hours: 18,
  Minutes: 20
};

//var _TRIM_ZEROES   = /(((00)?:0+)?:0+)?\.0+$/;
//var _TRIM_TIMEZONE = /(T[0-9:.]+)$/;

var Date2 = _createObject2(
  Date, 
  function(yy, mm, dd, h, m, s, ms) {
    switch (arguments.length) {
      case 0: return new Date;
      case 1: return typeof yy == "string" ? new Date(Date2.parse(yy)) : new Date(yy.valueOf());
      default: return new Date(yy, mm, arguments.length == 2 ? 1 : dd, h || 0, m || 0, s || 0, ms || 0);
    }
  }, "", {
    toISOString: function(date) {
      var string = "####-##-##T##:##:##.###";
      for (var part in _DATE_PARTS) {
        string = string.replace(/#+/, function(digits) {
          var value = date["getUTC" + part]();
          if (part == "Month") value++; // js month starts at zero
          return ("000" + value).slice(-digits.length); // pad
        });
      }
      //// remove trailing zeroes, and remove UTC timezone, when time's absent
      //return string.replace(_TRIM_ZEROES, "").replace(_TRIM_TIMEZONE, "$1Z");
      return string + "Z";
    }
  }
);

delete Date2.forEach;

Date2.now = function() {
  return (new Date).valueOf(); // milliseconds since the epoch
};

Date2.parse = function(string, defaultDate) {
  if (arguments.length > 1) {
    assertType(defaultDate, "number", "Default date should be of type 'number'.")
  }
  // parse ISO date
  var parts = match(string, _DATE_PATTERN);
  if (parts.length) {
    var month = parts[_DATE_PARTS.Month];
    if (month) parts[_DATE_PARTS.Month] = String(month - 1); // js months start at zero
    // round milliseconds on 3 digits
    if (parts[_TIMEZONE_PARTS.Hectomicroseconds] >= 5) parts[_DATE_PARTS.Milliseconds]++;
    var utc = parts[_TIMEZONE_PARTS.UTC] || parts[_TIMEZONE_PARTS.Hours] ? "UTC" : "";
    var date = new Date(defaultDate || 0);
    if (parts[_DATE_PARTS.Date]) date["set" + utc + "Date"](14);
    for (var part in _DATE_PARTS) {
      var value = parts[_DATE_PARTS[part]];
      if (value) {
        // set a date part
        date["set" + utc + part](value);
        // make sure that this setting does not overflow
        if (date["get" + utc + part]() != parts[_DATE_PARTS[part]]) {
          return NaN;
        }
      }
    }
    // timezone can be set, without time being available
    // without a timezone, local timezone is respected
    if (parts[_TIMEZONE_PARTS.Hours]) {
      var hours = Number(parts[_TIMEZONE_PARTS.Sign] + parts[_TIMEZONE_PARTS.Hours]);
      var minutes = Number(parts[_TIMEZONE_PARTS.Sign] + (parts[_TIMEZONE_PARTS.Minutes] || 0));
      date.setUTCMinutes(date.getUTCMinutes() + (hours * 60) + minutes);
    }
    return date.valueOf();
  } else {
    return Date.parse(string);
  }
};

// =========================================================================
// js/String2.js
// =========================================================================

var String2 = _createObject2(
  String, 
  function(string) {
    return new String(arguments.length == 0 ? "" : string);
  },
  "charAt,charCodeAt,concat,indexOf,lastIndexOf,match,replace,search,slice,split,substr,substring,toLowerCase,toUpperCase",
  {
    csv: csv,
    format: format,
    rescape: rescape,
    trim: trim
  }
);

delete String2.forEach;

// http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim(string) {
  return String(string).replace(_LTRIM, "").replace(_RTRIM, "");
};

function csv(string) {
  return string ? (string + "").split(/\s*,\s*/) : [];
};

function format(string) {
  // Replace %n with arguments[n].
  // e.g. format("%1 %2%3 %2a %1%3", "she", "se", "lls");
  // ==> "she sells sea shells"
  // Only %1 - %9 supported.
  var args = arguments;
  var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
  return (string + "").replace(pattern, function(match, index) {
    return args[index];
  });
};

function match(string, expression) {
  // Same as String.match() except that this function will return an
  // empty array if there is no match.
  return (string + "").match(expression) || [];
};

function rescape(string) {
  // Make a string safe for creating a RegExp.
  return (string + "").replace(_RESCAPE, "\\$1");
};

// =========================================================================
// js/Function2.js
// =========================================================================

var Function2 = _createObject2(
  Function,
  Function,
  "", {
    I: I,
    II: II,
    K: K,
    bind: bind,
    compose: compose,
    delegate: delegate,
    flip: flip,
    not: not,
    partial: partial,
    unbind: unbind
  }
);

function I(i) { // Return first argument.
  return i;
};

function II(i, ii) { // Return second argument.
  return ii;
};

function K(k) {
  return function() {
    return k;
  };
};

function bind(fn, context) {
  var lateBound = typeof fn != "function";
  if (arguments.length > 2) {
    var args = _slice.call(arguments, 2);
    return function() {
      return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
    };
  } else { // Faster if there are no additional arguments.
    return function() {
      return (lateBound ? context[fn] : fn).apply(context, arguments);
    };
  }
};

function compose() {
  var fns = _slice.call(arguments);
  return function() {
    var i = fns.length, result = fns[--i].apply(this, arguments);
    while (i--) result = fns[i].call(this, result);
    return result;
  };
};

function delegate(fn, context) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return fn.apply(context, args);
  };
};

function flip(fn) {
  return function() {
    return fn.apply(this, Array2.swap(arguments, 0, 1));
  };
};

function not(fn) {
  return function() {
    return !fn.apply(this, arguments);
  };
};

function partial(fn) { // Based on Oliver Steele's version.
  var args = _slice.call(arguments, 1);
  return function() {
    var specialised = args.concat(), i = 0, j = 0;
    while (i < args.length && j < arguments.length) {
      if (specialised[i] === undefined) specialised[i] = arguments[j++];
      i++;
    }
    while (j < arguments.length) {
      specialised[i++] = arguments[j++];
    }
    if (Array2.contains(specialised, undefined)) {
      specialised.unshift(fn);
      return partial.apply(null, specialised);
    }
    return fn.apply(this, specialised);
  };
};

function unbind(fn) {
  return function(context) {
    return fn.apply(context, _slice.call(arguments, 1));
  };
};

// =========================================================================
// base2/init.js
// =========================================================================

base2 = global.base2 = new Package(this, base2);
base2.toString = K("[base2]"); // hide private data here

var _exports = this.exports;

lang = new Package(this, lang);
_exports += this.exports;

js = new Package(this, js);
eval(_exports + this.exports);

lang.extend = extend;

// legacy support
base2.JavaScript = pcopy(js);
base2.JavaScript.namespace += "var JavaScript=js;";

// Node.js support
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = base2;
  }
  exports.base2 = base2;
} 

}; ////////////////////  END: CLOSURE  /////////////////////////////////////

},{}],2:[function(require,module,exports){
(function (global){
var miruken = require('./miruken.js'),
    Promise = require('bluebird');

new function () { // closure

    /**
     * @namespace miruken.callback
     */
    var callback = new base2.Package(this, {
        name:    "callback",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken",
        exports: "CallbackHandler,CallbackHandlerDecorator,CallbackHandlerFilter,CallbackHandlerAspect,CascadeCallbackHandler,CompositeCallbackHandler,ConditionalCallbackHandler,AcceptingCallbackHandler,ProvidingCallbackHandler,MethodCallbackHandler,InvocationOptions,Resolution,HandleMethod,getEffectivePromise,$handle,$expand,$define,$provide,$lookup,$NOT_HANDLED"
    });

    eval(this.imports);

    var _definitions = {},
        $handle      = $define('$handle',  Variance.Contravariant),
        $provide     = $define('$provide', Variance.Covariant),
        $lookup      = $define('$lookup' , Variance.Invariant),
        $NOT_HANDLED = {};

    /**
     * @protocol {InternalCallback}
     */
    var InternalCallback = Protocol.extend();

    /**
     * @class $expand
     * Metamacro to expand registered definitions.
     */
    var $expand = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            if ($isNothing(definition)) {
                return;
            }
            var clazz = metadata.getClass();
            if (target === clazz.prototype) {
                target = clazz;
            }
            for (tag in _definitions) {
                var list = null;
                if (definition.hasOwnProperty(tag)) {
                    list = definition[tag];
                    delete definition[tag];
                }
                if ($isFunction(list)) {
                    list = list();
                }
                if (!list || list.length == 0) {
                    continue;
                }
                var define = _definitions[tag];
                for (var idx = 0; idx < list.length; ++idx) {
                    var constraint = list[idx];
                    if (++idx >= list.length) {
                        throw new Error(lang.format(
                            "Incomplete '%1' definition: missing handler for constraint %2.",
                            tag, constraint));
                        }
                    define(target, constraint, list[idx]);
                }
            }
        },
        shouldInherit: True,
        isActive: True
    });

    /**
     * @class {HandleMethod}
     */
    var HandleMethod = Base.extend({
        constructor: function (protocol, methodName, args, strict) {
            if (protocol && !$isProtocol(protocol)) {
                throw new TypeError("Invalid protocol supplied.");
            }
            var _returnValue, _exception;
            this.extend({
                getProtocol:    function () { return protocol; },
                getMethodName:  function () { return methodName; },
                getArguments:   function () { return args; },
                getReturnValue: function () { return _returnValue; },
                setReturnValue: function (value) { _returnValue = value; },
                getException:   function () { return _exception; },
                invokeOn:       function (target, composer) {
                    if (!target || (strict && protocol && !protocol.adoptedBy(target))) {
                        return false;
                    }
                    var method = target[methodName];
                    if (!$isFunction(method)) {
                        return false;
                    }
                    try {
                        var oldComposer  = global.$composer;
                        global.$composer = composer;
                        var result = method.apply(target, args.slice(0));
                        if (result === $NOT_HANDLED) {
                            return false;
                        }
                        if (_returnValue === undefined) {
                            _returnValue = result;
                        }
                    } catch(exception) {
                        if (_returnValue === undefined && _exception === undefined) {
                            _exception = exception;
                        }
                        throw exception;
                    } finally {
                        if (oldComposer) {
                            global.$composer = oldComposer;
                        } else {
                            delete global.$composer;
                        }
                    }
                    return true;
                }
            });
        }
    });

    /**
     * @class {Lookup}
     */
    var Lookup = Base.extend({
            constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _results = [],
                _instant = $instant.test(key);
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
                getResults: function () { return _results; },
                addResult: function (result) {
                    if (!(_instant && $isPromise(result))) {
                        _results.push(result);
                    }
                }
            });
        }
    });

    /**
     * @class {Deferred}
     */
    var Deferred = Base.extend({
        constructor: function (callback, many) {
            if ($isNothing(callback)) {
                throw new TypeError("The callback is required.");
            }
            many = !!many;
            var _pending = [];
            this.extend({
                isMany: function () { return many; },
                getCallback: function () { return callback; },
                getPending: function () { return _pending; },
                track: function (result) {
                    if ($isPromise(result)) {
                        _pending.push(result);
                    }
                }
            });
        }
    });

    /**
     * @class {Resolution}
     */
    var Resolution = Base.extend({
        constructor: function (key, many) {
            if ($isNothing(key)) {
                throw new TypeError("The key is required.");
            }
            many = !!many;
            var _resolutions = [],
                _instant     = $instant.test(key);
            this.extend({
                getKey: function () { return key; },
                isMany: function () { return many; },
                getResolutions: function () { return _resolutions; },
                resolve: function (resolution) {
                    if (!(_instant && $isPromise(resolution))) {
                        _resolutions.push(resolution);
                    }
                }
            });
        }
    });

    /**
     * @class {CallbackHandler}
     */
    var CallbackHandler = Base.extend($expand, {
        constructor: function (delegate) {
            this.extend({
                getDelegate : function () { return delegate; }
            });
        },
        getDelegate: function () { return null; },
        /**
         * Handles the callback.
         * @param   {Object}          callback    - any callback
         * @param   {Boolean}         greedy      - true of handle greedily
         * @param   {CallbackHandler} [composer]  - initiated the handle for composition
         * @returns {Boolean} true if the callback was handled, false otherwise.
         */
        handle: function (callback, greedy, composer) {
            return !$isNothing(callback) &&
                   !!this.handleCallback(callback, !!greedy, composer || this);
        },
        handleCallback: function (callback, greedy, composer) {
            return $handle.dispatch(this, callback, null, composer, greedy);
        },
        $handle:[
            Lookup, function (lookup, composer) {
                return $lookup.dispatch(this, lookup,lookup.getKey(), composer, 
                                        lookup.isMany(), lookup.addResult);
            },
            Deferred, function (deferred, composer) {
                return $handle.dispatch(this, deferred.getCallback(), null, composer,
                                        deferred.isMany(), deferred.track);
            },
            Resolution, function (resolution, composer) {
                var key      = resolution.getKey(),
                    many     = resolution.isMany(),
                    resolved = $provide.dispatch(this, resolution, key, composer, many, resolution.resolve);
                if (!resolved) { // check if delegate or handler implicitly satisfy key
                    var implied  = new _Node(key),
                        delegate = this.getDelegate();
                    if (delegate && implied.match($classOf(delegate), Variance.Contravariant)) {
                        resolution.resolve(delegate);
                        resolved = true;
                    }
                    if ((!resolved || many) && implied.match($classOf(this), Variance.Contravariant)) {
                        resolution.resolve(this);
                        resolved = true;
                    }
                }
                return resolved;
            },
            HandleMethod, function (method, composer) {
                return method.invokeOn(this.getDelegate(), composer) || method.invokeOn(this, composer);
            }
        ],
        toDelegate: function () { return new InvocationDelegate(this); }
    }, {
        coerce: function (object) { return new this(object); }
    });

    Base.implement({
        toCallbackHandler: function () { return CallbackHandler(this); }
    });

    /**
     * @class {CallbackHandlerDecorator}
     */
    var CallbackHandlerDecorator = CallbackHandler.extend({
        constructor: function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            this.extend({
                getDecoratee: function () { return decoratee; },
                setDecoratee: function (value) {
                    decoratee = value.toCallbackHandler();
                },
                handleCallback: function (callback, greedy, composer) {
                    return this.getDecoratee().handle(callback, greedy, composer)
                        || this.base(callback, greedy, composer);
                }
            });
            this.setDecoratee(decoratee);
        }
    });

    /**
     * @class {CallbackHandlerFilter}
     */
    var CallbackHandlerFilter = CallbackHandlerDecorator.extend({
        constructor: function (decoratee, filter) {
            this.base(decoratee);
            if ($isNothing(filter)) {
                throw new TypeError("No filter specified.");
            } else if (!$isFunction(filter)) {
                throw new TypeError(lang.format("Invalid filter: %1 is not a function.", filter));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    var decoratee = this.getDecoratee();
                    if (InternalCallback.adoptedBy(callback)) {
                        return decoratee.handle(callback, greedy);
                    }
                    if (composer == this) {
                        composer = decoratee;
                    }
                    return filter(callback, composer, function () {
                        return decoratee.handle(callback, greedy);
                    })
                }});
        }
    });

    /**
     * @class {CallbackHandlerAspect}
     */
    var CallbackHandlerAspect = CallbackHandlerFilter.extend({
        constructor: function (decoratee, before, after) {
            this.base(decoratee, function (callback, composer, proceed) {
                var promise;
                if ($isFunction(before) && before(callback, composer) === false) {
                    return true;
                }
                try {
                    var handled = proceed();
                    if (handled && (promise = getEffectivePromise(callback))) {
                        // Use 'fulfilled' or 'rejected' handlers instead of 'finally' to ensure
                        // aspect boundary is consistent with synchronous invocations and avoid
                        // reentrancy issues.
                        if ($isFunction(after))
                            promise.then(function (result) {
                                after(callback, composer);
                            }, function (error) {
                                after(callback, composer);
                            });
                        return handled;
                    }
                } finally {
                    if (!promise && $isFunction(after)) {
                        after(callback, composer);
                    }
                }
            });
        }
    });

    /**
     * @class {CascadeCallbackHandler}
     */
    var CascadeCallbackHandler = CallbackHandler.extend({
        constructor: function (handler, cascadeToHandler) {
            if ($isNothing(handler)) {
                throw new TypeError("No handler specified.");
            } else if ($isNothing(cascadeToHandler)) {
                throw new TypeError("No cascadeToHandler specified.");
            }
            handler          = handler.toCallbackHandler();
            cascadeToHandler = cascadeToHandler.toCallbackHandler();
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    var handled = greedy
                        ? (handler.handle(callback, true, composer)
                           | cascadeToHandler.handle(callback, true, composer))
                        : (handler.handle(callback, false, composer)
                           || cascadeToHandler.handle(callback, false, composer));
                    if (!handled || greedy) {
                        handled = this.base(callback, greedy, composer) || handled;
                    }
                    return !!handled;
                }
            });
        }
    });

    /**
     * @class {CompositeCallbackHandler}
     */
    var CompositeCallbackHandler = CallbackHandler.extend({
        constructor: function () {
            var _handlers = new Array2;
            this.extend({
                getHandlers: function () { return _handlers.copy(); },
                addHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (handler) {
                            _handlers.push(handler.toCallbackHandler());
                        }
                    });
                    return this;
                },
                removeHandlers: function () {
                    Array2.flatten(arguments).forEach(function (handler) {
                        if (!handler) {
                            return;
                        }
                        var count = _handlers.length;
                        for (var idx = 0; idx < count; ++idx) {
                            var testHandler = _handlers[idx];
                            if (testHandler == handler || testHandler.getDelegate() == handler) {
                                _handlers.removeAt(idx);
                                return;
                            }
                        }
                    });
                    return this;
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = false,
                        count   = _handlers.length;
                    for (var idx = 0; idx < count; ++idx) {
                        var handler = _handlers[idx];
                        if (handler.handle(callback, greedy, composer)) {
                            if (!greedy) {
                                return true;
                            }
                            handled = true;
                        }
                    }
                    if (!handled || greedy) {
                        handled = this.base(callback, greedy, composer) || handled;
                    }
                    return handled;
                }
            });
            this.addHandlers(arguments);
        }
    });

    /**
     * @class {ConditionalCallbackHandler}
     */
    var ConditionalCallbackHandler = CallbackHandlerDecorator.extend({
        constructor: function (decoratee, condition) {
            this.base(decoratee);
            if ($isNothing(condition)) {
                throw new TypeError("No condition specified.");
            } else if (!$isFunction(condition)) {
                throw new TypeError(lang.format(
                    "Invalid condition: %1 is not a function.", condition));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    return condition(callback)
                         ? this.base(callback, greedy, composer)
                         : false;
                }
            });
        }
    });

    /**
     * @class {AcceptingCallbackHandler}
     */
    var AcceptingCallbackHandler = CallbackHandler.extend({
        constructor: function (handler, constraint) {
            $handle(this, constraint, handler);
        }
    });

    if (Function.prototype.accepting === undefined)
        Function.prototype.accepting = function (constraint) {
            return new AcceptingCallbackHandler(this, constraint);
        };

    CallbackHandler.accepting = function (handler, constraint) {
        return new AcceptingCallbackHandler(handler, constraint);
    };

    /**
     * @class {ProvidingCallbackHandler}
     */
    var ProvidingCallbackHandler = CallbackHandler.extend({
        constructor: function (provider, constraint) {
            $provide(this, constraint, provider);
        }
    });

    if (Function.prototype.providing === undefined)
        Function.prototype.providing = function (constraint) {
            return new ProvidingCallbackHandler(this, constraint);
        };

    CallbackHandler.providing = function (provider, constraint) {
        return new ProvidingCallbackHandler(provider, constraint);
    };

    /**
     * @class {MethodCallbackHandler}
     */
    var MethodCallbackHandler = CallbackHandler.extend({
        constructor: function (methodName, method) {
            if (!$isString(methodName) || methodName.length === 0 || !methodName.trim()) {
                throw new TypeError("No methodName specified.");
            } else if (!$isFunction(method)) {
                throw new TypeError(lang.format("Invalid method: %1 is not a function.", method));
            }
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    if (callback instanceof HandleMethod) {
                        var target         = new Object;
                        target[methodName] = method;
                        return callback.invokeOn(target);
                    }
                    return false;
                }
            });
        }
    });

    if (Function.prototype.implementing === undefined)
        Function.prototype.implementing = function (methodName) {
            return new MethodCallbackHandler(methodName, this);
        };

    CallbackHandler.implementing = function (methodName, method) {
        return new MethodCallbackHandler(methodName, method);
    };

    /**
     * InvocationOptions enum
     * @enum {Number}
     */
    var InvocationOptions = {
        None:        0,
        Broadcast:   1 << 0,
        BestEffort:  1 << 1,
        Strict:      1 << 2,
    };
    InvocationOptions.Notify = InvocationOptions.Broadcast | InvocationOptions.BestEffort;
    InvocationOptions = Enum(InvocationOptions);

    /**
     * @class {InvocationSemantics}
     */
    var InvocationSemantics = Base.extend(InternalCallback, {
        constructor: function (options) {
            var _options   = options || InvocationOptions.None,
                _specified = _options;
            this.extend({
                getOption: function (option) {
                    return (_options & option) === option;
                },
                setOption: function (option, enabled) {
                    if (enabled) {
                        _options = _options | option;
                    } else {
                        _options = _options & (~option);
                    }
                    _specified = _specified | option;
                },
                isSpecified: function (option) {
                    return (_specified & option) === option;
                },
                mergeInto: function (constraints) {
                    for (var index = 0; index <= 2; ++index) {
                        var option = (1 << index);
                        if (this.isSpecified(option) && !constraints.isSpecified(option)) {
                            constraints.setOption(option, this.getOption(option));
                        }
                    }
                }
            });
        }
    });

    /**
     * @class {InvocationOptionsHandler}
     */
    var InvocationOptionsHandler = CallbackHandler.extend({
        constructor: function (handler, options) {
            var semantics = new InvocationSemantics(options);
            this.extend({
                handleCallback: function (callback, greedy, composer) {
                    if (callback instanceof InvocationSemantics) {
                        semantics.mergeInto(callback);
                        return true;
                    }
                    return handler.handle(callback, greedy, composer);
                }
            });
        }
    });

    /**
     * @class {InvocationDelegate}
     */
    var InvocationDelegate = Delegate.extend({
        constructor: function (handler) {
            this.extend({
                delegate: function (protocol, methodName, args, strict) {
                    var semantics  = new InvocationSemantics();
                    handler.handle(semantics, true);
                    var broadcast    = semantics.getOption(InvocationOptions.Broadcast),
                        bestEffort   = semantics.getOption(InvocationOptions.BestEffort),
                        strict       = !!(strict | semantics.getOption(InvocationOptions.Strict)),
                        handleMethod = new HandleMethod(protocol, methodName, args, strict);
                    if (handler.handle(handleMethod, !!broadcast) === false && !bestEffort) {
                        throw new TypeError(lang.format(
                            "Object %1 has no method '%2'", handler, methodName));
                    }
                    return handleMethod.getReturnValue();
                }
            });
        }
    });

    CallbackHandler.implement({
        strict: function () { return this.callOptions(InvocationOptions.Strict); },
        broadcast: function () { return this.callOptions(InvocationOptions.Broadcast); },
        bestEffort: function () { return this.callOptions(InvocationOptions.BestEffort); },
        notify: function () { return this.callOptions(InvocationOptions.Notify); },
        callOptions: function (options) { return new InvocationOptionsHandler(this, options); }
    });

    CallbackHandler.implement({
        defer: function (callback) {
            var deferred = new Deferred(callback);
            return this.handle(deferred, false, global.$composer)
                 ? Promise.all(deferred.getPending()).return(true)
                 : Promise.resolve(false);
        },
        deferAll: function (callback) {
            var deferred = new Deferred(callback, true);
            return this.handle(deferred, true, global.$composer)
                 ? Promise.all(deferred.getPending()).return(true)
                 : Promise.resolve(false);
        },
        resolve: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key);
            if (this.handle(resolution, false, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return resolutions[0];
                }
            }
        },
        resolveAll: function (key) {
            var resolution = (key instanceof Resolution) ? key : new Resolution(key, true);
            if (this.handle(resolution, true, global.$composer)) {
                var resolutions = resolution.getResolutions();
                if (resolutions.length > 0) {
                    return $instant.test(key)
                         ? Array2.flatten(resolutions)
                         : Promise.all(resolutions).then(Array2.flatten);
                }
            }
            return [];
        },
        lookup: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key);
            if (this.handle(lookup, false, global.$composer)) {
                var results = lookup.getResults();
                if (results.length > 0) {
                    return results[0];
                }
            }
        },
        lookupAll: function (key) {
            var lookup = (key instanceof Lookup) ? key : new Lookup(key, true);
            if (this.handle(lookup, true, global.$composer)) {
                var results = lookup.getResults();
                if (results.length > 0) {
                    return $instant.test(key)
                         ? Array2.flatten(resolutions)
                         : Promise.all(results).then(Array2.flatten);
                }
            }
            return [];
        },
        filter: function (filter) {
            return new CallbackHandlerFilter(this, filter);
        },
        aspect: function (before, after) {
            return new CallbackHandlerAspect(this, before, after);
        },
        when: function (constraint) {
            var when      = new _Node(constraint),
                condition = function (callback) {
                if (callback instanceof Deferred) {
                    return when.match($classOf(callback.getCallback()), Variance.Contravariant);
                } else if (callback instanceof Resolution) {
                    return when.match(callback.getKey(), Variance.Covariant);
                } else {
                    return when.match($classOf(callback), Variance.Contravariant);
                }
            };
            return new ConditionalCallbackHandler(this, condition);
        },
        next: function () {
            switch(arguments.length) {
            case 0:  return this;
            case 1:  return new CascadeCallbackHandler(this, arguments[0])
            default: return new CompositeCallbackHandler((Array2.unshift(arguments, this), arguments));
            }
        }
    });

    /**
     * @function $define
     * Defines a new handler relationship.
     * @param    {String}   tag       - name of definition
     * @param    {Variance} variance  - variance of definition
     * @returns  {Function} function to add to definition.
     */
    function $define(tag, variance) {
        if (!$isString(tag) || tag.length === 0 || /\s/.test(tag)) {
            throw new TypeError("The tag must be a non-empty string with no whitespace.");
        } else if (_definitions[tag]) {
            throw new TypeError(lang.format("'%1' is already defined.", tag));
        }

        var handled, comparer;
        variance = variance || Variance.Contravariant;
        switch (variance) {
            case Variance.Covariant:
                handled  = _resultRequired;
                comparer = _covariantComparer; 
                break;
            case Variance.Contravariant:
                handled  = _successImplied;
                comparer = _contravariantComparer; 
                break;
            case Variance.Invariant:
                handled  = _resultRequired;
                comparer = _invariantComparer; 
                break;
            default:
                throw new Error("Variance must be Covariant, Contravariant or Invariant");
        }

        function definition(owner, constraint, handler, removed) {
            if (constraint instanceof Array) {
                return Array2.reduce(constraint, function (result, c) {
                    var undefine = _definition(owner, c, handler, removed);
                    return function (notifyRemoved) {
                        result(notifyRemoved);
                        undefine(notifyRemoved);
                    };
                }, Undefined);
            }
            return _definition(owner, constraint, handler, removed);
        }
        function _definition(owner, constraint, handler, removed) {
            if ($isNothing(owner)) {
                throw new TypeError("Definitions must have an owner.");
            } else if ($isNothing(handler)) {
                handler    = constraint;
                constraint = $classOf(Modifier.unwrap(constraint));
            }
            if ($isNothing(handler)) {
                throw new TypeError(lang.format(
                    "Incomplete '%1' definition: missing handler for constraint %2.",
                    tag, constraint));
            } else if (removed && !$isFunction(removed)) {
                throw new TypeError("The removed argument is not a function.");
            }
            if (!$isFunction(handler)) {
                if ($copy.test(handler)) {
                    var source = Modifier.unwrap(handler);
                    if (!$isFunction(source.copy)) {
                        throw new Error("$copy requires the target to have a copy method.");
                    }
                    handler = source.copy.bind(source);
                } else {
                    var source = $use.test(handler) ? Modifier.unwrap(handler) : handler;
                    handler    = $lift(source);
                }
            }
            var definitions = owner.hasOwnProperty('$miruken')
                            ? owner.$miruken : (owner.$miruken = {}),
                node        = new _Node(constraint, handler, removed),
                index       = _createIndex(node.constraint),
                list        = definitions.hasOwnProperty(tag) ? definitions[tag]
                            : definitions[tag] = new IndexedList(comparer);
            list.insert(node, index);
            return function (notifyRemoved) {
                list.remove(node);
                if (list.isEmpty()) {
                    delete definitions[tag];
                }
                if (node.removed && (notifyRemoved !== false)) {
                    node.removed(owner);
                }
            };
        };
        definition.removeAll = function (owner) {
            var definitions = owner.$miruken;
            if (definitions) {
                var list = definitions[tag],
                    head = list.head;
                while (head) {
                    if (head.removed) {
                        head.removed(owner);
                    }
                    head = head.next;
                }
                delete definitions[tag];
            }
        };
        definition.dispatch = function (handler, callback, constraint, composer, all, results) {
            var v        = variance,
                delegate = handler.getDelegate();
            constraint = constraint || callback;
            if (constraint) {
                if ($eq.test(constraint)) {
                    v = Variance.Invariant;
                }
                constraint = Modifier.unwrap(constraint);
                if (typeOf(constraint) === 'object') {
                    constraint = $classOf(constraint);
                }
            }
            var ok = _dispatch(delegate, delegate, callback, constraint, v, composer, all, results);
            if (!ok || all) {
                ok = ok || _dispatch(handler, handler, callback, constraint, v, composer, all, results);
            }
            return ok;
        };
        function _dispatch(target, owner, callback, constraint, v, composer, all, results) {
            var dispatched = false;
            while (owner && (owner !== Base) && (owner !== Object)) {
                var definitions = owner.$miruken,
                    index       = _createIndex(constraint),
                    list        = definitions && definitions[tag],
                    invariant   = (v === Variance.Invariant);
                owner = (owner === target) ? $classOf(owner) : $ancestorOf(owner);
                if (list && (!invariant || index)) {
                    var node = list.getIndex(index) || list.head;
                    while (node) {
                        if (node.match(constraint, v)) {
                            var base       = target.base,
                                baseCalled = false;
                            target.base    = function () {
                                var baseResult;
                                baseCalled = true;
                                _dispatch(target, owner, callback, constraint, v, composer, false,
                                          function (result) { baseResult = result; });
                                return baseResult;
                            };
                            try {
                                var result = node.handler.call(target, callback, composer);
                                if (handled(result)) {
                                    if (results) {
                                        results.call(callback, result);
                                    }
                                    if (!all) {
                                        return true;
                                    }
                                    dispatched = true;
                                } else if (baseCalled) {
                                    if (!all) {
                                        return false;
                                    }
                                }
                            } finally {
                                target.base = base;
                            }
                        } else if (invariant) {
                            break;  // stop matching if invariant not satisifed
                        }
                        node = node.next;
                    }
                }
            }
            return dispatched;
        }
        _definitions[tag] = definition;
        return definition;
    }

    /**
     * @class {_Node}
     */
    function _Node(constraint, handler, removed) {
        var invariant   = $eq.test(constraint);
        constraint      = Modifier.unwrap(constraint);
        this.constraint = constraint;
        this.handler    = handler;
        if ($isNothing(constraint)) {
            this.match = invariant ? False : _matchEverything;
        } else if ($isProtocol(constraint)) {
            this.match = invariant ? _matchInvariant : _matchProtocol;
        } else if ($isClass(constraint)) {
            this.match = invariant ? _matchInvariant : _matchClass;
        } else if ($isString(constraint)) {
            this.match = _matchString;
        } else if (instanceOf(constraint, RegExp)) {
            this.match = invariant ? False : _matchRegExp;
        } else if ($isFunction(constraint)) {
            this.match = constraint;
        } else {
            this.match = False;
        }
        if (removed) {
            this.removed = removed;
        }
    }

    function _createIndex(constraint) {
        if (constraint) {
            if ($isString(constraint)) {
                return constraint;
            } else if ($isFunction(constraint)) {
                return assignID(constraint);
            }
        }
    }

    function _matchInvariant(match) {
        return this.constraint === match;
    }

    function _matchEverything(match, variance) {
        return variance !== Variance.Invariant;
    }

    function _matchProtocol(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Covariant) {
            return constraint.conformsTo(match);
        } else if (variance === Variance.Contravariant) {
            return match.conformsTo && match.conformsTo(constraint);
        }
        return false;
    }

    function _matchClass(match, variance) {
        var constraint = this.constraint;
        if (constraint === match) {
            return true;
        } else if (variance === Variance.Contravariant) {
            return match.prototype instanceof constraint;
        }
        else if (variance === Variance.Covariant) {
            return match.prototype &&
                (constraint.prototype instanceof match
                 || ($isProtocol(match) && match.adoptedBy(constraint)));
        }
        return false;
    }

    function _matchString(match) {
        return $isString(match) && this.constraint == match;
    }

    function _matchRegExp(match, variance) {
        return (variance !== Variance.Invariant) && this.constraint.test(match);
    }

    function _covariantComparer(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Covariant)) {
            return -1;
        }
        return 1;
    }
    
    function _contravariantComparer(node, insert) {
        if (insert.match(node.constraint, Variance.Invariant)) {
            return 0;
        } else if (insert.match(node.constraint, Variance.Contravariant)) {
            return -1;
        }
        return 1;
    }

    function _invariantComparer(node, insert) {
        return insert.match(node.constraint, Variance.Invariant) ? 0 : -1;
    }

    function _resultRequired(result) {
        return ((result !== null) && (result !== undefined) && (result !== $NOT_HANDLED));
    }

    function _successImplied(result) {
        return result ? (result !== $NOT_HANDLED) : (result === undefined);
    }

    function getEffectivePromise(object) {
        if (object instanceof HandleMethod) {
            object = object.getReturnValue();
        }
        return $isPromise(object) ? object : null;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = callback;
    }

    eval(this.exports);

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./miruken.js":9,"bluebird":12}],3:[function(require,module,exports){
var miruken = require('./miruken.js');
              require('./callback.js');

new function () { // closure

    /**
     * @namespace miruken.context
     */
    var context = new base2.Package(this, {
        name:    "context",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "ContextState,ContextObserver,Context,Contextual,ContextualMixin,ContextualHelper,$contextual"
    });

    eval(this.imports);

    /**
     * ContextState enum
     * @enum {Number}
     */
    var ContextState = Enum({
        Active: 1,
        Ending: 2,
        Ended:  3 
    });

    /**
     * @protocol {ContextObserver}
     */
    var ContextObserver = Protocol.extend({
        contextEnding:      function (context) {},
        contextEnded:       function (context) {},
        childContextEnding: function (context) {},
        childContextEnded:  function (context) {}
    });

    /**
     * @class {Context}
     */
    var Context = CompositeCallbackHandler.extend(
    Parenting, Traversing, Disposing, TraversingMixin, {
        constructor: function (parent) {
            this.base();

            var _state              = ContextState.Active,
                _parent             = parent,
                _children           = new Array2,
                _baseHandleCallback = this.handleCallback,
                _observers;

            this.extend({
                getState: function () {
                    return _state; 
                },
                getParent: function () {
                    return _parent; 
                },
                getChildren: function () {
                    return _children.copy(); 
                },
                hasChildren: function () {
                    return _children.length > 0; 
                },
                getRoot: function () {
                    var root = this;    
                    while (root && root.getParent()) {
                        root = root.getParent();
                    }
                    return root;
                },
                newChild: function () {
                    _ensureActive();
                    var childContext = new ($classOf(this))(this).extend({
                        end: function () {
                            if (_observers) {
                                _observers.invoke('childContextEnding', childContext);
                            }
                            _children.remove(childContext);
                            this.base();
                            if (_observers) {
                                _observers.invoke('childContextEnded', childContext);
                            }
                        }
                    });
                    _children.push(childContext);
                    return childContext;
                },
                store: function (object) {
                    if ($isSomething(object)) {
                        $provide(this, object);
                    }
                },
                handleCallback: function (callback, greedy, composer) {
                    var handled = this.base(callback, greedy, composer);
                    if (handled && !greedy) {
                        return handled;
                    }
                    if (_parent) {
                        handled = handled | _parent.handle(callback, greedy, composer);
                    }
                    return !!handled;
                },
                handleAxis: function (axis, callback, greedy, composer) {
                    if (callback === null || callback === undefined) {
                        return false;
                    }
                    greedy   = !!greedy;
                    composer = composer || this;
                    if (axis == TraversingAxis.Self) {
                        return _baseHandleCallback.call(this, callback, greedy, composer);
                    }
                    var handled = false;
                    this.traverse(axis, function (node) {
                        handled = handled
                                | node.handleAxis(TraversingAxis.Self, callback, greedy, composer);
                        return handled && !greedy;
                    });
                    return !!handled;
                },
                observe: function (observer) {
                    _ensureActive();
                    if (observer === null || observer === undefined) {
                        return;
                    }
                    observer = ContextObserver(observer);
                    (_observers || (_observers = new Array2)).push(observer);
                    return function () { _observers.remove(observer); };
                },
                unwindToRootContext: function () {
                    var current = this;
                    while (current) {
                        if (current.getParent() == null) {
                            current.unwind();
                            return current;
                        }
                        current = current.getParent();
                    }
                    return null;
                },
                unwind: function () {
                    this.getChildren().invoke('end');
                },
                end: function () { 
                    if (_state == ContextState.Active) {
                        _state = ContextState.Ending;
                        if (_observers) {
                            _observers.invoke('contextEnding', this);
                        }
                        this.unwind();
                        _state = ContextState.Ended;
                        if (_observers) {
                            _observers.invoke('contextEnded', this);
                        }
                        _observers = null;
                    }
                },
                dispose: function () { this.end(); }
            });

            function _ensureActive() {
                if (_state != ContextState.Active) {
                    throw new Error("The context has already ended.");
                }
            }
        }
    });

    /**
     * @protocol {Contextual}
     */
    var Contextual = Protocol.extend({
        /**
         * Gets the Context associated with this object.
         * @returns {Context} this associated Context.
         */
        getContext: function () {},
        /**
         * Sets the Context associated with this object.
         * @param   {Context} context  - associated context
         */
        setContext: function (context) {}
    });

    /**
     * Contextual mixin
     * @class {Contextual}
     */
    var ContextualMixin = Module.extend({
        getContext: function (object) {
            return object.__context;
        },
        setContext: function (object, context) {
            if (object.__context === context) {
                return;
            }
            if (object.__context)
                object.__context.removeHandlers(object);
            if (context) {
                object.__context = context;
                context.addHandlers(object);
            } else {
                delete object.__context;
            }
        },
        isActiveContext: function (object) {
            return object.__context && (object.__context.getState() === ContextState.Active);
        },
        endContext: function (object) {
            if (object.__context) object.__context.end();
        }
    });

    /**
     * @class {$contextual}
     * Metamacro to implement Contextual protocol.
     */
    var $contextual = MetaMacro.extend({
        apply: function (step, metadata, target) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();
                clazz.addProtocol(Contextual);
                clazz.implement(ContextualMixin);
            }
        }
    });

    /**
     * ContextualHelper mixin
     * @class {ContextualHelper}
     */
    var ContextualHelper = Module.extend({
        resolveContext: function (contextual) {
            if (!contextual) return null;
            if (contextual instanceof Context) return contextual;
            return $isFunction(contextual.getContext)
                 ? contextual.getContext() : null;
        },
        requireContext: function (contextual) {
            var context = ContextualHelper.resolveContext(contextual);
            if (!(context instanceof Context))
                throw new Error("The supplied object is not a Context or Contextual object.");
            return context;
        },
        clearContext: function (contextual) {
            if (!contextual ||
                !$isFunction(contextual.getContext) || 
                !$isFunction(contextual.setContext)) {
                return;
            }
            var context = contextual.getContext();
            if (context) {
                try {
                    context.end();
                }
                finally {
                    contextual.setContext(null);
                }
            }
        },
        bindContext: function (contextual, context, replace) {
            if (!contextual ||
                (!replace && $isFunction(contextual.getContext)
                 && contextual.getContext())) {
                return contextual;
            }
            if (contextual.setContext === undefined) {
                contextual = ContextualMixin(contextual);
            } else if (!$isFunction(contextual.setContext)) {
                throw new Error("Unable to set the context on " + contextual + ".");
            }
            contextual.setContext(ContextualHelper.resolveContext(context));
            return contextual;
        },
        bindChildContext: function (contextual, child) {
            var childContext;
            if (child) {
                if ($isFunction(child.getContext)) {
                    childContext = child.getContext();
                    if (childContext && childContext.getState() === ContextState.Active) {
                        return childContext;
                    }
                }
                var context  = ContextualHelper.requireContext(contextual);
                while (context && context.getState() !== ContextState.Active) {
                    context = context.getParent();
                }
                if (context) {
                    childContext = context.newChild();
                    ContextualHelper.bindContext(child, childContext, true);
                }
            }
            return childContext;
        }
    });

   /**
     * Context traversal
     */
    Context.implement({
        self: function () {
            return _newContextTraversal(this, TraversingAxis.Self);
        },
        root: function () {
            return _newContextTraversal(this, TraversingAxis.Root);   
        },
        child: function () {
            return _newContextTraversal(this, TraversingAxis.Child);   
        },
        sibling: function () {
            return _newContextTraversal(this, TraversingAxis.Sibling);   
        },
        childOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.ChildOrSelf);   
        },
        siblingOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.SiblingOrSelf);   
        },
        ancestor: function () {
            return _newContextTraversal(this, TraversingAxis.Ancestor);   
        },
        ancestorOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.AncestorOrSelf);   
        },
        descendant: function () {
            return _newContextTraversal(this, TraversingAxis.Descendant);   
        },
        descendantOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.DescendantOrSelf);   
        },
        parentSiblingOrSelf: function () {
            return _newContextTraversal(this, TraversingAxis.ParentSiblingOrSelf);   
        }
    });

    function _newContextTraversal(context, axis) {
        function Traversal() {
            for (var key in context) {
                if (key in Base.prototype) {
                    continue;
                }
                var member = context[key];
                if ($isFunction(member))
                    this[key] = (function (k, m) {
                        return function () {
                            var owner       = (k in CallbackHandler.prototype) ? this : context, 
                                returnValue = m.apply(owner, arguments);
                            if (returnValue === context) {
                                returnValue = this;
                            }
                            else if (returnValue &&
                                     $isFunction(returnValue.getDecoratee) &&
                                     $isFunction(returnValue.setDecoratee) &&
                                     returnValue.getDecoratee() == context) {
                                returnValue.setDecoratee(this);
                            }
                            return returnValue;
                        }
                    })(key, member);
            }
            this.extend({
                handle: function (callback, greedy, composer) {
                    return this.handleAxis(axis, callback, greedy, composer);
                }});
        }
        Traversal.prototype = context.constructor.prototype;
        return new Traversal();
    }

    // =========================================================================
    // Function context extensions
    // =========================================================================

    if (Function.prototype.newInContext === undefined)
        Function.prototype.newInContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindContext(object, context);
            return object;
        };

    if (Function.prototype.newInChildContext === undefined)
        Function.prototype.newInChildContext = function () {
            var args        = Array.prototype.slice.call(arguments),
                context     = args.shift(),
                constructor = this;
            function Fake() { constructor.apply(this, args); }
            Fake.prototype  = constructor.prototype;
            var object      = new Fake;
            ContextualHelper.bindChildContext(context, object);
            return object;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = context;
    }

    eval(this.exports);

}

},{"./callback.js":2,"./miruken.js":9}],4:[function(require,module,exports){
var miruken    = require('./miruken.js'),
    prettyjson = require('prettyjson'),
    Promise    = require('bluebird');
                 require('./callback.js'),

new function() { // closure

    /**
     * @namespace miruken.error
     */
    var error = new base2.Package(this, {
        name:    "error",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "Errors,ErrorCallbackHandler"
    });

    eval(this.imports);

    /**
     * @protocol {Errors}
     */
    var Errors = Protocol.extend({
        handleError:     function(error,     context) {},
        handleException: function(exception, context) {},
        reportError:     function(error,     context) {},
        reportException: function(exception, context) {}
    });

    /**
     * @class {ErrorCallbackHandler}
     */
    var ErrorCallbackHandler = CallbackHandler.extend({
    /**
     * Handles the error.
     * @param   {Any}          error      - error (usually Error)
     * @param   {Any}          [context]  - scope of error
     * @returns {Promise(Any)} the handled error.
     */
        handleError: function(error, context) {
            return Promise.resolve(Errors($composer).reportError(error, context));
        },
    /**
     * Handles the exception.
     * @param   {Exception}    excption   - exception
     * @param   {Any}          [context]  - scope of error
     * @returns {Promise(Any)} the handled exception.
     */
        handleException: function(exception, context) {
            return Promise.resolve(Errors($composer).reportException(exception, context));
        },
    /**
     * Reports the error. i.e. to the console.
     * @param   {Any}          error      - error (usually Error)
     * @param   {Any}          [context]  - scope of error
     * @returns {Promise(Any)} the reported error (could be a dialog).
     */
        reportError: function(error, context) {
            console.error(formatJson(error));
            return Promise.resolve();
        },
    /**
     * Reports the excepion. i.e. to the console.
     * @param   {Exception}    exception  - exception
     * @param   {Any}          [context]  - scope of exception
     * @returns {Promise(Any)} the reported exception (could be a dialog).
     */
        reportException: function(exception, context) {
            console.error(formatJson(exception));
            return Promise.resolve();
        }
    });

    /**
     * Recoverable filter
     */
    CallbackHandler.implement({
        recoverable: function(context) {
            return new CallbackHandlerFilter(this, function(callback, composer, proceed) {
                try {
                    var promise,
                    handled = proceed();
                    if (handled && (promise = getEffectivePromise(callback))) {
                        promise = promise.caught(function(error) {
                            return Errors(composer).handleError(error, context);
                        });
                        if (callback instanceof HandleMethod) {
                            callback.setReturnValue(promise);
                        }
                    }
                    return handled;
                } catch (exception) {
                    Errors(composer).handleException(exception, context);
                    return true;
                }
            });
        },

        recover: function(context) {
            return function(error) {
                return Errors(this).handleError(error, context);
            }.bind(this);
        }
    });

    function formatJson(object) {
        var json = prettyjson.render(object);
        json = json.split('\n').join('\n    ');
        return '    ' + json;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = error;
    }

    eval(this.exports);

}

},{"./callback.js":2,"./miruken.js":9,"bluebird":12,"prettyjson":50}],5:[function(require,module,exports){
module.exports = require('./miruken.js');
require('./callback.js');
require('./context.js');
require('./validate.js');
require('./error.js');
require('./ioc');

},{"./callback.js":2,"./context.js":3,"./error.js":4,"./ioc":7,"./miruken.js":9,"./validate.js":11}],6:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('./ioc.js');

new function () { // closure

    /**
     * @namespace miruken.ioc.config
     */
    var config = new base2.Package(this, {
        name:    "config",
        version: miruken.ioc.version,
        parent:  miruken.ioc,
        imports: "miruken,miruken.ioc",
        exports: "Installer,$classes"
    });

    eval(this.imports);

    /**
     * @class {Installer}
     */
    var Installer = Base.extend(Registration, {
        register: function(container, composer) {}
    });

    /**
     * @class {FromBuilder}
     */
    var FromBuilder = Base.extend(Registration, {
        constructor: function () {
            var _basedOn;
            this.extend({
                getClasses: function () { return []; },
                basedOn: function (/*constraints*/) {
                    _basedOn = new BasedOnBuilder(this, Array2.flatten(arguments));
                    return _basedOn;
                },
                register: function(container, composer) {
                    var registrations,
                        classes = this.getClasses();
                    if (_basedOn) {  // try based on
                        registrations = Array2.filter(
                            Array2.map(classes, function (member) {
                                return _basedOn.builderForClass(member);
                            }), function (component) {
                            return component;
                        });
                    } else { // try installers
                        registrations = Array2.map(
                            Array2.filter(classes, function (member) {
                                var clazz = member.member || member;
                                return clazz.prototype instanceof Installer;
                            }), function (installer) {
                                installer = installer.member || installer;
                                return new installer;
                            });
                    }
                    return Promise.all(container.register(registrations))
                        .then(function (registrations) {
                            return _unregisterBatch(registrations);
                        });
                }
            });
        }
    });

    /**
     * @class {FromPackageBuilder}
     */
    var FromPackageBuilder = FromBuilder.extend(Registration, {
        constructor: function (package) {
            this.base();
            this.extend({
                getClasses: function () {
                    var classes = [];
                    package.getClasses(function (clazz) {
                        classes.push(clazz);
                    });
                    return classes;
                }
            });
        }
    });

    /**
     * @class {BasedOnBuilder}
     */
    var BasedOnBuilder = Base.extend(Registration, {
        constructor: function (from, constraints) {
            var _if, _unless, _configuration;
            this.withKeys = new KeyBuilder(this);
            this.extend({
                if: function (condition) {
                    if (_if) {
                        var cond = _if;
                        _if = function (clazz) {
                            return cond(clazz) && condition(clazz);
                        };
                    } else {
                        _if = condition;
                    }
                    return this;
                },
                unless: function (condition) {
                    if (_unless) {
                        var cond = _unless;
                        _unless = function (clazz) {
                            return cond(clazz) || condition(clazz);
                        };
                    } else {
                        _unless = condition;
                    }
                    return this;
                },
                configure: function (configuration) {
                    if (_configuration) {
                        var configure  = _configuration;
                        _configuration = function (component) {
                            configure(component);
                            configuration(component);
                        };
                    } else {
                        _configuration = configuration;
                    }
                    return this;
                },
                builderForClass: function (member) {
                    var basedOn = [],
                        clazz   = member.member || member,
                        name    = member.name;
                    if ((_if && !_if(clazz)) || (_unless && _unless(clazz))) {
                        return;
                    }
                    for (var i = 0; i < constraints.length; ++i) {
                        var constraint = constraints[i];
                        if ($isProtocol(constraint)) {
                            if (!constraint.adoptedBy(clazz)) {
                                continue;
                            }
                        } else if ($isClass(constraint)) {
                            if (!(clazz.prototype instanceof constraint)) {
                                continue;
                            }
                        }
                        if (basedOn.indexOf(constraint) < 0) {
                            basedOn.push(constraint);
                        }
                    }
                    if (basedOn.length > 0 || constraints.length === 0) {
                        var keys      = this.withKeys.getKeys(clazz, basedOn, name),
                            component = $component(keys).boundTo(clazz);
                        if (_configuration) {
                            _configuration(component);
                        }
                        return component;
                    }
                },
                register: function(container, composer) {
                    return from.register(container, composer);
                }
            });
        }
    });

    /**
     * @class {KeyBuilder}
     */
    var KeyBuilder = Base.extend({
        constructor: function (basedOn) {
            var _keySelector;
            this.extend({
                self: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push(clazz);
                    });
                },
                basedOn: function () {
                    return selectKeys(function (keys, clazz, constraints) {
                        keys.push.apply(keys, constraints);
                    });
                },
                anyService: function () {
                    return selectKeys(function (keys, clazz) {
                        var services = clazz.getAllProtocols();
                        if (services.length > 0) {
                            keys.push(services[0]);
                        }
                    });
                },
                allServices: function () {
                    return selectKeys(function (keys, clazz) {
                        keys.push.apply(keys, clazz.getAllProtocols());
                    });
                },
                mostSpecificService: function (service) {
                    return selectKeys(function (keys, clazz, constraints) {
                        if ($isProtocol(service)) {
                            _addMatchingProtocols(clazz, service, keys);
                        } else {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if ($isFunction(constraint)) {
                                    _addMatchingProtocols(clazz, constraint, keys);
                                }
                            }
                        }
                        if (keys.length === 0) {
                            for (var i = 0; i < constraints.length; ++i) {
                                var constraint = constraints[i];
                                if (constraint !== Base && constraint !== Object) {
                                    if ($isProtocol(constraint)) {
                                        if (constraint.adoptedBy(clazz)) {
                                            keys.push(constraint);
                                            break;
                                        }
                                    } else if (clazz === constraint ||
                                               clazz.prototype instanceof constraint) {
                                        keys.push(constraint);
                                        break;
                                    }
                                }
                            }
                        }
                    });
                },
                name: function (n) {
                    return selectKeys(function (keys, clazz, constraints, name) {
                        if ($isNothing(n)) {
                            if (name) {
                                keys.push(name);
                            }
                        } else if ($isFunction(n)) {
                            if (name = n(name)) {
                                keys.push(String(name));
                            }
                        } else {
                            keys.push(String(n));
                        }
                    });
                },
                getKeys: function (clazz, constraints, name) {
                    var keys = [];
                    if (_keySelector) {
                        _keySelector(keys, clazz, constraints, name);
                    }
                    if (keys.length > 0) {
                        return keys;
                    }
                }
            });

            function selectKeys(selector) {
                if (_keySelector) { 
                    var select   = _keySelector;
                    _keySelector = function (keys, clazz, constraints, name) {
                        select(keys, clazz, constraints, name);
                        selector(keys, clazz, constraints, name);
                    };
                } else {
                    _keySelector = selector;
                }
                return basedOn;
            }
        }
    });

    /**
     * @function $classes
     * @param   {Any} from - source of classes 
     * @returns {Any} a fluent class builder.
     */
    function $classes(from) {
        if (from instanceof Package) {
            return new FromPackageBuilder(from);
        }
        throw new TypeError(lang.format("Unrecognized $classes from %1.", hint));
    }

    $classes.fromPackage = function (package) {
        if (!(package instanceof Package)) {
            throw new TypeError(
                lang.format("$classes expected a Package, but received %1 instead.", package));
        }
        return new FromPackageBuilder(package);
    };

    function _unregisterBatch(registrations) {
        return function () {
            for (var i = 0; i < registrations.length; ++i) {
                registrations[i]();
            }
        };
    }

    function _addMatchingProtocols(clazz, preference, matches) {
        var toplevel = _toplevelProtocols(clazz);
        for (var i = 0; i < toplevel.length; ++i) {
            var protocol = toplevel[i];
            if (protocol.getAllProtocols().indexOf(preference) >= 0) {
                matches.push(protocol);
            }
        }
    }

    function _toplevelProtocols(type) {
        var protocols = type.getAllProtocols(),
            toplevel  = protocols.slice(0);
        for (var i = 0; i < protocols.length; ++i) {
            var parents = protocols[i].getAllProtocols();
            for (var ii = 0; ii < parents.length; ++ii) {
                Array2.remove(toplevel, parents[ii]);
            }
        }
        return toplevel;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = config;
    }

    eval(this.exports);
}
},{"../miruken.js":9,"./ioc.js":8,"bluebird":12}],7:[function(require,module,exports){
module.exports = require('./ioc.js');
require('./config.js');


},{"./config.js":6,"./ioc.js":8}],8:[function(require,module,exports){
var miruken = require('../miruken.js'),
    Promise = require('bluebird');
              require('../context.js'),
              require('../validate.js');

new function () { // closure

    /**
     * @namespace miruken.ioc
     */
    var ioc = new base2.Package(this, {
        name:    "ioc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context,miruken.validate",
        exports: "Container,Registration,ComponentPolicy,Lifestyle,TransientLifestyle,SingletonLifestyle,ContextualLifestyle,DependencyModifiers,DependencyModel,DependencyManager,DependencyInspector,ComponentModel,ComponentBuilder,IoContainer,DependencyResolution,DependencyResolutionError,$component,$$composer,$container"
    });

    eval(this.imports);

    /**
     * Composer dependency.
     */
    var $$composer    = {},
        $container    = $createModifier(),
        $proxyBuilder = new ProxyBuilder;

    /**
     * @protocol {Container}
     */
    var Container = Protocol.extend(Disposing, {
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        },
        /**
         * Registers on or more components in the container.
         * @param   {Any*}    registrations  - Registrations
         * @returns {Promise} a promise representing the registration.
         */
        register: function (/*registrations*/) {},
        /**
         * Adds a configured component to the container with policies.
         * @param   {ComponentModel}    componentModel  - component model
         * @param   {Array}             policies        - component policies
         * @returns {Promise} a promise representing the component.
         */
        addComponent: function (componentModel, policies) {},
        /**
         * Resolves the component for the key.
         * @param   {Any} key  - key used to identify the component
         * @returns {Any} component (or Promise) satisfying the key.
         */
        resolve: function (key) {},
        /**
         * Resolves all the components for the key.
         * @param   {Any} key  - key used to identify the components
         * @returns {Array} components (or Promises) satisfying the key.
         */
        resolveAll: function (key) {}
    });

    /**
     * @protocol {Registration}
     */
    var Registration = Protocol.extend({
        /**
         * Encapsulates the regisration of one or more components.
         * @param {Container}       container  - container to register components in
         * @param {CallbackHandler} composer   - supports composition
         */
         register: function (container, composer) {}
    });

    /**
     * @protocol {ComponentPolicy}
     */
    var ComponentPolicy = Protocol.extend({
        /**
         * Applies the policy to the ComponentModel.
         * @param {ComponentModel} componentModel  - component model
         */
         apply: function (componentModel) {}
    });

    /**
     * DependencyModifiers enum
     * @enum {Number}
     */
    var DependencyModifiers = Enum({
        None:       0,
        Use:        1 << 0,
        Lazy:       1 << 1,
        Every:      1 << 2,
        Dynamic:    1 << 3,
        Optional:   1 << 4,
        Promise:    1 << 5,
        Invariant:  1 << 6,
        Container:  1 << 7,
        Child:      1 << 8
        });

    /**
     * @class {DependencyModel}
     */
    var DependencyModel = Base.extend({
        constructor: function (dependency, modifiers) {
            modifiers = modifiers || DependencyModifiers.None;
            if (dependency instanceof Modifier) {
                if ($use.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Use;
                }
                if ($lazy.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Lazy;
                }
                if ($every.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Every;
                }
                if ($eval.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Dynamic;
                }
                if ($child.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Child;
                }
                if ($optional.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Optional;
                }
                if ($promise.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Promise;
                }
                if ($container.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Container;
                }
                if ($eq.test(dependency)) {
                    modifiers = modifiers | DependencyModifiers.Invariant;
                }
                dependency = Modifier.unwrap(dependency);
            }
            this.extend({
                getDependency: function () { return dependency; },
                getModifiers: function () { return modifiers; },
                test: function (modifier) {
                    return (modifiers & modifier) === modifier;
                }
            });
        }
    }, {
        coerce: function (object) {
           return (object === undefined) ? undefined : new DependencyModel(object);
        }
    });

    /**
     * @class {DependencyManager}
     */
    var DependencyManager = ArrayManager.extend({
        constructor: function (dependencies) {
            this.base(dependencies);
        },
        mapItem: function (item) {
            return DependencyModel(item);
        }                         
    });

    /**
     * @class {DependencyInspector}
     */
    var DependencyInspector = Base.extend({
        inspect: function (componentModel, policies) {
            // Dependencies will be merged from inject definitions
            // starting from most derived unitl no more remain or the
            // current definition is fully specified (no undefined).
            var dependencies = componentModel.getDependencies();
            if (dependencies && !Array2.contains(dependencies, undefined)) {
                return;
            }
            var clazz = componentModel.getClass();
            componentModel.manageDependencies(function (manager) {
                while (clazz && (clazz !== Base)) {
                    var injects = [clazz.prototype.$inject, clazz.prototype.inject,
                                   clazz.$inject, clazz.inject];
                    for (var i = 0; i < injects.length; ++i) {
                        var inject = injects[i];
                        if (inject !== undefined) {
                            if ($isFunction(inject)) {
                                inject = inject();
                            }
                            manager.merge(inject);
                            if (!Array2.contains(inject, undefined)) {
                                return;
                            }
                        }
                    }
                    clazz = $ancestorOf(clazz);
                }
            });
        }
    });

    /**
     * @class {ComponentModel}
     */
    var ComponentModel = Base.extend({
        constructor: function () {
            var _key, _class, _lifestyle, _factory,
                _invariant = false, _burden = {};
            this.extend({
                getKey: function () {
                    return _key || _class
                },
                setKey: function (value) { _key = value; },
                getClass: function () {
                    var clazz = _class;
                    if (!clazz && $isClass(_key)) {
                        clazz = _key;
                    }
                    return clazz;
                },
                setClass: function (value) {
                    if ($isSomething(value) && !$isClass(value)) {
                        throw new TypeError(lang.format("%1 is not a class.", value));
                    }
                    _class = value;
                },
                isInvariant: function () {
                    return _invariant;
                },
                setInvariant: function (value) { _invariant = !!value; },
                getLifestyle: function () { return _lifestyle; },
                setLifestyle: function (value) {
                    if (!$isSomething(value) && !(value instanceof Lifestyle)) {
                        throw new TypeError(lang.format("%1 is not a Lifestyle.", value));
                    }
                    _lifestyle = value; 
                },
                getFactory: function () {
                    var factory = _factory,
                        clazz   = this.getClass();
                    if (!factory) {
                        var interceptors = _burden[INTERCEPTORS];
                        if (interceptors && interceptors.length > 0) {
                            var types = [];
                            if (clazz) {
                                types.push(clazz);
                            }
                            if ($isProtocol(_key)) {
                                types.push(_key);
                            }
                            return _makeProxyFactory(types);
                        } else if (clazz) {
                            return _makeClassFactory(clazz);
                        }
                    }
                    return factory;
                },
                setFactory: function (value) {
                    if ($isSomething(value) && !$isFunction(value)) {
                        throw new TypeError(lang.format("%1 is not a function.", value));
                    }
                    _factory = value;
                },
                getDependencies: function (key) { 
                    return _burden[key || PARAMETERS];
                },
                setDependencies: function (key, value) {
                    if (arguments.length === 1) {
                        value = key, key = PARAMETERS;
                    }
                    if ($isSomething(value) && !(value instanceof Array)) {
                        throw new TypeError(lang.format("%1 is not an array.", value));
                    }
                    _burden[key] = Array2.map(value, DependencyModel);
                },
                manageDependencies: function (key, actions) {
                    if (arguments.length === 1) {
                        actions = key, key = PARAMETERS;
                    }
                    if ($isFunction(actions)) {
                        var dependencies = _burden[key],
                            manager      = new DependencyManager(dependencies);
                        actions(manager);
                        if (dependencies === undefined) {
                            var dependencies = manager.getItems();
                            if (dependencies.length > 0) {
                                _burden[key] = dependencies;
                            }
                        }
                    }
                    return dependencies;
                },
                getBurden: function () { return _burden; }
            });
        }
    });

    function _makeClassFactory(clazz) {
        return function (burden) {
            return clazz.new.apply(clazz, burden[PARAMETERS]);
        }
    }

    function _makeProxyFactory(types) {
        var proxy = $proxyBuilder.buildProxy(types);
        return function (burden) {
            return proxy.new.call(proxy, burden);
        }
    }

    /**
     * @class {Lifestyle}
     */
    var Lifestyle = Base.extend(ComponentPolicy, Disposing, DisposingMixin, {
        resolve: function (factory) { return factory(); },
        trackInstance: function (instance) {
            if (instance && $isFunction(instance.dispose)) {
                var _this = this;
                instance.extend({
                    dispose: function (disposing) {
                        if (disposing || _this.disposeInstance(instance, true)) {
                            this.base();
                            this.dispose = this.base;
                        }
                    }
                });
            }
        },
        disposeInstance: function (instance, disposing) {
            if (!disposing && instance && $isFunction(instance.dispose)) {
                instance.dispose(true);
            }
            return !disposing;
        },
        apply: function (componentModel) {
            componentModel.setLifestyle(this);
        }
    });

   /**
     * @class {TransientLifestyle}
     */
    var TransientLifestyle = Lifestyle.extend();

   /**
     * @class {SingletonLifestyle}
     */
    var SingletonLifestyle = Lifestyle.extend({
        constructor: function (instance) {
            this.extend({
                resolve: function (factory) {
                    if (!instance) {
                        var object = factory();
                        if ($isPromise(object)) {
                            var _this = this;
                            return Promise.resolve(object).then(function (object) {
                                // Only cache fulfilled instances
                                if (!instance && object) {
                                    instance = object;
                                    _this.trackInstance(instance);
                                }
                                return instance;
                            });
                        } else if (object) {
                            instance = object;
                            this.trackInstance(instance)
                        }
                    }
                    return instance;
                },
                disposeInstance: function (obj, disposing) {
                    // Singletons cannot be disposed directly
                    if (!disposing && (obj === instance)) {
                        if (this.base(obj, disposing)) {
                           instance = undefined;
                           return true;
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    this.disposeInstance(instance);
                }
            });
        }
    });

   /**
     * @class {ContextualLifestyle}
     */
    var ContextualLifestyle = Lifestyle.extend({
        constructor: function () {
            var _cache = {};
            this.extend({
                resolve: function (factory, composer) {
                    var context = composer.resolve(Context);
                    if (context) {
                        var id       = assignID(context),
                            instance = _cache[id];
                        if (!instance) {
                            var object = factory();
                            if ($isPromise(object)) {
                                var _this = this;
                                return Promise.resolve(object).then(function (object) {
                                    // Only cache fulfilled instances
                                    if (object && !(instance = _cache[id])) {
                                        instance = object;
                                        _this._recordInstance(id, instance, context);
                                    }
                                    return instance;
                                });
                            } else if (object) {
                                instance = object;
                                this._recordInstance(id, instance, context);
                            }
                        }
                        return instance;
                    }
                },
                _recordInstance: function (id, instance, context) {
                    var _this  = this;
                    _cache[id] = instance;
                    if (Contextual.adoptedBy(instance) || $isFunction(instance.setContext)) {
                        ContextualHelper.bindContext(instance, context);
                    }
                    this.trackInstance(instance);
                    var cancel = context.observe({
                        contextEnded: function () {
                            if ($isFunction(instance.setContext)) {
                                instance.setContext(null);
                            }
                            _this.disposeInstance(instance);
                            delete _cache[id];
                            cancel();
                        }
                    });
                },
                disposeInstance: function (instance, disposing) {
                    if (!disposing) {  // Cannot be disposed directly
                        for (contextId in _cache) {
                            if (_cache[contextId] === instance) {
                                this.base(instance, disposing);
                                delete _cache[contextId];
                                return true;
                            } 
                        }
                    }
                    return false;
                },
                _dispose: function() {
                    for (contextId in _cache) {
                        this.disposeInstance(_cache[contextId]);
                    }
                    _cache = {};
                }
            });
        }
    });

    /**
     * @class {ComponentBuilder}
     */
    var ComponentBuilder = Base.extend(Registration, {
        constructor: function (key) {
            var _componentModel = new ComponentModel,
                _newInContext, _newInChildContext,
                _policies       = [];
            _componentModel.setKey(key);
            this.extend({
                invariant: function () {
                    _componentModel.setInvariant();
                },
                boundTo: function (clazz) {
                    _componentModel.setClass(clazz);
                    return this;
                },
                dependsOn: function (/* dependencies */) {
                    var dependencies;
                    if (arguments.length === 1 && (arguments[0] instanceof Array)) {
                        dependencies = arguments[0];
                    } else if (arguments.length > 0) {
                        dependencies = Array.prototype.slice.call(arguments);
                    }
                    _componentModel.setDependencies(dependencies);
                    return this;
                },
                usingFactory: function (factory) {
                    _componentModel.setFactory(factory);
                    return this;
                },
                instance: function (instance) {
                    _componentModel.setLifestyle(new SingletonLifestyle(instance));
                    return this;
                },
                singleton: function () {
                    _componentModel.setLifestyle(new SingletonLifestyle);
                    return this;
                },
                transient: function () {
                    _componentModel.setLifestyle(new TransientLifestyle);
                    return this;
                },
                contextual: function () {
                    _componentModel.setLifestyle(new ContextualLifestyle);
                    return this;
                },
                newInContext: function () {
                    _newInContext = true;
                    return this;
                },
                newInChildContext: function () {
                    _newInChildContext = true;
                    return this;
                },
                interceptors: function (/* interceptors */) {
                    var interceptors = (arguments.length === 1 
                                    && (arguments[0] instanceof Array))
                                     ? arguments[0]
                                     : Array.prototype.slice.call(arguments);
                    return new InterceptorBuilder(this, _componentModel, interceptors);
                },
                getPolicy: function (policyClass) {
                    for (var i = 0; i < _policies.length; ++i) {
                        var policy = _policies[i];
                        if (policy instanceof policyClass) {
                            return policy;
                        }
                    }
                },
                addPolicy: function (policy) {
                    if (this.getPolicy($classOf(policy))) {
                        return false;
                    }
                    _policies.push(policy);
                    return true;
                },
                register: function(container) {
                    if ( _newInContext || _newInChildContext) {
                        var factory = _componentModel.getFactory();
                        _componentModel.setFactory(function (dependencies) {
                            var object  = factory(dependencies),
                                context = this.resolve(Context);
                            if (_newInContext) {
                                ContextualHelper.bindContext(object, context);
                            } else {
                                ContextualHelper.bindChildContext(context, object);
                            }
                            return object;
                        });
                    }
                    return container.addComponent(_componentModel, _policies);
                }
            });
        }
    });

    /**
     * @class {InterceptorBuilder}
     */
    var InterceptorBuilder = Base.extend(Registration, {
        constructor: function (component, componentModel, interceptors) {
            this.extend({
                selectWith: function (selectors) {
                    componentModel.manageDependencies(INTERCEPTOR_SELECTORS, function (manager) {
                        Array2.forEach(selectors, function (selector) {
                            if (selector instanceof InterceptorSelector) {
                                selecter = $use(selector);
                            }
                            manager.append(selector);
                        });
                    });
                    return this;
                },
                toFront: function () {
                    return this.atIndex(0);
                },
                atIndex: function (index) {
                    componentModel.manageDependencies(INTERCEPTORS, function (manager) {
                        Array2.forEach(interceptors, function (interceptor) {
                            manager.insertIndex(index, interceptor);
                        });
                    });
                    return componentModel;
                },
                register: function(container, composer) {
                    componentModel.manageDependencies(INTERCEPTORS, function (manager) {
                        manager.append(interceptors);
                    });
                    return component.register(container, composer);
                }
            });
        }
    });

    /**
     * @function $component
     * @param   {Any} key - component key
     * @returns {ComponentBuilder} a fluent component builder.
     */
    function $component(key) {
        return new ComponentBuilder(key);
    }

    /**
     * @class {DependencyResolution}
     */
    var DependencyResolution = Resolution.extend({
        constructor: function (key, parent, many) {
            var _class, _handler;
            this.base(key, many);
            this.extend({
                claim: function (handler, clazz) { 
                    if (this.isResolvingDependency(handler)) {
                        return false;
                    }
                    _handler = handler;
                    _class   = clazz;
                    return true;
                },
                isResolvingDependency: function (handler) {
                    return (handler === _handler)
                        || (parent && parent.isResolvingDependency(handler))
                },
                formattedDependencyChain: function () {
                    var invariant  = $eq.test(key),
                        rawKey     = Modifier.unwrap(key),
                        keyDisplay = invariant ? ('`' + rawKey + '`') : rawKey,
                        display    = _class ? ("(" + keyDisplay + " <- " + _class + ")") : keyDisplay;
                    return parent 
                         ? (display + " <= " + parent.formattedDependencyChain())
                         : display;
                }
            });
        }
    });

    /**
     * @class {DependencyResolutionError}
     * @param {DependencyResolution} dependency  - failing dependency
     * @param {String}               message     - error message
     */
    function DependencyResolutionError(dependency, message) {
        this.message    = message;
        this.dependency = dependency;
        this.stack      = (new Error).stack;
    }
    DependencyResolutionError.prototype             = new Error;
    DependencyResolutionError.prototype.constructor = DependencyResolutionError;

    /**
     * @class {IoContainer}
     */
    var IoContainer = CallbackHandler.extend(Container, {
        constructor: function () {
            var _inspectors = [new DependencyInspector];
            this.extend({
                register: function (/*registrations*/) {
                    var _this = this;
                    return Promise.all(Array2.flatten(arguments).map(function (registration) {
                               return registration.register(_this, $composer);
                           }));
                },
                addComponent: function (componentModel, policies) {
                    var _this = this;
                    policies  = policies || [];
                    for (var i = 0; i < _inspectors.length; ++i) {
                        _inspectors[i].inspect(componentModel, policies);
                    }
                    for (var i = 0; i < policies.length; ++i) {
                        var policy = policies[i];
                        if ($isFunction(policy.apply)) {
                            policy.apply(componentModel);
                        }
                    }
                    return Validator($composer).validate(componentModel).then(function () {
                        return _this.registerHandler(componentModel); 
                    })
                },
                registerHandler: function(componentModel) {
                    var key       = componentModel.getKey(),
                        clazz     = componentModel.getClass(),
                        lifestyle = componentModel.getLifestyle() || new SingletonLifestyle,
                        factory   = componentModel.getFactory(),
                        burden    = componentModel.getBurden();
                    key = componentModel.isInvariant() ? $eq(key) : key;
                    return _registerHandler(this, key, clazz, lifestyle, factory, burden); 
                },
                addInspector: function (inspector) {
                    if (!$isFunction(inspector.inspect)) {
                        throw new TypeError("Inspectors must have an inspect method.");
                    }
                    _inspectors.push(inspector);
                },
                removeInspector: function (inspector) {
                    Array2.remove(_inspectors, inspector);
                },
                dispose: function () {
                    $provide.removeAll(this);
                }
            })
        },
        $validate:[
            ComponentModel, function (validation, composer) {
                var componentModel = validation.getObject(),
                    key            = componentModel.getKey(),
                    factory        = componentModel.getFactory();
                if (!key) {
                    validation.required('Key', 'Key could not be determined for component.');
                }
                if (!factory) {
                    validation.required('Factory', 'Factory could not be determined for component.');
                }
            }]
    });

    function _registerHandler(container, key, clazz, lifestyle, factory, burden) {
        return $provide(container, key, function handler(resolution, composer) {
            if (!(resolution instanceof DependencyResolution)) {
                resolution = new DependencyResolution(resolution.getKey());
            }
            return resolution.claim(handler, clazz)
                 ? lifestyle.resolve(_activate.bind(container, clazz, factory,
                                     burden, resolution, composer), composer)
                 : $NOT_HANDLED;  // cycle detected
        }, lifestyle.dispose.bind(lifestyle));
    }

    function _activate(clazz, factory, burden, resolution, composer) {
        var promises     = [],
            dependencies = {},
            instant      = $instant.test(resolution.getKey()),
            containerDep = Container(composer);
        for (var key in burden) {
            var group = burden[key];
            if ($isNothing(group)) {
                continue;
            }
            var resolved = group.slice(0);
            for (var index = 0; index < resolved.length; ++index) {
                var dep = resolved[index];
                if (dep === undefined) {
                    continue;
                }
                var use        = dep.test(DependencyModifiers.Use),
                    lazy       = dep.test(DependencyModifiers.Lazy),
                    promise    = dep.test(DependencyModifiers.Promise),
                    child      = dep.test(DependencyModifiers.Child),
                    dynamic    = dep.test(DependencyModifiers.Dynamic),
                    dependency = dep.getDependency();
                if (use || dynamic || $isNothing(dependency)) {
                    if (dynamic && $isFunction(dependency)) {
                        dependency = dependency(containerDep);
                    }
                    if (child) {
                        dependency = _createChild(dependency);
                    }
                    if (promise) {
                        dependency = Promise.resolve(dependency);
                    }
                } else if (dependency === $$composer) {
                    dependency = composer;
                } else if (dependency === Container) {
                    dependency = containerDep;
                } else {
                    var all           = dep.test(DependencyModifiers.Every),
                        optional      = dep.test(DependencyModifiers.Optional),
                        invariant     = dep.test(DependencyModifiers.Invariant),
                        fromContainer = dep.test(DependencyModifiers.Container);
                    if (invariant) {
                        dependency = $eq(dependency);
                    }
                    if (instant) {
                        dependency = $instant(dependency);
                    }
                    if (lazy) {
                        dependency = (function (paramDep, created, param) {
                            return function () {
                                if (!created) {
                                    created = true;
                                    var container = fromContainer ? containerDep : composer;
                                    param = _resolveDependency(paramDep, false, promise, child, all, container);
                                }
                                return param;
                            };
                        })(dependency);
                    } else {
                        var paramDep  = new DependencyResolution(dependency, resolution, all),
                            container = fromContainer ? containerDep : composer;
                        dependency = _resolveDependency(paramDep, !optional, promise, child, all, container);
                        if (!promise && $isPromise(dependency)) {
                            promises.push(dependency);
                            (function (paramPromise, paramSet, paramIndex) {
                                paramPromise.then(function (param) {
                                    paramSet[paramIndex] = param;
                                });
                            })(dependency, resolved, index);
                        }
                    }
                }
                resolved[index] = dependency;
            }
            dependencies[key] = resolved;
        }
        function createInstance () {
            return factory.call(composer, dependencies);
        }
        if (promises.length === 1) {
            return promises[0].then(createInstance);
        } else if (promises.length > 0) {
            return Promise.all(promises).then(createInstance);
        } else {
            return createInstance();
        }
    }
    
    function _resolveDependency(dependency, required, promise, child, all, composer) {
        var result = all ? composer.resolveAll(dependency) : composer.resolve(dependency);
        if (result === undefined) {
            if (required) {
                var error = new DependencyResolutionError(dependency,
                       lang.format("Dependency %1 could not be resolved.",
                                   dependency.formattedDependencyChain()));
                if ($instant.test(dependency.getKey())) {
                    throw error;
                }
                return Promise.reject(error);
            }
            return result;
        } else if (child && !all) {
            result = $isPromise(result) 
                 ? result.then(function (parent) { return _createChild(parent); })
                 : _createChild(result)
        }
        return promise ? Promise.resolve(result) : result;
    }

    function _createChild(parent) {
        if (!(parent && $isFunction(parent.newChild))) {
            throw new Error(lang.format(
                "Child dependency requested, but %1 is not a parent.", parent));
        }
        return parent.newChild();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = ioc;
    }

    eval(this.exports);

}
},{"../context.js":3,"../miruken.js":9,"../validate.js":11,"bluebird":12}],9:[function(require,module,exports){
(function (global){
require('./base2.js');

new function () { // closure

    /**
     * @namespace miruken
     */
    var miruken = new base2.Package(this, {
        name:    "miruken",
        version: "1.0",
        exports: "Enum,Protocol,Delegate,Miruken,MetaStep,MetaMacro,Metadata,Disposing,DisposingMixin,Parenting,Starting,Startup,Interceptor,InterceptorSelector,ProxyBuilder,TraversingAxis,Traversing,TraversingMixin,Traversal,Variance,Modifier,ArrayManager,IndexedList,$isProtocol,$isClass,$classOf,$ancestorOf,$metadata,$isString,$isFunction,$isObject,$isPromise,$isSomething,$isNothing,$using,$lift,$eq,$use,$copy,$lazy,$eval,$type,$every,$child,$optional,$readonly,$promise,$instant,$createModifier,$properties,$inferProperties,$inheritStatic,PARAMETERS,INTERCEPTORS,INTERCEPTOR_SELECTORS"
    });

    eval(this.imports);

    var $eq       = $createModifier(),
        $use      = $createModifier(),
        $copy     = $createModifier(),
        $lazy     = $createModifier(),
        $eval     = $createModifier(),
        $type     = $createModifier(),
        $every    = $createModifier(),
        $child    = $createModifier(),
        $optional = $createModifier(),
        $readonly = $createModifier(),
        $promise  = $createModifier(),
        $instant  = $createModifier();

    /**
     * @class {Enum}
     * Represents an enumeration
     */
    var Enum = Base.extend({
        constructor: function() {
            throw new TypeError("Enums cannot be instantiated.");
        }
    }, {
        coerce: function (choices) {
            return Object.freeze(this.extend(null, choices));
        }
    });

    /**
     * Variance enum
     * @enum {Number}
     */
    var Variance = Enum({
        Covariant:     1,  // out
        Contravariant: 2,  // in
        Invariant:     3   // exact
        });

    /**
     * @class {Delegate}
     */
    var Delegate = Base.extend({
        /**
         * Delegates the method invocation on the protocol.
         * @param   {Protocol} protocol    - receiving protocol
         * @param   {String}   methodName  - name of the method
         * @param   {Array}    args        - method arguments
         * @returns {Any}      the result of the proxied invocation.
         */
        delegate: function (protocol, methodName, args) {}
    });

    /**
     * @class {ObjectDelegate}
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            if ($isNothing(object)) {
                throw new TypeError("No object specified.");
            }
            this.extend({
                delegate: function (protocol, methodName, args, strict) {
                    var method = object[methodName];
                    if (method && (!strict || protocol.adoptedBy(object))) {
                        return method.apply(object, args);
                    }
                }
            });
        }
    });

    /**
     * MetaStep enum
     * @enum {Number}
     */
    var MetaStep = Enum({
        Subclass:  1,
        Implement: 2,
        Extend:    3
        });

    /**
     * @class {MetaMacro}
     */
    var MetaMacro = Base.extend({
        apply: function (step, metadata, target, definition) {},
        shouldInherit: False,
        isActive: False,
    }, {
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });

    /**
     * @class {MetaMacro}
     */
    var Metadata = MetaMacro.extend({
        constructor: function(metaClass, macros)  {
            var ancestor = $ancestorOf(metaClass),
                baseMeta = ancestor.meta;
            this.extend({
                getClass: function () { return metaClass; },
                getBaseMeta: function () { return baseMeta; },
                apply: function (step, metadata, target, definition) {
                    if (baseMeta) {
                        baseMeta.apply(step, metadata, target, definition);
                    }
                    var inherit = (this !== metadata),
                        active  = (step !== MetaStep.Subclass);
                    for (var i = 0; i < macros.length; ++i) {
                        var macro = macros[i];
                        if ((!active  || macro.isActive()) &&
                            (!inherit || macro.shouldInherit())) {
                            macro.apply(step, metadata, target, definition);
                        }
                    }
                },
                linkBase: function (method) {
                    if (!this[method]) {
                        this.extend(method, function () {
                            var baseMethod = baseMeta && baseMeta[method];
                            if (baseMethod) {
                                return baseMethod.apply(baseMeta, arguments);
                            }
                        });
                    }
                    return this;
                }        
            });
        }
    });

    /**
     * @class {Protocol}
     */
    var Protocol = Base.extend({
        constructor: function (delegate, strict) {
            if ($isNothing(delegate)) {
                delegate = new Delegate;
            } else if ((delegate instanceof Delegate) === false) {
                if ($isFunction(delegate.toDelegate)) {
                    delegate = delegate.toDelegate();
                    if ((delegate instanceof Delegate) === false) {
                        throw new TypeError(lang.format(
                            "Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one."));
                    }
                } else {
                    delegate = new ObjectDelegate(delegate);
                }
            }
            this.extend({ 
                delegate: function (methodName, args) {
                    return delegate && delegate.delegate(
                        $classOf(this), methodName, args, strict);
                }
            });
        }
    }, {
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        conformsTo: False,
        adoptedBy:  function (target) {
            return target && $isFunction(target.conformsTo)
                 ? target.conformsTo(this)
                 : false;
        },
        coerce: function (object, strict) {
            return new this(object, strict);
        }
    });

    var extend  = Base.extend;
    Base.extend = function () {
        var _protocols      = [],
            isProtocol      = (this === Protocol) || (this.prototype instanceof Protocol),
            getProtocols    = function () { return _protocols.slice(0); },
            getAllProtocols = function () {
                var protocols = this.getProtocols(),
                    inner     = protocols.slice(0);
                if (!isProtocol) {
                    var ancestor = $ancestorOf(this);
                    if (ancestor !== Base) {
                        inner.push(ancestor);
                    }
                }
                for (var i = 0; i < inner.length; ++i) {
                    var innerProtocols = inner[i].getAllProtocols();
                    for (var ii = 0; ii < innerProtocols.length; ++ii) {
                        var protocol = innerProtocols[ii];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    } 
                }
                return protocols;
            },
            addProtocol  = function (protocol) {
                if ((protocol.prototype instanceof Protocol) 
                    &&  (_protocols.indexOf(protocol) === -1)) {
                    if (isProtocol) {
                        _liftMethods.call(this.prototype, protocol);
                    }
                    _protocols.push(protocol);
                }
            };
        return (function (base, args) {
            var protocols  = [], mixins      = [],
                metaMacros = [], constraints = args;
            if (base.prototype instanceof Protocol) {
                protocols.push(base);
            }
            if (args.length > 0 && (args[0] instanceof Array)) {
                constraints = args.shift();
            }
            while (constraints.length > 0) {
                var constraint = constraints[0];
                if (!constraint) {
                    break;
                } else if (constraint.prototype instanceof Protocol) {
                    protocols.push(constraint);
                } else if (constraint instanceof MetaMacro) {
                    metaMacros.push(constraint);
                } else if ($isFunction(constraint) 
                           &&  constraint.prototype instanceof MetaMacro) {
                    metaMacros.push(new constraint);
                } else if (constraint.prototype) {
                    mixins.push(constraint);
                } else {
                    break;
                }
                constraints.shift();
            }
            var instanceDef = args.shift(),
                staticDef   = args.shift(),
                subclass    = extend.call(base, instanceDef, staticDef),
                metadata    = new Metadata(subclass, metaMacros);
            Array2.forEach(protocols, addProtocol, subclass);
            subclass.addProtocol     = addProtocol;
            subclass.getProtocols    = getProtocols;
            subclass.getAllProtocols = getAllProtocols;
            subclass.conformsTo      = _conformsTo.bind(subclass, _protocols);
            Object.defineProperty(subclass, 'meta', _metaProperty(metadata));
            metadata.apply(MetaStep.Subclass, metadata, subclass.prototype, instanceDef);
            Array2.forEach(mixins, subclass.implement, subclass);
            return subclass;
            })(this, Array.prototype.slice.call(arguments));
    };

    Base.prototype.conformsTo = function (protocol) {
        return $classOf(this).conformsTo(protocol);
    };

    function _metaProperty(metadata) {
        var d = _metaProperty.d || (
            _metaProperty.d = {
                enumerable:   false,
                configurable: false,
                writable:     false
            }
        );
        d.value = metadata;
        return d;
    }
    
    var implement = Base.implement;
    Base.implement = function (source) {
        if ($isFunction(source)) {
            source = source.prototype; 
        }
        var metadata = this.meta;
        implement.call(this, source);
        if (metadata) {
            metadata.apply(MetaStep.Implement, metadata, this.prototype, source);
        }
        return this;
    }

    var extendInstance = Base.prototype.extend;
    Base.prototype.extend = function (key, value) {
        var definition = (arguments.length === 1) ? key : {};
        if (arguments.length >= 2) {
            definition[key] = value;
        }
        var metadata  = $metadata(this);
        extendInstance.call(this, definition);
        if (metadata) {
            metadata.apply(MetaStep.Extend, metadata, this, definition);
        }
        return this;
    }

    function _conformsTo(protocols, protocol) {
        if (!(protocol && (protocol.prototype instanceof Protocol))) {
            return false;
        } else if ((protocol === this) || (this.prototype instanceof protocol)) {
            return true;
        }
        for (var index = 0; index < protocols.length; ++index) {
            var proto = protocols[index];
            if (protocol === proto || proto.conformsTo(protocol)) {
                return true;
            }
        }
        var ancestor = this.ancestor;
        return ancestor && (ancestor !== Base) && (ancestor !== Protocol)
             ? ancestor.conformsTo(protocol)
             : false;
    };

    /**
     * @class {$proxyProtocol}
     * Metamacro to proxy protocol methods through delegate.
     */
    var $proxyProtocol = MetaMacro.extend({
        apply: function (step, metadata, target, definition) {
            for (var key in definition) {
                if (key === 'delegate' || (key in Base.prototype)) {
                    continue;
                }
                var member = target[key];
                if ($isFunction(member)) {
                    (function (methodName) {
                        target[methodName] = function () {
                            var args = Array.prototype.slice.call(arguments);
                            return this.delegate(methodName, args);
                        }
                    })(key);
                }
            }
            if (step === MetaStep.Subclass) {
                metadata.getClass().adoptedBy = Protocol.adoptedBy;
            }
        },
        shouldInherit: True,
        isActive: True
    });
    Protocol.extend     = Base.extend
    Protocol.implement  = Base.implement;;
    Protocol.meta       = new Metadata(Protocol, [new $proxyProtocol]);
    Protocol.meta.apply(MetaStep.Subclass, Protocol.meta, Protocol.prototype);

    /**
     * @class {$inhertStatic}
     * Metamacro to inherit static members in subclass.
     */
    var $inheritStatic = MetaMacro.extend({
        constructor: function (/*members*/) {
            var _members = Array.prototype.slice.call(arguments);
            this.extend({
                apply: function (step, metadata, target) {
                    if (step === MetaStep.Subclass) {
                        var clazz    = metadata.getClass(),
                            ancestor = $ancestorOf(clazz);
                        if (_members.length > 0) {
                            for (var i = 0; i < _members.length; ++i) {
                                var member = _members[i];
                                if (!(member in clazz)) {
                                    clazz[member] = ancestor[member];
                                }
                            }
                        } else {
                            for (var key in ancestor) {
                                if (ancestor !== Base && ancestor !== Object &&
                                    ancestor.hasOwnProperty(key) && !(key in clazz)) {
                                    clazz[key] = ancestor[key];
                                }
                            }
                        }
                    }
                }
            });
        },
        shouldInherit: True
    });

    /**
     * @class {$properties}
     * Metamacro to create properties.
     */
    var $properties = MetaMacro.extend({
        apply: function _(step, metadata, target, definition) {
            if ($isNothing(definition) || !definition.hasOwnProperty('$properties')) {
                return;
            }
            var properties = definition['$properties'], types;
            for (var name in properties) {
                var spec = _.spec || (_.spec = {
                    enumerable:   true,
                    configurable: true
                    }),
                    property  = properties[name],
                    type      = $type.test(property);
                spec.value    = Modifier.unwrap(property);
                spec.writable = !$readonly.test(property);
                if (type) {
                    (types || (types = {}))[name] = spec.value;
                    delete spec.value;
                }
                Object.defineProperty(target, name, spec);
            }
            if (types) {
                metadata.linkBase('getPropertyType').extend({
                    getPropertyType: function (name) {
                        return types[name] || this.base(name);
                    }
                });
            }
            delete definition['$properties'];
        },
        shouldInherit: True,
        isActive: True
    });

    /**
     * @class {$inferProperties}
     * Metamacro to derive properties from existng methods.
     */
    var $inferProperties = MetaMacro.extend({
        apply: function _(step, meatadata, target, definition) {
            for (var key in definition) {
                var value = definition[key];
                if (!$isFunction(value)) {
                    continue;
                }
                var spec = _.spec || (_.spec = {
                    enumerable: true
                });
                _inferProperty(key, value, definition, spec);
                var name = spec.name;
                if (name && name.length > 0) {
                    name = name.charAt(0).toLowerCase() + name.slice(1);
                    if (!(name in target)) {
                        Object.defineProperty(target, name, spec);
                    }
                }
            }
        },
        shouldInherit: True,
        isActive: True
    });

    function _inferProperty(key, value, definition, spec) {
        if (key.lastIndexOf('get', 0) === 0) {
            spec.name = key.substring(3);
            spec.get  = value;
        } else if (key.lastIndexOf('is', 0) === 0) {
            spec.name = key.substring(2);
            spec.get  = value;
        } else if (key.lastIndexOf('set', 0) === 0) {
            spec.name = key.substring(3);
            spec.set  = value;
        }
        if (spec.get) {
            spec.set = definition['set' + spec.name];
        }
    }

    /**
     * @class {Miruken}
     * Base class to prefer coercion over casting.
     */
    var Miruken = Base.extend({
        constructor: function () {
            this.base.apply(this, arguments);
        }
    }, {
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });

    /**
     * @protocol {Disposing}
     */
    var Disposing = Protocol.extend({
        /**
         * Releases the object.
         */
        dispose: function () {}
    });

    /**
     * @class {DisposingMixin}
     */
    var DisposingMixin = Module.extend({
        dispose: function (object) {
            if ($isFunction(object._dispose)) {
                object._dispose();
                object.dispose = Undefined;  // dispose once
            }
        }
    });

    /**
     * @protocol {Parenting}
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @returns {Any} the new child.
         */
        newChild: function () {}
    });

    /**
     * @protocol {Starting}
     */
    var Starting = Protocol.extend({
        start: function () {}
    });

    /**
     * @class {Startup}
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
    });

    /**
     * @function $using
     * Convenience function for disposing resources.
     * @param    {Disposing}           disposing  - object to dispose
     * @param    {Function | Promise}  action     - block or Promise
     * @param    {Object}              context    - block context
     * @returns  {Any} result of executing action in context.
     */
    function $using(disposing, action, context) {
        if (disposing && $isFunction(disposing.dispose)) {
            if ($isFunction(action)) {
                var result;
                try {
                    result = action.call(context, disposing);
                    return result;
                } finally {
                    if ($isPromise(result)) {
                        action = result;
                    } else {
                        disposing.dispose();
                    }
                }
            } else if (!$isPromise(action)) {
                return;
            }
            action.finally(function () { disposing.dispose(); });
            return action;
        }
    }

    /**
     * @class {Modifier}
     */
    function Modifier() {}
    Modifier.isModified = function (source) {
        return source instanceof Modifier;
    };
    Modifier.unwrap = function (source) {
        return (source instanceof Modifier) 
             ? Modifier.unwrap(source.getSource())
             : source;
    }
    function $createModifier() {
        var allowNew;
        function modifier(source) {
            if (this === global) {
                if (modifier.test(source)) {
                    return source;
                }
                allowNew = true;
                var wrapped = new modifier(source);
                allowNew = false;
                return wrapped;
            } else {
                if (!allowNew) {
                    throw new Error("Modifiers should not be called with the new operator.");
                }
                this.getSource = function () {
                    return source;
                }
            }
        }
        modifier.prototype = new Modifier();
        modifier.test      = function (source) {
            if (source instanceof modifier) {
                return true;
            } else if (source instanceof Modifier) {
                return modifier.test(source.getSource());
            }
            return false;
        }
        return modifier;
    }

    /**
     * @class {ArrayManager}
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            items = items || [];
            this.extend({
                getItems: function () { return items; },
                getIndex: function (index) {
                    if (items.length > index) {
                        return items[index];
                    }
                },
                setIndex: function (index, item) {
                    if ((items.length <= index) ||
                        (items[index] === undefined)) {
                        items[index] = this.mapItem(item);
                    }
                    return this;
                },
                insertIndex: function (index, item) {
                    items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                replaceIndex: function (index, item) {
                    items[index] = this.mapItem(item);
                    return this;
                },
                removeIndex: function (index) {
                    if (items.length > index) {
                        items.splice(index, 1);
                    }
                    return this;
                },
                append: function (/* items */) {
                    var newItems;
                    if (arguments.length === 1 && (arguments[0] instanceof Array)) {
                        newItems = arguments[0];
                    } else if (arguments.length > 0) {
                        newItems = Array.prototype.slice.call(arguments);
                    }
                    if (newItems) {
                        for (var i = 0; i < newItems.length; ++i) {
                            items.push(this.mapItem(newItems[i]));
                        }
                    }
                    return this;
                },
                merge: function (items) {
                    for (var index = 0; index < items.length; ++index) {
                        var item = items[index];
                        if (item !== undefined) {
                            this.setIndex(index, item);
                        }
                    }
                    return this;
                },

            });
        },
        mapItem: function (item) { return item; }
    });

    /**
     * @class {IndexedList}
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     */
    var IndexedList = Base.extend({
        constructor: function(order) {
            var _index = {};
            this.extend({
                isEmpty: function () {
                    return !this.head;
                },
                getIndex: function (index) {
                    return index && _index[index];
                },
                insert: function (node, index) {
                    var indexedNode = this.getIndex(index),
                        insert      = indexedNode;
                    if (index) {
                        insert = insert || this.head;
                        while (insert && order(node, insert) >= 0) {
                            insert = insert.next;
                        }
                    }
                    if (insert) {
                        var prev    = insert.prev;
                        node.next   = insert;
                        node.prev   = prev;
                        insert.prev = node;
                        if (prev) {
                            prev.next = node;
                        }
                        if (this.head === insert) {
                            this.head = node;
                        }
                    } else {
                        delete node.next;
                        var tail = this.tail;
                        if (tail) {
                            node.prev = tail;
                            tail.next = node;
                        } else {
                            this.head = node;
                            delete node.prev;
                        }
                        this.tail = node;
                    }
                    if (index) {
                        node.index = index;
                        if (!indexedNode) {
                            _index[index] = node;
                        }
                    }
                },
                remove: function (node) {
                    var prev = node.prev,
                        next = node.next;
                    if (prev) {
                        if (next) {
                            prev.next = next;
                            next.prev = prev;
                        } else {
                            this.tail = prev;
                            delete prev.next;
                        }
                    } else if (next) {
                        this.head = next;
                        delete next.prev;
                    } else {
                        delete this.head;
                        delete this.tail;
                    }
                    var index = node.index;
                    if (this.getIndex(index) === node) {
                        if (next && next.index === index) {
                            _index[index] = next;
                        } else {
                            delete _index[index];
                        }
                    }
                }
            });
        }
    });

    /**
     * @class {Interceptor}
     */
    var Interceptor = Base.extend({
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * @class {Interceptor}
     */
    var InterceptorSelector = Base.extend({
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * @class {ProxyBuilder}
     */
    var ProxyBuilder = Base.extend({
        buildProxy: function(types, options) {
            if (!(types instanceof Array)) {
                throw new TypeError("ProxyBuilder requires an array of types to proxy.");
            }
            var classes   = Array2.filter(types, $isClass),
                protocols = Array2.filter(types, $isProtocol);
            return _buildProxy(classes, protocols, options || {});
        }
    });

    var PARAMETERS            = 'parameters',
        INTERCEPTORS          = 'interceptors',
        INTERCEPTOR_SELECTORS = 'interceptorSelectors',
        DELEGATE              = 'delegate';

    function _buildProxy(classes, protocols, options) {
        var base  = options.baseType || classes.shift() || Base,
            proxy = base.extend(protocols.concat(classes), {
            constructor: function (facets) {
                this._selectors    = facets[INTERCEPTOR_SELECTORS];
                this._interceptors = facets[INTERCEPTORS];
                this._delegate     = facets[DELEGATE];
                if (base !== Base) {
                    ctor = _proxiedMethod('constructor', this.base, base);
                    ctor.apply(this, facets[PARAMETERS]);
                }
            },
            extend: _proxyExtender,
            getDelegate: function () { return this._delegate; },
            setDelegate: function (value) { this._delegate = value; },
            getInterceptors: function (source, method) {
                return (this._selectors && this._selectors.length > 0)
                     ? Array2.reduce(this._selectors, function (interceptors, selector) {
                           return selector.selectInterceptors(source, method, interceptors);
                       }, this._interceptors)
                     : this._interceptors;
            }
        }, {
            shouldProxy: options.shouldProxy
        });
        var sources    = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied    = {};
        for (var i = 0; i < sources.length; ++i) {
            var source      = sources[i],
                sourceProto = source.prototype;
            for (key in sourceProto) {
                if (!(key in proxied) && !(key in _noProxyMethods)
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var member = $isProtocol(source) ? undefined : sourceProto[key];
                    if ($isNothing(member) || $isFunction(member)) {
                        proxyProto[key] = _proxiedMethod(key, member, proxy);
                    }
                    proxied[key] = true;
                }
            }
        }
        proxy.extend = proxy.implement = _throwProxiesSealedExeception;
        return proxy;
    }

    function _proxyExtender() {
        var proxy     = this.constructor,
            clazz     = proxy.prototype,
            overrides = (arguments.length === 1) ? arguments[0] : {};
        if (arguments.length >= 2) {
            overrides[arguments[0]] = arguments[1];
        }
        for (methodName in overrides) {
            if (!(methodName in _noProxyMethods) && 
                (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
                var method = this[methodName];
                if (method && method.baseMethod) {
                    this[methodName] = method.baseMethod;
                }
                this.base(methodName, overrides[methodName]);
                this[methodName] = _proxiedMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    function _proxiedMethod(key, method, source) {
        var interceptors;
        function proxyMethod () {
            var _this    = this, idx = -1,
                delegate = this.getDelegate(),
                args     = Array.prototype.slice.call(arguments);
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                getMethod: function () { return key; },
                getSource: function () { return source; },
                getArgs: function () { return args; },
                setArgs: function (value) { args = value; },
                useDelegate: function (value) { delegate = value; },
                replaceDelegate: function (value) {
                    _this.setDelegate(value);
                    delegate = value;
                },
                proceed: function () {
                    ++idx;
                    if (interceptors && idx < interceptors.length) {
                        var interceptor = interceptors[idx];
                        return interceptor.intercept(invocation);
                    }
                    if (delegate) {
                        var delegateMethod = delegate[key];
                        if ($isFunction(delegateMethod)) {
                            return delegateMethod.apply(delegate, args);
                        }
                    } else if (method) {
                        return method.apply(_this, args);
                    }
                    throw new Error(lang.format(
                        "Interceptor cannot proceed without a class or delegate method '%1'.",
                        key));
                }
            };
            return invocation.proceed();
        }
        proxyMethod.baseMethod = method;
        return proxyMethod;
    }

    function _throwProxiesSealedExeception()
    {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
    }

    var _noProxyMethods = {
        base: true, extend: true, constructor: true, conformsTo: true,
        getInterceptors: true, getDelegate: true, setDelegate: true
    };

    /**
     * Package extensions
     */
    Package.implement({
        export: function (name, member) {
            this.addName(name, member);
        },
        getProtocols: function (cb) {
            _listContents(this, cb, $isProtocol);
        },
        getClasses: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return $isClass(member) && (memberName != "constructor");
            });
        },
        getPackages: function (cb) {
            _listContents(this, cb, function (member, memberName) {
                return (member instanceof Package) && (memberName != "parent");
            });
        }
    });

    function _listContents(package, cb, filter) {
        if ($isFunction(cb)) {
            for (memberName in package) {
                var member = package[memberName];
                if (!filter || filter(member, memberName)) {
                    cb({ member: member, name: memberName});
                }
            }
        }
    }

    /**
     * @function $isProtocol
     * @param    {Any}     protocol  - protocol to test
     * @returns  {Boolean} true if a protocol.
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * @function $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {Boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * @function $classOf
     * @param    {Object}  instance  - object
     * @returns  {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * @function $ancestorOf
     * @param    {Function} clazz  - clazz
     * @returns  {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * @function $metadata
     * @param    {Object}   source  - class or instance
     * @returns  {Object} source metadata.
     */
    function $metadata(source) {
        if (source) {
            var metadata = source.meta;
            if (!metadata) {
                var clazz = source.constructor;
                return clazz && clazz.meta;
            }
            return metadata;
        }
    }

    /**
     * @function $isString
     * @param    {Any}     str  - string to test
     * @returns  {Boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * @function $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {Boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * @function $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {Boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * @function $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {Boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }

    /**
     * @function $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return (value !== undefined && value !== null);
    }

    /**
     * @function $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {Boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return (value === undefined || value === null);
    }

    /**
     * @function $lift
     * @param    {Any} value  - any value
     * @returns  {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    // =========================================================================
    // Traversing
    // =========================================================================

    /**
     * Traversing enum
     * @enum {Number}
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
        ParentSiblingOrSelf:     13
    });

    /**
     * @protocol {Traversing}
     */
    var Traversing = Protocol.extend({
        /**
         * Traverse a graph of objects.
         * @param {TraversingAxis} axis       - axis of traversal
         * @param {Function}       visitor    - receives visited nodes
         * @param {Object}         [context]  - visitor callback context
         */
        traverse: function (axis, visitor, context) {}
    });

    /**
     * Traversing mixin
     * @class {Traversing}
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
                _traverseParentSiblingOrSelf.call(object, visitor, false, false, context);
                break;
                
            case TraversingAxis.ChildOrSelf:
                _traverseChildren.call(object, visitor, true, context);
                break;

            case TraversingAxis.SiblingOrSelf:
                _traverseParentSiblingOrSelf.call(object, visitor, true, false, context);
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
                
            case TraversingAxis.ParentSiblingOrSelf:
                _traverseParentSiblingOrSelf.call(object, visitor, true, true, context);
                break;

            default:
                throw new Error("Unrecognized TraversingAxis " + axis + '.');
            }
        }
    });

    function checkCircularity(visited, node) {
        if (visited.indexOf(node) !== -1) {
            throw new Error('Circularity detected for node ' + node + '.');
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

    function _traverseParentSiblingOrSelf(visitor, withSelf, withParent, context) {
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
            if (withParent) {
                visitor.call(context, parent);
            }
        }
    }

    var Traversal = Abstract.extend({}, {
        preOrder: function (node, visitor, context) {
            return _preOrder(node, visitor, context, []);
        },
        postOrder: function (node, visitor, context) {
            return _postOrder(node, visitor, context, []);
        },
        levelOrder: function (node, visitor, context) {
            return _levelOrder(node, visitor, context, []);
        },
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

    /**
     * @function _liftMethods
     * @param    {Object} source  - object to lift
     */
    function _liftMethods(source) {
        source = source.prototype;
        for (var key in source) {
            if (!(key in this)) {
                var member = source[key];
                if ($isFunction(member)) {
                    this[key] = member;
                }
            }
        }
    }

    /**
     * @function new
     */
    if (Function.prototype.new === undefined)
        Function.prototype.new = function () {
            var args        = arguments,
                constructor = this;
            function Wrapper () { constructor.apply(this, args); }
            Wrapper.prototype  = constructor.prototype;
            return new Wrapper;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = miruken;
    }

    /**
     * Add miruken and Miruken to the global namespace
     */
    global.miruken = miruken;
    global.Miruken = Miruken;

    eval(this.exports);

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./base2.js":1}],10:[function(require,module,exports){
var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');

new function () { // closure

    /**
     * @namespace miruken.mvc
     */
    var mvc = new base2.Package(this, {
        name:    "mvc",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback,miruken.context",
        exports: "Model,Controller,MasterDetail,MasterDetailAware"
    });

    eval(this.imports);

    /**
     * @class {Model}
     */
    var Model = Base.extend(
         $properties, $inferProperties, $inheritStatic, {
        constructor: function (data) {
            var meta    = $metadata(this),
                model   = meta && meta.getClass(),
                getType = meta && meta.getPropertyType;
            for (var key in data) {
                var value = data[key],
                    type  = getType && getType(key);
                if (key in this) {
                    this[key] = type ? model.map(value) : value;
                } else {
                    var lkey = key.toLowerCase();
                    for (var k in this) {
                        if (k.toLowerCase() === lkey) {
                            this[k] = type ? model.map(value) : value;
                        }
                    }
                }
            }
        },
        pluck: function (/*values*/) {
            var data = {};
            for (var i = 0; i < arguments.length; ++i) {
                var key   = arguments[i],
                    value = this[key];
                if (!$isFunction(value)) {
                    data[key] = value;
                }
            }
            return data;
        }
    }, {
        map: function (value) {
            return typeof value.length == "number"
                 ? mapping = Array2.map(value, this.new, this)
                 : mapping = this.new.call(this, value);
        }
    });

    /**
     * @class {Controller}
     */
    var Controller = CallbackHandler.extend(
        $contextual, $inferProperties);

    /**
     * @protocol {MasterDetail}
     */
    var MasterDetail = Protocol.extend({
        getSelectedDetail: function (detailClass) {},
        getSelectedDetails: function (detailClass) {},
        selectDetail: function (selectedDetail) {},
        deselectDetail: function (selectedDetail) {},
        hasPreviousDetail: function (detailClass) {},
        hasNextDetail: function (detailClass) {},
        getPreviousDetail: function (detailClass) {},
        getNextDetail: function (detailClass) {},
        addDetail: function (detail) {},
        updateDetail: function (detail) {},
        removeDetail: function (detail, deleteIt) {}
    });
    
    /**
     * @protocol {MasterDetailAware}
     */
    var MasterDetailAware = Protocol.extend({
        masterChanged: function (master) {},
        didSelectDetail: function (detail, master) {},
        didDeselectDetail: function (detail, master) {},
        didRemoveDetail: function (detail, master) {}
    });

    eval(this.exports);
}

},{"../callback.js":2,"../context.js":3,"../miruken.js":9}],11:[function(require,module,exports){
var miruken = require('./miruken.js'),
    Promise = require('bluebird');
              require('./callback.js');

new function () { // closure

    /**
     * @namespace miruken.validate
     */
    var validate = new base2.Package(this, {
        name:    "validate",
        version: miruken.version,
        parent:  miruken,
        imports: "miruken,miruken.callback",
        exports: "Validator,ValidationErrorCode,ValidationError,ValidationResult,ValidationCallbackHandler,$validate"
    });

    eval(this.imports);

    var $validate = $define('$validate');

    /**
     * @protocol {Validator}
     */
    var Validator = Protocol.extend({
        /**
         * Validates the object in the scope.
         * @param   {Object} object  - object to validate
         * @param   {Object} scope   - scope of validation
         * @returns {Promise(ValidationResult)} a promise for the validation result
         */
        validate: function (object, scope) {}
    });

    /**
     * ValidationErrorCode enum
     * @enum {Number}
     */
    var ValidationErrorCode = Enum({
        Invalid:           100,
        Required:          101,
        TypeMismatch:      102,
        MutuallyExclusive: 103,
        NumberTooLarge:    104,
        NumberTooSmall:    105,
        DateTooLate:       106,
        DateTooSoon:       107
        });

    /**
     * @class {ValidationError}
     * @param {String} message   - validation error message
     * @param {Object} userInfo  - additional error info
     *   Standard userInfo keys:
     *   key    => identifies invald key
     *   domain => identifies category of error
     *   code   => identifies type of error
     *   source => captures invalid value
     */
    function ValidationError(message, userInfo) {
        this.message  = message;
        this.userInfo = userInfo;
        this.stack    = (new Error).stack;
    }
    ValidationError.prototype             = new Error;
    ValidationError.prototype.constructor = ValidationError;

    // =========================================================================
    // ValidationResult
    // =========================================================================
    
    var $childResultsKey = '__childResults';

    /**
     * @class {ValidationResult}
     */
    var ValidationResult = Base.extend({
        constructor: function (object, scope) {
            var _errors = {};
            this.extend({
                getObject: function () { return object; },
                getScope: function () { return scope; },
                isValid: function () {
                    for (var k in _errors) {
                        return false;
                    }
                    return true;
                },
                getKeyCulprits: function () {
                    var keys = [];
                    for (var k in _errors) {
                        if (k !== $childResultsKey) {
                            keys.push(k);
                        }
                    }
                    return keys;
                },
                getKeyErrors: function (key) { return _errors[key]; },
                addKeyError: function (key, error) {
                    if (!((error instanceof ValidationResult) && error.isValid())) {
                        var keyErrors = _errors[key];
                        if (!keyErrors) {
                            keyErrors = _errors[key] = [];
                        }
                        keyErrors.push(error);
                    }
                    return this;
                },
                getChildResults: function () { 
                    return this.getKeyErrors($childResultsKey);
                },
                addChildResult: function (childResult) {
                    this.addKeyError($childResultsKey, childResult);
                }
            });
        },
        toString: function () {
            var str = "",
                keys = this.getKeyCulprits();
            for (var ki = 0; ki < keys.length; ++ki) {
                var key    = keys[ki],
                    errors = this.getKeyErrors(key);
                str += key;
                for (var ei = 0; ei < errors.length; ++ei) {
                    var error = errors[ei];
                    str += '\n    - ';
                    str += error.message;
                }
                str += '\n';
            }
            return str;
        }
    });

    ValidationResult.implement({
        invalid: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.Invalid, message, source);
        },
        required: function(key, message) {
            _addValidationError(this, key, ValidationErrorCode.Required, message);
        },
        typeMismatch: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.TypeMismatch, message);
        },
        mutuallyExclusive: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.MutuallyExclusive, message);
        },
        numberToLarge: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.NumberToLarge, message);
        },
        numberToSmall: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.NumberToSmall, message);
        },
        dateToLate: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.DateToLate, message);
        },
        dateToSoon: function(key, source, message) {
            _addValidationError(this, key, ValidationErrorCode.DateToSoon, message);
        }
    });

    function _addValidationError(result, key, code, message, source) {
        var userInfo = { key: key, code: code };
        if (source) {
            userInfo.source = source;
        }
        result.addKeyError(key, new ValidationError(message, userInfo));
    }

    /**
     * @class {ValidationCallbackHandler}
     */
    var ValidationCallbackHandler = CallbackHandler.extend({
        validate: function (object, scope) {
            var validation = new ValidationResult(object, scope);
            return Promise.resolve($composer.deferAll(validation)).then(function (handled) {
                return !handled || validation.isValid() ? validation : Promise.reject(validation);
            });
        }
    });

    $handle(CallbackHandler, ValidationResult, function (validation, composer) {
        var target = validation.getObject(),
            source = target && target.constructor;
        if (source) {
            return $validate.dispatch(this, validation, source, composer);
        }
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = validate;
    }

    eval(this.exports);

}

},{"./callback.js":2,"./miruken.js":9,"bluebird":12}],12:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.9.14
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, progress, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var _process = typeof process !== "undefined" ? process : undefined;

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype._withDomain = function(fn) {
    if (_process !== undefined &&
        _process.domain != null &&
        !fn.domain) {
        fn = _process.domain.bind(fn);
    }
    return fn;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    fn = this._withDomain(fn);
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

Async.prototype.invokeLater = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invoke = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.settlePromises = function(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    this._setBoundTo(thisArg);
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._setBoundTo(thisArg);
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    if (maybePromise instanceof Promise) {
        maybePromise._then(function(thisArg) {
            ret._setBoundTo(thisArg);
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._setBoundTo(thisArg);
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    error.stack = reconstructStack(message, stacks);
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow) {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundTo;
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

Promise.prototype._ensurePossibleRejectionHandled = function () {
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            error.stack = parsed.message + "\n" + parsed.stack.join("\n");
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    possiblyUnhandledRejection = typeof fn === "function" ? fn : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    unhandledRejectionHandled = typeof fn === "function" ? fn : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (wrapsPrimitiveReceiver && isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (wrapsPrimitiveReceiver && isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (wrapsPrimitiveReceiver && isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundTo)
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundTo, value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._callback = fn;
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundTo;
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret = tryCatch(nodeback).apply(promise._boundTo, [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundTo;
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundTo, reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex =
        target._addCallbacks(didFulfill, didReject, didProgress, ret, receiver);

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === undefined && this._isBound()) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    this._addCallbacks(fulfill, reject, progress, promise, receiver);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace())
            this._fulfillmentHandler0 = fulfill;
        if (typeof reject === "function") this._rejectionHandler0 = reject;
        if (typeof progress === "function") this._progressHandler0 = progress;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function")
            this[base + 0] = fulfill;
        if (typeof reject === "function")
            this[base + 1] = reject;
        if (typeof progress === "function")
            this[base + 2] = progress;
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundTo, value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);


    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

Promise._makeSelfResolutionError = makeSelfResolutionError;
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./cancel.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./call_get.js')(Promise);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./progress.js')(Promise, PromiseArray);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._unsetRejectionIsUnhandled();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyPropsPattern =
    /^(?:length|name|arguments|caller|prototype|__isPromisified__)$/;
var defaultFilter = function(name, func) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        !util.isClass(func);
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        ret.__isPromisified__ = true;                                        \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    promisified.__isPromisified__ = true;
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        obj[promisifiedKey] = promisifier === makeNodePromisified
                ? makeNodePromisified(key, THIS, key, fn, suffix)
                : promisifier(fn, function() {
                    return makeNodePromisified(key, THIS, key, fn, suffix);
                });
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    this._callback = fn;
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundTo;
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
if (_dereq_("./util.js").isNode) {
    schedule = process.nextTick;
} else if (typeof MutationObserver !== "undefined") {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = function() {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    };
}
module.exports = schedule;

},{"./util.js":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        if (x === value) {
            promise._rejectCallback(
                Promise._makeSelfResolutionError(), false, true);
        } else {
            promise._resolveCallback(value);
        }
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = "operation timed out";
    }
    var err = new TimeoutError(message);
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
        len--;
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = arguments[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = fn.apply(undefined, vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        return tryCatchTarget.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}


var wrapsPrimitiveReceiver = (function() {
    return this !== "string";
}).call("string");

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    if (es5.isES5) {
        var oProto = Object.prototype;
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && obj !== oProto) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        return function(obj) {
            var ret = [];
            /*jshint forin:false */
            for (var key in obj) {
                ret.push(key);
            }
            return ret;
        };
    }

})();

function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);
            if (es5.isES5) return keys.length > 1;
            return keys.length > 0 &&
                   !(keys.length === 1 && keys[0] === "constructor");
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027*/
    function f() {}
    f.prototype = obj;
    return f;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            es5.defineProperty(to, key, es5.getDescriptor(from, key));
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    wrapsPrimitiveReceiver: wrapsPrimitiveReceiver,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":49}],13:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":14}],14:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = []
  , exports = module.exports = {};

/*!
 * Chai version
 */

exports.version = '1.10.0';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }

  return this;
};

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":15,"./chai/config":16,"./chai/core/assertions":17,"./chai/interface/assert":18,"./chai/interface/expect":19,"./chai/interface/should":20,"./chai/utils":31,"assertion-error":40}],15:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');
var NOOP = function() { };

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * @api private
   */

  function Assertion (obj, msg, stack) {
    flag(this, 'ssfi', stack || arguments.callee);
    flag(this, 'object', obj);
    flag(this, 'message', msg);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.addChainableNoop = function(name, fn) {
    util.addChainableMethod(this.prototype, name, NOOP, fn);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /*!
   * ### .assert(expression, message, negateMessage, expected, actual)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String or Function} message or function that returns message to display if fails
   * @param {String or Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (true !== showDiff) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      var msg = util.getMessage(this, arguments)
        , actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":16}],16:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

   includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded,
   * the value is truncated.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40

};

},{}],17:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to
   * improve the readability of your assertions. They
   * do not provide testing capabilities unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   *
   * @name language chains
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'at'
  , 'of', 'same' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });

  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * @name deep
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type.
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contain` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @api public
   */

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var expected = false;
    if (_.type(obj) === 'array' && _.type(val) === 'object') {
      for (var i in obj) {
        if (_.eql(obj[i], val)) {
          expected = true;
          break;
        }
      }
    } else if (_.type(val) === 'object') {
      if (!flag(this, 'negate')) {
        for (var k in val) new Assertion(obj).property(k, val[k]);
        return;
      }
      var subset = {}
      for (var k in val) subset[k] = obj[k]
      expected = _.eql(subset, val);
    } else {
      expected = obj && ~obj.indexOf(val)
    }
    this.assert(
        expected
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everthing').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect('everthing').to.be.ok();
   *     
   * @name ok
   * @api public
   */

  Assertion.addChainableNoop('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(true).to.be.true();
   *
   * @name true
   * @api public
   */

  Assertion.addChainableNoop('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(false).to.be.false();
   *
   * @name false
   * @api public
   */

  Assertion.addChainableNoop('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).not.to.be.null;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(null).to.be.null();
   *
   * @name null
   * @api public
   */

  Assertion.addChainableNoop('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *     expect(null).to.not.be.undefined;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(undefined).to.be.undefined();
   *
   * @name undefined
   * @api public
   */

  Assertion.addChainableNoop('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect(foo).to.exist();
   *
   * @name exist
   * @api public
   */

  Assertion.addChainableNoop('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });


  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     expect([]).to.be.empty();
   *
   * @name empty
   * @api public
   */

  Assertion.addChainableNoop('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;

    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }

    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * Can also be used as a function, which prevents some linter errors.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments();
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addChainableNoop('arguments', checkArguments);
  Assertion.addChainableNoop('Arguments', checkArguments);

  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be at most ' + n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(value)
   *
   * Asserts that the target is greater than or equal to `value`.
   *
   *     expect(10).to.be.at.least(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.least(2);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);
   *
   * @name least
   * @alias gte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be at least ' + n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(value)
   *
   * Asserts that the target is less than or equal to `value`.
   *
   *     expect(5).to.be.at.most(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.most(4);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);
   *
   * @name most
   * @alias lte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };

   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @api public
   */

  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var descriptor = flag(this, 'deep') ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , value = flag(this, 'deep')
        ? _.getPathValue(name, obj)
        : obj[name];

    if (negate && undefined !== val) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          undefined !== value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (undefined !== val) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  });


  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @api public
   */

  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .length(value)
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.length(3);
   *     expect('foobar').to.have.length(6);
   *
   * Can also be used as a chain precursor to a value
   * comparison for the length property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name length
   * @alias lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength);

  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('match', function (re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  });

  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });


  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target has exactly the given keys, or
   * asserts the inclusion of some keys when using the
   * `include` or `contain` modifiers.
   *
   *     expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');
   *
   * @name keys
   * @alias key
   * @param {String...|Array} keys
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true;

    keys = keys instanceof Array
      ? keys
      : Array.prototype.slice.call(arguments);

    if (!keys.length) throw new Error('keys required');

    var actual = Object.keys(obj)
      , expected = keys
      , len = keys.length;

    // Inclusion
    ok = keys.every(function(key){
      return ~actual.indexOf(key);
    });

    // Strict
    if (!flag(this, 'negate') && !flag(this, 'contains')) {
      ok = ok && keys.length == actual.length;
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      str = keys.join(', ') + ', and ' + last;
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
      , expected.sort()
      , actual.sort()
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *     expect(fn).to.not.throw(new RangeError('Out of range.'));
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @api public
   */

  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');

    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;

    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = constructor.prototype.name || constructor.name;
      if (name === 'Error' && constructor !== Error) {
        name = (new constructor()).name;
      }
    } else {
      constructor = null;
    }

    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp}'
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)
          , (err instanceof Error ? err.toString() : err)
        );

        flag(this, 'object', err);
        return this;
      }

      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'
          , name
          , (err instanceof Error ? err.toString() : err)
        );

        if (!errMsg) {
          flag(this, 'object', err);
          return this;
        }
      }

      // next, check message
      var message = 'object' === _.type(err) && "message" in err
        ? err.message
        : '' + err;

      if ((message != null) && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(message)
          , 'expected #{this} to throw error matching #{exp} but got #{act}'
          , 'expected #{this} to throw error not matching #{exp}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }

    var actuallyGot = ''
      , expectedThrown = name !== null
        ? name
        : desiredError
          ? '#{exp}' //_.inspect(desiredError)
          : 'an error';

    if (thrown) {
      actuallyGot = ' but #{act} was thrown'
    }

    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)
    );

    flag(this, 'object', thrownError);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *     Klass.baz = function(){};
   *     expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @param {String} method
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('respondTo', function (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === _.type(obj) && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  });

  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *     function Foo() {}
   *     Foo.bar = function() {}
   *     Foo.prototype.baz = function() {}
   *
   *     expect(Foo).itself.to.respondTo('bar');
   *     expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @param {Function} matcher
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('satisfy', function (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , this.negate ? false : true
      , result
    );
  });

  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('closeTo', function (expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj, msg).is.a('number');
    if (_.type(expected) !== 'number' || _.type(delta) !== 'number') {
      throw new Error('the arguments to closeTo must be numbers');
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  });

  function isSubsetOf(subset, superset, cmp) {
    return subset.every(function(elem) {
      if (!cmp) return superset.indexOf(elem) !== -1;

      return superset.some(function(elem2) {
        return cmp(elem, elem2);
      });
    })
  }

  /**
   * ### .members(set)
   *
   * Asserts that the target is a superset of `set`,
   * or that the target and `set` have the same strictly-equal (===) members.
   * Alternately, if the `deep` flag is set, set members are compared for deep
   * equality.
   *
   *     expect([1, 2, 3]).to.include.members([3, 2]);
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);
   *
   *     expect([4, 2]).to.have.members([2, 4]);
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);
   *
   *     expect([{ id: 1 }]).to.deep.include.members([{ id: 1 }]);
   *
   * @name members
   * @param {Array} set
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj).to.be.an('array');
    new Assertion(subset).to.be.an('array');

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    if (flag(this, 'contains')) {
      return this.assert(
          isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to be a superset of #{act}'
        , 'expected #{this} to not be a superset of #{act}'
        , obj
        , subset
      );
    }

    this.assert(
        isSubsetOf(obj, subset, cmp) && isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to have the same members as #{act}'
        , 'expected #{this} to not have the same members as #{act}'
        , obj
        , subset
    );
  });
};

},{}],18:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .ok(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.ok('everything', 'everything is ok');
   *     assert.ok(false, 'this will fail');
   *
   * @name ok
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.ok = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };

  /**
   * ### .notOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.notOk('everything', 'this will fail');
   *     assert.notOk(false, 'this will pass');
   *
   * @name notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.notOk = function (val, msg) {
    new Assertion(val, msg).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object (as revealed by
   * `Object.prototype.toString`).
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object.
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Works
   * for strings and arrays.
   *i
   *     assert.notInclude('foobar', 'baz', 'string not include substring');
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude).not.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };

  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };

  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };

  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };

  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 5, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };

  /**
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throw(fn, 'function throws a reference error');
   *     assert.throw(fn, /function throws a reference error/);
   *     assert.throw(fn, ReferenceError);
   *     assert.throw(fn, ReferenceError, 'function throws a reference error');
   *     assert.throw(fn, ReferenceError, /function throws a reference error/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.Throw = function (fn, errt, errs, msg) {
    if ('string' === typeof errt || errt instanceof RegExp) {
      errs = errt;
      errt = null;
    }

    var assertErr = new Assertion(fn, msg).to.Throw(errt, errs);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }

    new Assertion(fn, msg).to.not.Throw(type);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    if (!~['==', '===', '>', '>=', '<', '<=', '!=', '!=='].indexOf(operator)) {
      throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(eval(val + operator + val2), msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members.
   * Order is not taken into account.
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset`.
   * Order is not taken into account.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.members(subset);
  }

  /*!
   * Undocumented / untested
   */

  assert.ifError = function (val, msg) {
    new Assertion(val, msg).to.not.be.ok;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('Throw', 'throw')
  ('Throw', 'throws');
};

},{}],19:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };
};


},{}],20:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String || this instanceof Number) {
        return new Assertion(this.constructor(this), null, shouldGetter);
      } else if (this instanceof Boolean) {
        return new Assertion(this == true, null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],21:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var transferFlags = require('./transferFlags');
var flag = require('./flag');
var config = require('../config');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function () {
        chainableBehavior.chainingBehavior.call(this);

        var assert = function assert() {
          var old_ssfi = flag(this, 'ssfi');
          if (old_ssfi && config.includeStack === false)
            flag(this, 'ssfi', assert);
          var result = chainableBehavior.method.apply(this, arguments);
          return result === undefined ? this : result;
        };

        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = assert.__proto__ = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (!excludeNames.test(asserterName)) {
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
              Object.defineProperty(assert, asserterName, pd);
            }
          });
        }

        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};

},{"../config":16,"./flag":24,"./transferFlags":38}],22:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');

/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @name addMethod
 * @api public
 */
var flag = require('./flag');

module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var old_ssfi = flag(this, 'ssfi');
    if (old_ssfi && config.includeStack === false)
      flag(this, 'ssfi', ctx[name]);
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{"../config":16,"./flag":24}],23:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @name addProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],24:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### flag(object ,key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object (constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @name flag
 * @api private
 */

module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],25:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],26:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],27:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @name getMessage
 * @api public
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#{this}/g, objDisplay(val))
    .replace(/#{act}/g, objDisplay(actual))
    .replace(/#{exp}/g, objDisplay(expected));

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":24,"./getActual":25,"./inspect":32,"./objDisplay":33}],28:[function(require,module,exports){
/*!
 * Chai - getName utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 */

module.exports = function (func) {
  if (func.name) return func.name;

  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};

},{}],29:[function(require,module,exports){
/*!
 * Chai - getPathValue utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @name getPathValue
 * @api public
 */

var getPathValue = module.exports = function (path, obj) {
  var parsed = parsePath(path);
  return _getPathValue(parsed, obj);
};

/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath (path) {
  var str = path.replace(/\[/g, '.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /\[(\d+)\]$/
      , mArr = re.exec(value)
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value };
  });
};

/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */

function _getPathValue (parsed, obj) {
  var tmp = obj
    , res;
  for (var i = 0, l = parsed.length; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
};

},{}],30:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(subject);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(subject);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],31:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Main exports
 */

var exports = module.exports = {};

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('./type');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path value
 */

exports.getPathValue = require('./getPathValue');

/*!
 * Function name
 */

exports.getName = require('./getName');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');


},{"./addChainableMethod":21,"./addMethod":22,"./addProperty":23,"./flag":24,"./getActual":25,"./getMessage":27,"./getName":28,"./getPathValue":29,"./inspect":32,"./objDisplay":33,"./overwriteChainableMethod":34,"./overwriteMethod":35,"./overwriteProperty":36,"./test":37,"./transferFlags":38,"./type":39,"deep-eql":41}],32:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('./getName');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"./getEnumerableProperties":26,"./getName":28,"./getProperties":30}],33:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @api public
 */

module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":16,"./inspect":32}],34:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteChainableMethod (ctx, name, fn)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'length',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.length(3);
 *     expect(myFoo).to.have.length.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function () {
    var result = chainingBehavior(_chainingBehavior).call(this);
    return result === undefined ? this : result;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function () {
    var result = method(_method).apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{}],35:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @name overwriteMethod
 * @api public
 */

module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };

  if (_method && 'function' === typeof _method)
    _super = _method;

  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};

},{}],36:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @name overwriteProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],37:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":24}],38:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags too; usually a new assertion
 * @param {Boolean} includeAll
 * @name getAllFlags
 * @api private
 */

module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],39:[function(require,module,exports){
/*!
 * Chai - type utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Arguments]': 'arguments'
  , '[object Array]': 'array'
  , '[object Date]': 'date'
  , '[object Function]': 'function'
  , '[object Number]': 'number'
  , '[object RegExp]': 'regexp'
  , '[object String]': 'string'
};

/**
 * ### type(object)
 *
 * Better implementation of `typeof` detection that can
 * be used cross-browser. Handles the inconsistencies of
 * Array, `null`, and `undefined` detection.
 *
 *     utils.type({}) // 'object'
 *     utils.type(null) // `null'
 *     utils.type(undefined) // `undefined`
 *     utils.type([]) // `array`
 *
 * @param {Mixed} object to detect type of
 * @name type
 * @api private
 */

module.exports = function (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
};

},{}],40:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || arguments.callee;
  if (ssf && Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],41:[function(require,module,exports){
module.exports = require('./lib/eql');

},{"./lib/eql":42}],42:[function(require,module,exports){
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var type = require('type-detect');

/*!
 * Buffer.isBuffer browser shim
 */

var Buffer;
try { Buffer = require('buffer').Buffer; }
catch(ex) {
  Buffer = {};
  Buffer.isBuffer = function() { return false; }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;

/**
 * Assert super-strict (egal) equality between
 * two objects of any type.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Array} memoised (optional)
 * @return {Boolean} equal match
 */

function deepEqual(a, b, m) {
  if (sameValue(a, b)) {
    return true;
  } else if ('date' === type(a)) {
    return dateEqual(a, b);
  } else if ('regexp' === type(a)) {
    return regexpEqual(a, b);
  } else if (Buffer.isBuffer(a)) {
    return bufferEqual(a, b);
  } else if ('arguments' === type(a)) {
    return argumentsEqual(a, b, m);
  } else if (!typeEqual(a, b)) {
    return false;
  } else if (('object' !== type(a) && 'object' !== type(b))
  && ('array' !== type(a) && 'array' !== type(b))) {
    return sameValue(a, b);
  } else {
    return objectEqual(a, b, m);
  }
}

/*!
 * Strict (egal) equality test. Ensures that NaN always
 * equals NaN and `-0` does not equal `+0`.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} equal match
 */

function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

/*!
 * Compare the types of two given objects and
 * return if they are equal. Note that an Array
 * has a type of `array` (not `object`) and arguments
 * have a type of `arguments` (not `array`/`object`).
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function typeEqual(a, b) {
  return type(a) === type(b);
}

/*!
 * Compare two Date objects by asserting that
 * the time values are equal using `saveValue`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {Boolean} result
 */

function dateEqual(a, b) {
  if ('date' !== type(b)) return false;
  return sameValue(a.getTime(), b.getTime());
}

/*!
 * Compare two regular expressions by converting them
 * to string and checking for `sameValue`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean} result
 */

function regexpEqual(a, b) {
  if ('regexp' !== type(b)) return false;
  return sameValue(a.toString(), b.toString());
}

/*!
 * Assert deep equality of two `arguments` objects.
 * Unfortunately, these must be sliced to arrays
 * prior to test to ensure no bad behavior.
 *
 * @param {Arguments} a
 * @param {Arguments} b
 * @param {Array} memoize (optional)
 * @return {Boolean} result
 */

function argumentsEqual(a, b, m) {
  if ('arguments' !== type(b)) return false;
  a = [].slice.call(a);
  b = [].slice.call(b);
  return deepEqual(a, b, m);
}

/*!
 * Get enumerable properties of a given object.
 *
 * @param {Object} a
 * @return {Array} property names
 */

function enumerable(a) {
  var res = [];
  for (var key in a) res.push(key);
  return res;
}

/*!
 * Simple equality for flat iterable objects
 * such as Arrays or Node.js buffers.
 *
 * @param {Iterable} a
 * @param {Iterable} b
 * @return {Boolean} result
 */

function iterableEqual(a, b) {
  if (a.length !==  b.length) return false;

  var i = 0;
  var match = true;

  for (; i < a.length; i++) {
    if (a[i] !== b[i]) {
      match = false;
      break;
    }
  }

  return match;
}

/*!
 * Extension to `iterableEqual` specifically
 * for Node.js Buffers.
 *
 * @param {Buffer} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(b)) return false;
  return iterableEqual(a, b);
}

/*!
 * Block for `objectEqual` ensuring non-existing
 * values don't get in.
 *
 * @param {Mixed} object
 * @return {Boolean} result
 */

function isValue(a) {
  return a !== null && a !== undefined;
}

/*!
 * Recursively check the equality of two objects.
 * Once basic sameness has been established it will
 * defer to `deepEqual` for each enumerable key
 * in the object.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function objectEqual(a, b, m) {
  if (!isValue(a) || !isValue(b)) {
    return false;
  }

  if (a.prototype !== b.prototype) {
    return false;
  }

  var i;
  if (m) {
    for (i = 0; i < m.length; i++) {
      if ((m[i][0] === a && m[i][1] === b)
      ||  (m[i][0] === b && m[i][1] === a)) {
        return true;
      }
    }
  } else {
    m = [];
  }

  try {
    var ka = enumerable(a);
    var kb = enumerable(b);
  } catch (ex) {
    return false;
  }

  ka.sort();
  kb.sort();

  if (!iterableEqual(ka, kb)) {
    return false;
  }

  m.push([ a, b ]);

  var key;
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], m)) {
      return false;
    }
  }

  return true;
}

},{"buffer":45,"type-detect":43}],43:[function(require,module,exports){
module.exports = require('./lib/type');

},{"./lib/type":44}],44:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Array]': 'array'
  , '[object RegExp]': 'regexp'
  , '[object Function]': 'function'
  , '[object Arguments]': 'arguments'
  , '[object Date]': 'date'
};

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */

function getType (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library () {
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function (type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function (obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],45:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding) {
  var self = this
  if (!(self instanceof Buffer)) return new Buffer(subject, encoding)

  var type = typeof subject
  var length

  if (type === 'number') {
    length = +subject
  } else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) {
    // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data)) subject = subject.data
    length = +subject.length
  } else {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (length > kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum size: 0x' +
      kMaxLength.toString(16) + ' bytes')
  }

  if (length < 0) length = 0
  else length >>>= 0 // coerce to uint32

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    self = Buffer._augment(new Uint8Array(length)) // eslint-disable-line consistent-this
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    self.length = length
    self._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    self._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++) {
        self[i] = subject.readUInt8(i)
      }
    } else {
      for (i = 0; i < length; i++) {
        self[i] = ((subject[i] % 256) + 256) % 256
      }
    }
  } else if (type === 'string') {
    self.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < length; i++) {
      self[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize) self.parent = rootParent

  return self
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, totalLength) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function byteLength (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, target_start, start, end) {
  var self = this // source

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || self.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= self.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - target_start < end - start) {
    end = target.length - target_start + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":46,"ieee754":47,"is-array":48}],46:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],47:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],48:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],49:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],50:[function(require,module,exports){
'use strict';

// ### Module dependencies
require('colors');
var Utils = require('./utils');

exports.version = require('../package.json').version;

// ### Render function
// *Parameters:*
//
// * **`data`**: Data to render
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       emptyArrayMsg: '(empty)', // Rendered message on empty strings
//       keysColor: 'blue',        // Color for keys in hashes
//       dashColor: 'red',         // Color for the dashes in arrays
//       stringColor: 'grey',      // Color for strings
//       defaultIndentation: 2     // Indentation on nested objects
//     }
exports.render = function render(data, options, indentation) {
  // Default values
  indentation = indentation || 0;
  options = options || {};
  options.emptyArrayMsg = options.emptyArrayMsg || '(empty array)';
  options.keysColor = options.keysColor || 'green';
  options.dashColor = options.dashColor || 'green';
  options.numberColor = options.numberColor || 'blue';
  options.defaultIndentation = options.defaultIndentation || 2;
  options.noColor = !!options.noColor;

  options.stringColor = options.stringColor || null;

  var output = [];

  // Helper function to detect if an object can be directly serializable
  var isSerializable = function(input, onlyPrimitives) {
    if (typeof input === 'boolean' ||
        typeof input === 'number' || input === null || 
		input instanceof Date) {
      return true;
    }
    if (typeof input === 'string' && input.indexOf('\n') === -1) {
      return true;
    }

    if (options.inlineArrays && !onlyPrimitives) {
      if (Array.isArray(input) && isSerializable(input[0], true)) {
        return true;
      }
    }

    return false;
  };

  var indentLines = function(string, spaces){
    var lines = string.split('\n');
    lines = lines.map(function(line){
      return Utils.indent(spaces) + line;
    });
    return lines.join('\n');
  };

  var addColorToData = function(input) {
    if (options.noColor) {
      return input;
    }

    if (typeof input === 'string') {
      // Print strings in regular terminal color
      return options.stringColor ? input[options.stringColor] : input;
    }

    var sInput = input + '';

    if (input === true) {
      return sInput.green;
    }
    if (input === false) {
      return sInput.red;
    }
    if (input === null) {
      return sInput.grey;
    }
    if (typeof input === 'number') {
      return sInput[options.numberColor];
    }
    if (Array.isArray(input)) {
      return input.join(', ');
    }

    return sInput;
  };

  // Render a string exactly equal
  if (isSerializable(data)) {	
    output.push(Utils.indent(indentation) + addColorToData(data));
  }
  else if (typeof data === 'string') {
    //unserializable string means it's multiline
    output.push(Utils.indent(indentation) + '"""');
    output.push(indentLines(data, indentation + options.defaultIndentation));
    output.push(Utils.indent(indentation) + '"""');
  }
  else if (Array.isArray(data)) {
    // If the array is empty, render the `emptyArrayMsg`
    if (data.length === 0) {
      output.push(Utils.indent(indentation) + options.emptyArrayMsg);
    } else {
      data.forEach(function(element) {
        // Prepend the dash at the begining of each array's element line
        var line = ('- ');
        if (!options.noColor) {
          line = line[options.dashColor];
        }
        line = Utils.indent(indentation) + line;

        // If the element of the array is a string, bool, number, or null
        // render it in the same line
        if (isSerializable(element)) {
          line += exports.render(element, options);
          output.push(line);

        // If the element is an array or object, render it in next line
        } else {
          output.push(line);
          output.push(exports.render(
            element, options, indentation + options.defaultIndentation
          ));
        }
      });
    }
  }
  else if (typeof data === 'object') {
    // Get the size of the longest index to align all the values
    var maxIndexLength = Utils.getMaxIndexLength(data);
    var key;
    var isError = data instanceof Error;

    Object.getOwnPropertyNames(data).forEach(function(i) {
      // Prepend the index at the beginning of the line
      key = (i + ': ');
      if (!options.noColor) {
        key = key[options.keysColor];
      }
      key = Utils.indent(indentation) + key;

      // Skip `undefined`, it's not a valid JSON value.
      if (data[i] === undefined) {
        return;
      }

      // If the value is serializable, render it in the same line
      if (isSerializable(data[i]) && (!isError || i !== 'stack')) {
        key += exports.render(data[i], options, maxIndexLength - i.length);
        output.push(key);

        // If the index is an array or object, render it in next line
      } else {
        output.push(key);
        output.push(
          exports.render(
            isError && i === 'stack' ? data[i].split('\n') : data[i],
            options,
            indentation + options.defaultIndentation
          )
        );
      }
    });
  }
  // Return all the lines as a string
  return output.join('\n');
};

// ### Render from string function
// *Parameters:*
//
// * **`data`**: Data to render as a string
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       emptyArrayMsg: '(empty)', // Rendered message on empty strings
//       keysColor: 'blue',        // Color for keys in hashes
//       dashColor: 'red',         // Color for the dashes in arrays
//       defaultIndentation: 2     // Indentation on nested objects
//     }
exports.renderString = function renderString(data, options, indentation) {

  var output = '';
  var parsedData;
  // If the input is not a string or if it's empty, just return an empty string
  if (typeof data !== 'string' || data === '') {
    return '';
  }

  // Remove non-JSON characters from the beginning string
  if (data[0] !== '{' && data[0] !== '[') {
    var beginingOfJson;
    if (data.indexOf('{') === -1) {
      beginingOfJson = data.indexOf('[');
    } else if (data.indexOf('[') === -1) {
      beginingOfJson = data.indexOf('{');
    } else if (data.indexOf('{') < data.indexOf('[')) {
      beginingOfJson = data.indexOf('{');
    } else {
      beginingOfJson = data.indexOf('[');
    }
    output += data.substr(0, beginingOfJson) + '\n';
    data = data.substr(beginingOfJson);
  }

  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    // Return an error in case of an invalid JSON
    return 'Error:'.red + ' Not valid JSON!';
  }

  // Call the real render() method
  output += exports.render(parsedData, options, indentation);
  return output;
};

},{"../package.json":53,"./utils":51,"colors":52}],51:[function(require,module,exports){
'use strict';

/**
 * Creates a string with the same length as `numSpaces` parameter
 **/
exports.indent = function indent(numSpaces) {
  return new Array(numSpaces+1).join(' ');
};

/**
 * Gets the string length of the longer index in a hash
 **/
exports.getMaxIndexLength = function(input) {
  var maxWidth = 0;

  Object.getOwnPropertyNames(input).forEach(function(key) {
    maxWidth = Math.max(maxWidth, key.length);
  });
  return maxWidth;
};

},{}],52:[function(require,module,exports){
/*
colors.js

Copyright (c) 2010

Marak Squires
Alexis Sellier (cloudhead)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var isHeadless = false;

if (typeof module !== 'undefined') {
  isHeadless = true;
}

if (!isHeadless) {
  var exports = {};
  var module = {};
  var colors = exports;
  exports.mode = "browser";
} else {
  exports.mode = "console";
}

//
// Prototypes the string object to have additional method calls that add terminal colors
//
var addProperty = function (color, func) {
  exports[color] = function (str) {
    return func.apply(str);
  };
  String.prototype.__defineGetter__(color, func);
};

function stylize(str, style) {

  var styles;

  if (exports.mode === 'console') {
    styles = {
      //styles
      'bold'      : ['\x1B[1m',  '\x1B[22m'],
      'italic'    : ['\x1B[3m',  '\x1B[23m'],
      'underline' : ['\x1B[4m',  '\x1B[24m'],
      'inverse'   : ['\x1B[7m',  '\x1B[27m'],
      'strikethrough' : ['\x1B[9m',  '\x1B[29m'],
      //text colors
      //grayscale
      'white'     : ['\x1B[37m', '\x1B[39m'],
      'grey'      : ['\x1B[90m', '\x1B[39m'],
      'black'     : ['\x1B[30m', '\x1B[39m'],
      //colors
      'blue'      : ['\x1B[34m', '\x1B[39m'],
      'cyan'      : ['\x1B[36m', '\x1B[39m'],
      'green'     : ['\x1B[32m', '\x1B[39m'],
      'magenta'   : ['\x1B[35m', '\x1B[39m'],
      'red'       : ['\x1B[31m', '\x1B[39m'],
      'yellow'    : ['\x1B[33m', '\x1B[39m'],
      //background colors
      //grayscale
      'whiteBG'     : ['\x1B[47m', '\x1B[49m'],
      'greyBG'      : ['\x1B[49;5;8m', '\x1B[49m'],
      'blackBG'     : ['\x1B[40m', '\x1B[49m'],
      //colors
      'blueBG'      : ['\x1B[44m', '\x1B[49m'],
      'cyanBG'      : ['\x1B[46m', '\x1B[49m'],
      'greenBG'     : ['\x1B[42m', '\x1B[49m'],
      'magentaBG'   : ['\x1B[45m', '\x1B[49m'],
      'redBG'       : ['\x1B[41m', '\x1B[49m'],
      'yellowBG'    : ['\x1B[43m', '\x1B[49m']
    };
  } else if (exports.mode === 'browser') {
    styles = {
      //styles
      'bold'      : ['<b>',  '</b>'],
      'italic'    : ['<i>',  '</i>'],
      'underline' : ['<u>',  '</u>'],
      'inverse'   : ['<span style="background-color:black;color:white;">',  '</span>'],
      'strikethrough' : ['<del>',  '</del>'],
      //text colors
      //grayscale
      'white'     : ['<span style="color:white;">',   '</span>'],
      'grey'      : ['<span style="color:gray;">',    '</span>'],
      'black'     : ['<span style="color:black;">',   '</span>'],
      //colors
      'blue'      : ['<span style="color:blue;">',    '</span>'],
      'cyan'      : ['<span style="color:cyan;">',    '</span>'],
      'green'     : ['<span style="color:green;">',   '</span>'],
      'magenta'   : ['<span style="color:magenta;">', '</span>'],
      'red'       : ['<span style="color:red;">',     '</span>'],
      'yellow'    : ['<span style="color:yellow;">',  '</span>'],
      //background colors
      //grayscale
      'whiteBG'     : ['<span style="background-color:white;">',   '</span>'],
      'greyBG'      : ['<span style="background-color:gray;">',    '</span>'],
      'blackBG'     : ['<span style="background-color:black;">',   '</span>'],
      //colors
      'blueBG'      : ['<span style="background-color:blue;">',    '</span>'],
      'cyanBG'      : ['<span style="background-color:cyan;">',    '</span>'],
      'greenBG'     : ['<span style="background-color:green;">',   '</span>'],
      'magentaBG'   : ['<span style="background-color:magenta;">', '</span>'],
      'redBG'       : ['<span style="background-color:red;">',     '</span>'],
      'yellowBG'    : ['<span style="background-color:yellow;">',  '</span>']
    };
  } else if (exports.mode === 'none') {
    return str + '';
  } else {
    console.log('unsupported mode, try "browser", "console" or "none"');
  }
  return styles[style][0] + str + styles[style][1];
}

function applyTheme(theme) {

  //
  // Remark: This is a list of methods that exist
  // on String that you should not overwrite.
  //
  var stringPrototypeBlacklist = [
    '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'charAt', 'constructor',
    'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf', 'charCodeAt',
    'indexOf', 'lastIndexof', 'length', 'localeCompare', 'match', 'replace', 'search', 'slice', 'split', 'substring',
    'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight'
  ];

  Object.keys(theme).forEach(function (prop) {
    if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
      console.log('warn: '.red + ('String.prototype' + prop).magenta + ' is probably something you don\'t want to override. Ignoring style name');
    }
    else {
      if (typeof(theme[prop]) === 'string') {
        addProperty(prop, function () {
          return exports[theme[prop]](this);
        });
      }
      else {
        addProperty(prop, function () {
          var ret = this;
          for (var t = 0; t < theme[prop].length; t++) {
            ret = exports[theme[prop][t]](ret);
          }
          return ret;
        });
      }
    }
  });
}


//
// Iterate through all default styles and colors
//
var x = ['bold', 'underline', 'strikethrough', 'italic', 'inverse', 'grey', 'black', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta', 'greyBG', 'blackBG', 'yellowBG', 'redBG', 'greenBG', 'blueBG', 'whiteBG', 'cyanBG', 'magentaBG'];
x.forEach(function (style) {

  // __defineGetter__ at the least works in more browsers
  // http://robertnyman.com/javascript/javascript-getters-setters.html
  // Object.defineProperty only works in Chrome
  addProperty(style, function () {
    return stylize(this, style);
  });
});

function sequencer(map) {
  return function () {
    if (!isHeadless) {
      return this.replace(/( )/, '$1');
    }
    var exploded = this.split(""), i = 0;
    exploded = exploded.map(map);
    return exploded.join("");
  };
}

var rainbowMap = (function () {
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
  return function (letter, i, exploded) {
    if (letter === " ") {
      return letter;
    } else {
      return stylize(letter, rainbowColors[i++ % rainbowColors.length]);
    }
  };
})();

exports.themes = {};

exports.addSequencer = function (name, map) {
  addProperty(name, sequencer(map));
};

exports.addSequencer('rainbow', rainbowMap);
exports.addSequencer('zebra', function (letter, i, exploded) {
  return i % 2 === 0 ? letter : letter.inverse;
});

exports.setTheme = function (theme) {
  if (typeof theme === 'string') {
    try {
      exports.themes[theme] = require(theme);
      applyTheme(exports.themes[theme]);
      return exports.themes[theme];
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    applyTheme(theme);
  }
};


addProperty('stripColors', function () {
  return ("" + this).replace(/\x1B\[\d+m/g, '');
});

// please no
function zalgo(text, options) {
  var soul = {
    "up" : [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚'
    ],
    "down" : [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣'
    ],
    "mid" : [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉'
    ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function is_char(character) {
    var bool = false;
    all.filter(function (i) {
      bool = (i === character);
    });
    return bool;
  }

  function heComes(text, options) {
    var result = '', counts, l;
    options = options || {};
    options["up"] = options["up"] || true;
    options["mid"] = options["mid"] || true;
    options["down"] = options["down"] || true;
    options["size"] = options["size"] || "maxi";
    text = text.split('');
    for (l in text) {
      if (is_char(l)) {
        continue;
      }
      result = result + text[l];
      counts = {"up" : 0, "down" : 0, "mid" : 0};
      switch (options.size) {
      case 'mini':
        counts.up = randomNumber(8);
        counts.min = randomNumber(2);
        counts.down = randomNumber(8);
        break;
      case 'maxi':
        counts.up = randomNumber(16) + 3;
        counts.min = randomNumber(4) + 1;
        counts.down = randomNumber(64) + 3;
        break;
      default:
        counts.up = randomNumber(8) + 1;
        counts.mid = randomNumber(6) / 2;
        counts.down = randomNumber(8) + 1;
        break;
      }

      var arr = ["up", "mid", "down"];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0 ; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  return heComes(text);
}


// don't summon zalgo
addProperty('zalgo', function () {
  return zalgo(this);
});

},{}],53:[function(require,module,exports){
module.exports={
  "author": {
    "name": "Rafael de Oleza",
    "email": "rafeca@gmail.com",
    "url": "https://github.com/rafeca"
  },
  "name": "prettyjson",
  "description": "Package for formatting JSON data in a coloured YAML-style, perfect for CLI output",
  "version": "1.1.0",
  "homepage": "http://rafeca.com/prettyjson",
  "keywords": [
    "json",
    "cli",
    "formatting",
    "colors"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/rafeca/prettyjson.git"
  },
  "bugs": {
    "url": "https://github.com/rafeca/prettyjson/issues"
  },
  "main": "./lib/prettyjson",
  "scripts": {
    "test": "npm run jshint && mocha --reporter spec",
    "testwin": "node ./node_modules/mocha/bin/mocha --reporter spec",
    "jshint": "jshint lib/*.js",
    "coverage": "istanbul cover _mocha --report lcovonly -- -R spec",
    "coveralls": "npm run coverage && cat ./coverage/lcov.info | coveralls && rm -rf ./coverage",
    "changelog": "git log $(git describe --tags --abbrev=0)..HEAD --pretty='* %s' --first-parent"
  },
  "bin": {
    "prettyjson": "./bin/prettyjson"
  },
  "engines": {
    "node": ">= 0.10.0 < 0.12.0"
  },
  "dependencies": {
    "colors": "0.6.2",
    "minimist": "0.0.8"
  },
  "devDependencies": {
    "mocha": "^1.18.2",
    "should": "^3.1.4",
    "jshint": "^2.4.4",
    "getversion": "~0.1.1",
    "istanbul": "~0.2.4",
    "coveralls": "^2.10.0",
    "mocha-lcov-reporter": "0.0.1"
  },
  "gitHead": "5ab0755baae84985f094d27ad0332d6437f34e86",
  "_id": "prettyjson@1.1.0",
  "_shasum": "de1bc2711a5b7b7a944c217849ec65f299bd4751",
  "_from": "prettyjson@>=1.0.0 <2.0.0",
  "_npmVersion": "2.4.1",
  "_nodeVersion": "0.10.32",
  "_npmUser": {
    "name": "rafeca",
    "email": "rafeca@gmail.com"
  },
  "maintainers": [
    {
      "name": "rafeca",
      "email": "rafeca@gmail.com"
    }
  ],
  "dist": {
    "shasum": "de1bc2711a5b7b7a944c217849ec65f299bd4751",
    "tarball": "http://registry.npmjs.org/prettyjson/-/prettyjson-1.1.0.tgz"
  },
  "directories": {},
  "_resolved": "https://registry.npmjs.org/prettyjson/-/prettyjson-1.1.0.tgz"
}

},{}],54:[function(require,module,exports){
var miruken  = require('../lib/miruken.js'),
    callback = require('../lib/callback.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(callback.namespace);

new function () { // closure

    var callback_test = new base2.Package(this, {
        name:    "callback_test",
        exports: "Guest,Dealer,PitBoss,DrinkServer,Game,Security,Level1Security,Level2Security,WireMoney,CountMoney,Accountable,Cashier,Activity,CardTable,Casino"
    });

    eval(this.imports);

    var Guest = Base.extend({
        constructor: function (age) {
            this.extend({
                getAge: function () { return age; }
            });
        }
    });

    var Dealer = Base.extend({
        constructor: function () {
            this.extend({
                shuffle: function (cards) {
                    return cards.sort(function () {
                        return 0.5 - Math.random();
                    });
                }
            });
        }
    });

    var PitBoss = Base.extend({
        constructor: function (name) {
            this.extend({
                getName: function () { return name; }
            });
        }
    });

    var DrinkServer = Base.extend({
    });

    var Game = Protocol.extend({
        open: function (numPlayers) {}
    });

    var Security = Protocol.extend({
        admit: function (guest) {},
        trackActivity: function (activity) {}
    });

    var Level1Security = Base.extend(Security, {
        admit: function (guest) {
            return guest.getAge() >= 21;
        }
    });

    var Level2Security = Base.extend(Security, {
        trackActivity: function (activity) {
            console.log(lang.format("Tracking '%1'", activity.getName()));
        }
    });

    var WireMoney = Base.extend({
        constructor: function (requested) {
            var _received = 0.0;
            this.extend({
                getRequested: function () { return requested; },
                getReceived:  function () { return _received;},
                setReceived:  function (received) { _received = received; }
            });
        }
    });

    var CountMoney = Base.extend({
        constructor: function () {
            var _total = 0.0;
            this.extend({
                getTotal: function () { return _total; },
                record:   function (amount) { _total += amount; }
            });
        }
    });

    var Accountable = Base.extend($expand, {
        constructor: function (assets, liabilities) {
            assets      = Number(assets || 0);
            liabilities = Number(liabilities || 0);
            this.extend({
                getAssets:       function () { return assets; },
                getLiabilities:  function () { return liabilities; },
                getBalance:      function () { return assets - liabilities; },
                addAssets:       function (amount) { assets      += amount; },
                addLiabilities:  function (amount) { liabilities += amount; },
                transfer:        function (amount, receiver) {
                    assets -= amount;
                    if (assets < 0) {
                        liabilties -= assets;
                        assets      = 0;
                    }
                    receiver.addAssets(amount);
                    return Promise.delay(100);
                }
            });
        },
        $handle:[
            CountMoney, function (countMoney, composer) {
                countMoney.record(this.getBalance());
            }]
    });

    var Cashier = Accountable.extend({
        toString: function () { return 'Cashier $' + this.getBalance(); },
        $handle:[
            WireMoney, function (wireMoney, composer) {
                wireMoney.setReceived(wireMoney.getRequested());
                return Promise.resolve(wireMoney);
            }]
    });

    var Activity = Accountable.extend({
        constructor: function (name) {
            this.base();
            this.extend({
                getName: function () { return name; },
            });
        },
        toString: function () { return 'Activity ' + this.getName(); }
    });

    var CardTable = Activity.extend(Game, {
        constructor: function (name, minPlayers, maxPlayers) {
            this.base(name);
            this.extend({
                open: function (numPlayers) {
                    if (minPlayers > numPlayers || numPlayers > maxPlayers)
                        return $NOT_HANDLED;
                },
            });
        }
    });

    var Casino = CompositeCallbackHandler.extend({
        constructor: function (name) {
            this.base();
            this.extend({
                getName: function () { return name; }
            });
        },
        toString: function () { return 'Casino ' + this.getName(); },

        $provide:[
            PitBoss, function (composer) {
                return new PitBoss('Freddy');
            },

            DrinkServer, function (composer) {
                return Promise.delay(new DrinkServer(), 100);
            }]
    });

  eval(this.exports);
};

eval(base2.callback_test.namespace);

describe("HandleMethod", function () {
    describe("#getMethodName", function () {
        it("should get the method name", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            expect(method.getMethodName()).to.equal("deal");
        });
    });

    describe("#getArguments", function () {
        it("should get the method arguments", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            expect(method.getArguments()).to.eql([[1,3,8], 2]);
        });

        it("should be able to change arguments", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.getArguments()[0] = [2,4,8];
            expect(method.getArguments()).to.eql([[2,4,8], 2]);
        });
    });

    describe("#getReturnValue", function () {
        it("should get the return value", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#setReturnValue", function () {
        it("should set the return value", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#invokeOn", function () {
        it("should invoke method on target", function () {
            var dealer  = new Dealer(),
            method  = new HandleMethod(undefined, "shuffle", [[22,19,9,14,29]]),
            handled = method.invokeOn(dealer);
            expect(handled).to.be.true;
            expect(method.getReturnValue()).to.have.members([22,19,9,14,29]);
        });
    });
});

describe("Definitions", function () {
    describe("$define", function () {
        it("should require non-empty tag", function () {
            $define('$foo');
            expect(function () {
                $define();
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
            expect(function () {
                $define("");
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
            expect(function () {
                $define("  ");
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
        });

        it("should prevent same tag from being registered", function () {
            $define('$bar');
            expect(function () {
                $define('$bar');
            }).to.throw(Error, "'$bar' is already defined.");
        });

        it("Should accept variance option", function () {
            var baz = $define('$baz', Variance.Contravariant);
        expect(baz).to.be.ok;
        });

        it("Should reject invalid variance option", function () {
            expect(function () {
        $define('$buz', { variance: 1000 });
            }).to.throw(Error, "Variance must be Covariant, Contravariant or Invariant");
        });
    });

    describe("#list", function () {
        it("should not have $miruken storage by default", function () {
            var handler    = new CallbackHandler;
            expect(handler.hasOwnProperty('$miruken')).to.be.false;
        });

        it("should create $miruken.$handle key when first handler registered", function () {
            var handler    = new CallbackHandler;
            $handle(handler, True, True);
            expect(handler.hasOwnProperty('$miruken')).to.be.true;
            expect(handler.$miruken.$handle).to.be.ok;
        });

        it("should maintain linked-list of handlers", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Accountable, nothing);
            $handle(handler, Game, nothing);
            expect(handler.$miruken.$handle.head.constraint).to.equal(Activity);
            expect(handler.$miruken.$handle.head.next.constraint).to.equal(Accountable);
            expect(handler.$miruken.$handle.tail.prev.constraint).to.equal(Accountable);
            expect(handler.$miruken.$handle.tail.constraint).to.equal(Game);
        });

        it("should order $handle contravariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Accountable, nothing);
            $handle(handler, Activity, nothing);
            expect(handler.$miruken.$handle.head.constraint).to.equal(Activity);
            expect(handler.$miruken.$handle.tail.constraint).to.equal(Accountable);
        });

        it("should order $handle invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$miruken.$handle.head.handler).to.equal(nothing);
            expect(handler.$miruken.$handle.tail.handler).to.equal(something);
        });

        it("should order $provide covariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Accountable, nothing);
            expect(handler.$miruken.$provide.head.constraint).to.equal(Accountable);
            expect(handler.$miruken.$provide.tail.constraint).to.equal(Activity);
        });

        it("should order $provide invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Activity, something);
            expect(handler.$miruken.$provide.head.handler).to.equal(nothing);
            expect(handler.$miruken.$provide.tail.handler).to.equal(something);
        });

        it("should order $lookup invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $lookup(handler, Activity, nothing);
            $lookup(handler, Activity, something);
            expect(handler.$miruken.$lookup.head.handler).to.equal(nothing);
            expect(handler.$miruken.$lookup.tail.handler).to.equal(something);
        });

        it("should index first registered handler with head and tail", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                unregister  = $handle(handler, True, nothing);
            expect(unregister).to.be.a('function');
            expect(handler.$miruken.$handle.head.handler).to.equal(nothing);
            expect(handler.$miruken.$handle.tail.handler).to.equal(nothing);
        });

        it("should call function when handler removed", function () {
            var handler        = new CallbackHandler,
                func           = function (callback) {},
                handlerRemoved = false,
                unregister     = $handle(handler, True, func, function () {
                    handlerRemoved = true;
                });
            unregister();
            expect(handlerRemoved).to.be.true;
            expect(handler.$miruken.$handle).to.be.undefined;
        });

        it("should suppress handler removed if requested", function () {
            var handler        = new CallbackHandler,
                func           = function (callback) {},
                handlerRemoved = false,
                unregister     = $handle(handler, True, func, function () {
                    handlerRemoved = true;
                });
            unregister(false);
            expect(handlerRemoved).to.be.false;
            expect(handler.$miruken.$handle).to.be.undefined;
        });

        it("should remove $handle when no handlers remain", function () {
            var handler     = new CallbackHandler,
                func        = function (callback) {},
                unregister  = $handle(handler, True, func);
            unregister();
            expect(handler.$miruken.$handle).to.be.undefined;
        });
    });

    describe("#index", function () {
        it("should index class constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Activity, nothing);
            expect(handler.$miruken.$handle.getIndex(index).constraint).to.equal(Activity);
        });

        it("should index protocol constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Game);
            $handle(handler, Game, nothing);
            expect(handler.$miruken.$handle.getIndex(index).constraint).to.equal(Game);
        });

        it("should index string constraints using string", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, "something", nothing);
            expect(handler.$miruken.$handle.getIndex("something").handler).to.equal(nothing);
        });

        it("should move index to next match", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {},
                index       = assignID(Activity),
                unregister  = $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$miruken.$handle.getIndex(index).handler).to.equal(nothing);
            unregister();
            expect(handler.$miruken.$handle.getIndex(index).handler).to.equal(something);
        });

        it("should remove index when no more matches", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Accountable, nothing);
            var unregister  = $handle(handler, Activity, nothing);
            unregister();
            expect(handler.$miruken.$handle.getIndex(index)).to.be.undefined;
        });
    });

    describe("#removeAll", function () {
        it("should remove all $handler definitions", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
            removeCount = 0,
            removed     = function () { ++removeCount; };
            $handle(handler, Accountable, nothing, removed);
            $handle(handler, Activity, nothing, removed);
        $handle.removeAll(handler);
        expect(removeCount).to.equal(2);
            expect(handler.$miruken.$handle).to.be.undefined;
        });

        it("should remove all $provider definitions", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
            removeCount = 0,
            removed     = function () { ++removeCount; };
            $provide(handler, Activity, nothing, removed);
            $provide(handler, Accountable, nothing, removed);
        $provide.removeAll(handler);
        expect(removeCount).to.equal(2);
            expect(handler.$miruken.$provide).to.be.undefined;
        });
    });
});

/*
describe("CallbackHandler", function () {
    describe("#handle", function () {
        it("should not handle nothing", function () {
            var casino     = new Casino();
            expect(casino.handle()).to.be.false;
            expect(casino.handle(null)).to.be.false;
        });

        it("should not handle anonymous objects", function () {
            var casino     = new Casino();
            expect(casino.handle({name:'Joe'})).to.be.false;
        });

        it("should handle callbacks", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney();
            expect(casino.handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(1000000.00);
        });

        it("should handle callbacks per instance", function () {
            var cashier    = new Cashier(1000000.00),
                handler    = new CallbackHandler;
            $handle(handler, Cashier, function (cashier) {
                this.cashier = cashier;
            });
            expect(handler.handle(cashier)).to.be.true;
            expect(handler.cashier).to.equal(cashier);
        });

        it("should handle callback hierarchy", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Accountable, function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
        });

        it("should ignore callback if $NOT_HANDLED", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Cashier, function (cashier) {
                            return $NOT_HANDLED;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.false;
        });

        it("should handle callback invariantly", function () {
            var cashier     = new Cashier(1000000.00),
                accountable = new Accountable(1.00),
                inventory   = new (CallbackHandler.extend({
                    $handle:[
                        $eq(Accountable), function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.false;
            expect(inventory.handle(accountable)).to.be.true;
            expect(inventory.accountable).to.equal(accountable);
            $handle(inventory, Accountable, function (accountable) {
                this.accountable = accountable;
            });
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
        });

        it("should stop early if handle callback invariantly", function () {
            var cashier     = new Cashier(1000000.00),
                accountable = new Accountable(1.00),
                inventory   = new (CallbackHandler.extend({
                    $handle:[
                        Accountable, function (accountable) {
                        },
                        null, function (anything) {
                        }]
                }));
            expect(inventory.handle($eq(accountable))).to.be.true;
            expect(inventory.handle($eq(cashier))).to.be.false;
        });

        it("should handle callback protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Game, function (game) {
                            this.game = game;
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.game).to.equal(blackjack);
        });

        it("should prefer callback hierarchy over protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.activity = activity;
                        },
                        Game, function (game) {
                            this.game = game;
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.activity).to.equal(blackjack);
            expect(inventory.game).to.be.undefined;
        });

        it("should prefer callback hierarchy and continue with protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.activity = activity;
                            return false;
                        },
                        Game, function (game) {
                            this.game = game;
                        }]
                    }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.activity).to.equal(blackjack);
            expect(inventory.game).to.equal(blackjack);
        });

        it("should handle unknown callback", function () {
            var blackjack = new CardTable('Blackjack'),
                inventory = new (CallbackHandler.extend({
                    $handle:[null, function (callback) {
                        callback.check = true;
                    }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(blackjack.check).to.be.true;
        });

        it("should handle unknown callback via delegate", function () {
            var blackjack = new CardTable('Blackjack'),
                inventory = new (Base.extend($expand, {
                    $handle:[null, function (callback) {
                        callback.check = true;
                    }]
                }));
                casino     = new Casino('Belagio').addHandlers(inventory);
            expect(casino.handle(blackjack)).to.be.true;
            expect(blackjack.check).to.be.true;
        });

        it("should allow handlers to chain to base", function () {
            var blackjack  = new CardTable('Blackjack'),
                Tagger     = CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            activity.tagged = true;
                        }]
                });
                inventory  = new (Tagger.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.base();
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(blackjack.tagged).to.be.true;
        });

        it("should handle callbacks with precedence rules", function () {
            var matched   = -1,
                Checkers  = Base.extend(Game),
                inventory = new (CallbackHandler.extend({
                    $handle:[
                        function (constraint) {
                            return constraint === PitBoss;
                        }, function (callback) {
                            matched = 0;
                        },
                        null,        function (callback) {
                            matched = 1;
                        },
                        Game,        function (callback) {
                            matched = 2;
                        },
                        Security,    function (callback) {
                            matched = 3;
                        },
                        Activity,    function (callback) {
                            matched = 5;
                        },
                        Accountable, function (callback) {
                            matched = 4;
                        },
                        CardTable,   function (callback) {
                            matched = 6;
                        }]
                }));
            inventory.handle(new CardTable('3 Card Poker'));
            expect(matched).to.equal(6);
            inventory.handle(new Activity('Video Poker'));
            expect(matched).to.equal(5);
            inventory.handle(new Cashier(100));
            expect(matched).to.equal(4);
            inventory.handle(new Level1Security);
            expect(matched).to.equal(3);
            inventory.handle(new Checkers);
            expect(matched).to.equal(2);
            inventory.handle(new Casino('Paris'));
            expect(matched).to.equal(1);
            inventory.handle(new PitBoss('Mike'));
            expect(matched).to.equal(0);
        });

        it("should handle callbacks greedy", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                casino     = new Casino('Belagio')
                .addHandlers(cashier, blackjack),
            countMoney = new CountMoney();
            cashier.transfer(50000, blackjack)

            expect(blackjack.getBalance()).to.equal(50000);
            expect(cashier.getBalance()).to.equal(950000);
            expect(casino.handle(countMoney, true)).to.be.true;
            expect(countMoney.getTotal()).to.equal(1000000.00);
        });

        it("should handle callbacks anonymously", function () {
            var countMoney = new CountMoney,
                handler    = CallbackHandler.accepting(function (countMoney) {
                    countMoney.record(50);
                }, CountMoney);
            expect(handler.handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(50);
        });

        it("should handle compound keys", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                bank       = new (Accountable.extend()),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        [Cashier, Activity], function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.accountable).to.equal(blackjack);
            expect(inventory.handle(bank)).to.be.false;
        });

        it("should unregister compound keys", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                bank       = new (Accountable.extend()),
                inventory  = new CallbackHandler,
                unregister = $handle(inventory, [Cashier, Activity], function (accountable) {
                    this.accountable = accountable;
                });
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.accountable).to.equal(blackjack);
            expect(inventory.handle(bank)).to.be.false;
            unregister();
            expect(inventory.handle(cashier)).to.be.false;
            expect(inventory.handle(blackjack)).to.be.false;
        });
    })

    describe("#defer", function () {
        it("should handle objects eventually", function (done) {
            var cashier    = new Cashier(750000.00),
                casino     = new Casino('Venetian').addHandlers(cashier),
                wireMoney  = new WireMoney(250000);
            Promise.resolve(casino.defer(wireMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.getReceived()).to.equal(250000);
                done();
            });
        });

        it("should handle objects eventually with promise", function (done) {
            var bank       = (new (CallbackHandler.extend({
                    $handle:[
                        WireMoney, function (wireMoney) {
                            wireMoney.setReceived(50000);
                            return Promise.delay(wireMoney, 100);
                        }]
                }))),
                casino     = new Casino('Venetian').addHandlers(bank),
                wireMoney  = new WireMoney(150000);
            Promise.resolve(casino.defer(wireMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.getReceived()).to.equal(50000);
                done();
            });
        });

        it("should handle callbacks anonymously with promise", function (done) {
            var handler    = CallbackHandler.accepting(function (countMoney) {
                    countMoney.record(50);
                }, CountMoney),
                countMoney = new CountMoney;
            Promise.resolve(handler.defer(countMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(countMoney.getTotal()).to.equal(50);
                done();
            });
        });
    });

    describe("#resolve", function () {
        it("should resolve explicit objects", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $provide:[Cashier, cashier]
                }));
            expect(inventory.resolve(Cashier)).to.equal(cashier);
        });

        it("should infer constraint from explicit objects", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new CallbackHandler;
            $provide(inventory, cashier);
            expect(inventory.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve copy of object with $copy", function () {
            var Circle     = Base.extend({
                    constructor: function (radius) {
                        this.radius = radius;
                    },
                    copy: function () {
                        return new Circle(this.radius);
                    }
                }),
                circle     = new Circle(2),
                shapes     = new (CallbackHandler.extend({
                    $provide:[Circle, $copy(circle)]
                }));
           var shape = shapes.resolve(Circle);
           expect(shape).to.not.equal(circle);
           expect(shape.radius).to.equal(2);
        });

        it("should resolve objects by class implicitly", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier);
            expect(casino.resolve(Casino)).to.equal(casino);
            expect(casino.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve objects by protocol implicitly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                casino     = new Casino('Belagio').addHandlers(blackjack);
            expect(casino.resolve(Game)).to.equal(blackjack);
        });

        it("should resolve objects by class explicitly", function () {
            var casino     = new Casino('Belagio'),
                pitBoss    = casino.resolve(PitBoss);
            expect(pitBoss).to.be.an.instanceOf(PitBoss);
        });

        it("should resolve objects by per instance", function () {
            var cashier    = new Cashier(1000000.00),
                provider   = new CallbackHandler;
            $provide(provider, Cashier, function (resolution) {
                return cashier;
            });
            expect(provider.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve objects by class invariantly", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $provide:[
                        $eq(Cashier), function (resolution) {
                            return cashier;
                        }]
                }));
            expect(inventory.resolve(Accountable)).to.be.undefined;
            expect(inventory.resolve(Cashier)).to.equal(cashier);
            $provide(inventory, Cashier, function (resolution) {
                return cashier;
            });
            expect(inventory.resolve(Accountable)).to.equal(cashier);
        });

        it("should resolve objects by protocol invariantly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        $eq(Game), function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve(CardTable)).to.be.undefined;
            expect(cardGames.resolve(Game)).to.equal(blackjack);
        });

        it("should resolve objects by class instantly", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new CardTable("BlackJack", 1, 5),
                inventory  = new (CallbackHandler.extend({
                    $provide:[
                        Cashier, function (resolution) {
                            return cashier;
                        },
                        CardTable, function (resolution) {
                            return Promise.resolve(blackjack);
                        }]
                }));
            expect(inventory.resolve($instant(Cashier))).to.equal(cashier);
            expect($isPromise(inventory.resolve(CardTable))).to.be.true;
            expect(inventory.resolve($instant(CardTable))).to.be.undefined;
        });

        it("should resolve objects by protocol instantly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        Game, function (resolution) {
                            return Promise.resolve(blackjack);
                        }]
                }));
            expect($isPromise(cardGames.resolve(Game))).to.be.true;
            expect(cardGames.resolve($instant(Game))).to.be.undefined;
        });

        it("should resolve by string literal", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        'BlackJack', function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve('BlackJack')).to.equal(blackjack);
        });

        it("should resolve by string instance", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        'BlackJack', function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve(new String("BlackJack"))).to.equal(blackjack);
        });

        it("should resolve string by regular expression", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        /black/i, function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve('BlackJack')).to.equal(blackjack);
        });

        it("should resolve instances using instance class", function () {
            var Config  = Base.extend({
                    constructor: function (key) {
                        this.extend({
                                getKey: function () { return key; }
                            });
                    }
                });
                settings  = new (CallbackHandler.extend({
                    $provide:[
                        Config, function (resolution) {
                            var config = resolution.getKey(),
                                key    = config.getKey();
                            if (key == "url") {
                                return "my.server.com";
                            } else if (key == "user") {
                                return "dba";
                            }
                        }]
                }));
                expect(settings.resolve(new Config("user"))).to.equal("dba");
                expect(settings.resolve(new Config("name"))).to.be.undefined;
        });

        it("should resolve objects with compound keys", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cashier    = new Cashier(1000000.00),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        [CardTable, Cashier], function (resolution) {
                            var key = resolution.getKey();
                            if (key.conformsTo(Game)) {
                                return blackjack;
                            } else if (key === Cashier) {
                                return cashier;
                            }
                        }]
                }));
            expect(cardGames.resolve(Game)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.equal(cashier);
        });

        it("should unregister objects with compound keys", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cashier    = new Cashier(1000000.00),
                cardGames  = new CallbackHandler,
                unregister = $provide(cardGames, [CardTable, Cashier], function (resolution) {
                    var key = resolution.getKey();
                    if (key.conformsTo(Game)) {
                        return blackjack;
                    } else if (key === Cashier) {
                        return cashier;
               }});
            expect(cardGames.resolve(Game)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.equal(cashier);
            unregister();
            expect(cardGames.resolve(Game)).to.be.undefined;
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });

        it("should not resolve objects if not found", function () {
            var something = new CallbackHandler;
            expect(something.resolve(Cashier)).to.be.undefined;
        });

        it("should not resolve objects if $NOT_HANDLED", function () {
            var inventory  = new (CallbackHandler.extend({
                    $provide:[
                        Cashier, function (resolution) {
                            return $NOT_HANDLED;
                        }]
                }));
            expect(inventory.resolve(Cashier)).to.be.undefined;
        });

        it("should resolve unknown objects", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            if (resolution.getKey() === CardTable) {
                                return blackjack;
                            }
                        }]
                }));
            expect(cardGames.resolve(CardTable)).to.equal(blackjack);
            expect(cardGames.resolve(Game)).to.be.undefined;
        });

        it("should resolve objects by class eventually", function (done) {
            var casino = new Casino('Venetian');
            Promise.resolve(casino.resolve(DrinkServer)).then(function (server) {
                expect(server).to.be.an.instanceOf(DrinkServer);
                done();
            });
        });

        it("should not resolve by string", function () {
            var casino = new Casino('Venetian');
            expect(casino.resolve("slot machine")).to.be.undefined;
        });

        it("should resolve with precedence rules", function () {
            var Checkers  = Base.extend(Game),
                inventory = new (CallbackHandler.extend({
                    $provide:[
                        function (constraint) {
                            return constraint === PitBoss;
                        }, function (callback) {
                            return 0;
                            },
                        null, function (callback) {
                            return 1;
                        },
                        Checkers, function (callback) {
                            return 2;
                        },
                        Level1Security, function (callback) {
                            return 3;
                        },
                        Activity, function (callback) {
                            return 5;
                        },
                        Accountable, function (callback) {
                            return 4;
                        },
                        CardTable, function (callback) {
                            return 6;
                            }]
                }));
                      expect(inventory.resolve(CardTable)).to.equal(6);
            expect(inventory.resolve(Activity)).to.equal(5);
            expect(inventory.resolve(Cashier)).to.equal(1);
            expect(inventory.resolve(Security)).to.equal(3);
            expect(inventory.resolve(Game)).to.equal(2);
            expect(inventory.resolve(Casino)).to.equal(1);
            expect(inventory.resolve(PitBoss)).to.equal(0);
        });
    });

    describe("#resolveAll", function () {
        it("should resolve all objects by class explicitly", function (done) {
            var belagio    = new Casino('Belagio'),
                venetian   = new Casino('Venetian'),
                paris      = new Casino('Paris'),
                strip      = belagio.next(venetian, paris);
            Promise.resolve(strip.resolveAll(Casino)).then(function (casinos) {
                expect(casinos).to.eql([belagio, venetian, paris]);
                done();
            });
        });

        it("should resolve all objects by class eventually", function (done) {
            var stop1      = [ new PitBoss("Craig"),  new PitBoss("Matthew") ],
                stop2      = [ new PitBoss("Brenda"), new PitBoss("Lauren"), new PitBoss("Kaitlyn") ],
                stop3      = [ new PitBoss("Phil") ],
                bus1       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop1, 75);
                    }]
                })),
                bus2       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop2, 100);
                    }]
                })),
                bus3       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop3, 50);
                    }]
                })),
                company    = bus1.next(bus2, bus3);
            Promise.resolve(company.resolveAll(PitBoss)).then(function (pitBosses) {
                expect(pitBosses).to.eql(js.Array2.flatten([stop1, stop2, stop3]));
                done();
            });
        });

        it("should resolve all objects by class instantly", function () {
            var belagio    = new Casino('Belagio'),
                venetian   = new Casino('Venetian'),
                paris      = new Casino('Paris'),
                strip      = new (CallbackHandler.extend({
                    $provide:[
                        Casino, function (resolution) {
                            return venetian;
                        },
                        Casino, function (resolution) {
                            return Promise.resolve(belagio);
                        },
                        Casino, function (resolution) {
                            return paris;
                        }]
                }));
            var casinos = strip.resolveAll($instant(Casino));
            expect(casinos).to.eql([venetian, paris]);
        });

        it("should return empty array if none resolved", function (done) {
            Promise.resolve((new CallbackHandler).resolveAll(Casino)).then(function (casinos) {
                expect(casinos).to.have.length(0);
                done();
            });
        });

        it("should return empty array instantly if none resolved", function () {
            var belagio  = new Casino('Belagio'),
                strip    = new (CallbackHandler.extend({
                    $provide:[
                        Casino, function (resolution) {
                            return Promise.resolve(belagio);
                        }]
                }));
            var casinos = strip.resolveAll($instant(Casino));
            expect(casinos).to.have.length(0);
        });
    });

    describe("#lookup", function () {
        it("should lookup by class", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        CardTable, function (lookup) {
                            return blackjack;
                        },
                        null, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup(CardTable)).to.equal(blackjack);
            expect(cardGames.lookup(Game)).to.be.undefined;
        });

        it("should lookup by protocol", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        Game, function (lookup) {
                            return blackjack;
                        },
                        null, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup(Game)).to.equal(blackjack);
            expect(cardGames.lookup(CardTable)).to.be.undefined;
        });

        it("should lookup by string", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        'blackjack', function (lookup) {
                            return blackjack;
                        },
                        /game/, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup('blackjack')).to.equal(blackjack);
            expect(cardGames.lookup('game')).to.be.undefined;
        });
    });

    describe("#next", function () {
        it("should cascade handlers using short syntax", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
                security = CallbackHandler(level1).next(level2);
            expect(Security(security).admit(guest)).to.be.false;
            Security(security).trackActivity(baccarat);
        });

        it("should compose handlers using short syntax", function () {
            var baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
                compose  = CallbackHandler(level1).next(level2, baccarat),
            countMoney = new CountMoney();
            expect(compose.handle(countMoney)).to.be.true;
        });
    });

    describe("#when", function () {
        it("should restrict handlers using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $handle:[
                        True, function (cardTable) {
                            cardTable.closed = true;
                        }]
                }))).when(CardTable);
            expect(cardGames.handle(blackjack)).to.be.true;
            expect(blackjack.closed).to.be.true;
            expect(cardGames.handle(new Cashier)).to.be.false;
        });

        it("should restrict handlers invariantly using short syntax", function () {
            var Blackjack  = CardTable.extend({
                    constructor: function () {
                        this.base("BlackJack", 1, 5);
                    }
                }),
                blackjack  = new Blackjack,
                cardGames  = (new (CallbackHandler.extend({
                    $handle:[
                        True, function (cardTable) {
                            cardTable.closed = true;
                        }]
                }))).when($eq(CardTable));
            expect(cardGames.handle(blackjack)).to.be.false;
            expect(blackjack.closed).to.be.undefined;
            expect(cardGames.handle(new Cashier)).to.be.false;
        });

        it("should restrict providers using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            return blackjack;
                        }]
                }))).when(CardTable);
            expect(cardGames.resolve(CardTable)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });

        it("should restrict providers invariantly using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            return blackjack;
                        }]
                }))).when($eq(Activity));
            expect(cardGames.resolve(Activity)).to.equal(blackjack);
            expect(cardGames.resolve(CardTable)).to.be.undefined;
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });
    });
});

describe("MethodCallbackHandler", function () {
    var Calculator = Protocol.extend({
        add:    function (op1, op2) {},
        divide: function (dividend, divisor) {},
        clear:  function () {}
    });

    describe("#handle", function () {
        it("should call function", function () {
            var add = new MethodCallbackHandler("add", function (op1, op2) {
                return op1 + op2;
            });
            expect(Calculator(add).add(5, 10)).to.equal(15);
        });

        it("should call function using short syntax", function () {
            var add = function (op1, op2) { return op1 + op2; }.implementing("add");
            expect(Calculator(add).add(22, 19)).to.equal(41);
        });

        it("should propgate exception in function", function () {
            var divide = new MethodCallbackHandler("divide", function (dividend, divisor) {
                if (divisor === 0)
                    throw new Error("Division by zero");
                return dividend / divisor;
            });
            expect(function () {
                Calculator(divide).divide(10,0);
            }).to.throw(Error, /Division by zero/);
        });

        it("should bind function", function () {
            var context = new Object,
                clear   = new MethodCallbackHandler("clear", (function () {
                return context;
            }).bind(context));
            expect(Calculator(clear).clear()).to.equal(context);
        });

        it("should require non-empty method name", function () {
            expect(function () {
                new MethodCallbackHandler(null, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler(void 0, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler(10, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler("", function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler("   ", function () {});
            }).to.throw(Error, /No methodName specified/);
        });
    });
});

describe("CascadeCallbackHandler", function () {
    describe("#handle", function () {
        it("should cascade handlers", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
                security = new CascadeCallbackHandler(level1, level2);
            expect(Security(security).admit(guest)).to.be.false;
            Security(security).trackActivity(baccarat);
        });
    });
});

describe("InvocationCallbackHandler", function () {
    describe("#handle", function () {
        it("should handle invocations", function () {
            var guest1 = new Guest(17),
                guest2 = new Guest(21),
                level1 = CallbackHandler(new Level1Security());
            expect(Security(level1).admit(guest1)).to.be.false;
            expect(Security(level1).admit(guest2)).to.be.true;
        });

        it("should ignore explicitly unhandled invocations", function () {
            var texasHoldEm = new CardTable("Texas Hold'em", 2, 7),
            casino    = new Casino('Caesars Palace')
                .addHandlers(texasHoldEm);
            expect(function () {
                Game(casino).open(5);
            }).to.not.throw(Error);
            expect(function () {
                Game(casino).open(9);
            }).to.throw(Error, /has no method 'open'/);
        });

        it("should fail missing methods", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);

            expect(function () {
                Security(casino).trackActivity(letItRide)
            }).to.throw(Error, /has no method 'trackActivity'/);
        });

        it("can ignore missing methods", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            expect(Security(casino.bestEffort()).trackActivity(letItRide)).to.be.undefined;
        });

        it("should require protocol conformance", function () {
            var gate  = new (CallbackHandler.extend(Security, {
                    admit: function (guest) { return true; }
                }));
            expect(Security(gate.strict()).admit(new Guest('Me'))).to.be.true;
        });

        it("should reject if no protocol conformance", function () {
            var gate  = new (CallbackHandler.extend({
                    admit: function (guest) { return true; }
                }));
            expect(function () {
                Security(gate.strict()).admit(new Guest('Me'))
            }).to.throw(Error, /has no method 'admit'/);
        });

        it("can broadcast invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                level2    = new Level2Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, level2, letItRide);
            Security(casino.broadcast()).trackActivity(letItRide);
        });

        it("can notify invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            Security(casino.notify()).trackActivity(letItRide);
        });
    })
});
*/
},{"../lib/callback.js":2,"../lib/miruken.js":9,"bluebird":12,"chai":13}],55:[function(require,module,exports){
var miruken = require('../lib/miruken.js'),
    context = require('../lib/context.js')
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(context.namespace);

describe("Context", function() {
    var Dog = Base.extend({});
    
    describe("#getState", function() {
        it("should start in the default state", function() {
            var context = new Context;
            expect(context.getState()).to.equal(ContextState.Active);
            expect(context.getChildren()).to.be.empty;
        });
    });
    
    describe("#getParent", function() {
        it("should not have a parent when root", function() {
            var context = new Context;
            expect(context.getParent()).to.not.exist;
        });
        
        it("should have a parent when a child", function() {
            var context = new Context,
            child   = context.newChild();
            expect(child.getParent()).to.equal(context);
        });
    });
    
    describe("#getChildren", function() {
        it("should have children when created", function() {
            var context = new Context,
                child1  = context.newChild(),
                child2  = context.newChild();
            expect(context.getChildren()).to.include(child1, child2);
        });
    });
    
    describe("#hasChildren", function() {
        it("should not have children by default", function() {
            var context = new Context;
            expect(context.hasChildren()).to.be.false;
        });
        
        it("should have children when created", function() {
            var context = new Context,
                child   = context.newChild();
            expect(context.hasChildren()).to.be.true;
        });
    });
    
    describe("#getRoot", function() {
        it("should return self if no childern", function() {
            var context = new Context;
            expect(context.getRoot()).to.equal(context);
        });
        
        it("should return root context when descendant", function() {
            var context    = new Context,
                child      = context.newChild(),
                grandChild = child.newChild();
            expect(grandChild.getRoot()).to.equal(context);
        });
    });

    describe("#newChild", function() {
        it("should return new child context", function() {
            var context      = new Context,
                childContext = context.newChild();
            expect(childContext.getParent()).to.equal(context);
        });

        it("should execute block with new child context and then end it", function() {
            var context      = new Context,
                childContext = context.newChild();
            $using(
                childContext, function (ctx) {
                    expect(ctx.getState()).to.equal(ContextState.Active);
                    expect(ctx.getParent()).to.equal(context); }
            );
            expect(childContext.getState()).to.equal(ContextState.Ended);
        });
    });

    describe("#resolve", function() {
        it("should resolve context to self", function() {
            var context = new Context;
            expect(context.resolve(Context)).to.equal(context);
        });
        
        it("should return root context when descendant", function() {
            var context    = new Context,
                child      = context.newChild(),
                grandChild = child.newChild();
            expect(grandChild.getRoot()).to.equal(context);
        });
    });
    
    describe("#end", function() {
        it("should end the context", function() {
            var context = new Context;
            context.end();
            expect(context.getState()).to.equal(ContextState.Ended);
        });
        
        it("should end children", function() {
            var context = new Context,
                child   = context.newChild();
            context.end();
            expect(context.getState()).to.equal(ContextState.Ended);
            expect(child.getState()).to.equal(ContextState.Ended);
        });
    });

    describe("#dispose", function() {
        it("should end the context", function() {
            var context = new Context;
            context.dispose();
            expect(context.getState()).to.equal(ContextState.Ended);
        });
    });
    
    describe("#unwind", function() {
        it("should end children when ended", function() {
            var context = new Context,
                child1  = context.newChild(),
                child2  = context.newChild();
            context.unwind();
            expect(context.getState()).to.equal(ContextState.Active);
            expect(child1.getState()).to.equal(ContextState.Ended);
            expect(child2.getState()).to.equal(ContextState.Ended);
        });
    });

    describe("#unwindToRootContext", function() {
        it("should end children except and root and return it", function() {
            var context    = new Context,
                child1     = context.newChild(),
                child2     = context.newChild(),
                grandChild = child1.newChild();
            var root       = context.unwindToRootContext();
            expect(root).to.equal(context);
            expect(context.getState()).to.equal(ContextState.Active);
            expect(child1.getState()).to.equal(ContextState.Ended);
            expect(child2.getState()).to.equal(ContextState.Ended);
            expect(grandChild.getState()).to.equal(ContextState.Ended);
        });
    });

    describe("#store", function() {
        it("should add object to the context", function() {
            var dog     = new Dog,
                context = new Context;
            expect(context.resolve(Dog)).to.be.undefined;
            context.store(dog);
            expect(context.resolve(Dog)).to.equal(dog);
        });
    });

    describe("#handle", function() {
        it("should traverse ancestors", function() {
            var dog        = new Dog,
                context    = new Context,
                child1     = context.newChild(),
                child2     = context.newChild(),
                grandChild = child1.newChild();
            context.store(dog);
            expect(grandChild.resolve(Dog)).to.equal(dog);
        });
    });

    describe("#handleAxis", function() {
        it("should wrap context", function() {
            var dog       = new Dog,
                context   = new Context,
                wrapped   = context.self(),
                decorated = wrapped.when(function(cb) { return true; });
            context.store(dog);
            expect(wrapped).to.not.equal(context);
            expect(wrapped.constructor).to.equal(Context);
            expect(wrapped.addHandlers(dog)).to.equal(wrapped);
            expect(decorated.getDecoratee()).to.equal(wrapped);
            expect(context.resolve(Dog)).to.equal(dog);
        });

        it("should traverse self", function() {
            var dog     = new Dog,
                context = new Context,
                child   = context.newChild();
            context.store(dog);
            expect(child.self().resolve(Dog)).to.be.undefined;
            expect(context.self().resolve(Dog)).to.equal(dog);
        });

        it("should traverse root", function() {
            var dog   = new Dog,
                root  = new Context,
                child = root.newChild();
            child.store(dog);
            expect(child.root().resolve(Dog)).to.be.undefined;
            root.store(dog);
            expect(child.root().resolve(Dog)).to.equal(dog);
        });

        it("should traverse children", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child2.store(dog);
            expect(child2.child().resolve(Dog)).to.be.undefined;
            expect(grandChild.child().resolve(Dog)).to.be.undefined;
            expect(root.child().resolve(Dog)).to.equal(dog);
        });

        it("should traverse siblings", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(root.sibling().resolve(Dog)).to.be.undefined;
            expect(child3.sibling().resolve(Dog)).to.be.undefined;
            expect(grandChild.sibling().resolve(Dog)).to.be.undefined;
            expect(child2.sibling().resolve(Dog)).to.equal(dog);
        });

        it("should traverse children and self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(child1.childOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.childOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.childOrSelf().resolve(Dog)).to.equal(dog);
            expect(root.childOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse siblings and self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(root.siblingOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.siblingOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.siblingOrSelf().resolve(Dog)).to.equal(dog);
            expect(child2.siblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestors", function() {
            var dog        = new Dog,
                root       = new Context,
                child      = root.newChild(),
                grandChild = child.newChild();
            root.store(dog);
            expect(root.ancestor().resolve(Dog)).to.be.undefined;
            expect(grandChild.ancestor().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestors or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child      = root.newChild(),
                grandChild = child.newChild();
            root.store(dog);
            expect(root.ancestorOrSelf().resolve(Dog)).to.equal(dog);
            expect(grandChild.ancestorOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse descendants", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            grandChild.store(dog);
            expect(grandChild.descendant().resolve(Dog)).to.be.undefined;
            expect(child2.descendant().resolve(Dog)).to.be.undefined;
            expect(child3.descendant().resolve(Dog)).to.equal(dog);
            expect(root.descendant().resolve(Dog)).to.equal(dog);
        });

        it("should traverse descendants or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            grandChild.store(dog);
            expect(child2.descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.descendantOrSelf().resolve(Dog)).to.equal(dog);
            expect(child3.descendantOrSelf().resolve(Dog)).to.equal(dog);
            expect(root.descendantOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse parent, siblings or |self|", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            root.store(dog);
            expect(child2.descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(root.parentSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse parent, |siblings| or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child2.store(dog);
            expect(grandChild.descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.parentSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse |parent|, siblings or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(grandChild.parentSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });
    });

    describe("#observe", function() {
        it("should observe context end", function() {
            var context = new Context,
                ending  = false, ended = false;
            context.observe({
                contextEnding: function(ctx) { 
                    expect(ctx).to.equal(context);
                    ending = !ended; 
                },
                contextEnded:  function(ctx) {
                    expect(ctx).to.equal(context);
                    ended  = true; 
                }
            });
            context.end();
            expect(ending).to.be.true;
            expect(ended).to.be.true;
        });
    });

    describe("#observe", function() {
        it("should observe child context end", function() {
            var context = new Context,
                child   = context.newChild(),
                ending  = false, ended = false;
            context.observe({
                childContextEnding: function(ctx) {
                    expect(ctx).to.equal(child);
                    ending = !ended;
                },
                childContextEnded:  function(ctx) {
                    expect(ctx).to.equal(child);
                    ended  = true; 
                }
            });
            child.end();
            expect(ending).to.be.true;
            expect(ended).to.be.true;
        });
    });

    describe("#observe", function() {
        it("can un-observe context end", function() {
            var context = new Context,
                ending  = false, ended = false;
            var unobserve = context.observe({
                contextEnding: function(ctx) { 
                    expect(ctx).to.equal(context);
                    ending = !ended; 
                },
                contextEnded:  function(ctx) {
                    expect(ctx).to.equal(context);
                    ended  = true; 
                }
            });
            unobserve();
            context.end();
            expect(ending).to.be.false;
            expect(ended).to.be.false;
        });
    });
});

describe("Contextual", function() {
    var Shutdown = Base.extend({
        constructor: function(methodName, args) {
            var _vetos = [];
            this.extend({
                getVetos: function() { 
                    return _vetos.slice(0); 
                },
                veto: function(reason) {
                    _vetos.puh(reason);
                }
            });
        }
    });
    
    var Controller = Base.extend($contextual, {
        shutdown: function(shutdown) {}
    });

    describe("#setContext", function() {
        it("should be able to set context", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            expect(controller.getContext()).to.equal(context);
        });

        it("should add handler when context set", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            var resolve    = context.resolve(Controller);
            expect(resolve).to.equal(controller);
        });

        it("should remove handler when context cleared", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            var resolve    = context.resolve(Controller);
            expect(resolve).to.equal(controller);
            controller.setContext(null);
            expect(context.resolve(Controller)).to.be.undefined;
        });
    });

    describe("#isActiveContext", function() {
        it("should be able to test if context active", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);
            expect(controller.isActiveContext()).to.be.true;
        });
    });

    describe("#endContext", function() {
        it("should be able to end context", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);
            controller.endContext();
            expect(context.getState()).to.equal(ContextState.Ended);
            expect(controller.isActiveContext()).to.be.false;
        });
    });
});
},{"../lib/context.js":3,"../lib/miruken.js":9,"chai":13}],56:[function(require,module,exports){
var miruken  = require('../lib/miruken.js'),
    context  = require('../lib/context.js')
    error    = require('../lib/error.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(error.namespace);

describe("ErrorCallbackHandler", function () {
    describe("#handleError", function () {
        it("should handle errors", function () {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                error        = new Error('passwords do not match');
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleError(error)).then(function () {
                done();
            });
        });

        it("should be able to customize error handling", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                error        = new Error('Something bad happended');
            context.addHandlers(errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            Promise.resolve(Errors(customize).handleError(error)).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });
    });

    describe("#handleException", function () {
        it("should handle exceptions", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler,
                exception    = new TypeError('Expected a string argument');
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleException(exception)).then(function () {
                done();
            });
        });
    })
});

describe("CallbackHandler", function () {
    var Payments = Protocol.extend({
        validateCard: function (card) {},
        processPayment: function (payment) {}
    });

    var Paymentech = Base.extend({
        validateCard: function (card) {
            if (card.number.length < 10)
                throw new Error("Card number must have at least 10 digits");
        },
        processPayment: function (payment) {
            if (payment.amount > 500)
                return Promise.reject(new Error("Amount exceeded limit"));
        }
    });

    describe("#recoverable", function () {
        it("should implicitly recover from errors synchronously", function () {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            Payments(context.recoverable()).validateCard({number:'1234'});
        });

        it("should implicitly recover from errors asynchronously", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler); 
            var pay = Payments(context.recoverable()).processPayment({amount:1000});
            Promise.resolve(pay).then(function (result) {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery from errors asynchronously", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            var pay = Payments(customize.recoverable()).processPayment({amount:1000});
            Promise.resolve(pay).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });

        it("should recover explicitly", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var pay = Payments(context).processPayment({amount:1000})
                .catch(context.recover());
            Promise.resolve(pay).then(function (result) {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery explicitly", function (done) {
            var context      = new Context,
                errorHandler = new ErrorCallbackHandler;
            context.addHandlers(new Paymentech, errorHandler);
            var customize    = context.newChild().extend({
                reportError: function (error, context) {
                    return Promise.resolve('custom');
                }
            });
            var pay = Payments(context).processPayment({amount:1000})
                .catch(customize.recover());
            Promise.resolve(pay).then(function (result) {
                expect(result).to.equal('custom');
                done();
            });
        });
    });
});

},{"../lib/context.js":3,"../lib/error.js":4,"../lib/miruken.js":9,"bluebird":12,"chai":13}],57:[function(require,module,exports){
var miruken = require('../lib'),
    chai    = require("chai"),
    expect  = chai.expect;

describe("index", function () {
    describe("#namespaces", function () {
        it("should have all namespaces", function () {
            expect(miruken.namespace).to.be.ok;
            expect(miruken.callback.namespace).to.be.ok;
            expect(miruken.context.namespace).to.be.ok;
            expect(miruken.ioc.namespace).to.be.ok;
            expect(miruken.ioc.config.namespace).to.be.ok;
            expect(miruken.validate.namespace).to.be.ok;
            expect(miruken.error.namespace).to.be.ok;
        });
    });
});

},{"../lib":5,"chai":13}],58:[function(require,module,exports){
var miruken  = require('../../lib/miruken.js'),
    config   = require('../../lib/ioc/config.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;
              
eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.context.namespace);
eval(miruken.validate.namespace);
eval(miruken.ioc.namespace);
eval(config.namespace);

new function () { // closure

    var ioc_config_test = new base2.Package(this, {
        name:    "ioc_config_test",
        exports: "Service,Authentication,Controller,Credentials,LoginController,SomeService,InMemoryAuthenticator,PackageInstaller"
    });

    eval(this.imports);

    var Controller = Base.extend();

    var Credentials = Base.extend({
        constructor: function (user, password) {
            this.extend({
                getUser: function () { return user; },
                getPassword: function () { return password; }
            });
        }
    });

    var Service = Protocol.extend();

    var Authentication = Protocol.extend(Service, {
        authenticate: function (credentials) {}
    });

    var LoginController = Controller.extend({
        $inject: Authentication,
        constructor: function (authenticator) {
           this.extend({
               login: function (credentials) {
                   return authenticator.authenticate(credentials);
               }
           });
        }
    });

    var SomeService = Base.extend(Service);

    var InMemoryAuthenticator = Base.extend(Authentication, {
        authenticate: function (credentials) {
            return false;
        }
    });

    var PackageInstaller = Installer.extend({
        register: function(container, composer) {
            container.register(
                $classes.fromPackage(ioc_config_test).basedOn(Service)
                        .withKeys.mostSpecificService()
            );
        }
    });

    eval(this.exports);
};

eval(base2.ioc_config_test.namespace);

describe("$classes", function () {
    var context, container;
    beforeEach(function() {
        context   = new Context;
        container = Container(context);
        context.addHandlers(new IoContainer, new ValidationCallbackHandler);
    });

    describe("#fromPackage", function () {
        it("should select classes from package", function (done) {
            container.register(
                $component(Authentication).boundTo(InMemoryAuthenticator),
                $classes.fromPackage(ioc_config_test).basedOn(Controller)).then(function () {
                Promise.resolve(container.resolve(LoginController)).then(function (loginController) {
                    expect(loginController).to.be.instanceOf(LoginController);
                    done();
                });
            });
        });

        it("should select classes from package using shortcut", function (done) {
            container.register(
                $component(Authentication).boundTo(InMemoryAuthenticator),
                $classes(ioc_config_test).basedOn(Controller)).then(function () {
                Promise.resolve(container.resolve(LoginController)).then(function (loginController) {
                    expect(loginController).to.be.instanceOf(LoginController);
                    done();
                });
            });
        });

        it("should register installers if no based on criteria", function (done) {
            container.register(
                $classes.fromPackage(ioc_config_test)).then(function () {
                    Promise.all([container.resolve($eq(Service)),
                                container.resolve($eq(Authentication)),
                           container.resolve($eq(InMemoryAuthenticator))])
                        .spread(function (service, authenticator, nothing) {
                        expect(service).to.be.instanceOf(SomeService);
                        expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                        expect(nothing).to.be.undefined;
                        done();
                    });
                });
        });

        it("should reject package if not a Package", function () {
            expect(function () { 
                container.register($classes.fromPackage(Controller));
            }).to.throw(TypeError, /[$]classes expected a Package, but received.*Controller.*instead./);
        });
    });

    describe("#withKeys", function () {
        describe("#self", function () {
            it("should select class as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.self()).then(function () {
                         Promise.all([container.resolve($eq(InMemoryAuthenticator)),
                                      container.resolve($eq(Authentication))])
                             .spread(function (authenticator, nothing) {
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#basedOn", function () {
            it("should select basedOn as keys", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.basedOn()).then(function () {
                        Promise.all([container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (authenticator, nothing) {
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#anyService", function () {
            it("should select any service as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.anyService()).then(function () {
                         Promise.all([container.resolve($eq(Service)),
                                      container.resolve($eq(SomeService))])
                             .spread(function (service, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#allServices", function () {
            it("should select all services as keys", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Authentication)
                            .withKeys.allServices()).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (authenticator1, authenticator2, nothing) {
                            expect(authenticator1).to.be.instanceOf(InMemoryAuthenticator);
                            expect(authenticator2).to.equal(authenticator1);
                            expect(nothing).to.be.undefined;
                            done();
                        });
                });
            });
        });

        describe("#mostSpecificService", function () {
            it("should select most specific service as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.mostSpecificService(Service)).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (service, authenticator, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });

            it("should select most specific service form basedOn as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Service)
                            .withKeys.mostSpecificService()).then(function () {
                        Promise.all([container.resolve($eq(Service)),
                                     container.resolve($eq(Authentication)),
                                     container.resolve($eq(InMemoryAuthenticator))])
                            .spread(function (service, authenticator, nothing) {
                            expect(service).to.be.instanceOf(SomeService);
                            expect(authenticator).to.be.instanceOf(InMemoryAuthenticator);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });

            it("should select basedOn as key if no services match", function (done) {
                container.register(
                    $component(Authentication).boundTo(InMemoryAuthenticator),
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.mostSpecificService()).then(function () {
                        Promise.all([container.resolve($eq(Controller)),
                                     container.resolve($eq(LoginController))])
                            .spread(function (controller, nothing) {
                            expect(controller).to.be.instanceOf(LoginController);
                            expect(nothing).to.be.undefined;
                            done();
                       });
                });
            });
        });

        describe("#name", function () {
            it("should specify name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.name("Login")).then(function () {
                        Promise.resolve(container.resolve("Login")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });

            it("should infer name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                            .withKeys.name()).then(function () {
                        Promise.resolve(container.resolve("LoginController")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });

            it("should evaluate name as key", function (done) {
                container.register(
                    $classes.fromPackage(ioc_config_test).basedOn(Controller)
                        .withKeys.name(function (name) { 
                            return name.replace("Controller", "");
                            })).then(function () {
                        Promise.resolve(container.resolve("Login")).then(function (controller) {
                            expect(controller).to.be.instanceOf(LoginController);
                            done();
                        });
                });
            });
        });
    });

    describe("#configure", function () {
        it("should customize component configuration", function (done) {
            container.register(
                $classes.fromPackage(ioc_config_test).basedOn(Service)
                        .withKeys.mostSpecificService()
                        .configure(function (component) {
                            component.transient();
                         })).then(function () {
                   Promise.all([container.resolve($eq(Authentication)),
                                container.resolve($eq(Authentication))])
                       .spread(function (authenticator1, authenticator2) {
                       expect(authenticator1).to.be.instanceOf(InMemoryAuthenticator);
                       expect(authenticator2).to.not.equal(authenticator1);
                       done();
                    });
                });
            });
        });

});

},{"../../lib/ioc/config.js":6,"../../lib/miruken.js":9,"bluebird":12,"chai":13}],59:[function(require,module,exports){
var miruken  = require('../../lib/miruken.js'),
    ioc      = require('../../lib/ioc/ioc.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(miruken.callback.namespace);
eval(miruken.context.namespace);
eval(miruken.validate.namespace);
eval(ioc.namespace);

Promise.onPossiblyUnhandledRejection(Undefined);

new function () { // closure

    var ioc_test = new base2.Package(this, {
        name:    "ioc_test",
        exports: "Car,Engine,Diagnostics,Junkyard,V12,RebuiltV12,Supercharger,Ferrari,Bugatti,Auction,OBDII,CraigsJunk,LogInterceptor,ToUpperInterceptor,ToLowerInterceptor"
    });

    eval(this.imports);

    var Engine = Protocol.extend({
        getNumberOfCylinders: function () {},
        getHorsepower: function () {},
        getDisplacement: function () {}
    });

    var Car = Protocol.extend({
        getMake: function () {},
        getModel: function() {},
        getEngine: function () {}
    });

    var Diagnostics = Protocol.extend({
        getMPG: function () {}
    });

    var Junkyard = Protocol.extend({
        decomission: function (part) {}
    });

    var V12 = Base.extend(Engine, {
        $inject: [,,$optional(Diagnostics)],
        constructor: function (horsepower, displacement, diagnostics) {
            this.extend({
                getHorsepower: function () { return horsepower; },
                getDisplacement: function () { return displacement; },
                getDiagnostics: function () { return diagnostics; }
            });
        },
        getNumberOfCylinders: function () { return 12; },
    });
 
    var RebuiltV12 = V12.extend(Engine, Disposing, {
        $inject: [,,,Junkyard],
        constructor: function (horsepower, displacement, diagnostics, junkyard) {
            this.base(horsepower, displacement, diagnostics, junkyard);
            this.extend({
                dispose: function () {
                    junkyard.decomission(this);
                }
            });
        }
    });

    var Supercharger = Base.extend(Engine, {
        $inject: [Engine],
        constructor: function (engine, boost) {
            this.extend({
                getHorsepower: function () {
                    return engine.getHorsepower() * (1.0 + boost); 
                },
                getDisplacement: function () {
                    return engine.getDisplacement(); 
                }
            });
        }
    });

    var Ferrari = Base.extend(Car, {
        $inject: [,Engine],
        constructor: function (model, engine) {
            this.extend({
                getMake: function () { return "Ferrari"; },
                getModel: function () { return model; },
                getEngine: function () { return engine; }
            });
        }
    });

    var Bugatti = Base.extend(Car, {
        $inject: [,Engine],
        constructor: function (model, engine) {
            this.extend({
                getMake: function () { return "Bugatti"; },
                getModel: function () { return model; },
                getEngine: function () { return engine; }
            });
        }
    });

    var Auction = Base.extend({
        $inject: [$every(Car)],
        constructor: function (cars) {
            var inventory = {};
            cars.forEach(function (car) {
                var make   = car.getMake(),
                    models = inventory[make];
                if (!models) {
                    inventory[make] = models = [];
                }
                models.push(car);
            });
            this.extend({
                getCars: function () { return inventory; }
            });
        }
    });

    var OBDII = Base.extend(Diagnostics, {
        constructor: function () {
            this.extend({
                getMPG: function () { return 22.0; }
            });
        }
    });

    var CraigsJunk = Base.extend(Junkyard, {
        constructor: function () {
            var _parts = [];
            this.extend({
                getParts: function () { return _parts.slice(0); },
                decomission: function (part) {
                    _parts.push(part);
                }
            });
        }
    });

    var LogInterceptor = Interceptor.extend({
        intercept: function (invocation) {
            console.log(lang.format("Called %1 with (%2) from %3",
                        invocation.getMethod(),
                        invocation.getArgs().join(", "), 
                        invocation.getSource()));
            var result = invocation.proceed();
            console.log(lang.format("    And returned %1", result));
            return result;
        }
    });

    var ToUpperInterceptor = Interceptor.extend({
        intercept: function (invocation) {
            var args = invocation.getArgs();
            for (var i = 0; i < args.length; ++i) {
                if ($isString(args[i])) {
                    args[i] = args[i].toUpperCase();
                }
            }
            var result = invocation.proceed();
            if ($isString(result)) {
                result = result.toUpperCase();
            }
            return result;
        }
    });

    var ToLowerInterceptor = Interceptor.extend({
        intercept: function (invocation) {
            var args = invocation.getArgs();
            for (var i = 0; i < args.length; ++i) {
                if ($isString(args[i])) {
                    args[i] = args[i].toUpperCase();
                }
            }
            var result = invocation.proceed();
            if ($isString(result)) {
                result = result.toLowerCase();
            }
            return result;
        }
    });

    eval(this.exports);
};

eval(base2.ioc_test.namespace);

describe("DependencyModel", function () {
    describe("#getDependency", function () {
        it("should return actual dependency", function () {
            var dependency = new DependencyModel(22);
            expect(dependency.getDependency()).to.equal(22);
        });

        it("should coerce dependency", function () {
            var dependency = DependencyModel(Engine);
            expect(dependency.getDependency()).to.equal(Engine);
        });

        it("should not ceorce undefined dependency", function () {
            var dependency = DependencyModel();
            expect(dependency).to.be.undefined;
        });
    });

    describe("#test", function () {
        it("should test dependency modifier", function () {
            var dependency = new DependencyModel(22, DependencyModifiers.Use);
            expect(dependency.test(DependencyModifiers.Use)).to.be.true;
        });
    });
});

describe("ComponentModel", function () {
    describe("#getKey", function () {
        it("should return class if no key", function () {
            var componentModel = new ComponentModel;
            componentModel.setClass(Ferrari);
            expect(componentModel.getKey()).to.equal(Ferrari);
        });
    });

    describe("#setClass", function () {
        it("should reject invalid class", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.setClass(1);
            }).to.throw(Error, "1 is not a class.");
        });
    });

    describe("#getFactory", function () {
        it("should return default factory", function () {
            var componentModel = new ComponentModel;
            componentModel.setClass(Ferrari);
            expect(componentModel.getFactory()).to.be.a('function');
        });
    });

    describe("#setFactory", function () {
        it("should reject factory if not a function", function () {
            var componentModel = new ComponentModel;
            expect(function () {
                componentModel.setFactory(true);
            }).to.throw(Error, "true is not a function.");
        });
    });

    describe("#manageDependencies", function () {
        it("should manage dependencies", function () {
            var componentModel = new ComponentModel;
                dependencies   = componentModel.manageDependencies(function (deps) {
                    deps.append(Car, 22);
                });
            expect(dependencies).to.have.length(2);
            expect(dependencies[0].getDependency()).to.equal(Car);
            expect(dependencies[1].getDependency()).to.equal(22);
        });
    });

    var context, container;
    beforeEach(function() {
        context   = new Context;
        container = Container(context);
        context.addHandlers(new IoContainer, new ValidationCallbackHandler);
    });

    describe("#constructor", function () {
        it("should configure component fluently", function (done) {
            Promise.resolve(container.register($component(V12))).then(function () {
                Promise.resolve(container.resolve(V12)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });

    describe("#instance", function () {
        it("should use supplied instance", function (done) {
            var v12 = new V12(333, 4.2);
            Promise.resolve(container.register($component(V12).instance(v12))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.equal(v12);
                    done();
                });
            });
        });
    });

    describe("#singleton", function () {
        it("should configure singleton component", function (done) {
            Promise.resolve(container.register($component(V12).singleton())).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.equal(engine1);
                    done();
                });
            });
        });
    });

    describe("#transient", function () {
        it("should configure transient component", function (done) {
            Promise.resolve(container.register($component(V12).transient())).then(function () {
                Promise.all([container.resolve(V12), container.resolve(V12)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.not.equal(engine1);
                    done();
                });
            });
        });
    });

    describe("#contextual", function () {
        it("should configure contextual component", function (done) {
            Promise.resolve(container.register($component(V12).contextual())).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                    expect(engine1).to.be.instanceOf(V12);
                    expect(engine2).to.equal(engine1);
                    var childContext = context.newChild();
                    $using(childContext, 
                           Promise.resolve(Container(childContext).resolve(V12)).then(function (engine3) {
                               expect(engine3).to.not.equal(engine1);
                               done();
                           })
                    );
                });
            });
        });
    });

    describe("#boundTo", function () {
        it("should configure component implementation", function (done) {
            Promise.resolve(container.register(
                $component(Engine).boundTo(V12)
            )).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should configure component name", function (done) {
            Promise.resolve(container.register(
                $component('engine').boundTo(V12)
            )).then(function () {
                Promise.resolve(container.resolve('engine')).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });

    describe("#usingFactory", function () {
        it("should create components with factory", function (done) {
             Promise.resolve(container.register(
                 $component(Engine).usingFactory(function () {
                     return new V12(450, 6.2);
                 })
             )).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    expect(engine.getHorsepower()).to.equal(450);
                    expect(engine.getDisplacement()).to.equal(6.2);
                    done();
                });
            });
        });
    });

    describe("#dependsOn", function () {
        it("should configure component dependencies", function (done) {
            Promise.resolve(container.register(
                $component(Engine).boundTo(V12)
                                  .dependsOn($use(255), $use(5.0))
            )).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });

        it("should configure component dependencies with factory", function (done) {
             Promise.resolve(container.register(
                 $component(Engine).dependsOn($use(1000), $use(7.7))
                                   .usingFactory(function (burden) {
                     return V12.new.apply(V12, burden[PARAMETERS]);
                 })
             )).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    expect(engine.getHorsepower()).to.equal(1000);
                    expect(engine.getDisplacement()).to.equal(7.7);
                    done();
                });
            });
        });
    });

    describe("#interceptors", function () {
        it("should configure component interceptors", function (done) {
            Promise.resolve(container.register(
                $component(LogInterceptor),
                $component(Engine).boundTo(V12)
                                  .dependsOn($use(255), $use(5.0))
                                  .interceptors(LogInterceptor)
            )).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });
    });
});

describe("ComponentBuilder", function () {
    var context, container;
    beforeEach(function() {
        context   = new Context;
        container = Container(context);
        context.addHandlers(new IoContainer, new ValidationCallbackHandler);
    });
    
    describe("#constructor", function () {
        it("should configure component fluently", function (done) {
            Promise.resolve(container.register($component(V12))).then(function () {
                Promise.resolve(container.resolve(V12)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });
    
    describe("#boundTo", function () {
        it("should configure component implementation", function (done) {
            Promise.resolve(container.register($component(Engine).boundTo(V12))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
            
        it("should configure component name", function (done) {
            Promise.resolve(container.register($component('engine').boundTo(V12))).then(function () {
                Promise.resolve(container.resolve('engine')).then(function (engine) {
                    expect(engine).to.be.instanceOf(V12);
                    done();
                });
            });
        });
    });
    
    describe("#dependsOn", function () {
        it("should configure component dependencies", function (done) {
            Promise.resolve(container.register($component(Engine).boundTo(V12)
                                     .dependsOn($use(255), $use(5.0)))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });
    });

    describe("#interceptors", function () {
        it("should configure component interceptors", function (done) {
            Promise.resolve(container.register($component(LogInterceptor),
                                 $component(Engine).boundTo(V12)
                                     .dependsOn($use(255), $use(5.0))
                                     .interceptors(LogInterceptor))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(255);
                    expect(engine.getDisplacement()).to.equal(5.0);
                    done();
                });
            });
        });
    });
});

describe("SingletonLifestyle", function () {
    describe("#resolve", function () {
        it("should resolve same instance for SingletonLifestyle", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve((container).register($component(V12).singleton())).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                        expect(engine1).to.equal(engine2);
                        done();
                    });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose instance when unregistered", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.all(container.register($component(RebuiltV12).singleton(),
                                     $component(CraigsJunk))).spread(function (unregister) {
                Promise.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
                        unregister();
                        expect(junk.getParts()).to.eql([engine]);
                        done();
                    });
            });
        });

        it("should not dispose instance when called directly", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.all(container.register($component(RebuiltV12),
                                     $component(CraigsJunk))).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
                        engine.dispose();
                        expect(junk.getParts()).to.eql([]);
                        done();
                    });
            });
        });
    });
});

describe("TransientLifestyle", function () {
    describe("#resolve", function () {
        it("should resolve diferent instance for TransientLifestyle", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve(container.register($component(V12).transient())).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                        expect(engine1).to.not.equal(engine2);
                        done();
                    });
            });
        });
    });
});

describe("ContextualLifestyle", function () {
    var Controller = Base.extend(Contextual, ContextualMixin, {
            $inject: [$optional(Context)],
            constructor: function (context) {
                this.setContext(context);
            }
        });
    describe("#resolve", function () {
        it("should resolve diferent instance per context for ContextualLifestyle", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve(container.register($component(V12).contextual())).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Engine)])
                    .spread(function (engine1, engine2) {
                        expect(engine1).to.equal(engine2);
                        var childContext = context.newChild();
                        $using(childContext, 
                               Promise.resolve(Container(childContext).resolve(Engine)).then(function (engine3) {
                                   expect(engine3).to.not.equal(engine1);
                                   done();
                               })
                        );
                    });
            });
        });

        it("should implicitly satisfy Context dependency", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve(container.register($component(Controller))).then(function () {
                Promise.resolve(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should setContext if contextual object", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve(container.register(
                $component(Controller).contextual().dependsOn([]))).then(function () {
                Promise.resolve(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should fulfill child Context dependency", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.resolve(container.register(
                $component(Controller).dependsOn($child(Context)))).then(function () {
                Promise.resolve(container.resolve(Controller)).then(function (controller) {
                    expect(controller.getContext().getParent()).to.equal(context);
                    done();
                });
            });
        });

        it("should resolve nothing if context not available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Promise.resolve(Container(container).register($component(V12).contextual())).then(function () {
                Promise.resolve(Container(container).resolve(Engine)).then(function (engine) {
                    expect(engine).to.be.undefined;
                    done();
                });
            });
        });

        it("should reject Context dependency if context not available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Promise.resolve(Container(container).register(
                $component(Controller).dependsOn(Context))).then(function () {
                Promise.resolve(Container(container).resolve(Controller)).catch(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.dependency.getKey()).to.equal(Context);
                    done();
                });
            });
        });

        it("should not fail if optional child Context and no context available", function (done) {
            var container = (new ValidationCallbackHandler).next(new IoContainer);
            Promise.resolve(Container(container).register(
                $component(Controller).dependsOn($optional($child(Context))))).then(function () {
                Promise.resolve(Container(container).resolve(Controller)).then(function (controller) {
                    done();
                });
            });
        });
    });

    describe("#dispose", function () {
        it("should dispose unregistered components", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).spread(function (unregister) {
                    Promise.all([container.resolve(Engine), container.resolve(Junkyard)])
                        .spread(function (engine, junk) {
                            unregister();
                            expect(junk.getParts()).to.eql([engine]);
                            done();
                        });
                });
        });

        it("should dispose components when context ended", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).then(function () {
                var engine, junk,
                    childContext = context.newChild();
                $using(childContext, 
                       Promise.all([Container(childContext).resolve(Engine),
                              Container(childContext).resolve(Junkyard)]).spread(function (e, j) {
                           engine = e, junk = j;
                      })
                ).finally(function() {
                      expect(junk.getParts()).to.eql([engine]);
                      done();
                  });
            });
        });

        it("should not dispose instance when called directly", function (done) {
            var context   = new Context,
                container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
            Promise.all(container.register($component(RebuiltV12).contextual(),
                                     $component(CraigsJunk))).then(function () {
                Promise.all([container.resolve(Engine), container.resolve(Junkyard)])
                    .spread(function (engine, junk) {
                        engine.dispose();
                        expect(junk.getParts()).to.eql([]);
                        done();
                });
            });
        });
    })
});

describe("IoContainer", function () {
    describe("#register", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should register component from class", function (done) {
            Promise.resolve(container.register($component(Ferrari))).then(function () {
                done();
            });
        });

        it("should register component from protocol and class", function (done) {
             Promise.resolve(container.register($component(Car).boundTo(Ferrari))).then(function () {
                done();
            });
        });

        it("should register component from name and class", function (done) {
            Promise.resolve(container.register($component('car').boundTo(Ferrari))).then(function () {
                done();
            });
        });

        it("should unregister component", function (done) {
            Promise.resolve(container.register($component(V12))).spread(function (unregister) {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    unregister();
                    expect(engine).to.be.instanceOf(V12);
                    expect(container.resolve(Engine)).to.be.undefined;
                    done();
                });
            });
        });

        it("should reject registration if no key", function (done) {
            Promise.resolve(container.register($component())).catch(function (error) {
                expect(error.getKeyErrors("Key")).to.eql([
                    new ValidationError("Key could not be determined for component.", {
                        key:  "Key",
                        code: ValidationErrorCode.Required
                    })
                ]);
                done();
            });
        });

        it("should reject registration if no factory", function (done) {
            Promise.resolve(container.register($component('car'))).catch(function (error) {
                expect(error.getKeyErrors("Factory")).to.eql([
                    new ValidationError("Factory could not be determined for component.", {
                        key:  "Factory",
                        code: ValidationErrorCode.Required
                    })
                ]);
                done();
            });
        });
    });

    describe("#resolve", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should resolve component", function (done) {
            Promise.all(container.register($component(Ferrari), $component(V12))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferrari);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should resolve nothing if component not found", function (done) {
            Promise.resolve(container.resolve(Car)).then(function (car) {
                expect(car).to.be.undefined;
                done();
            });
        });

        it("should resolve class invariantly", function (done) {
            Promise.all(container.register($component(Ferrari), $component(V12))).then(function () {
                Promise.resolve(container.resolve($eq(Car))).then(function (car) {
                    expect(car).to.be.undefined;
                    Promise.resolve(container.resolve($eq(Ferrari))).then(function (car) {
                        expect(car).to.be.instanceOf(Ferrari);
                        expect(car.getEngine()).to.be.instanceOf(V12);
                        done();
                    });
                });
            });
        });

        it("should resolve class instantly", function (done) {
            Promise.all(container.register($component(Ferrari), $component(V12))).then(function () {
                var car = container.resolve($instant(Car));
                expect(car).to.be.instanceOf(Ferrari);
                expect(car.getEngine()).to.be.instanceOf(V12);
                done();
            });
        });

        it("should resolve instance with supplied dependencies", function (done) {
            Promise.resolve(container.register(
                $component(V12).dependsOn($use(917), $use(6.3)))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(917);
                    expect(engine.getDisplacement()).to.equal(6.3);
                    done();
                });
            });
        });

        it("should resolve instance using decorator pattern", function (done) {
            Promise.resolve(container.register(
                $component(Supercharger).dependsOn([,$use(.5)]),
                $component(V12).dependsOn($use(175), $use(3.2)))).then(function () {
                Promise.resolve(container.resolve(Engine)).then(function (engine) {
                    expect(engine.getHorsepower()).to.equal(262.5);
                    expect(engine.getDisplacement()).to.equal(3.2);
                    done();
                });
            });
        });

        it("should resolve instance with dependency promises", function (done) {
            var Order = Base.extend({
                    $inject: [$promise(Engine), $promise($use(19))],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
            Promise.all(container.register($component(Order), $component(V12))).then(function () {
                Promise.resolve(container.resolve(Order)).then(function (order) {
                    expect($isPromise(order.getEngine())).to.be.true;
                    expect($isPromise(order.getCount())).to.be.true;
                    Promise.all([order.getEngine(), order.getCount()]).spread(function (engine, count) {
                        expect(engine).to.be.instanceOf(V12);
                        expect(count).to.equal(19);
                        done();
                    });
                });
            });
        });

        it("should override dependencies", function (done) {
            Promise.all(container.register(
                      $component(Ferrari).dependsOn($use('Enzo'), $optional(Engine)),
                      $component(V12))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferrari);
                    expect(car.getEngine()).to.be.instanceOf(V12);
                    done();
                });
            });
        });

        it("should accept null dependnecies", function (done) {
            Promise.resolve(container.register(
                $component(Ferrari).dependsOn(null, null))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferrari);
                    expect(car.getEngine()).to.be.null;
                    done();
                });
            });
        });

        it("should resolve instance with optional dependencies", function (done) {
            Promise.all(container.register($component(Ferrari), $component(V12),
                                     $component(OBDII))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    var diagnostics = car.getEngine().getDiagnostics();
                    expect(diagnostics).to.be.instanceOf(OBDII);
                    expect(diagnostics.getMPG()).to.equal(22.0);
                    done();
                });
            });
        });

        it("should resolve instance with optional missing dependencies", function (done) {
            Promise.resolve(container.register(
                  $component(Ferrari).dependsOn($optional(Engine)))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferrari);
                    expect(car.getEngine()).to.be.undefined;
                    done();
                });
            });
        });

        it("should resolve instance with lazy dependencies", function (done) {
            var Order = Base.extend({
                    $inject: [$lazy(Engine), $lazy($use(9))],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine(); },
                            getCount: function () { return count; }
                        });
                    }
                });
            Promise.all(container.register($component(Order), $component(V12))).then(function () {
                Promise.resolve(container.resolve(Order)).then(function (order) {
                    Promise.all([order.getEngine(), order.getEngine()]).spread(function (engine1, engine2) {
                        expect(engine1).to.be.instanceOf(V12);
                        expect(engine1).to.equal(engine2);
                        expect(order.getCount()).to.equal(9);
                        done();
                    });
                });
            });
        });

        it("should not fail resolve when missing lazy dependencies", function (done) {
            var Order = Base.extend({
                    $inject: [$lazy(Engine)],
                    constructor: function (engine) {
                        this.extend({
                            getEngine: function () { return engine(); }
                        });
                    }
                });
            Promise.resolve(container.register($component(Order))).then(function () {
                Promise.resolve(container.resolve(Order)).then(function (order) {
                    expect(order).to.be.instanceOf(Order);
                    expect(order.getEngine()).to.be.undefined;
                    done();
                });
            });
        });

        it("should delay rejecting lazy dependency failures", function (done) {
            var Order = Base.extend({
                    $inject: [$lazy(Car)],
                    constructor: function (car) {
                        this.extend({
                            getCar: function () { return car(); }
                        });
                    }
                });
            Promise.all(container.register($component(Order), $component(Ferrari))).then(function () {
                Promise.resolve(container.resolve(Order)).then(function (order) {
                    expect(order).to.be.instanceOf(Order);
                    Promise.resolve(order.getCar()).catch(function (error) {
                        expect(error).to.be.instanceof(DependencyResolutionError);
                        expect(error.message).to.match(/Dependency.*Engine.*<=.*Car.*could not be resolved./);
                        done();
                    });
                });
            });
        });

        it("should resolve instance with invariant dependencies", function (done) {
                Promise.all(container.register($component(Ferrari).dependsOn($use('Spider'), $eq(V12)),
                                               $component(Engine).boundTo(V12))).then(function () {
                Promise.resolve(container.resolve(Car)).catch(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*`.*V12.*`.*<=.*Car.*could not be resolved./);
                    container.register($component(V12)).then(function () {
                        Promise.resolve(container.resolve(Car)).then(function (car) {
                            expect(car).to.be.instanceOf(Ferrari);
                            expect(car.getEngine()).to.be.instanceOf(V12);
                            done();
                        });
                    });
                });
            });
        });

        it("should resolve instance with dynamic dependencies", function (done) {
            var count   = 0,
                counter = function () { return ++count; },
                Order = Base.extend({
                    $inject: [Engine, $eval(counter)],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
                Promise.all(container.register($component(Order).transient(),
                                               $component(V12))).then(function (reg) {
                Promise.all([container.resolve(Order), container.resolve(Order)])
                    .spread(function (order1, order2) {
                        expect(order1.getCount()).to.equal(1);
                        expect(order2.getCount()).to.equal(2);
                        done();
                    });
            });
        });

        it("should behave like $use if no function passed to $eval", function (done) {
            var  Order = Base.extend({
                    $inject: [Engine, $eval(5)],
                    constructor: function (engine, count) {
                        this.extend({
                            getEngine: function () { return engine; },
                            getCount: function () { return count; }
                        });
                    }
                });
            Promise.all(container.register($component(Order).transient(),
                                           $component(V12))).then(function (reg) {
                Promise.all([container.resolve(Order), container.resolve(Order)])
                    .spread(function (order1, order2) {
                        expect(order1.getCount()).to.equal(5);
                        expect(order2.getCount()).to.equal(5);
                        done();
                    });
            });
        });

        it("should implicitly satisfy container dependency", function (done) {
            var Registry = Base.extend({
                    $inject: [Container],
                    constructor: function (container) {
                        this.extend({
                            getContainer: function () { return container; },
                        });
                    }
                });
            Promise.resolve(container.register($component(Registry))).then(function () {
                Promise.resolve(container.resolve(Registry)).then(function (registry) {
                    expect(registry.getContainer()).to.be.instanceOf(Container);
                    done();
                });
            });
        });

        it("should implicitly satisfy composer dependency", function (done) {
            var Registry = Base.extend({
                    $inject: [$$composer],
                    constructor: function (composer) {
                        this.extend({
                            getComposer: function () { return composer; },
                        });
                    }
                });
            Promise.resolve(container.register($component(Registry))).then(function () {
                Promise.resolve(container.resolve(Registry)).then(function (registry) {
                    expect(registry.getComposer()).to.equal(context);
                    Promise.resolve(Validator(registry.getComposer()).validate(registry))
                           .then(function (validation) {
                        expect(validation.isValid()).to.be.true;
                    });
                    done();
                });
            });
        });

        it("should have opportunity to resolve missing components", function (done) {
            var context   = new Context;
                container = new IoContainer,
            context.addHandlers(container, new ValidationCallbackHandler);
            $provide(container, Car, function (resolution, composer) {
                return new Ferrari('TRS', new V12(917, 6.3));
            });
            Promise.resolve(Container(context).resolve(Car)).then(function (car) {
                expect(car).to.be.instanceOf(Ferrari);
                expect(car.getModel()).to.equal('TRS');
                expect(car.getEngine()).to.be.instanceOf(V12);
                done();
            });
        });

        it("should resolve external dependencies", function (done) {
            var engine = new V12;
            context.store(engine);
            Promise.resolve(container.register($component(Ferrari))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    expect(car).to.be.instanceOf(Ferrari);
                    expect(car.getEngine()).to.equal(engine);
                    done();
                });
            });
        });

        it("should resolve in new child context", function (done) {
            var Workflow = Base.extend(ContextualMixin);
            Promise.all(container.register(
                    $component(Workflow).newInContext())).then(function () {
                Promise.resolve(container.resolve(Workflow)).done(function (workflow) {
                    expect(workflow).to.be.instanceOf(Workflow);
                    expect(workflow.getContext()).to.equal(context);
                    done();
                });
            });
        });

        it("should resolve in new child context", function (done) {
            var AssemblyLine = Base.extend({
                $inject: [Engine],
                constructor: function (engine) {
                    this.extend({
                        getEngine: function () { return engine; }
                    });
                }    
            });
            Promise.all(container.register(
                    $component(V12),
                    $component(AssemblyLine).newInChildContext())).then(function () {
                Promise.resolve(container.resolve(AssemblyLine)).done(function (assembleEngine) {
                    expect(assembleEngine).to.be.instanceOf(AssemblyLine);
                    expect(assembleEngine.getEngine()).to.be.instanceOf(V12);
                    expect(assembleEngine.getContext().getParent()).to.equal(context);
                    done();
                });
            });
        });

        it("should ignore external dependencies for $container", function (done) {
            context.store(new V12);
            Promise.resolve(container.register(
                $component(Ferrari).dependsOn($container(Engine)))).then(function () {
                Promise.resolve(container.resolve(Car)).catch(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Car.*<-.*Ferrari.*)could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });

        it("should use child contexts to manage child containers", function (done) {
            var Order = Base.extend({
                    $inject: [Car],
                    constructor: function (car) {
                        this.extend({
                            getCar: function () { return car; }
                        });
                    }
                }),
                childContext = context.newChild();
            $using(childContext, 
                   Promise.all([Container(childContext).register(
                               $component(Order), $component(RebuiltV12)),
                          container.register($component(Ferrari), $component(OBDII),
                                             $component(CraigsJunk))]).then(function () {
                    Promise.resolve(container.resolve(Order)).then(function (order) {
                        var car         = order.getCar(),
                            engine      = car.getEngine(),
                            diagnostics = engine.getDiagnostics();
                        expect(car).to.be.instanceOf(Ferrari);
                        expect(engine).to.be.instanceOf(RebuiltV12);
                        expect(diagnostics).to.be.instanceOf(OBDII);
                        done();
                    });
                })
            );
        });

        it("should resolve collection dependencies", function (done) {
            Promise.all(container.register($component(Ferrari).dependsOn($use('LaFerrari')),
                                           $component(Bugatti).dependsOn($use('Veyron')),
                                           $component(V12), $component(Auction))).then(function () {
                Promise.resolve(container.resolve(Auction)).then(function (auction) {
                    var cars = auction.getCars();
                    expect(cars['Ferrari']).to.have.length(1);
                    expect(cars['Bugatti']).to.have.length(1);
                    done();
                });
            });
        });

        it("should resolve collection dependencies from child containers", function (done) {
            Promise.all(container.register($component(Ferrari).dependsOn($use('LaFerrari')),
                                           $component(Bugatti).dependsOn($use('Veyron')),
                                           $component(V12))).then(function () {
                var childContext = context.newChild();
                $using(childContext, 
                       Promise.resolve(Container(childContext).register(
                           $component(Ferrari).dependsOn($use('California')),
                           $component(Auction))).then(function () {
                               Promise.resolve(Container(childContext).resolve(Auction)).then(function (auction) {
                                   var cars     = auction.getCars();
                                   expect(cars['Ferrari']).to.have.length(2);
                                   var ferraris = js.Array2.map(cars['Ferrari'], function (ferrari) {
                                       return ferrari.getModel();
                                   });
                                   expect(ferraris).to.eql(['LaFerrari', 'California']);
                                   expect(cars['Bugatti']).to.have.length(1);
                                   done();
                               });
                           })
                );
            });
        });

        it("should fail resolve if missing dependencies", function (done) {
            Promise.resolve(container.register($component(Ferrari))).then(function (model) {
                Promise.resolve(container.resolve(Car)).catch(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Car.*<-.*Ferrari.*)could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });

        it("should detect circular dependencies", function (done) {
            Promise.all(container.register($component(Ferrari),
                        $component(V12).dependsOn($use(917), $use(6.3), Engine))).then(function () {
                Promise.resolve(container.resolve(Car)).catch(function (error) {
                    expect(error).to.be.instanceof(DependencyResolutionError);
                    expect(error.message).to.match(/Dependency.*Engine.*<= (.*Engine.*<-.*V12.*) <= (.*Car.*<-.*Ferrari.*) could not be resolved./);
                    expect(error.dependency.getKey()).to.equal(Engine);
                    done();
                });
            });
        });
    });

    describe("#resolveAll", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should resolve all components", function (done) {
            Promise.all(container.register($component(Ferrari).dependsOn($use('LaFerrari')),
                                     $component(Bugatti).dependsOn($use('Veyron')),
                                     $component(V12))).then(function () {
                Promise.resolve(container.resolveAll(Car)).then(function (cars) {
                    var inventory = js.Array2.combine(  
                        js.Array2.map(cars, function (car) { return car.getMake(); }),
                        js.Array2.map(cars, function (car) { return car.getModel(); }));
                    expect(inventory['Ferrari']).to.equal('LaFerrari');
                    expect(inventory['Bugatti']).to.equal('Veyron');
                    done();
                });
            });
        });
    })

    describe("#dispose", function () {
        var context, container;
        beforeEach(function() {
            context   = new Context;
            container = Container(context);
            context.addHandlers(new IoContainer, new ValidationCallbackHandler);
        });

        it("should dispose all components", function (done) {
            Promise.all(container.register($component(Ferrari), $component(V12))).then(function () {
                Promise.resolve(container.resolve(Car)).then(function (car) {
                    done();
                    container.dispose();
                });
            });
        });
    });
});

},{"../../lib/ioc/ioc.js":8,"../../lib/miruken.js":9,"bluebird":12,"chai":13}],60:[function(require,module,exports){
(function (global){
var miruken = require('../lib/miruken.js'),
    Promise = require('bluebird'),
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(base2.js.namespace);
eval(miruken.namespace);

Promise.onPossiblyUnhandledRejection(Undefined);

new function () { // closure

    var miruken_test = new base2.Package(this, {
        name:    "miruken_test",
        exports: "Animal,Tricks,CircusAnimal,Dog,Elephant,AsianElephant,Tracked,ShoppingCart,TreeNode,LogInterceptor"
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
        constructor: function (name) {
           this.extend({
               getName: function () { return name; }
           });
        },
        talk: function () { return 'Ruff Ruff'; },
        fetch: function (item) { return 'Fetched ' + item; }
    });

    var Elephant = Base.extend(CircusAnimal, {
    });
    
	var Tracked = Protocol.extend({
		getTag: function () {}
	});

    var AsianElephant = Elephant.extend(Tracked);

    var ShoppingCart = Base.extend(Disposing, DisposingMixin, {
        constructor: function () {
            var _items = [];
            this.extend({
                getItems: function () { return _items; },
                addItem: function (item) { _items.push(item); }, 
                _dispose: function () { _items = []; }
            });
        }
    });
    
    var TreeNode = Base.extend(Traversing, TraversingMixin, {
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

    var LogInterceptor = Interceptor.extend({
        intercept: function (invocation) {
            console.log(lang.format("Called %1 with (%2) from %3",
                        invocation.getMethod(),
                        invocation.getArgs().join(", "), 
                        invocation.getSource()));
            var result = invocation.proceed();
            console.log(lang.format("    And returned %1", result));
            return result;
        }
    });

    eval(this.exports);
};

eval(base2.miruken_test.namespace);

describe("miruken", function () {
    it("should be in global namespace", function () {
        expect(global.miruken).to.equal(base2.miruken);
    });
});

describe("Enum", function () {
    it("should be immutable", function () {
        var Color = Enum({red: 1, blue: 2, green: 3});
        expect(Color.prototype).to.be.instanceOf(Enum);
        Color.black = 4;
        expect(Color.black).to.be.undefined;
    });

    it("should reject enum construction", function () {
        var Color = Enum({red: 1, blue: 2, green: 3});
        expect(function () { 
            new Color(2);
        }).to.throw(Error, /Enums cannot be instantiated./);
    });
});

describe("Miruken", function () {
    it("should be in global namespace", function () {
        expect(global.Miruken).to.equal(base2.miruken.Miruken);
    });

    it("should pass arguments to base", function () {
        var Something = Miruken.extend({
            constructor: function () {
                this.base({name: 'Larry'});
            }
        }),
        something = new Something;
        expect(something.name).to.equal('Larry');
    });

    it("should perform coercion by default", function () {
        var Pet = Miruken.extend({
                constructor: function (name) {
                    this.extend({
                        getName: function () { return name; }
                    });
                }
            }),
            pet = Pet('Spike');
        expect(pet).to.be.instanceOf(Pet);
        expect(pet.getName()).to.equal('Spike');
    });
});

describe("$isClass", function () {
    it("should identify miruken classes", function () {
        expect($isClass(Dog)).to.be.true;
    });

    it("should reject non-miruken classes", function () {
        var SomeClass = function () {};
        expect($isClass(SomeClass)).to.be.false;
    });
});

describe("$isFunction", function () {
    it("should identify functions", function () {
        var fn = function () {};
        expect($isFunction(fn)).to.be.true;
    });

    it("should reject no functions", function () {
        expect($isFunction(1)).to.be.false;
        expect($isFunction("hello")).to.be.false;
    });
});

describe("$properties", function () {
    var Person = Base.extend($properties, {
        $properties: {
            firstName: '',
            age:       undefined,
            gender:    $readonly('male'),
            pet:       $type(Animal)
        }
    }), Doctor = Person.extend({
        $properties: {
            patient:   $type(Person)
        }
    });

    it("should synthesize instance properties", function () {
        var person       = new Person,
            friend       = new Person;
        person.firstName = 'John';
        expect(person.firstName).to.equal('John');
        expect(person._firstName).to.be.undefined;
        person.firstName = 'Sarah';
        expect(person.firstName).to.equal('Sarah');
        expect(friend.firstName).to.equal('');
    });

    it("should synthesize custom instance properties", function () {
        var person = new Person;
        person.age = 18;
        expect(person.age).to.equal(18);
        expect(person.__age).to.be.undefined;
        person.age = 45;
        expect(person.age).to.equal(45);
    });

    it("should synthesize readonly instance properties", function () {
        var person    = new Person;
        person.gender = 'female';
        expect(person.gender).to.equal('male');
    });

    it("should retrieve property type", function () {
        expect(Doctor.meta.getPropertyType('patient')).to.equal(Person);
    });

    it("should retrieve inherited property type", function () {
        expect(Doctor.meta.getPropertyType('pet')).to.equal(Animal);
    });
});

describe("$inferProperties", function () {
    var Person = Base.extend( 
        $inferProperties, {
        constructor: function (firstName) {
            this.firstName = firstName;
        },
        getFirstName: function () { return this._name; },
        setFirstName: function (value) { this._name = value; }
    });
    
    it("should infer instance properties", function () {
        var person = new Person('Sean');
        expect(person.firstName).to.equal('Sean');
        expect(person.getFirstName()).to.equal('Sean');
    });

    it("should infer extended properties", function () {
        var Doctor = Person.extend({
                constructor: function (firstName, speciality) {
                    this.base(firstName);
                    this.speciality = speciality;
                },
                getSpeciality: function () { return this._speciality; },
                setSpeciality: function (value) { this._speciality = value; }
            }),
            Surgeon = Doctor.extend({
                constructor: function (firstName, speciality, hospital) {
                    this.base(firstName, speciality);
                    this.hospital = hospital;
                },
                getHospital: function () { return this._hospital; },
                setHospital: function (value) { this._hospital = value; }
            }),
            doctor  = new Doctor('Frank', 'Orthopedics'),
            surgeon = new Surgeon('Brenda', 'Cardiac', 'Baylor');
        expect(doctor.firstName).to.equal('Frank');
        expect(doctor.getFirstName()).to.equal('Frank');
        expect(doctor.speciality).to.equal('Orthopedics');
        expect(doctor.getSpeciality()).to.equal('Orthopedics');
        expect(surgeon.firstName).to.equal('Brenda');
        expect(surgeon.getFirstName()).to.equal('Brenda');
        expect(surgeon.speciality).to.equal('Cardiac');
        expect(surgeon.getSpeciality()).to.equal('Cardiac');
        expect(surgeon.hospital).to.equal('Baylor');
        expect(surgeon.getHospital()).to.equal('Baylor');
    });

    it("should infer implemented properties", function () {
        Person.implement({
            getMother: function () { return this._mother; },
            setMother: function (value) { this._mother = value; } 
        });
        var mom = new Person,
            son = new Person;
        son.mother = mom;
        expect(son.mother).to.equals(mom);
        expect(son.getMother()).to.equal(mom);
    });

    it("should infer extended instance properties", function () {
        var person = new Person;
        person.extend({
            getAge: function () { return this._age; },
            setAge: function (value) { this._age = value; }
        });
        person.age = 23;
        expect(person.age).to.equal(23);
        expect(person.getAge()).to.equal(23);
    });
});

describe("$inheritStatic", function () {
    var Math = Base.extend(
        $inheritStatic, null, {
            PI: 3.14159265359,
            add: function (a, b) {
                return a + b;
            }
        }), 
        Geometry = Math.extend(null, {
            area: function(length, width) {
                return length * width;
            }
        });
    
    it("should inherit static members", function () {
        expect(Geometry.PI).to.equal(Math.PI);
        expect(Geometry.add).to.equal(Math.add);
    });
});

describe("DisposingMixin", function () {
    describe("dispose", function () {
        it("should provide dispose", function () {
            var shoppingCart = new ShoppingCart;
            shoppingCart.addItem("Sneakers");
            shoppingCart.addItem("Milk");
            expect(shoppingCart.getItems()).to.eql(["Sneakers", "Milk"]);
            shoppingCart.dispose();
            expect(shoppingCart.getItems()).to.eql([]);
        });

        it("should only dispose once", function () {
            var counter = 0,
                DisposeCounter = Base.extend(Disposing, DisposingMixin, {
                _dispose: function () { ++counter; }
            });
            var disposeCounter = new DisposeCounter;
            expect(counter).to.equal(0);
            disposeCounter.dispose();
            expect(counter).to.equal(1);
            disposeCounter.dispose();
            expect(counter).to.equal(1);
        });
    });
});

describe("$using", function () {
    it("should call block then dispose", function () {
        var shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, function (cart) {
            expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche"]);
        });
        expect(shoppingCart.getItems()).to.eql([]);
    });

    it("should call block then dispose if exeception", function () {
        var shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect(function () { 
            $using(shoppingCart, function (cart) {
                throw new Error("Something bad");
            });
        }).to.throw(Error, "Something bad");
        expect(shoppingCart.getItems()).to.eql([]);
    });

    it("should wait for promise to fulfill then dispose", function (done) {
        var shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, Promise.delay(100).then(function () {
               shoppingCart.addItem("Book");
               expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche", "Book"]);
               }) 
        ).finally(function () {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });

    it("should wait for promise to fail then dispose", function (done) {
        var shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, Promise.delay(100).then(function () {
               throw new Error("Something bad");
               }) 
        ).finally(function () {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
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
        it("should retrieve declaring protocols", function () {
            expect(Dog.getProtocols()).to.eql([Animal, Tricks]);
            expect(TreeNode.getProtocols()).to.eql([Traversing]);
        });
    });

    describe("#getAllProtocols", function () {
        it("should retrieve all protocol protocols", function () {
            expect(CircusAnimal.getAllProtocols()).to.eql([Animal, Tricks]);
        });

        it("should retrieve all class protocols", function () {
            expect(AsianElephant.getAllProtocols()).to.eql([Tracked, CircusAnimal, Animal, Tricks]);
        });
    });

    describe("#implement", function () {
        it("should extend protocol", function () {
            Animal.implement({
               reproduce: function () {}
            }),
            dog = new Dog;
            expect(Animal(dog).reproduce()).to.be.undefined;
            dog.extend({
                reproduce: function () {
                    return new Dog('Hazel');
                }
            });
            expect(Animal(dog).reproduce().getName()).to.equal('Hazel');
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
            expect(CircusAnimal.conformsTo(CircusAnimal)).to.be.true;
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

        it("should accept array of protocols", function () {
            var EndangeredAnimal = Base.extend([Animal, Tracked]);
            expect(EndangeredAnimal.conformsTo(Animal)).to.be.true;
            expect(EndangeredAnimal.conformsTo(Tracked)).to.be.true;
            expect(EndangeredAnimal.getProtocols()).to.eql([Animal, Tracked]);
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
            expect(Protocol.adoptedBy(Animal)).to.be.false;
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

describe("ProxyBuilder", function () {
    var ToUpperInterceptor = Interceptor.extend({
        intercept: function (invocation) {
            var args = invocation.getArgs();
            for (var i = 0; i < args.length; ++i) {
                if ($isString(args[i])) {
                    args[i] = args[i].toUpperCase();
                }
            }
            var result = invocation.proceed();
            if ($isString(result)) {
                result = result.toUpperCase();
            }
            return result;
        }
    });
        
    describe("#buildProxy", function () {
        it("should proxy class", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]),
                dog          = new DogProxy({
                                   parameters:   ['Patches'],
                                   interceptors: [new LogInterceptor]
                               });
            expect(dog.getName()).to.equal('Patches');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
        });

        it("should proxy protocol", function () {
            var proxyBuilder = new ProxyBuilder,
                AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                AnimalInterceptor = Interceptor.extend({
                    intercept: function (invocation) {
                            var method = invocation.getMethod(),
                                args = invocation.getArgs();
                        if (method === 'talk') {
                            return "I don't know what to say.";
                        } else if (method === 'eat') {
                            return lang.format("I don't like %1.", args[0]);
                        }
                        return invocation.proceed();
                    }
                }),
                animal = new AnimalProxy({
                             interceptors: [new AnimalInterceptor]
                         });
            expect(animal.talk()).to.equal("I don't know what to say.");
            expect(animal.eat('pizza')).to.equal("I don't like pizza.");
        });

        it("should proxy classes and protocols", function () {
            var proxyBuilder   = new ProxyBuilder,
                Flying         = Protocol.extend({ fly: function () {} }),
                FlyingInterceptor = Interceptor.extend({
                    intercept: function (invocation) {
                        if (invocation.getMethod() !== 'fly') {
                            return invocation.proceed();
                        }
                    }
                }),
                FlyingDogProxy = proxyBuilder.buildProxy([Dog, Flying, DisposingMixin]);
            $using(new FlyingDogProxy({
                       parameters:   ['Wonder Dog'],
                       interceptors: [new FlyingInterceptor, new LogInterceptor]
                   }), function (wonderDog) {
                expect(wonderDog.getName()).to.equal('Wonder Dog');
                expect(wonderDog.talk()).to.equal('Ruff Ruff');
                expect(wonderDog.fetch("purse")).to.equal('Fetched purse');
                wonderDog.fly();
                }
            );
        });

        it("should modify arguments and return value", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]),
                dog          = new DogProxy({
                                   parameters:   ['Patches'],
                                   interceptors: [new ToUpperInterceptor]
                               });
            expect(dog.getName()).to.equal('PATCHES');
            expect(dog.talk()).to.equal('RUFF RUFF');
            expect(dog.fetch("bone")).to.equal('FETCHED BONE');
        });

        it("should restrict proxied method with interceptor selector options", function () {
            var proxyBuilder = new ProxyBuilder,
                selector     =  (new InterceptorSelector).extend({
                    selectInterceptors: function (type, method, interceptors) {
                        return method === 'getName' ? interceptors : [];
                }}),
                DogProxy     = proxyBuilder.buildProxy([Dog]),
                dog          = new DogProxy({
                                   parameters:           ['Patches'],
                                   interceptors:         [new ToUpperInterceptor],
                                   interceptorSelectors: [selector]
                               });
            expect(dog.getName()).to.equal('PATCHES');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
        });

        it("should fail if no types array provided", function () {
            var proxyBuilder = new ProxyBuilder;
            expect(function () {
                proxyBuilder.buildProxy();
            }).to.throw(Error, "ProxyBuilder requires an array of types to proxy.");
        });

        it("should fail if no method to proceed too", function () {
            var proxyBuilder = new ProxyBuilder,
                AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                animal       = new AnimalProxy([]);
            expect(function () {
                animal.talk();
            }).to.throw(Error, "Interceptor cannot proceed without a class or delegate method 'talk'.");
        });
    });

    describe("#extend", function () {
        it("should reject extending  proxy classes.", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(function () {
                DogProxy.extend();
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
        });

        it("should proxy new method", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]),
                dog          = new DogProxy({
                                  parameters:  ['Patches'],
                                  interceptors:[new ToUpperInterceptor]
                               });
            dog.extend("getColor", function () { return "white with brown spots"; });
            dog.extend({
                getBreed: function () { return "King James Cavalier"; }
            });
            expect(dog.getColor()).to.equal("WHITE WITH BROWN SPOTS");
            expect(dog.getBreed()).to.equal("KING JAMES CAVALIER");
        });

        it("should proxy existing methods", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]),
                dog          = new DogProxy({
                                  parameters:  ['Patches'],
                                  interceptors:[new ToUpperInterceptor]
                               });
            expect(dog.getName()).to.equal("PATCHES");
            dog.extend({
                getName: function () { return "Spike"; }
            });
            expect(dog.getName()).to.equal("SPIKE");
        });
    });

    describe("#implement", function () {
        it("should reject extending  proxy classes.", function () {
            var proxyBuilder = new ProxyBuilder,
                DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(function () {
                DogProxy.implement(DisposingMixin);
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
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
            var CircularParent = Base.extend(TraversingMixin, {
                constructor: function (data) { 
                    this.extend({
                        getParent:   function () { return this; },
                        getChildren: function () { return []; },
                    });
                }});

            var CircularChildren = Base.extend(TraversingMixin, {
                constructor: function (data) { 
                    this.extend({
                        getParent:   function () { return null; },
                        getChildren: function () { return [this]; },
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

describe("Package", function () {
    describe("#getProtocols", function () {
        it("should expose protocol definitions", function () {
            var protocols = [];
            miruken_test.getProtocols(function (protocol) {
                protocols.push(protocol.member);
            });
            expect(protocols).to.have.members([Animal, Tricks, CircusAnimal, Tracked]);
        });
    });

    describe("#getClasses", function () {
        it("should expose class definitions", function () {
            var classes = [];
            miruken_test.getClasses(function (cls) {
                classes.push(cls.member);
            });
            expect(classes).to.have.members([Dog, Elephant, AsianElephant, ShoppingCart,
                                             TreeNode, LogInterceptor]);
        });
    });

    describe("#getPackages", function () {
        it("should expose package definitions", function () {
            var packages = [];
            base2.getPackages(function (package) {
                packages.push(package.member);
            });
            expect(packages).to.contain(miruken_test);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/miruken.js":9,"bluebird":12,"chai":13}],61:[function(require,module,exports){
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
    });
});
},{"../../lib/miruken.js":9,"../../lib/mvc/mvc.js":10,"chai":13}],62:[function(require,module,exports){
var miruken  = require('../lib/miruken.js'),
    context  = require('../lib/context.js')
    validate = require('../lib/validate.js'),
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
        exports: "Player,Team,"
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
        it("should invalidate object", function (done) {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler()),
            player = new Player;
            Promise.resolve(Validator(league).validate(player)).caught(function (error) {
                done();
            });
        });

        it("should be valid if no validators", function (done) {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler()),
            player = new Player;
            Promise.resolve(Validator(league).validate(player)).then(function (validated) {
                expect(validated.isValid(player)).to.be.true;
                done();
            });
        });

        it("should provide invalid keys", function (done) {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler()),
                player     = new Player("Matthew");
            Promise.resolve(Validator(league).validate(player)).caught(function (error) {
		    expect(error.getKeyCulprits()).to.eql(["LastName", "DOB"]);
            done();
            });
        });

        it("should provide key errors", function (done) {
            var team       = new Team("Liverpool", "U8"),
                league     = new Context()
                    .addHandlers(team, new ValidationCallbackHandler()),
                player     = new Player("Matthew");
            Promise.resolve(Validator(league).validate(player)).caught(function (error) {
                expect(error.getKeyErrors("LastName")).to.eql([
                    new ValidationError("Last name required", {
                        key:  "LastName",
                        code: ValidationErrorCode.Required
                    })
                ]);
                expect(error.getKeyErrors("DOB")).to.eql([
                    new ValidationError("Valid Date-of-birth required", {
                        key:  "DOB",
                        code: ValidationErrorCode.Invalid
                    })
                ]);
                done();
            });
        });

        it("should dynamically add validation", function (done) {
            var team   = new Team("Liverpool", "U8"),
                league = new Context()
                    .addHandlers(team, new ValidationCallbackHandler()),
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
            Promise.resolve(Validator(league).validate(player)).caught(function (error) {
                expect(error.getKeyErrors("DOB")).to.eql([
                    new ValidationError("Player too old for division U8", {
                        key:    "DOB",
                        code:   ValidationErrorCode.DateTooSoon,
                        source: new Date(2006, 7, 19)
                    })
                ]);
                done();
            });
        });

        it("should validate unknown sources", function (done) {
            var league = new Context()
                    .addHandlers(new ValidationCallbackHandler());
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
            Promise.resolve(Validator(league).validate(new Team)).caught(function (error) {
                expect(error.getKeyErrors("Name")).to.eql([
                    new ValidationError("Team name required", {
                        key:    "Name",
                        code:   ValidationErrorCode.Required,
                        source: undefined
                    })
                ]);
                done();
            });
        });
    });
});

},{"../lib/context.js":3,"../lib/miruken.js":9,"../lib/validate.js":11,"bluebird":12,"chai":13}]},{},[54,55,56,57,58,59,60,61,62]);
