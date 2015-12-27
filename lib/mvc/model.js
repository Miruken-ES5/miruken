var miruken = require('../miruken.js');
              require('../callback.js');
              require('../context.js');
              require('../validate');

new function () { // closure

    /**
     * Package providing Model-View-Controller abstractions.<br/>
     * Requires the {{#crossLinkModule "miruken"}}{{/crossLinkModule}},
     * {{#crossLinkModule "callback"}}{{/crossLinkModule}},
     * {{#crossLinkModule "context"}}{{/crossLinkModule}} and 
     * {{#crossLinkModule "validate"}}{{/crossLinkModule}} modules.
     * @module miruken
     * @submodule mvc
     * @namespace miruken.mvc
     */
    miruken.package(this, {
        name:    "mvc",
        imports: "miruken,miruken.validate",
        exports: "Model"
    });

    eval(this.imports);

    /**
     * Base class for modelling concepts using one or more 
     * {{#crossLink "miruken.$properties"}}{{/crossLink}}
     * <pre>
     *    var Child = Model.extend({
     *       $properties: {
     *           firstName: { validate: { presence: true } },
     *           lastNane:  { validate: { presence: true } },
     *           sibling:   { map: Child },
     *           age:       { validate {
     *                            numericality: {
     *                                onlyInteger:       true,
     *                                lessThanOrEqualTo: 12
     *                            }
     *                      }}
     *       }
     *    })
     * </pre>
     * @class Model
     * @constructor
     * @param  {Object}  [data]   -  json structured data
     * @param  {Object}  options  -  mapping options
     * @extends Base
     */
    var Model = Base.extend(
        $inferProperties, $validateThat, {
        constructor: function (data, options) {
            this.fromData(data, options);
        },
        /**
         * Maps json structured data into the model.
         * @method fromData
         * @param   {Object}  data     -  json structured data
         * @param   {Object}  options  -  mapping options
         */
        fromData: function (data, options) {
            if ($isNothing(data)) {
                return;
            }
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor(),
                dynamic     = options && options.dynamic;
            if (descriptors) {
                for (var key in descriptors) {
                    var descriptor = descriptors[key];
                    if (descriptor && descriptor.root && descriptor.map) {
                        this[key] = descriptor.map(data); 
                    }
                }
            }
            for (var key in data) {
                var descriptor = descriptors && descriptors[key],
                    mapper     = descriptor  && descriptor.map;
                if ((mapper && descriptor.root) || (descriptor && descriptor.ignore)) {
                    continue;  // ignore or already rooted
                }
                var value = data[key];
                if (value === undefined) {
                    continue;
                }
                if (key in this) {
                    this[key] = Model.map(value, mapper, options);
                } else {
                    var lkey  = key.toLowerCase(),
                        found = false;
                    for (var k in this) {
                        if (k.toLowerCase() === lkey) {
                            descriptor = descriptors && descriptors[k];
                            mapper     = descriptor  && descriptor.map;                            
                            this[k]    = Model.map(value, mapper, options);
                            found      = true;
                            break;
                        }
                    }
                    if (!found && dynamic) {
                        this[key] = value;
                    }
                }
            }
            return this;
        },
        /**
         * Maps the model into json structured data.
         * @method toData
         * @param   {Object}  spec    -  filters data to map
         * @param   {Object}  [data]  -  receives mapped data
         * @returns {Object} json structured data.
         */                        
        toData: function (spec, data) {
            data = data || {};
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            if (descriptors) {
                var all = $isNothing(spec);
                for (var key in descriptors) {
                    if (all || (key in spec)) {
                        var keyValue   = this[key];
                        if (keyValue === undefined) {
                            continue;
                        }
                        var descriptor = descriptors[key],
                            keySpec    = all ? spec : spec[key];
                        if (!(all || keySpec) || descriptor.ignore) {
                            continue;
                        }
                        if (descriptor.root) {
                            if (keyValue && $isFunction(keyValue.toData)) {
                                keyValue.toData(keySpec, data);
                            }
                        } else if ($isArray(keyValue)) {
                            data[key] = Array2.map(keyValue, function (elem) {
                                return elem && $isFunction(elem.toData)
                                     ? elem.toData(keySpec)
                                     : elem;
                            });
                        } else if (keyValue && $isFunction(keyValue.toData)) {
                            data[key] = keyValue.toData(keySpec);
                        } else {
                            data[key] = keyValue;
                        }
                    }
                }
            }            
            return data;
        },
        /**
         * Merges specified data into another model.
         * @method mergeInto
         * @param   {miruken.mvc.Model}  model  -  model to receive data
         * @returns {boolean} true if model could be merged into. 
         */            
        mergeInto: function (model) {
            if (!(model instanceof this.constructor)) {
                return false;
            }
            var meta        = this.$meta,
                descriptors = meta && meta.getDescriptor();
            for (var key in descriptors) {
                var keyValue = this[key];
                if (keyValue !== undefined && this.hasOwnProperty(key)) {
                    var modelValue = model[key];
                    if (modelValue === undefined || !model.hasOwnProperty(key)) {
                        model[key] = keyValue;
                    } else if ($isFunction(keyValue.mergeInto)) {
                        keyValue.mergeInto(modelValue);
                    }
                }
            }
            return true;
        }
    }, {
        /**
         * Maps the model value into json using a mapper function.
         * @method map
         * @static
         * @param   {Any}      value      -  model value
         * @param   {Fnction}  mapper     -  mapping function or class
         * @param   {Object}   [options]  -  mapping options
         * @returns {Object} json structured data.
         */                                
        map: function (value, mapper, options) {
            return $isArray(value)
                ? Array2.map(value, function (elem) {
                    return Model.map(elem, mapper, options)
                })
            : (mapper ? mapper(value, options) : value);
        },
        coerce: function () {
            return this.new.apply(this, arguments);
        }
    });
    
    eval(this.exports);
    
}
