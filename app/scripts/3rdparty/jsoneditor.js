/*! JSON Editor v0.7.22 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2015-08-12
 */

/**
 * See README.md for requirements and usage info
 */

'use strict';

(function() {

/*jshint loopfunc: true */
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var Class;
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){window.postMessage('xyz');}) ? /\bSuper\b/ : /.*/;
 
  // The base Class implementation (does nothing)
  Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function extendClass(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] === 'function' &&
        typeof _super[name] === 'function' && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init ) {
        this.init.apply(this, arguments);
      }
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;
 
    // And make this class extendable
    Class.extend = extendClass;
   
    return Class;
  };
  
  return Class;
})();

// CustomEvent constructor polyfill
// From MDN
(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || 
                                      window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
 
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

// Array.isArray polyfill
// From MDN
(function() {
  if(!Array.isArray) {
    Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }
}());
/**
 * Taken from jQuery 2.1.3
 *
 * @param obj
 * @returns {boolean}
 */
var $isplainobject = function( obj ) {
  // Not plain objects:
  // - Any object or value whose internal [[Class]] property is not '[object Object]'
  // - DOM nodes
  // - window
  if (typeof obj !== 'object' || obj.nodeType || (obj !== null && obj === obj.window)) {
    return false;
  }

  if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
    return false;
  }

  // If the function hasn't returned already, we're confident that
  // |obj| is a plain object, created by {} or constructed with new Object
  return true;
};

var $extend = function(destination) {
  var source, i,property;
  for(i=1; i<arguments.length; i++) {
    source = arguments[i];
    for (property in source) {
      if(!source.hasOwnProperty(property)) { continue; }
      if(source[property] && $isplainobject(source[property])) {
        if(!destination.hasOwnProperty(property)) { destination[property] = {}; }
        $extend(destination[property], source[property]);
      }
      else {
        if (Array.isArray(source[property])) {
          destination[property] = source[property].slice(0);
        } else {
          destination[property] = source[property];
        }
      }
    }
  }
  return destination;
};

var $each = function(obj,callback) {
  if(!obj || typeof obj !== 'object') { return; }
  var i;
  if(Array.isArray(obj) || (typeof obj.length === 'number' && obj.length > 0 && (obj.length - 1) in obj)) {
    for(i=0; i<obj.length; i++) {
      if(callback(i,obj[i])===false) { return; }
    }
  }
  else {
    if (Object.keys) {
      var keys = Object.keys(obj);
      for(i=0; i<keys.length; i++) {
        if(callback(keys[i],obj[keys[i]])===false) { return; }
      }
    }
    else {
      for(i in obj) {
        if(!obj.hasOwnProperty(i)) { continue; }
        if(callback(i,obj[i])===false) { return; }
      }
    }
  }
};

var $trigger = function(el,event) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(event, true, true);
  el.dispatchEvent(e);
};
var $triggerc = function(el,event) {
  var e = new CustomEvent(event,{
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(e);
};

var JSONEditor = function(element,options) {
  if (!(element instanceof Element)) {
    throw new Error('element should be an instance of Element');
  }
  options = $extend({},JSONEditor.defaults.options,options||{});
  this.element = element;
  this.options = options;
  this.init();
};
JSONEditor.prototype = {
  // necessary since we remove the ctor property by doing a literal assignment. Without this
  // the $isplainobject function will think that this is a plain object.
  constructor: JSONEditor,
  init: function() {
    var self = this;
    
    this.ready = false;

    var ThemeClass = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!ThemeClass) { throw 'Unknown theme ' + (this.options.theme || JSONEditor.defaults.theme); }
    
    this.schema = this.options.schema;
    this.theme = new ThemeClass();
    this.template = this.options.template;
    this.refs = this.options.refs || {};
    this.uuid = 0;
    this.__data = {};
    
    var IconClass = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
    if(IconClass) { this.iconlib = new IconClass(); }

    this.rootContainer = this.theme.getContainer();
    this.element.appendChild(this.rootContainer);
    
    this.translate = this.options.translate || JSONEditor.defaults.translate;

    // Fetch all external refs via ajax
    this._loadExternalRefs(this.schema, function() {
      self._getDefinitions(self.schema);
      self.validator = new JSONEditor.Validator(self);
      
      // Create the root editor
      var EditorClass = self.getEditorClass(self.schema);
      self.root = self.createEditor(EditorClass, {
        jsoneditor: self,
        schema: self.schema,
        required: true,
        container: self.rootContainer
      });
      
      self.root.preBuild();
      self.root.build();
      self.root.postBuild();

      // Starting data
      if(self.options.startval) { self.root.setValue(self.options.startval); }

      self.validationResults = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validationResults);
      self.ready = true;

      // Fire ready event asynchronously
      window.requestAnimationFrame(function() {
        if(!self.ready) { return; }
        self.validationResults = self.validator.validate(self.root.getValue());
        self.root.showValidationErrors(self.validationResults);
        self.trigger('ready');
        self.trigger('change');
      });
    });
  },
  getValue: function() {
    if(!this.ready) { throw "JSON Editor not ready yet.  Listen for 'ready' event before getting the value"; }

    return this.root.getValue();
  },
  setValue: function(value) {
    if(!this.ready) { throw "JSON Editor not ready yet.  Listen for 'ready' event before setting the value"; }

    this.root.setValue(value);
    return this;
  },
  validate: function(value) {
    if(!this.ready) { throw "JSON Editor not ready yet.  Listen for 'ready' event before validating"; }
    
    // Custom value
    if(arguments.length === 1) {
      return this.validator.validate(value);
    }
    // Current value (use cached result)
    else {
      return this.validationResults;
    }
  },
  destroy: function() {
    if(this.destroyed) { return; }
    if(!this.ready) { return; }
    
    this.schema = null;
    this.options = null;
    this.root.destroy();
    this.root = null;
    this.rootContainer = null;
    this.validator = null;
    this.validationResults = null;
    this.theme = null;
    this.iconlib = null;
    this.template = null;
    this.__data = null;
    this.ready = false;
    this.element.innerHTML = '';
    
    this.destroyed = true;
  },
  on: function(event, callback) {
    this.callbacks = this.callbacks || {};
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
    
    return this;
  },
  off: function(event, callback) {
    // Specific callback
    if(event && callback) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = this.callbacks[event] || [];
      var newcallbacks = [];
      for(var i=0; i<this.callbacks[event].length; i++) {
        if(this.callbacks[event][i]===callback) { continue; }
        newcallbacks.push(this.callbacks[event][i]);
      }
      this.callbacks[event] = newcallbacks;
    }
    // All callbacks for a specific event
    else if(event) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = [];
    }
    // All callbacks for all events
    else {
      this.callbacks = {};
    }
    
    return this;
  },
  trigger: function(event) {
    if(this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
      for(var i=0; i<this.callbacks[event].length; i++) {
        this.callbacks[event][i]();
      }
    }
    
    return this;
  },
  setOption: function(option, value) {
    if(option === 'showErrors') {
      this.options.showErrors = value;
      this.onChange();
    }
    // Only the `showErrors` option is supported for now
    else {
      throw 'Option '+option+' must be set during instantiation and cannot be changed later';
    }
    
    return this;
  },
  getEditorClass: function(schema) {
    var classname;

    schema = this.expandSchema(schema);

    $each(JSONEditor.defaults.resolvers,function(i,resolver) {
      var tmp = resolver(schema);
      if(tmp) {
        if(JSONEditor.defaults.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

    if(!classname) { throw 'Unknown editor for schema '+JSON.stringify(schema); }
    if(!JSONEditor.defaults.editors[classname]) { throw 'Unknown editor '+classname; }

    return JSONEditor.defaults.editors[classname];
  },
  createEditor: function(EditorClass, options) {
    options = $extend({},EditorClass.options||{},options);
    return new EditorClass(options);
  },
  onChange: function() {
    if(!this.ready) { return; }
    
    if(this.firingChange) { return; }
    this.firingChange = true;
    
    var self = this;
    
    window.requestAnimationFrame(function() {
      self.firingChange = false;
      if(!self.ready) { return; }

      // Validate and cache results
      self.validationResults = self.validator.validate(self.root.getValue());
      
      if(self.options.showErrors !== 'never') {
        self.root.showValidationErrors(self.validationResults);
      }
      else {
        self.root.showValidationErrors([]);
      }
      
      // Fire change event
      self.trigger('change');
    });
    
    return this;
  },
  compileTemplate: function(template, name) {
    name = name || JSONEditor.defaults.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!JSONEditor.defaults.templates[name]) { throw 'Unknown template engine '+name; }
      engine = JSONEditor.defaults.templates[name]();

      if(!engine) { throw 'Template engine '+name+' missing required library.'; }
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) { throw 'No template engine set'; }
    if(!engine.compile) { throw 'Invalid template engine set'; }

    return engine.compile(template);
  },
  _data: function(el,key,value) {
    // Setting data
    if(arguments.length === 3) {
      var uuid;
      if(el.hasAttribute('data-jsoneditor-'+key)) {
        uuid = el.getAttribute('data-jsoneditor-'+key);
      }
      else {
        uuid = this.uuid++;
        el.setAttribute('data-jsoneditor-'+key,uuid);
      }

      this.__data[uuid] = value;
    }
    // Getting data
    else {
      // No data stored
      if(!el.hasAttribute('data-jsoneditor-'+key)) { return null;}
      
      return this.__data[el.getAttribute('data-jsoneditor-'+key)];
    }
  },
  registerEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = editor;
    return this;
  },
  unregisterEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = null;
    return this;
  },
  getEditor: function(path) {
    if(!this.editors) { return; }
    return this.editors[path];
  },
  watch: function(path,callback) {
    this.watchlist = this.watchlist || {};
    this.watchlist[path] = this.watchlist[path] || [];
    this.watchlist[path].push(callback);
    
    return this;
  },
  unwatch: function(path,callback) {
    if(!this.watchlist || !this.watchlist[path]) { return this; }
    // If removing all callbacks for a path
    if(!callback) {
      this.watchlist[path] = null;
      return this;
    }
    
    var newlist = [];
    for(var i=0; i<this.watchlist[path].length; i++) {
      if(this.watchlist[path][i] === callback) { continue; }
      else { newlist.push(this.watchlist[path][i]); }
    }
    this.watchlist[path] = newlist.length? newlist : null;
    return this;
  },
  notifyWatchers: function(path) {
    if(!this.watchlist || !this.watchlist[path]) { return this; }
    for(var i=0; i<this.watchlist[path].length; i++) {
      this.watchlist[path][i]();
    }
  },
  isEnabled: function() {
    return !this.root || this.root.isEnabled();
  },
  enable: function() {
    this.root.enable();
  },
  disable: function() {
    this.root.disable();
  },
  _getDefinitions: function(schema,path) {
    path = path || '#/definitions/';
    if(schema.definitions) {
      for(var i in schema.definitions) {
        if(!schema.definitions.hasOwnProperty(i)) { continue; }
        this.refs[path+i] = schema.definitions[i];
        if(schema.definitions[i].definitions) {
          this._getDefinitions(schema.definitions[i],path+i+'/definitions/');
        }
      }
    }
  },
  _getExternalRefs: function(schema) {
    var refs = {};
    var mergeRefs = function(newrefs) {
      for(var i in newrefs) {
        if(newrefs.hasOwnProperty(i)) {
          refs[i] = true;
        }
      }
    };
    
    if(schema.$ref && typeof schema.$ref !== 'object' && schema.$ref.substr(0,1) !== '#' && !this.refs[schema.$ref]) {
      refs[schema.$ref] = true;
    }
    
    for(var i in schema) {
      if(!schema.hasOwnProperty(i)) { continue; }
      if(schema[i] && typeof schema[i] === 'object' && Array.isArray(schema[i])) {
        for(var j=0; j<schema[i].length; j++) {
          if(typeof schema[i][j]==='object') {
            mergeRefs(this._getExternalRefs(schema[i][j]));
          }
        }
      }
      else if(schema[i] && typeof schema[i] === 'object') {
        mergeRefs(this._getExternalRefs(schema[i]));
      }
    }
    
    return refs;
  },
  _loadExternalRefs: function(schema, callback) {
    var self = this;
    var refs = this._getExternalRefs(schema);
    
    var done = 0, waiting = 0, callbackFired = false;
    
    $each(refs,function(url) {
      if(self.refs[url]) { return; }
      if(!self.options.ajax) { throw 'Must set ajax option to true to load external ref '+url; }
      self.refs[url] = 'loading';
      waiting++;

      var r = new XMLHttpRequest(); 
      r.open('GET', url, true);
      r.onreadystatechange = function () {
        if (r.readyState !== 4) { return; }
        // Request succeeded
        if(r.status === 200) {
          var response;
          try {
            response = JSON.parse(r.responseText);
          }
          catch(e) {
            window.console.log(e);
            throw 'Failed to parse external ref '+url;
          }
          if(!response || typeof response !== 'object') { throw 'External ref does not contain a valid schema - '+url; }
          
          self.refs[url] = response;
          self._loadExternalRefs(response,function() {
            done++;
            if(done >= waiting && !callbackFired) {
              callbackFired = true;
              callback();
            }
          });
        }
        // Request failed
        else {
          window.console.log(r);
          throw 'Failed to fetch ref via ajax- '+url;
        }
      };
      r.send();
    });
    
    if(!waiting) {
      callback();
    }
  },
  expandRefs: function(schema) {
    schema = $extend({},schema);
    
    while (schema.$ref) {
      var ref = schema.$ref;
      delete schema.$ref;
      
      if(!this.refs[ref]) { ref = decodeURIComponent(ref); }
      
      schema = this.extendSchemas(schema,this.refs[ref]);
    }
    return schema;
  },
  expandSchema: function(schema) {
    var self = this;
    var extended = $extend({},schema);
    var i;

    // Version 3 `type`
    if(typeof schema.type === 'object') {
      // Array of types
      if(Array.isArray(schema.type)) {
        $each(schema.type, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.type[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.type = self.expandSchema(schema.type);
      }
    }
    // Version 3 `disallow`
    if(typeof schema.disallow === 'object') {
      // Array of types
      if(Array.isArray(schema.disallow)) {
        $each(schema.disallow, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.disallow[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.disallow = self.expandSchema(schema.disallow);
      }
    }
    // Version 4 `anyOf`
    if(schema.anyOf) {
      $each(schema.anyOf, function(key,value) {
        schema.anyOf[key] = self.expandSchema(value);
      });
    }
    // Version 4 `dependencies` (schema dependencies)
    if(schema.dependencies) {
      $each(schema.dependencies,function(key,value) {
        if(typeof value === 'object' && !(Array.isArray(value))) {
          schema.dependencies[key] = self.expandSchema(value);
        }
      });
    }
    // Version 4 `not`
    if(schema.not) {
      schema.not = this.expandSchema(schema.not);
    }
    
    // allOf schemas should be merged into the parent
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        extended = this.extendSchemas(extended,this.expandSchema(schema.allOf[i]));
      }
      delete extended.allOf;
    }
    // extends schemas should be merged into parent
    if(schema['extends']) {
      // If extends is a schema
      if(!(Array.isArray(schema['extends']))) {
        extended = this.extendSchemas(extended,this.expandSchema(schema['extends']));
      }
      // If extends is an array of schemas
      else {
        for(i=0; i<schema['extends'].length; i++) {
          extended = this.extendSchemas(extended,this.expandSchema(schema['extends'][i]));
        }
      }
      delete extended['extends'];
    }
    // parent should be merged into oneOf schemas
    if(schema.oneOf) {
      var tmp = $extend({},extended);
      delete tmp.oneOf;
      for(i=0; i<schema.oneOf.length; i++) {
        extended.oneOf[i] = this.extendSchemas(this.expandSchema(schema.oneOf[i]),tmp);
      }
    }
    
    return this.expandRefs(extended);
  },
  extendSchemas: function(obj1, obj2) {
    obj1 = $extend({},obj1);
    obj2 = $extend({},obj2);

    var self = this;
    var extended = {};
    $each(obj1, function(prop,val) {
      // If this key is also defined in obj2, merge them
      if(typeof obj2[prop] !== 'undefined') {
        // Required arrays should be unioned together
        if(prop === 'required' && typeof val === 'object' && Array.isArray(val)) {
          // Union arrays and unique
          extended.required = val.concat(obj2[prop]).reduce(function(p, c) {
            if (p.indexOf(c) < 0) { p.push(c); }
            return p;
          }, []);
        }
        // Type should be intersected and is either an array or string
        else if(prop === 'type' && (typeof val === 'string' || Array.isArray(val))) {
          // Make sure we're dealing with arrays
          if(typeof val === 'string') { val = [val]; }
          if(typeof obj2.type === 'string') { obj2.type = [obj2.type]; }


          extended.type = val.filter(function(n) {
            return obj2.type.indexOf(n) !== -1;
          });

          // If there's only 1 type and it's a primitive, use a string instead of array
          if(extended.type.length === 1 && typeof extended.type[0] === 'string') {
            extended.type = extended.type[0];
          }
        }
        // All other arrays should be intersected (enum, etc.)
        else if(typeof val === 'object' && Array.isArray(val)){
          extended[prop] = val.filter(function(n) {
            return obj2[prop].indexOf(n) !== -1;
          });
        }
        // Objects should be recursively merged
        else if(typeof val === 'object' && val !== null) {
          extended[prop] = self.extendSchemas(val,obj2[prop]);
        }
        // Otherwise, use the first value
        else {
          extended[prop] = val;
        }
      }
      // Otherwise, just use the one in obj1
      else {
        extended[prop] = val;
      }
    });
    // Properties in obj2 that aren't in obj1
    $each(obj2, function(prop,val) {
      if(typeof obj1[prop] === 'undefined') {
        extended[prop] = val;
      }
    });

    return extended;
  }
};

JSONEditor.defaults = {
  themes: {},
  templates: {},
  iconlibs: {},
  editors: {},
  languages: {},
  resolvers: [],
  customValidators: []
};

JSONEditor.Validator = Class.extend({
  init: function(jsoneditor,schema) {
    this.jsoneditor = jsoneditor;
    this.schema = schema || this.jsoneditor.schema;
    this.options = {};
    this.translate = this.jsoneditor.translate || JSONEditor.defaults.translate;
  },
  validate: function(value) {
    return this._validateSchema(this.schema, value);
  },
  _validateSchema: function(schema,value,path) {
    var self = this;
    var errors = [];
    var valid, i, j;
    var stringified = JSON.stringify(value);

    path = path || 'root';

    // Work on a copy of the schema
    schema = $extend({},this.jsoneditor.expandRefs(schema));

    /*
     * Type Agnostic Validation
     */

    // Version 3 `required`
    if(schema.required && schema.required === true) {
      if(typeof value === 'undefined') {
        errors.push({
          path: path,
          property: 'required',
          message: this.translate('errorNotset')
        });

        // Can't do any more validation at this point
        return errors;
      }
    }
    // Value not defined
    else if(typeof value === 'undefined') {
      // If requiredByDefault is set, all fields are required
      if(this.jsoneditor.options.requiredByDefault) {
        errors.push({
          path: path,
          property: 'required',
          message: this.translate('errorNotset')
        });
      }
      // Not required, no further validation needed
      else {
        return errors;
      }
    }

    // `enum`
    if(schema['enum']) {
      valid = false;
      for(i=0; i<schema['enum'].length; i++) {
        if(stringified === JSON.stringify(schema['enum'][i])) { valid = true; }
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'enum',
          message: this.translate('errorEnum')
        });
      }
    }

    // `extends` (version 3)
    if(schema['extends']) {
      for(i=0; i<schema['extends'].length; i++) {
        errors = errors.concat(this._validateSchema(schema['extends'][i],value,path));
      }
    }

    // `allOf`
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        errors = errors.concat(this._validateSchema(schema.allOf[i],value,path));
      }
    }

    // `anyOf`
    if(schema.anyOf) {
      valid = false;
      for(i=0; i<schema.anyOf.length; i++) {
        if(!this._validateSchema(schema.anyOf[i],value,path).length) {
          valid = true;
          break;
        }
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'anyOf',
          message: this.translate('errorAnyOf')
        });
      }
    }

    // `oneOf`
    if(schema.oneOf) {
      valid = 0;
      var oneofErrors = [];
      for(i=0; i<schema.oneOf.length; i++) {
        // Set the error paths to be path.oneOf[i].rest.of.path
        var tmp = this._validateSchema(schema.oneOf[i],value,path);
        if(!tmp.length) {
          valid++;
        }

        for(j=0; j<tmp.length; j++) {
          tmp[j].path = path+'.oneOf['+i+']'+tmp[j].path.substr(path.length);
        }
        oneofErrors = oneofErrors.concat(tmp);

      }
      if(valid !== 1) {
        errors.push({
          path: path,
          property: 'oneOf',
          message: this.translate('errorOneOf', [valid])
        });
        errors = errors.concat(oneofErrors);
      }
    }

    // `not`
    if(schema.not) {
      if(!this._validateSchema(schema.not,value,path).length) {
        errors.push({
          path: path,
          property: 'not',
          message: this.translate('errorNot')
        });
      }
    }

    // `type` (both Version 3 and Version 4 support)
    if(schema.type) {
      // Union type
      if(Array.isArray(schema.type)) {
        valid = false;
        for(i=0;i<schema.type.length;i++) {
          if(this._checkType(schema.type[i], value)) {
            valid = true;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'type',
            message: this.translate('errorTypeUnion')
          });
        }
      }
      // Simple type
      else {
        if(!this._checkType(schema.type, value)) {
          errors.push({
            path: path,
            property: 'type',
            message: this.translate('errorType', [schema.type])
          });
        }
      }
    }


    // `disallow` (version 3)
    if(schema.disallow) {
      // Union type
      if(Array.isArray(schema.disallow)) {
        valid = true;
        for(i=0;i<schema.disallow.length;i++) {
          if(this._checkType(schema.disallow[i], value)) {
            valid = false;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'disallow',
            message: this.translate('errorDisallowUnion')
          });
        }
      }
      // Simple type
      else {
        if(this._checkType(schema.disallow, value)) {
          errors.push({
            path: path,
            property: 'disallow',
            message: this.translate('errorDisallow', [schema.disallow])
          });
        }
      }
    }

    /*
     * Type Specific Validation
     */

    // Number Specific Validation
    if(typeof value === 'number') {
      // `multipleOf` and `divisibleBy`
      if(schema.multipleOf || schema.divisibleBy) {
        valid = value / (schema.multipleOf || schema.divisibleBy);
        if(valid !== Math.floor(valid)) {
          errors.push({
            path: path,
            property: schema.multipleOf? 'multipleOf' : 'divisibleBy',
            message: this.translate('errorMultipleOf', [schema.multipleOf || schema.divisibleBy])
          });
        }
      }

      // `maximum`
      if(schema.hasOwnProperty('maximum')) {
        if(schema.exclusiveMaximum && value >= schema.maximum) {
          errors.push({
            path: path,
            property: 'maximum',
            message: this.translate('errorMaximumExcl', [schema.maximum])
          });
        }
        else if(!schema.exclusiveMaximum && value > schema.maximum) {
          errors.push({
            path: path,
            property: 'maximum',
            message: this.translate('errorMaximumIncl', [schema.maximum])
          });
        }
      }

      // `minimum`
      if(schema.hasOwnProperty('minimum')) {
        if(schema.exclusiveMinimum && value <= schema.minimum) {
          errors.push({
            path: path,
            property: 'minimum',
            message: this.translate('errorMinimumExcl', [schema.minimum])
          });
        }
        else if(!schema.exclusiveMinimum && value < schema.minimum) {
          errors.push({
            path: path,
            property: 'minimum',
            message: this.translate('errorMinimumIncl', [schema.minimum])
          });
        }
      }
    }
    // String specific validation
    else if(typeof value === 'string') {
      // `maxLength`
      if(schema.maxLength) {
        if((value+'').length > schema.maxLength) {
          errors.push({
            path: path,
            property: 'maxLength',
            message: this.translate('errorMaxLength', [schema.maxLength])
          });
        }
      }

      // `minLength`
      if(schema.minLength) {
        if((value+'').length < schema.minLength) {
          errors.push({
            path: path,
            property: 'minLength',
            message: this.translate((schema.minLength===1?'errorNotempty':'errorMinLength'), [schema.minLength])
          });
        }
      }

      // `pattern`
      if(schema.pattern) {
        if(!(new RegExp(schema.pattern)).test(value)) {
          errors.push({
            path: path,
            property: 'pattern',
            message: this.translate('errorPattern')
          });
        }
      }
    }
    // Array specific validation
    else if(typeof value === 'object' && value !== null && Array.isArray(value)) {
      // `items` and `additionalItems`
      if(schema.items) {
        // `items` is an array
        if(Array.isArray(schema.items)) {
          for(i=0; i<value.length; i++) {
            // If this item has a specific schema tied to it
            // Validate against it
            if(schema.items[i]) {
              errors = errors.concat(this._validateSchema(schema.items[i],value[i],path+'.'+i));
            }
            // If all additional items are allowed
            else if(schema.additionalItems === true) {
              break;
            }
            // If additional items is a schema
            // TODO: Incompatibility between version 3 and 4 of the spec
            else if(schema.additionalItems) {
              errors = errors.concat(this._validateSchema(schema.additionalItems,value[i],path+'.'+i));
            }
            // If no additional items are allowed
            else if(schema.additionalItems === false) {
              errors.push({
                path: path,
                property: 'additionalItems',
                message: this.translate('errorAdditionalItems')
              });
              break;
            }
            // Default for `additionalItems` is an empty schema
            else {
              break;
            }
          }
        }
        // `items` is a schema
        else {
          // Each item in the array must validate against the schema
          for(i=0; i<value.length; i++) {
            errors = errors.concat(this._validateSchema(schema.items,value[i],path+'.'+i));
          }
        }
      }

      // `maxItems`
      if(schema.maxItems) {
        if(value.length > schema.maxItems) {
          errors.push({
            path: path,
            property: 'maxItems',
            message: this.translate('errorMaxItems', [schema.maxItems])
          });
        }
      }

      // `minItems`
      if(schema.minItems) {
        if(value.length < schema.minItems) {
          errors.push({
            path: path,
            property: 'minItems',
            message: this.translate('errorMinItems', [schema.minItems])
          });
        }
      }

      // `uniqueItems`
      if(schema.uniqueItems) {
        var seen = {};
        for(i=0; i<value.length; i++) {
          valid = JSON.stringify(value[i]);
          if(seen[valid]) {
            errors.push({
              path: path,
              property: 'uniqueItems',
              message: this.translate('errorUniqueItems')
            });
            break;
          }
          seen[valid] = true;
        }
      }
    }
    // Object specific validation
    else if(typeof value === 'object' && value !== null) {
      // `maxProperties`
      if(schema.maxProperties) {
        valid = 0;
        for(i in value) {
          if(!value.hasOwnProperty(i)) { continue; }
          valid++;
        }
        if(valid > schema.maxProperties) {
          errors.push({
            path: path,
            property: 'maxProperties',
            message: this.translate('errorMaxProperties', [schema.maxProperties])
          });
        }
      }

      // `minProperties`
      if(schema.minProperties) {
        valid = 0;
        for(i in value) {
          if(!value.hasOwnProperty(i)) { continue; }
          valid++;
        }
        if(valid < schema.minProperties) {
          errors.push({
            path: path,
            property: 'minProperties',
            message: this.translate('errorMinProperties', [schema.minProperties])
          });
        }
      }

      // Version 4 `required`
      if(schema.required && Array.isArray(schema.required)) {
        for(i=0; i<schema.required.length; i++) {
          if(typeof value[schema.required[i]] === 'undefined') {
            errors.push({
              path: path,
              property: 'required',
              message: this.translate('errorRequired', [schema.required[i]])
            });
          }
        }
      }

      // `properties`
      var validatedProperties = {};
      if(schema.properties) {
        for(i in schema.properties) {
          if(!schema.properties.hasOwnProperty(i)) { continue; }
          validatedProperties[i] = true;
          errors = errors.concat(this._validateSchema(schema.properties[i],value[i],path+'.'+i));
        }
      }

      // `patternProperties`
      if(schema.patternProperties) {
        for(i in schema.patternProperties) {
          if(!schema.patternProperties.hasOwnProperty(i)) { continue; }

          var regex = new RegExp(i);

          // Check which properties match
          for(j in value) {
            if(!value.hasOwnProperty(j)) { continue; }
            if(regex.test(j)) {
              validatedProperties[j] = true;
              errors = errors.concat(this._validateSchema(schema.patternProperties[i],value[j],path+'.'+j));
            }
          }
        }
      }

      // The noAdditionalProperties option currently doesn't work with extended schemas that use oneOf or anyOf
      if(typeof schema.additionalProperties === 'undefined' && this.jsoneditor.options.noAdditionalProperties && !schema.oneOf && !schema.anyOf) {
        schema.additionalProperties = false;
      }

      // `additionalProperties`
      if(typeof schema.additionalProperties !== 'undefined') {
        for(i in value) {
          if(!value.hasOwnProperty(i)) { continue; }
          if(!validatedProperties[i]) {
            // No extra properties allowed
            if(!schema.additionalProperties) {
              errors.push({
                path: path,
                property: 'additionalProperties',
                message: this.translate('errorAdditionalProperties', [i])
              });
              break;
            }
            // Allowed
            else if(schema.additionalProperties === true) {
              break;
            }
            // Must match schema
            // TODO: incompatibility between version 3 and 4 of the spec
            else {
              errors = errors.concat(this._validateSchema(schema.additionalProperties,value[i],path+'.'+i));
            }
          }
        }
      }

      // `dependencies`
      if(schema.dependencies) {
        for(i in schema.dependencies) {
          if(!schema.dependencies.hasOwnProperty(i)) { continue; }

          // Doesn't need to meet the dependency
          if(typeof value[i] === 'undefined') { continue; }

          // Property dependency
          if(Array.isArray(schema.dependencies[i])) {
            for(j=0; j<schema.dependencies[i].length; j++) {
              if(typeof value[schema.dependencies[i][j]] === 'undefined') {
                errors.push({
                  path: path,
                  property: 'dependencies',
                  message: this.translate('errorDependency', [schema.dependencies[i][j]])
                });
              }
            }
          }
          // Schema dependency
          else {
            errors = errors.concat(this._validateSchema(schema.dependencies[i],value,path));
          }
        }
      }
    }

    if (schema.links) {
      for (i = 0; i < schema.links.length; i++) {
        if (schema.links[i].rel.toLowerCase() === 'describedby') {
          var href = schema.links[i].href;
          var data = this.jsoneditor.root.getValue();
          //var template = new UriTemplate(href); //preprocessURI(href));
          //var ref = template.fillFromObject(data);
          var template = this.jsoneditor.compileTemplate(href, this.jsoneditor.template);
          var ref = template(data);

          schema.links.splice(i, 1);

          schema = $extend({}, schema, this.jsoneditor.refs[ref]);

          errors = errors.concat(this._validateSchema(schema, value, path));
        }
      }
    }

    // Custom type validation
    $each(JSONEditor.defaults.customValidators,function(i,validator) {
      errors = errors.concat(validator.call(self,schema,value,path));
    });

    return errors;
  },
  _checkType: function(type, value) {
    // Simple types
    if(typeof type === 'string') {
      if(type==='string') { return typeof value === 'string'; }
      else if(type==='number') { return typeof value === 'number'; }
      else if(type==='integer') { return typeof value === 'number' && value === Math.floor(value); }
      else if(type==='boolean') { return typeof value === 'boolean'; }
      else if(type==='array') { return Array.isArray(value); }
      else if(type === 'object') { return value !== null && !(Array.isArray(value)) && typeof value === 'object'; }
      else if(type === 'null') { return value === null; }
      else { return true; }
    }
    // Schema
    else {
      return !this._validateSchema(type,value).length;
    }
  }
});

/**
 * All editors should extend from this class
 */
JSONEditor.AbstractEditor = Class.extend({
  onChildEditorChange: function(editor) {
    this.onChange(true);
  },
  notify: function() {
    this.jsoneditor.notifyWatchers(this.path);
  },
  change: function() {
    if(this.parent) { this.parent.onChildEditorChange(this); }
    else { this.jsoneditor.onChange(); }
  },
  onChange: function(bubble) {
    this.notify();
    if(this.watchListener) { this.watchListener(); }
    if(bubble) { this.change(); }
  },
  register: function() {
    this.jsoneditor.registerEditor(this);
    this.onChange();
  },
  unregister: function() {
    if(!this.jsoneditor) { return; }
    this.jsoneditor.unregisterEditor(this);
  },
  getNumColumns: function() {
    return 12;
  },
  init: function(options) {
    this.jsoneditor = options.jsoneditor;
    
    this.theme = this.jsoneditor.theme;
    this.templateEngine = this.jsoneditor.template;
    this.iconlib = this.jsoneditor.iconlib;
    
    this.originalSchema = options.schema;
    this.schema = this.jsoneditor.expandSchema(this.originalSchema);
    
    this.options = $extend({}, (this.options || {}), (options.schema.options || {}), options);
    
    if(!options.path && !this.schema.id) { this.schema.id = 'root'; }
    this.path = options.path || 'root';
    this.formname = options.formname || this.path.replace(/\.([^.]+)/g,'[$1]');
    if(this.jsoneditor.options.formNameRoot) { this.formname = this.formname.replace(/^root\[/,this.jsoneditor.options.formNameRoot+'['); }
    this.key = this.path.split('.').pop();
    this.parent = options.parent;
    
    this.linkWatchers = [];
    
    if(options.container) { this.setContainer(options.container); }
  },
  setContainer: function(container) {
    this.container = container;
    if(this.schema.id) { this.container.setAttribute('data-schemaid',this.schema.id); }
    if(this.schema.type && typeof this.schema.type === 'string') { this.container.setAttribute('data-schematype',this.schema.type); }
    this.container.setAttribute('data-schemapath',this.path);
  },
  
  preBuild: function() {

  },
  build: function() {
    
  },
  postBuild: function() {
    this.setupWatchListeners();
    this.addLinks();
    this.setValue(this.getDefault(), true);
    this.updateHeaderText();
    this.register();
    this.onWatchedFieldChange();
  },
  
  setupWatchListeners: function() {
    var self = this;
    
    // Watched fields
    this.watched = {};
    if(this.schema.vars) { this.schema.watch = this.schema.vars; }
    this.watchedValues = {};
    this.watchListener = function() {
      if(self.refreshWatchedFieldValues()) {
        self.onWatchedFieldChange();
      }
    };
    
    this.register();
    if(this.schema.hasOwnProperty('watch')) {
      var path,pathParts,first,root,adjustedPath;

      for(var name in this.schema.watch) {
        if(!this.schema.watch.hasOwnProperty(name)) { continue; }
        path = this.schema.watch[name];

        if(Array.isArray(path)) {
          pathParts = [path[0]].concat(path[1].split('.'));
        }
        else {
          pathParts = path.split('.');
          if(!self.theme.closest(self.container,'[data-schemaid="'+pathParts[0]+'"]')) { pathParts.unshift('#'); }
        }
        first = pathParts.shift();

        if(first === '#') { first = self.jsoneditor.schema.id || 'root'; }

        // Find the root node for this template variable
        root = self.theme.closest(self.container,'[data-schemaid="'+first+'"]');
        if(!root) { throw 'Could not find ancestor node with id '+first; }

        // Keep track of the root node and path for use when rendering the template
        adjustedPath = root.getAttribute('data-schemapath') + '.' + pathParts.join('.');
        
        self.jsoneditor.watch(adjustedPath,self.watchListener);
        
        self.watched[name] = adjustedPath;
      }
    }
    
    // Dynamic header
    if(this.schema.headerTemplate) {
      this.headerTemplate = this.jsoneditor.compileTemplate(this.schema.headerTemplate, this.templateEngine);
    }
  },
  
  addLinks: function() {
    // Add links
    if(!this.noLinkHolder) {
      this.linkHolder = this.theme.getLinksHolder();
      this.container.appendChild(this.linkHolder);
      if(this.schema.links) {
        for(var i=0; i<this.schema.links.length; i++) {
          this.addLink(this.getLink(this.schema.links[i]));
        }
      }
    }
  },
  
  
  getButton: function(text, icon, title) {
    var btnClass = 'json-editor-btn-'+icon;
    if(!this.iconlib) { icon = null; }
    else { icon = this.iconlib.getIcon(icon); }
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    var btn = this.theme.getButton(text, icon, title);
    btn.className += ' ' + btnClass + ' ';
    return btn;
  },
  setButtonText: function(button, text, icon, title) {
    if(!this.iconlib) { icon = null; }
    else { icon = this.iconlib.getIcon(icon); }
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    return this.theme.setButtonText(button, text, icon, title);
  },
  addLink: function(link) {
    if(this.linkHolder) { this.linkHolder.appendChild(link); }
  },
  getLink: function(data) {
    var holder, link;
        
    // Get mime type of the link
    var mime = data.mediaType || 'application/javascript';
    var type = mime.split('/')[0];
    
    // Template to generate the link href
    var href = this.jsoneditor.compileTemplate(data.href,this.templateEngine);
    
    // Image links
    if(type === 'image') {
      holder = this.theme.getBlockLinkHolder();
      link = document.createElement('a');
      link.setAttribute('target','_blank');
      var image = document.createElement('img');
      
      this.theme.createImageLink(holder,link,image);
    
      // When a watched field changes, update the url  
      this.linkWatchers.push(function(vars) {
        var url = href(vars);
        link.setAttribute('href',url);
        link.setAttribute('title',data.rel || url);
        image.setAttribute('src',url);
      });
    }
    // Audio/Video links
    else if(['audio','video'].indexOf(type) >=0) {
      holder = this.theme.getBlockLinkHolder();
      
      link = this.theme.getBlockLink();
      link.setAttribute('target','_blank');
      
      var media = document.createElement(type);
      media.setAttribute('controls','controls');
      
      this.theme.createMediaLink(holder,link,media);
      
      // When a watched field changes, update the url  
      this.linkWatchers.push(function(vars) {
        var url = href(vars);
        link.setAttribute('href',url);
        link.textContent = data.rel || url;
        media.setAttribute('src',url);
      });
    }
    // Text links
    else {
      holder = this.theme.getBlockLink();
      holder.setAttribute('target','_blank');
      holder.textContent = data.rel;
      
      // When a watched field changes, update the url  
      this.linkWatchers.push(function(vars) {
        var url = href(vars);
        holder.setAttribute('href',url);
        holder.textContent = data.rel || url;
      });
    }
    
    return holder;
  },
  refreshWatchedFieldValues: function() {
    if(!this.watchedValues) { return; }
    var watched = {};
    var changed = false;
    var self = this;
    
    if(this.watched) {
      var val,editor;
      for(var name in this.watched) {
        if(!this.watched.hasOwnProperty(name)) { continue; }
        editor = self.jsoneditor.getEditor(this.watched[name]);
        val = editor? editor.getValue() : null;
        if(self.watchedValues[name] !== val) { changed = true; }
        watched[name] = val;
      }
    }
    
    watched.self = this.getValue();
    if(this.watchedValues.self !== watched.self) { changed = true; }
    
    this.watchedValues = watched;
    
    return changed;
  },
  getWatchedFieldValues: function() {
    return this.watchedValues;
  },
  updateHeaderText: function() {
    if(this.header) {
      // If the header has children, only update the text node's value
      if(this.header.children.length) {
        for(var i=0; i<this.header.childNodes.length; i++) {
          if(this.header.childNodes[i].nodeType===3) {
            this.header.childNodes[i].nodeValue = this.getHeaderText();
            break;
          }
        }
      }
      // Otherwise, just update the entire node
      else {
        this.header.textContent = this.getHeaderText();
      }
    }
  },
  getHeaderText: function(titleOnly) {
    if(this.headerText) { return this.headerText; }
    else if(titleOnly) { return this.schema.title; }
    else { return this.getTitle(); }
  },
  onWatchedFieldChange: function() {
    var vars;
    if(this.headerTemplate) {
      vars = $extend(this.getWatchedFieldValues(),{
        key: this.key,
        i: this.key,
        i0: (this.key*1),
        i1: (this.key*1+1),
        title: this.getTitle()
      });
      var headerText = this.headerTemplate(vars);
      
      if(headerText !== this.headerText) {
        this.headerText = headerText;
        this.updateHeaderText();
        this.notify();
        //this.fireChangeHeaderEvent();
      }
    }
    if(this.linkWatchers.length) {
      vars = this.getWatchedFieldValues();
      for(var i=0; i<this.linkWatchers.length; i++) {
        this.linkWatchers[i](vars);
      }
    }
  },
  setValue: function(value) {
    this.value = value;
  },
  getValue: function() {
    return this.value;
  },
  refreshValue: function() {

  },
  getChildEditors: function() {
    return false;
  },
  destroy: function() {
    var self = this;
    this.unregister(this);
    $each(this.watched,function(name,adjustedPath) {
      self.jsoneditor.unwatch(adjustedPath,self.watchListener);
    });
    this.watched = null;
    this.watchedValues = null;
    this.watchListener = null;
    this.headerText = null;
    this.headerTemplate = null;
    this.value = null;
    if(this.container && this.container.parentNode) { this.container.parentNode.removeChild(this.container); }
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  getDefault: function() {
    if(this.schema['default']) { return this.schema['default']; }
    if(this.schema['enum']) { return this.schema['enum'][0]; }
    
    var type = this.schema.type || this.schema.oneOf;
    if(type && Array.isArray(type)) { type = type[0]; }
    if(type && typeof type === 'object') { type = type.type; }
    if(type && Array.isArray(type)) { type = type[0]; }
    
    if(typeof type === 'string') {
      if(type === 'number') { return 0.0; }
      if(type === 'boolean') { return false; }
      if(type === 'integer') { return 0; }
      if(type === 'string') { return ''; }
      if(type === 'object') { return {}; }
      if(type === 'array') { return []; }
    }
    
    return null;
  },
  getTitle: function() {
    return this.schema.title || this.key;
  },
  enable: function() {
    this.disabled = false;
  },
  disable: function() {
    this.disabled = true;
  },
  isEnabled: function() {
    return !this.disabled;
  },
  isRequired: function() {
    if(typeof this.schema.required === 'boolean') { return this.schema.required; }
    else if(this.parent && this.parent.schema && Array.isArray(this.parent.schema.required)) { return this.parent.schema.required.indexOf(this.key) > -1; }
    else if(this.jsoneditor.options.requiredByDefault) { return true; }
    else { return false; }
  },  
  getDisplayText: function(arr) {
    var disp = [];
    var used = {};
    
    // Determine how many times each attribute name is used.
    // This helps us pick the most distinct display text for the schemas.
    $each(arr,function(i,el) {
      if(el.title) {
        used[el.title] = used[el.title] || 0;
        used[el.title]++;
      }
      if(el.description) {
        used[el.description] = used[el.description] || 0;
        used[el.description]++;
      }
      if(el.format) {
        used[el.format] = used[el.format] || 0;
        used[el.format]++;
      }
      if(el.type) {
        used[el.type] = used[el.type] || 0;
        used[el.type]++;
      }
    });
    
    // Determine display text for each element of the array
    $each(arr,function(i,el)  {
      var name;
      
      // If it's a simple string
      if(typeof el === 'string') { name = el; }
      // Object
      else if(el.title && used[el.title]<=1) { name = el.title; }
      else if(el.format && used[el.format]<=1) { name = el.format; }
      else if(el.type && used[el.type]<=1) { name = el.type; }
      else if(el.description && used[el.description]<=1) { name = el.descripton; }
      else if(el.title) { name = el.title; }
      else if(el.format) { name = el.format; }
      else if(el.type) { name = el.type; }
      else if(el.description) { name = el.description; }
      else if(JSON.stringify(el).length < 50) { name = JSON.stringify(el); }
      else { name = 'type'; }
      
      disp.push(name);
    });
    
    // Replace identical display text with 'text 1', 'text 2', etc.
    var inc = {};
    $each(disp,function(i,name) {
      inc[name] = inc[name] || 0;
      inc[name]++;
      
      if(used[name] > 1) { disp[i] = name + ' ' + inc[name]; }
    });
    
    return disp;
  },
  getOption: function(key) {
    try {
      throw 'getOption is deprecated';
    }
    catch(e) {
      window.console.error(e);
    }
    
    return this.options[key];
  },
  showValidationErrors: function(errors) {

  }
});

JSONEditor.defaults.editors['null'] = JSONEditor.AbstractEditor.extend({
  getValue: function() {
    return null;
  },
  setValue: function() {
    this.onChange();
  },
  getNumColumns: function() {
    return 2;
  }
});

JSONEditor.defaults.editors.string = JSONEditor.AbstractEditor.extend({
  register: function() {
    this._super();
    if(!this.input) { return; }
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
    if(!this.input) { return; }
    this.input.removeAttribute('name');
  },
  setValue: function(value,initial,fromTemplate) {
    var self = this;
    
    if(this.template && !fromTemplate) {
      return;
    }
    
    if(value === null || typeof value === 'undefined') { value = ''; }
    else if(typeof value === 'object') { value = JSON.stringify(value); }
    else if(typeof value !== 'string') { value = ''+value; }
    
    if(value === this.serialized) { return; }

    // Sanitize value before setting it
    var sanitized = this.sanitize(value);

    if(this.input.value === sanitized) {
      return;
    }

    this.input.value = sanitized;
    
    // If using SCEditor, update the WYSIWYG
    if(this.sceditorInstance) {
      this.sceditorInstance.val(sanitized);
    }
    else if(this.epiceditor) {
      this.epiceditor.importFile(null,sanitized);
    }
    else if(this.aceEditor) {
      this.aceEditor.setValue(sanitized);
    }
    
    var changed = fromTemplate || this.getValue() !== value;
    
    this.refreshValue();
    
    if(initial) { this.isDirty = false; }
    else if(this.jsoneditor.options.showErrors === 'change') { this.isDirty = true; }
    
    if(this.adjustHeight) { this.adjustHeight(this.input); }

    // Bubble this setValue to parents if the value changed
    this.onChange(changed);
  },
  getNumColumns: function() {
    var min = Math.ceil(Math.max(this.getTitle().length,this.schema.maxLength||0,this.schema.minLength||0)/5);
    var num;
    
    if(this.inputType === 'textarea') { num = 6; }
    else if(['text','email'].indexOf(this.inputType) >= 0) { num = 4; }
    else { num = 2; }
    
    return Math.min(12,Math.max(min,num));
  },
  build: function() {
    var self = this, i;
    if(!this.options.compact) { this.header = this.label = this.theme.getFormInputLabel(this.getTitle()); }
    if(this.schema.description) { this.description = this.theme.getFormInputDescription(this.schema.description); }

    this.format = this.schema.format;
    if(!this.format && this.schema.media && this.schema.media.type) {
      this.format = this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g,'');
    }
    if(!this.format && this.options.defaultFormat) {
      this.format = this.options.defaultFormat;
    }
    if(this.options.format) {
      this.format = this.options.format;
    }

    // Specific format
    if(this.format) {
      // Text Area
      if(this.format === 'textarea') {
        this.inputType = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // Range Input
      else if(this.format === 'range') {
        this.inputType = 'range';
        var min = this.schema.minimum || 0;
        var max = this.schema.maximum || Math.max(100,min+1);
        var step = 1;
        if(this.schema.multipleOf) {
          if(min%this.schema.multipleOf) { min = Math.ceil(min/this.schema.multipleOf)*this.schema.multipleOf; }
          if(max%this.schema.multipleOf) { max = Math.floor(max/this.schema.multipleOf)*this.schema.multipleOf; }
          step = this.schema.multipleOf;
        }

        this.input = this.theme.getRangeInput(min,max,step);
      }
      // Source Code
      else if([
          'actionscript',
          'batchfile',
          'bbcode',
          'c',
          'c++',
          'cpp',
          'coffee',
          'csharp',
          'css',
          'dart',
          'django',
          'ejs',
          'erlang',
          'golang',
          'handlebars',
          'haskell',
          'haxe',
          'html',
          'ini',
          'jade',
          'java',
          'javascript',
          'json',
          'less',
          'lisp',
          'lua',
          'makefile',
          'markdown',
          'matlab',
          'mysql',
          'objectivec',
          'pascal',
          'perl',
          'pgsql',
          'php',
          'python',
          'r',
          'ruby',
          'sass',
          'scala',
          'scss',
          'smarty',
          'sql',
          'stylus',
          'svg',
          'twig',
          'vbscript',
          'xml',
          'yaml'
        ].indexOf(this.format) >= 0
      ) {
        this.inputType = this.format;
        this.sourceCode = true;
        
        this.input = this.theme.getTextareaInput();
      }
      // HTML5 Input type
      else {
        this.inputType = this.format;
        this.input = this.theme.getFormInputField(this.inputType);
      }
    }
    // Normal text input
    else {
      this.inputType = 'text';
      this.input = this.theme.getFormInputField(this.inputType);
    }
    
    // minLength, maxLength, and pattern
    if(typeof this.schema.maxLength !== 'undefined') { this.input.setAttribute('maxlength',this.schema.maxLength); }
    if(typeof this.schema.pattern !== 'undefined') { this.input.setAttribute('pattern',this.schema.pattern); }
    else if(typeof this.schema.minLength !== 'undefined') { this.input.setAttribute('pattern','.{'+this.schema.minLength+',}'); }

    if(this.options.compact) {
      this.container.className += ' compact';
    }
    else {
      if(this.options.inputWidth) { this.input.style.width = this.options.inputWidth; }
    }

    if(this.schema.readOnly || this.schema.readonly || this.schema.template) {
      this.alwaysDisabled = true;
      this.input.disabled = true;
    }

    this.input
      .addEventListener('change',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't allow changing if this field is a template
        if(self.schema.template) {
          this.value = self.value;
          return;
        }

        var val = this.value;
        
        // sanitize value
        var sanitized = self.sanitize(val);
        if(val !== sanitized) {
          this.value = sanitized;
        }
        
        self.isDirty = true;

        self.refreshValue();
        self.onChange(true);
      });
      
    if(this.options.inputHeight) { this.input.style.height = this.options.inputHeight; }
    if(this.options.expandHeight) {
      this.adjustHeight = function(el) {
        if(!el) { return; }
        var i, ch=el.offsetHeight;
        // Input too short
        if(el.offsetHeight < el.scrollHeight) {
          i=0;
          while(el.offsetHeight < el.scrollHeight+3) {
            if(i>100) { break; }
            i++;
            ch++;
            el.style.height = ch+'px';
          }
        }
        else {
          i=0;
          while(el.offsetHeight >= el.scrollHeight+3) {
            if(i>100) { break; }
            i++;
            ch--;
            el.style.height = ch+'px';
          }
          el.style.height = (ch+1)+'px';
        }
      };
      
      this.input.addEventListener('keyup',function(e) {
        self.adjustHeight(this);
      });
      this.input.addEventListener('change',function(e) {
        self.adjustHeight(this);
      });
      this.adjustHeight();
    }

    if(this.format) { this.input.setAttribute('data-schemaformat',this.format); }

    this.control = this.theme.getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    // Any special formatting that needs to happen after the input is added to the dom
    window.requestAnimationFrame(function() {
      // Skip in case the input is only a temporary editor,
      // otherwise, in the case of an aceEditor creation,
      // it will generate an error trying to append it to the missing parentNode
      if(self.input.parentNode) { self.afterInputReady(); }
      if(self.adjustHeight) { self.adjustHeight(self.input); }
    });

    // Compile and store the template
    if(this.schema.template) {
      this.template = this.jsoneditor.compileTemplate(this.schema.template, this.templateEngine);
      this.refreshValue();
    }
    else {
      this.refreshValue();
    }
  },
  enable: function() {
    if(!this.alwaysDisabled) {
      this.input.disabled = false;
      // TODO: WYSIWYG and Markdown editors
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    // TODO: WYSIWYG and Markdown editors
    this._super();
  },
  afterInputReady: function() {
    var self = this, options;
    
    // Code editor
    if(this.sourceCode) {
      // WYSIWYG html and bbcode editor
      if(this.options.wysiwyg && 
        ['html','bbcode'].indexOf(this.inputType) >= 0 && 
        window.jQuery && window.jQuery.fn && window.jQuery.fn.sceditor
      ) {
        options = $extend({},{
          plugins: self.inputType==='html'? 'xhtml' : 'bbcode',
          emoticonsEnabled: false,
          width: '100%',
          height: 300
        },JSONEditor.plugins.sceditor,self.options.sceditorOptions||{});
        
        window.jQuery(self.input).sceditor(options);
        
        self.sceditorInstance = window.jQuery(self.input).sceditor('instance');
        
        self.sceditorInstance.blur(function() {
          // Get editor's value
          var val = window.jQuery('<div>'+self.sceditorInstance.val()+'</div>');
          // Remove sceditor spans/divs
          window.jQuery('#sceditor-start-marker,#sceditor-end-marker,.sceditor-nlf',val).remove();
          // Set the value and update
          self.input.value = val.html();
          self.value = self.input.value;
          self.isDirty = true;
          self.onChange(true);
        });
      }
      // EpicEditor for markdown (if it's loaded)
      else if (this.inputType === 'markdown' && window.EpicEditor) {
        this.epiceditorContainer = document.createElement('div');
        this.input.parentNode.insertBefore(this.epiceditorContainer,this.input);
        this.input.style.display = 'none';
        
        options = $extend({},JSONEditor.plugins.epiceditor,{
          container: this.epiceditorContainer,
          clientSideStorage: false
        });
        
        this.epiceditor = new window.EpicEditor(options).load();
        
        this.epiceditor.importFile(null,this.getValue());
      
        this.epiceditor.on('update',function() {
          var val = self.epiceditor.exportFile();
          self.input.value = val;
          self.value = val;
          self.isDirty = true;
          self.onChange(true);
        });
      }
      // ACE editor for everything else
      else if(window.ace) {
        var mode = this.inputType;
        // aliases for c/cpp
        if(mode === 'cpp' || mode === 'c++' || mode === 'c') {
          mode = 'cCpp';
        }
        
        this.aceContainer = document.createElement('div');
        this.aceContainer.style.width = '100%';
        this.aceContainer.style.position = 'relative';
        this.aceContainer.style.height = '400px';
        this.input.parentNode.insertBefore(this.aceContainer,this.input);
        this.input.style.display = 'none';
        this.aceEditor = window.ace.edit(this.aceContainer);
        
        this.aceEditor.setValue(this.getValue());
        
        // The theme
        if(JSONEditor.plugins.ace.theme) { this.aceEditor.setTheme('ace/theme/'+JSONEditor.plugins.ace.theme); }
        // The mode
        mode = window.ace.require('ace/mode/'+mode);
        if(mode) { this.aceEditor.getSession().setMode(new mode.Mode()); }
        
        // Listen for changes
        this.aceEditor.on('change',function() {
          var val = self.aceEditor.getValue();
          self.input.value = val;
          self.refreshValue();
          self.isDirty = true;
          self.onChange(true);
        });
      }
    }
    
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.value;
    if(typeof this.value !== 'string') { this.value = ''; }
    this.serialized = this.value;
  },
  destroy: function() {
    // If using SCEditor, destroy the editor instance
    if(this.sceditorInstance) {
      this.sceditorInstance.destroy();
    }
    else if(this.epiceditor) {
      this.epiceditor.unload();
    }
    else if(this.aceEditor) {
      this.aceEditor.destroy();
    }
    
    
    this.template = null;
    if(this.input && this.input.parentNode) { this.input.parentNode.removeChild(this.input); }
    if(this.label && this.label.parentNode) { this.label.parentNode.removeChild(this.label); }
    if(this.description && this.description.parentNode) { this.description.parentNode.removeChild(this.description); }

    this._super();
  },
  /**
   * This is overridden in derivative editors
   */
  sanitize: function(value) {
    return value;
  },
  /**
   * Re-calculates the value if needed
   */
  onWatchedFieldChange: function() {
    var self = this, vars, j;
    
    // If this editor needs to be rendered by a macro template
    if(this.template) {
      vars = this.getWatchedFieldValues();
      this.setValue(this.template(vars),false,true);
    }
    
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    if(this.jsoneditor.options.showErrors === 'always') {}
    else if(!this.isDirty && this.previousErrorSetting===this.jsoneditor.options.showErrors) { return; }
    
    this.previousErrorSetting = this.jsoneditor.options.showErrors;

    var messages = [];
    $each(errors,function(i,error) {
      if(error.path === self.path) {
        messages.push(error.message);
      }
    });

    if(messages.length) {
      this.theme.addInputError(this.input, messages.join('. ')+'.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});

JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
  sanitize: function(value) {
    return (value+'').replace(/[^0-9\.\-eE]/g,'');
  },
  getNumColumns: function() {
    return 2;
  },
  getValue: function() {
    return this.value*1;
  }
});

JSONEditor.defaults.editors.integer = JSONEditor.defaults.editors.number.extend({
  sanitize: function(value) {
    value = value + '';
    return value.replace(/[^0-9\-]/g,'');
  },
  getNumColumns: function() {
    return 2;
  }
});

JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return $extend({},this.schema['default'] || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  register: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) { continue; }
        this.editors[i].register();
      }
    }
  },
  unregister: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) { continue; }
        this.editors[i].unregister();
      }
    }
  },
  getNumColumns: function() {
    return Math.max(Math.min(12,this.maxwidth),3);
  },
  enable: function() {
    if(this.editjsonButton) { this.editjsonButton.disabled = false; }
    if(this.addpropertyButton) { this.addpropertyButton.disabled = false; }
    
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) { continue; }
        this.editors[i].enable();
      }
    }
  },
  disable: function() {
    if(this.editjsonButton) { this.editjsonButton.disabled = true; }
    if(this.addpropertyButton) { this.addpropertyButton.disabled = true; }
    this.hideEditJSON();
    
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) { continue; }
        this.editors[i].disable();
      }
    }
  },
  layoutEditors: function() {
    var self = this, i, j;
    
    if(!this.rowContainer) { return; }

    // Sort editors by propertyOrder
    this.propertyOrder = Object.keys(this.editors);
    this.propertyOrder = this.propertyOrder.sort(function(a,b) {
      var ordera = self.editors[a].schema.propertyOrder;
      var orderb = self.editors[b].schema.propertyOrder;
      if(typeof ordera !== 'number') { ordera = 1000; }
      if(typeof orderb !== 'number') { orderb = 1000; }

      return ordera - orderb;
    });
    
    var container;
    
    if(this.format === 'grid') {
      var rows = [];
      $each(this.propertyOrder, function(j,key) {
        var editor = self.editors[key];
        if(editor.propertyRemoved) { return; }
        var found = false;
        var width = editor.options.hidden? 0 : (editor.options.gridColumns || editor.getNumColumns());
        var height = editor.options.hidden? 0 : editor.container.offsetHeight;
        // See if the editor will fit in any of the existing rows first
        for(var i=0; i<rows.length; i++) {
          // If the editor will fit in the row horizontally
          if(rows[i].width + width <= 12) {
            // If the editor is close to the other elements in height
            // i.e. Don't put a really tall editor in an otherwise short row or vice versa
            if(!height || (rows[i].minh*0.5 < height && rows[i].maxh*2 > height)) {
              found = i;
            }
          }
        }
        
        // If there isn't a spot in any of the existing rows, start a new row
        if(found === false) {
          rows.push({
            width: 0,
            minh: 999999,
            maxh: 0,
            editors: []
          });
          found = rows.length-1;
        }
        
        rows[found].editors.push({
          key: key,
          //editor: editor,
          width: width,
          height: height
        });
        rows[found].width += width;
        rows[found].minh = Math.min(rows[found].minh,height);
        rows[found].maxh = Math.max(rows[found].maxh,height);
      });
      
      // Make almost full rows width 12
      // Do this by increasing all editors' sizes proprotionately
      // Any left over space goes to the biggest editor
      // Don't touch rows with a width of 6 or less
      for(i=0; i<rows.length; i++) {
        if(rows[i].width < 12) {
          var biggest = false;
          var newWidth = 0;
          for(j=0; j<rows[i].editors.length; j++) {
            if(biggest === false) { biggest = j; }
            else if(rows[i].editors[j].width > rows[i].editors[biggest].width) { biggest = j; }
            rows[i].editors[j].width *= 12/rows[i].width;
            rows[i].editors[j].width = Math.floor(rows[i].editors[j].width);
            newWidth += rows[i].editors[j].width;
          }
          if(newWidth < 12) { rows[i].editors[biggest].width += 12-newWidth; }
          rows[i].width = 12;
        }
      }
      
      // layout hasn't changed
      if(this.layout === JSON.stringify(rows)) { return false; }
      this.layout = JSON.stringify(rows);
      
      // Layout the form
      container = document.createElement('div');
      for(i=0; i<rows.length; i++) {
        var row = this.theme.getGridRow();
        container.appendChild(row);
        for(j=0; j<rows[i].editors.length; j++) {
          var key = rows[i].editors[j].key;
          var editor = this.editors[key];
          
          if(editor.options.hidden) { editor.container.style.display = 'none'; }
          else { this.theme.setGridColumnSize(editor.container,rows[i].editors[j].width); }
          row.appendChild(editor.container);
        }
      }
    }
    // Normal layout
    else {
      container = document.createElement('div');
      $each(this.propertyOrder, function(i,key) {
        var editor = self.editors[key];
        if(editor.propertyRemoved) { return; }
        var row = self.theme.getGridRow();
        container.appendChild(row);
        
        if(editor.options.hidden) { editor.container.style.display = 'none'; }
        else { self.theme.setGridColumnSize(editor.container,12); }
        row.appendChild(editor.container);
      });
    }
    this.rowContainer.innerHTML = '';
    this.rowContainer.appendChild(container);
  },
  getPropertySchema: function(key) {
    // Schema declared directly in properties
    var schema = this.schema.properties[key] || {};
    schema = $extend({},schema);
    var matched = this.schema.properties[key]? true : false;
    
    // Any matching patternProperties should be merged in
    if(this.schema.patternProperties) {
      for(var i in this.schema.patternProperties) {
        if(!this.schema.patternProperties.hasOwnProperty(i)) { continue; }
        var regex = new RegExp(i);
        if(regex.test(key)) {
          schema.allOf = schema.allOf || [];
          schema.allOf.push(this.schema.patternProperties[i]);
          matched = true;
        }
      }
    }
    
    // Hasn't matched other rules, use additionalProperties schema
    if(!matched && this.schema.additionalProperties && typeof this.schema.additionalProperties === 'object') {
      schema = $extend({},this.schema.additionalProperties);
    }
    
    return schema;
  },
  preBuild: function() {
    this._super();

    this.editors = {};
    this.cachedEditors = {};
    var self = this;

    this.format = this.options.layout || this.options.objectLayout || this.schema.format || this.jsoneditor.options.objectLayout || 'normal';

    this.schema.properties = this.schema.properties || {};

    this.minwidth = 0;
    this.maxwidth = 0;

    // If the object should be rendered as a table row
    if(this.options.tableRow) {
      $each(this.schema.properties, function(key,schema) {
        var editor = self.jsoneditor.getEditorClass(schema);
        self.editors[key] = self.jsoneditor.createEditor(editor,{
          jsoneditor: self.jsoneditor,
          schema: schema,
          path: self.path+'.'+key,
          parent: self,
          compact: true,
          required: true
        });
        self.editors[key].preBuild();

        var width = self.editors[key].options.hidden? 0 : (self.editors[key].options.gridColumns || self.editors[key].getNumColumns());

        self.minwidth += width;
        self.maxwidth += width;
      });
      this.noLinkHolder = true;
    }
    // If the object should be rendered as a table
    else if(this.options.table) {
      // TODO: table display format
      throw 'Not supported yet';
    }
    // If the object should be rendered as a div
    else {
      this.defaultProperties = this.schema.defaultProperties || Object.keys(this.schema.properties);

      // Increase the grid width to account for padding
      self.maxwidth += 1;

      $each(this.defaultProperties, function(i,key) {
        self.addObjectProperty(key, true);

        if(self.editors[key]) {
          self.minwidth = Math.max(self.minwidth,(self.editors[key].options.gridColumns || self.editors[key].getNumColumns()));
          self.maxwidth += (self.editors[key].options.gridColumns || self.editors[key].getNumColumns());
        }
      });
    }
    
    // Sort editors by propertyOrder
    this.propertyOrder = Object.keys(this.editors);
    this.propertyOrder = this.propertyOrder.sort(function(a,b) {
      var ordera = self.editors[a].schema.propertyOrder;
      var orderb = self.editors[b].schema.propertyOrder;
      if(typeof ordera !== 'number') { ordera = 1000; }
      if(typeof orderb !== 'number') { orderb = 1000; }

      return ordera - orderb;
    });
  },
  build: function() {
    var self = this;

    // If the object should be rendered as a table row
    if(this.options.tableRow) {
      this.editorHolder = this.container;
      $each(this.editors, function(key,editor) {
        var holder = self.theme.getTableCell();
        self.editorHolder.appendChild(holder);

        editor.setContainer(holder);
        editor.build();
        editor.postBuild();

        if(self.editors[key].options.hidden) {
          holder.style.display = 'none';
        }
        if(self.editors[key].options.inputWidth) {
          holder.style.width = self.editors[key].options.inputWidth;
        }
      });
    }
    // If the object should be rendered as a table
    else if(this.options.table) {
      // TODO: table display format
      throw 'Not supported yet';
    }
    // If the object should be rendered as a div
    else {
      this.header = document.createElement('span');
      this.header.textContent = this.getTitle();
      this.title = this.theme.getHeader(this.header);
      this.container.appendChild(this.title);
      this.container.style.position = 'relative';
      
      // Edit JSON modal
      this.editjsonHolder = this.theme.getModal();
      this.editjsonTextarea = this.theme.getTextareaInput();
      this.editjsonTextarea.style.height = '170px';
      this.editjsonTextarea.style.width = '300px';
      this.editjsonTextarea.style.display = 'block';
      this.editjsonSave = this.getButton('Save','save','Save');
      this.editjsonSave.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.saveJSON();
      });
      this.editjsonCancel = this.getButton('Cancel','cancel','Cancel');
      this.editjsonCancel.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.hideEditJSON();
      });
      this.editjsonHolder.appendChild(this.editjsonTextarea);
      this.editjsonHolder.appendChild(this.editjsonSave);
      this.editjsonHolder.appendChild(this.editjsonCancel);
      
      // Manage Properties modal
      this.addpropertyHolder = this.theme.getModal();
      this.addpropertyList = document.createElement('div');
      this.addpropertyList.style.width = '295px';
      this.addpropertyList.style.maxHeight = '160px';
      this.addpropertyList.style.padding = '5px 0';
      this.addpropertyList.style.overflowY = 'auto';
      this.addpropertyList.style.overflowX = 'hidden';
      this.addpropertyList.style.paddingLeft = '5px';
      this.addpropertyList.setAttribute('class', 'property-selector');
      this.addpropertyAdd = this.getButton('add','add','add');
      this.addpropertyInput = this.theme.getFormInputField('text');
      this.addpropertyInput.setAttribute('placeholder','Property name...');
      this.addpropertyInput.style.width = '220px';
      this.addpropertyInput.style.marginBottom = '0';
      this.addpropertyInput.style.display = 'inline-block';
      this.addpropertyAdd.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(self.addpropertyInput.value) {
          if(self.editors[self.addpropertyInput.value]) {
            window.alert('there is already a property with that name');
            return;
          }
          
          self.addObjectProperty(self.addpropertyInput.value);
          if(self.editors[self.addpropertyInput.value]) {
            self.editors[self.addpropertyInput.value].disable();
          }
          self.onChange(true);
        }
      });
      this.addpropertyHolder.appendChild(this.addpropertyList);
      this.addpropertyHolder.appendChild(this.addpropertyInput);
      this.addpropertyHolder.appendChild(this.addpropertyAdd);
      var spacer = document.createElement('div');
      spacer.style.clear = 'both';
      this.addpropertyHolder.appendChild(spacer);
      
      
      // Description
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      
      // Validation error placeholder area
      this.errorHolder = document.createElement('div');
      this.container.appendChild(this.errorHolder);
      
      // Container for child editor area
      this.editorHolder = this.theme.getIndentedPanel();
      this.editorHolder.style.paddingBottom = '0';
      this.container.appendChild(this.editorHolder);

      // Container for rows of child editors
      this.rowContainer = this.theme.getGridContainer();
      this.editorHolder.appendChild(this.rowContainer);

      $each(this.editors, function(key,editor) {
        var holder = self.theme.getGridColumn();
        self.rowContainer.appendChild(holder);

        editor.setContainer(holder);
        editor.build();
        editor.postBuild();
      });

      // Control buttons
      this.titleControls = this.theme.getHeaderButtonHolder();
      this.editjsonControls = this.theme.getHeaderButtonHolder();
      this.addpropertyControls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.titleControls);
      this.title.appendChild(this.editjsonControls);
      this.title.appendChild(this.addpropertyControls);

      // Show/Hide button
      this.collapsed = false;
      this.toggleButton = this.getButton('','collapse','Collapse');
      this.titleControls.appendChild(this.toggleButton);
      this.toggleButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(self.collapsed) {
          self.editorHolder.style.display = '';
          self.collapsed = false;
          self.setButtonText(self.toggleButton,'','collapse','Collapse');
        }
        else {
          self.editorHolder.style.display = 'none';
          self.collapsed = true;
          self.setButtonText(self.toggleButton,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggleButton,'click');
      }
      
      // Collapse button disabled
      if(this.schema.options && typeof this.schema.options.disableCollapse !== 'undefined') {
        if(this.schema.options.disableCollapse) { this.toggleButton.style.display = 'none'; }
      }
      else if(this.jsoneditor.options.disableCollapse) {
        this.toggleButton.style.display = 'none';
      }
      
      // Edit JSON Button
      this.editjsonButton = this.getButton('JSON','edit','Edit JSON');
      this.editjsonButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggleEditJSON();
      });
      this.editjsonControls.appendChild(this.editjsonButton);
      this.editjsonControls.appendChild(this.editjsonHolder);
      
      // Edit JSON Buttton disabled
      if(this.schema.options && typeof this.schema.options.disableEditJson !== 'undefined') {
        if(this.schema.options.disableEditJson) { this.editjsonButton.style.display = 'none'; }
      }
      else if(this.jsoneditor.options.disableEditJson) {
        this.editjsonButton.style.display = 'none';
      }
      
      // Object Properties Button
      this.addpropertyButton = this.getButton('Properties','edit','Object Properties');
      this.addpropertyButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggleAddProperty();
      });
      this.addpropertyControls.appendChild(this.addpropertyButton);
      this.addpropertyControls.appendChild(this.addpropertyHolder);
      this.refreshAddProperties();
    }
    
    // Fix table cell ordering
    if(this.options.tableRow) {
      this.editorHolder = this.container;
      $each(this.propertyOrder,function(i,key) {
        self.editorHolder.appendChild(self.editors[key].container);
      });
    }
    // Layout object editors in grid if needed
    else {
      // Initial layout
      this.layoutEditors();
      // Do it again now that we know the approximate heights of elements
      this.layoutEditors();
    }
  },
  showEditJSON: function() {
    if(!this.editjsonHolder) { return; }
    this.hideAddProperty();
    
    // Position the form directly beneath the button
    // TODO: edge detection
    this.editjsonHolder.style.left = this.editjsonButton.offsetLeft+'px';
    this.editjsonHolder.style.top = this.editjsonButton.offsetTop + this.editjsonButton.offsetHeight+'px';
    
    // Start the textarea with the current value
    this.editjsonTextarea.value = JSON.stringify(this.getValue(),null,2);
    
    // Disable the rest of the form while editing JSON
    this.disable();
    
    this.editjsonHolder.style.display = '';
    this.editjsonButton.disabled = false;
    this.editingJson = true;
  },
  hideEditJSON: function() {
    if(!this.editjsonHolder) { return; }
     if(!this.editingJson) { return; }
    
    this.editjsonHolder.style.display = 'none';
    this.enable();
    this.editingJson = false;
  },
  saveJSON: function() {
     if(!this.editjsonHolder) { return; }
    
    try {
      var json = JSON.parse(this.editjsonTextarea.value);
      this.setValue(json);
      this.hideEditJSON();
    }
    catch(e) {
      window.alert('invalid JSON');
      throw e;
    }
  },
  toggleEditJSON: function() {
     if(this.editingJson) { this.hideEditJSON(); }
    else { this.showEditJSON(); }
  },
  insertPropertyControlUsingPropertyOrder: function (property, control, container) {
    var propertyOrder;
    if (this.schema.properties[property]) {
      propertyOrder = this.schema.properties[property].propertyOrder;
    }
     if (typeof propertyOrder !== 'number') { propertyOrder = 1000; }
    control.propertyOrder = propertyOrder;

    for (var i = 0; i < container.childNodes.length; i++) {
      var child = container.childNodes[i];
      if (control.propertyOrder < child.propertyOrder) {
        this.addpropertyList.insertBefore(control, child);
        control = null;
        break;
      }
    }
    if (control) {
      this.addpropertyList.appendChild(control);
    }
  },
  addPropertyCheckbox: function(key) {
    var self = this;
    var checkbox, label, labelText, control;

    checkbox = self.theme.getCheckbox();
    checkbox.style.width = 'auto';

    if (this.schema.properties[key] && this.schema.properties[key].title) {
      labelText = this.schema.properties[key].title;
    }
    else {
      labelText = key;
    }

    label = self.theme.getCheckboxLabel(labelText);

    control = self.theme.getFormControl(label,checkbox);
    control.style.paddingBottom = control.style.marginBottom = control.style.paddingTop = control.style.marginTop = 0;
    control.style.height = 'auto';
    //control.style.overflowY = 'hidden';

    this.insertPropertyControlUsingPropertyOrder(key, control, this.addpropertyList);

    checkbox.checked = key in this.editors;
    checkbox.addEventListener('change',function() {
      if(checkbox.checked) {
        self.addObjectProperty(key);
      }
      else {
        self.removeObjectProperty(key);
      }
      self.onChange(true);
    });
    self.addpropertyCheckboxes[key] = checkbox;
    
    return checkbox;
  },
  showAddProperty: function() {
     if(!this.addpropertyHolder) { return; }
    this.hideEditJSON();
    
    // Position the form directly beneath the button
    // TODO: edge detection
    this.addpropertyHolder.style.left = this.addpropertyButton.offsetLeft+'px';
    this.addpropertyHolder.style.top = this.addpropertyButton.offsetTop + this.addpropertyButton.offsetHeight+'px';
    
    // Disable the rest of the form while editing JSON
    this.disable();
    
    this.addingProperty = true;
    this.addpropertyButton.disabled = false;
    this.addpropertyHolder.style.display = '';
    this.refreshAddProperties();
  },
  hideAddProperty: function() {
     if(!this.addpropertyHolder) { return; }
     if(!this.addingProperty) { return; }
    
    this.addpropertyHolder.style.display = 'none';
    this.enable();
    
    this.addingProperty = false;
  },
  toggleAddProperty: function() {
     if(this.addingProperty) { this.hideAddProperty(); }
    else { this.showAddProperty(); }
  },
  removeObjectProperty: function(property) {
    if(this.editors[property]) {
      this.editors[property].unregister();
      delete this.editors[property];
      
      this.refreshValue();
      this.layoutEditors();
    }
  },
  addObjectProperty: function(name, prebuildOnly) {
    var self = this;
    
    // Property is already added
     if(this.editors[name]) { return; }
    
    // Property was added before and is cached
    if(this.cachedEditors[name]) {
      this.editors[name] = this.cachedEditors[name];
       if(prebuildOnly) { return; }
      this.editors[name].register();
    }
    // New property
    else {
      if(!this.canHaveAdditionalProperties() && (!this.schema.properties || !this.schema.properties[name])) {
        return;
      }

      var schema = self.getPropertySchema(name);
      
            
      // Add the property
      var editor = self.jsoneditor.getEditorClass(schema);

      self.editors[name] = self.jsoneditor.createEditor(editor,{
        jsoneditor: self.jsoneditor,
        schema: schema,
        path: self.path+'.'+name,
        parent: self
      });
      self.editors[name].preBuild();
      
      if(!prebuildOnly) {
        var holder = self.theme.getChildEditorHolder();
        self.editorHolder.appendChild(holder);
        self.editors[name].setContainer(holder);
        self.editors[name].build();
        self.editors[name].postBuild();
      }
      
      self.cachedEditors[name] = self.editors[name];
    }
    
    // If we're only prebuilding the editors, don't refresh values
    if(!prebuildOnly) {
      self.refreshValue();
      self.layoutEditors();
    }
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this._super(editor);
  },
  canHaveAdditionalProperties: function() {
    if (typeof this.schema.additionalProperties === 'boolean') {
      return this.schema.additionalProperties;
    }
    return !this.jsoneditor.options.noAdditionalProperties;
  },
  destroy: function() {
    $each(this.cachedEditors, function(i,el) {
      el.destroy();
    });
     if(this.editorHolder) { this.editorHolder.innerHTML = ''; }
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.errorHolder && this.errorHolder.parentNode) { this.errorHolder.parentNode.removeChild(this.errorHolder); }

    this.editors = null;
    this.cachedEditors = null;
     if(this.editorHolder && this.editorHolder.parentNode) { this.editorHolder.parentNode.removeChild(this.editorHolder); }
    this.editorHolder = null;

    this._super();
  },
  getValue: function() {
    var result = this._super();
    if(this.jsoneditor.options.removeEmptyProperties || this.options.removeEmptyProperties) {
      for(var i in result) {
        if(result.hasOwnProperty(i)) {
           if(!result[i]) { delete result[i]; }
        }
      }
    }
    return result;
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    
    for(var i in this.editors) {
       if(!this.editors.hasOwnProperty(i)) { continue; }
      this.value[i] = this.editors[i].getValue();
    }
    
     if(this.addingProperty) { this.refreshAddProperties(); }
  },
  refreshAddProperties: function() {
    if(this.options.disableProperties || (this.options.disableProperties !== false && this.jsoneditor.options.disableProperties)) {
      this.addpropertyControls.style.display = 'none';
      return;
    }

    var canAdd = false, canRemove = false, numProps = 0, i, showModal = false;
    
    // Get number of editors
    for(i in this.editors) {
       if(!this.editors.hasOwnProperty(i)) { continue; }
      numProps++;
    }
    
    // Determine if we can add back removed properties
    canAdd = this.canHaveAdditionalProperties() && !(typeof this.schema.maxProperties !== 'undefined' && numProps >= this.schema.maxProperties);
    
    if(this.addpropertyCheckboxes) {
      this.addpropertyList.innerHTML = '';
    }
    this.addpropertyCheckboxes = {};
    
    // Check for which editors can't be removed or added back
    for(i in this.cachedEditors) {
       if(!this.cachedEditors.hasOwnProperty(i)) { continue; }
      
      this.addPropertyCheckbox(i);
      
      if(this.isRequired(this.cachedEditors[i]) && i in this.editors) {
        this.addpropertyCheckboxes[i].disabled = true;
      }
      
      if(typeof this.schema.minProperties !== 'undefined' && numProps <= this.schema.minProperties) {
        this.addpropertyCheckboxes[i].disabled = this.addpropertyCheckboxes[i].checked;
         if(!this.addpropertyCheckboxes[i].checked) { showModal = true; }
      }
      else if(!(i in this.editors)) {
        if(!canAdd  && !this.schema.properties.hasOwnProperty(i)) {
          this.addpropertyCheckboxes[i].disabled = true;
        }
        else {
          this.addpropertyCheckboxes[i].disabled = false;
          showModal = true;
        }
      }
      else {
        showModal = true;
        canRemove = true;
      }
    }
    
    if(this.canHaveAdditionalProperties()) {
      showModal = true;
    }
    
    // Additional addproperty checkboxes not tied to a current editor
    for(i in this.schema.properties) {
       if(!this.schema.properties.hasOwnProperty(i)) { continue; }
       if(this.cachedEditors[i]) { continue; }
      showModal = true;
      this.addPropertyCheckbox(i);
    }
    
    // If no editors can be added or removed, hide the modal button
    if(!showModal) {
      this.hideAddProperty();
      this.addpropertyControls.style.display = 'none';
    }
    // If additional properties are disabled
    else if(!this.canHaveAdditionalProperties()) {
      this.addpropertyAdd.style.display = 'none';
      this.addpropertyInput.style.display = 'none';
    }
    // If no new properties can be added
    else if(!canAdd) {
      this.addpropertyAdd.disabled = true;
    }
    // If new properties can be added
    else {
      this.addpropertyAdd.disabled = false;
    }
  },
  isRequired: function(editor) {
     if(typeof editor.schema.required === 'boolean') { return editor.schema.required; }
    else if(Array.isArray(this.schema.required)) { return this.schema.required.indexOf(editor.key) > -1; }
    else if(this.jsoneditor.options.requiredByDefault) { return true; }
    else { return false; }
  },
  setValue: function(value, initial) {
    var self = this;
    value = value || {};
    
     if(typeof value !== 'object' || Array.isArray(value)) { value = {}; }

    // First, set the values for all of the defined properties
    $each(this.cachedEditors, function(i,editor) {
      // Value explicitly set
      if(typeof value[i] !== 'undefined') {
        self.addObjectProperty(i);
        editor.setValue(value[i],initial);
      }
      // Otherwise, remove value unless this is the initial set or it's required
      else if(!initial && !self.isRequired(editor)) {
        self.removeObjectProperty(i);
      }
      // Otherwise, set the value to the default
      else {
        editor.setValue(editor.getDefault(),initial);
      }
    });

    $each(value, function(i,val) {
      if(!self.cachedEditors[i]) {
        self.addObjectProperty(i);
         if(self.editors[i]) { self.editors[i].setValue(val,initial); }
      }
    });
    
    this.refreshValue();
    this.layoutEditors();
    this.onChange();
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var myErrors = [];
    var otherErrors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        myErrors.push(error);
      }
      else {
        otherErrors.push(error);
      }
    });

    // Show errors for this editor
    if(this.errorHolder) {
      if(myErrors.length) {
        var message = [];
        this.errorHolder.innerHTML = '';
        this.errorHolder.style.display = '';
        $each(myErrors, function(i,error) {
          self.errorHolder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.errorHolder.style.display = 'none';
      }
    }

    // Show error for the table row if this is inside a table
    if(this.options.tableRow) {
      if(myErrors.length) {
        this.theme.addTableRowError(this.container);
      }
      else {
        this.theme.removeTableRowError(this.container);
      }
    }

    // Show errors for child editors
    $each(this.editors, function(i,editor) {
      editor.showValidationErrors(otherErrors);
    });
  }
});

JSONEditor.defaults.editors.array = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema['default'] || [];
  },
  register: function() {
    this._super();
    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].register();
      }
    }
  },
  unregister: function() {
    this._super();
    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].unregister();
      }
    }
  },
  getNumColumns: function() {
    var info = this.getItemInfo(0);
    // Tabs require extra horizontal space
    if(this.tabsHolder) {
      return Math.max(Math.min(12,info.width+2),4);
    }
    else {
      return info.width;
    }
  },
  enable: function() {
     if(this.addRowButton) { this.addRowButton.disabled = false; }
     if(this.removeAllRowsButton) { this.removeAllRowsButton.disabled = false; }
     if(this.deleteLastRowButton) { this.deleteLastRowButton.disabled = false; }

    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].enable();

         if(this.rows[i].moveupButton) { this.rows[i].moveupButton.disabled = false; }
         if(this.rows[i].movedownButton) { this.rows[i].movedownButton.disabled = false; }
         if(this.rows[i].deleteButton) { this.rows[i].deleteButton.disabled = false; }
      }
    }
    this._super();
  },
  disable: function() {
     if(this.addRowButton) { this.addRowButton.disabled = true; }
     if(this.removeAllRowsButton) { this.removeAllRowsButton.disabled = true; }
     if(this.deleteLastRowButton) { this.deleteLastRowButton.disabled = true; }

    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].disable();

         if(this.rows[i].moveupButton) { this.rows[i].moveupButton.disabled = true; }
         if(this.rows[i].movedownButton) { this.rows[i].movedownButton.disabled = true; }
         if(this.rows[i].deleteButton) { this.rows[i].deleteButton.disabled = true; }
      }
    }
    this._super();
  },
  preBuild: function() {
    this._super();

    this.rows = [];

    this.hideDeleteButtons = this.options.disableArrayDelete || this.jsoneditor.options.disableArrayDelete;
    this.hideMoveButtons = this.options.disableArrayReorder || this.jsoneditor.options.disableArrayReorder;
    this.hideAddButton = this.options.disableArrayAdd || this.jsoneditor.options.disableArrayAdd;
  },
  build: function() {
    var self = this;

    if(!this.options.compact) {
      this.header = document.createElement('span');
      this.header.textContent = this.getTitle();
      this.title = this.theme.getHeader(this.header);
      this.container.appendChild(this.title);
      this.titleControls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.titleControls);
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.errorHolder = document.createElement('div');
      this.container.appendChild(this.errorHolder);

      if(this.schema.format === 'tabs') {
        this.controls = this.theme.getHeaderButtonHolder();
        this.title.appendChild(this.controls);
        this.tabsHolder = this.theme.getTabHolder();
        this.container.appendChild(this.tabsHolder);
        this.rowHolder = this.theme.getTabContentHolder(this.tabsHolder);

        this.activeTab = null;
      }
      else {
        this.panel = this.theme.getIndentedPanel();
        this.container.appendChild(this.panel);
        this.rowHolder = document.createElement('div');
        this.panel.appendChild(this.rowHolder);
        this.controls = this.theme.getButtonHolder();
        this.panel.appendChild(this.controls);
      }
    }
    else {
        this.panel = this.theme.getIndentedPanel();
        this.container.appendChild(this.panel);
        this.controls = this.theme.getButtonHolder();
        this.panel.appendChild(this.controls);
        this.rowHolder = document.createElement('div');
        this.panel.appendChild(this.rowHolder);
    }

    // Add controls
    this.addControls();
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this.refreshTabs(true);
    this._super(editor);
  },
  getItemTitle: function() {
    if(!this.itemTitle) {
      if(this.schema.items && !Array.isArray(this.schema.items)) {
        var tmp = this.jsoneditor.expandRefs(this.schema.items);
        this.itemTitle = tmp.title || 'item';
      }
      else {
        this.itemTitle = 'item';
      }
    }
    return this.itemTitle;
  },
  getItemSchema: function(i) {
    if(Array.isArray(this.schema.items)) {
      if(i >= this.schema.items.length) {
        if(this.schema.additionalItems===true) {
          return {};
        }
        else if(this.schema.additionalItems) {
          return $extend({},this.schema.additionalItems);
        }
      }
      else {
        return $extend({},this.schema.items[i]);
      }
    }
    else if(this.schema.items) {
      return $extend({},this.schema.items);
    }
    else {
      return {};
    }
  },
  getItemInfo: function(i) {
    var schema = this.getItemSchema(i);

    // Check if it's cached
    this.itemInfo = this.itemInfo || {};
    var stringified = JSON.stringify(schema);
     if(typeof this.itemInfo[stringified] !== 'undefined') { return this.itemInfo[stringified]; }

    // Get the schema for this item
    schema = this.jsoneditor.expandRefs(schema);

    this.itemInfo[stringified] = {
      title: schema.title || 'item',
      'default': schema['default'],
      width: 12,
      childEditors: schema.properties || schema.items
    };

    return this.itemInfo[stringified];
  },
  getElementEditor: function(i) {
    var itemInfo = this.getItemInfo(i);
    var schema = this.getItemSchema(i);
    schema = this.jsoneditor.expandRefs(schema);
    schema.title = itemInfo.title+' '+(i+1);

    var editor = this.jsoneditor.getEditorClass(schema);

    var holder;
    if(this.tabsHolder) {
      holder = this.theme.getTabContent();
    }
    else if(itemInfo.childEditors) {
      holder = this.theme.getChildEditorHolder();
    }
    else {
      holder = this.theme.getIndentedPanel();
    }

    this.rowHolder.appendChild(holder);

    var ret = this.jsoneditor.createEditor(editor,{
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });
    ret.preBuild();
    ret.build();
    ret.postBuild();

    if(!ret.titleControls) {
      ret.arrayControls = this.theme.getButtonHolder();
      holder.appendChild(ret.arrayControls);
    }

    return ret;
  },
  destroy: function() {
    this.empty();
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.description && this.description.parentNode) { this.description.parentNode.removeChild(this.description); }
     if(this.rowHolder && this.rowHolder.parentNode) { this.rowHolder.parentNode.removeChild(this.rowHolder); }
     if(this.controls && this.controls.parentNode) { this.controls.parentNode.removeChild(this.controls); }
     if(this.panel && this.panel.parentNode) { this.panel.parentNode.removeChild(this.panel); }

    this.rows = this.title = this.description = this.rowHolder = this.panel = this.controls = null;

    this._super();
  },
  empty: function() {
     if(!this.rows) { return; }
    var self = this;
    $each(this.rows,function(i,row) {
       if(row.tab && row.tab.parentNode) { row.tab.parentNode.removeChild(row.tab); }
      self.destroyRow(row);
      self.rows[i] = null;
    });
    self.rows = [];
  },
  destroyRow: function(row) {
    var holder = row.container;
    row.destroy();
     if(holder.parentNode) { holder.parentNode.removeChild(holder); }
     if(row.tab && row.tab.parentNode) { row.tab.parentNode.removeChild(row.tab); }
  },
  getMax: function() {
    if((Array.isArray(this.schema.items)) && this.schema.additionalItems === false) {
      return Math.min(this.schema.items.length,this.schema.maxItems || Infinity);
    }
    else {
      return this.schema.maxItems || Infinity;
    }
  },
  refreshTabs: function(refreshHeaders) {
    var self = this;
    $each(this.rows, function(i,row) {
       if(!row.tab) { return; }

      if(refreshHeaders) {
        row.tabText.textContent = row.getHeaderText();
      }
      else {
        if(row.tab === self.activeTab) {
          self.theme.markTabActive(row.tab);
          row.container.style.display = '';
        }
        else {
          self.theme.markTabInactive(row.tab);
          row.container.style.display = 'none';
        }
      }
    });
  },
  setValue: function(value, initial) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];

     if(!(Array.isArray(value))) { value = [value]; }

    var serialized = JSON.stringify(value);
     if(serialized === this.serialized) { return; }

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemInfo(value.length)['default']);
      }
    }
    if(this.getMax() && value.length > this.getMax()) {
      value = value.slice(0,this.getMax());
    }

    var self = this;
    $each(value,function(i,val) {
      if(self.rows[i]) {
        // TODO: don't set the row's value if it hasn't changed
        self.rows[i].setValue(val,initial);
      }
      else {
        self.addRow(val,initial);
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      self.destroyRow(self.rows[j]);
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    // Set the active tab
    var newActiveTab = null;
    $each(self.rows, function(i,row) {
      if(row.tab === self.activeTab) {
        newActiveTab = row.tab;
        return false;
      }
    });
     if(!newActiveTab && self.rows.length) { newActiveTab = self.rows[0].tab; }

    self.activeTab = newActiveTab;

    self.refreshValue(initial);
    self.refreshTabs(true);
    self.refreshTabs();

    self.onChange();

    // TODO: sortable
  },
  refreshValue: function(force) {
    var self = this;
    var oldi = this.value? this.value.length : 0;
    this.value = [];

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      self.value[i] = editor.getValue();
    });

    if(oldi !== this.value.length || force) {
      // If we currently have minItems items in the array
      var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;

      $each(this.rows,function(i,editor) {
        // Hide the move down button for the last row
        if(editor.movedownButton) {
          if(i === self.rows.length - 1) {
            editor.movedownButton.style.display = 'none';
          }
          else {
            editor.movedownButton.style.display = '';
          }
        }

        // Hide the delete button if we have minItems items
        if(editor.deleteButton) {
          if(minItems) {
            editor.deleteButton.style.display = 'none';
          }
          else {
            editor.deleteButton.style.display = '';
          }
        }

        // Get the value for this editor
        self.value[i] = editor.getValue();
      });

      var controlsNeeded = false;

      if(!this.value.length) {
        this.deleteLastRowButton.style.display = 'none';
        this.removeAllRowsButton.style.display = 'none';
      }
      else if(this.value.length === 1) {
        this.removeAllRowsButton.style.display = 'none';

        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems || this.hideDeleteButtons) {
          this.deleteLastRowButton.style.display = 'none';
        }
        else {
          this.deleteLastRowButton.style.display = '';
          controlsNeeded = true;
        }
      }
      else {
        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems || this.hideDeleteButtons) {
          this.deleteLastRowButton.style.display = 'none';
          this.removeAllRowsButton.style.display = 'none';
        }
        else {
          this.deleteLastRowButton.style.display = '';
          this.removeAllRowsButton.style.display = '';
          controlsNeeded = true;
        }
      }

      // If there are maxItems in the array, hide the add button beneath the rows
      if((this.getMax() && this.getMax() <= this.rows.length) || this.hideAddButton){
        this.addRowButton.style.display = 'none';
      }
      else {
        this.addRowButton.style.display = '';
        controlsNeeded = true;
      }

      if(!this.collapsed && controlsNeeded) {
        this.controls.style.display = 'inline-block';
      }
      else {
        this.controls.style.display = 'none';
      }
    }
  },
  addRow: function(value, initial) {
    var self = this;
    var i = this.rows.length;

    self.rows[i] = this.getElementEditor(i);

    if(self.tabsHolder) {
      self.rows[i].tabText = document.createElement('span');
      self.rows[i].tabText.textContent = self.rows[i].getHeaderText();
      self.rows[i].tab = self.theme.getTab(self.rows[i].tabText);
      self.rows[i].tab.addEventListener('click', function(e) {
        self.activeTab = self.rows[i].tab;
        self.refreshTabs();
        e.preventDefault();
        e.stopPropagation();
      });

      self.theme.addTab(self.tabsHolder, self.rows[i].tab);
    }

    var controlsHolder = self.rows[i].titleControls || self.rows[i].arrayControls;

    // Buttons to delete row, move row up, and move row down
    if(!self.hideDeleteButtons) {
      self.rows[i].deleteButton = this.getButton(self.getItemTitle(),'delete','Delete '+self.getItemTitle());
      self.rows[i].deleteButton.className += ' delete';
      self.rows[i].deleteButton.setAttribute('data-i',i);
      self.rows[i].deleteButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

        var value = self.getValue();

        var newval = [];
        var newActiveTab = null;
        $each(value,function(j,row) {
          if(j===i) {
            // If the one we're deleting is the active tab
            if(self.rows[j].tab === self.activeTab) {
              // Make the next tab active if there is one
              // Note: the next tab is going to be the current tab after deletion
               if(self.rows[j+1]) { newActiveTab = self.rows[j].tab; }
              // Otherwise, make the previous tab active if there is one
              else if(j) { newActiveTab = self.rows[j-1].tab; }
            }

            return; // If this is the one we're deleting
          }
          newval.push(row);
        });
        self.setValue(newval);
        if(newActiveTab) {
          self.activeTab = newActiveTab;
          self.refreshTabs();
        }

        self.onChange(true);
      });

      if(controlsHolder) {
        controlsHolder.appendChild(self.rows[i].deleteButton);
      }
    }

    if(i && !self.hideMoveButtons) {
      self.rows[i].moveupButton = this.getButton('','moveup','Move up');
      self.rows[i].moveupButton.className += ' moveup';
      self.rows[i].moveupButton.setAttribute('data-i',i);
      self.rows[i].moveupButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

         if(i<=0) { return; }
        var rows = self.getValue();
        var tmp = rows[i-1];
        rows[i-1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.activeTab = self.rows[i-1].tab;
        self.refreshTabs();

        self.onChange(true);
      });

      if(controlsHolder) {
        controlsHolder.appendChild(self.rows[i].moveupButton);
      }
    }

    if(!self.hideMoveButtons) {
      self.rows[i].movedownButton = this.getButton('','movedown','Move down');
      self.rows[i].movedownButton.className += ' movedown';
      self.rows[i].movedownButton.setAttribute('data-i',i);
      self.rows[i].movedownButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

        var rows = self.getValue();
         if(i>=rows.length-1) { return; }
        var tmp = rows[i+1];
        rows[i+1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.activeTab = self.rows[i+1].tab;
        self.refreshTabs();
        self.onChange(true);
      });

      if(controlsHolder) {
        controlsHolder.appendChild(self.rows[i].movedownButton);
      }
    }

     if(value) { self.rows[i].setValue(value, initial); }
    self.refreshTabs();
  },
  addControls: function() {
    var self = this;

    this.collapsed = false;
    this.toggleButton = this.getButton('','collapse','Collapse');
    this.titleControls.appendChild(this.toggleButton);
    var rowHolderDisplay = self.rowHolder.style.display;
    var controlsDisplay = self.controls.style.display;
    this.toggleButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      if(self.collapsed) {
        self.collapsed = false;
         if(self.panel) { self.panel.style.display = ''; }
        self.rowHolder.style.display = rowHolderDisplay;
         if(self.tabsHolder) { self.tabsHolder.style.display = ''; }
        self.controls.style.display = controlsDisplay;
        self.setButtonText(this,'','collapse','Collapse');
      }
      else {
        self.collapsed = true;
        self.rowHolder.style.display = 'none';
         if(self.tabsHolder) { self.tabsHolder.style.display = 'none'; }
        self.controls.style.display = 'none';
         if(self.panel) { self.panel.style.display = 'none'; }
        self.setButtonText(this,'','expand','Expand');
      }
    });

    // If it should start collapsed
    if(this.options.collapsed) {
      $trigger(this.toggleButton,'click');
    }

    // Collapse button disabled
    if(this.schema.options && typeof this.schema.options.disableCollapse !== 'undefined') {
       if(this.schema.options.disableCollapse) { this.toggleButton.style.display = 'none'; }
    }
    else if(this.jsoneditor.options.disableCollapse) {
      this.toggleButton.style.display = 'none';
    }

    // Add 'new row' and 'delete last' buttons below editor
    this.addRowButton = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle());

    this.addRowButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      var i = self.rows.length;
      self.addRow();
      self.activeTab = self.rows[i].tab;
      self.refreshTabs();
      self.refreshValue();
      self.onChange(true);
    });
    self.controls.appendChild(this.addRowButton);

    this.deleteLastRowButton = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle());
    this.deleteLastRowButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      var rows = self.getValue();

      var newActiveTab = null;
       if(self.rows.length > 1 && self.rows[self.rows.length-1].tab === self.activeTab) { newActiveTab = self.rows[self.rows.length-2].tab; }

      rows.pop();
      self.setValue(rows);
      if(newActiveTab) {
        self.activeTab = newActiveTab;
        self.refreshTabs();
      }
      self.onChange(true);
    });
    self.controls.appendChild(this.deleteLastRowButton);

    this.removeAllRowsButton = this.getButton('All','delete','Delete All');
    this.removeAllRowsButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.setValue([]);
      self.onChange(true);
    });
    self.controls.appendChild(this.removeAllRowsButton);

    if(self.tabs) {
      this.addRowButton.style.width = '100%';
      this.addRowButton.style.textAlign = 'left';
      this.addRowButton.style.marginBottom = '3px';

      this.deleteLastRowButton.style.width = '100%';
      this.deleteLastRowButton.style.textAlign = 'left';
      this.deleteLastRowButton.style.marginBottom = '3px';

      this.removeAllRowsButton.style.width = '100%';
      this.removeAllRowsButton.style.textAlign = 'left';
      this.removeAllRowsButton.style.marginBottom = '3px';
    }
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var myErrors = [];
    var otherErrors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        myErrors.push(error);
      }
      else {
        otherErrors.push(error);
      }
    });

    // Show errors for this editor
    if(this.errorHolder) {
      if(myErrors.length) {
        var message = [];
        this.errorHolder.innerHTML = '';
        this.errorHolder.style.display = '';
        $each(myErrors, function(i,error) {
          self.errorHolder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.errorHolder.style.display = 'none';
      }
    }

    // Show errors for child editors
    $each(this.rows, function(i,row) {
      row.showValidationErrors(otherErrors);
    });
  }
});

JSONEditor.defaults.editors.table = JSONEditor.defaults.editors.array.extend({
  register: function() {
    this._super();
    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].register();
      }
    }
  },
  unregister: function() {
    this._super();
    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].unregister();
      }
    }
  },
  getNumColumns: function() {
    return Math.max(Math.min(12,this.width),3);
  },
  preBuild: function() {
    var itemSchema = this.jsoneditor.expandRefs(this.schema.items || {});

    this.itemTitle = itemSchema.title || 'row';
    this.itemDefault = itemSchema['default'] || null;
    this.itemHasChildEditors = itemSchema.properties || itemSchema.items;
    this.width = 12;
    this._super();
  },
  build: function() {
    var self = this;
    this.table = this.theme.getTable();
    this.container.appendChild(this.table);
    this.thead = this.theme.getTableHead();
    this.table.appendChild(this.thead);
    this.headerRow = this.theme.getTableRow();
    this.thead.appendChild(this.headerRow);
    this.rowHolder = this.theme.getTableBody();
    this.table.appendChild(this.rowHolder);

    // Determine the default value of array element
    var tmp = this.getElementEditor(0,true);
    this.itemDefault = tmp.getDefault();
    this.width = tmp.getNumColumns() + 2;
    
    if(!this.options.compact) {
      this.title = this.theme.getHeader(this.getTitle());
      this.container.appendChild(this.title);
      this.titleControls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.titleControls);
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.panel = this.theme.getIndentedPanel();
      this.container.appendChild(this.panel);
      this.errorHolder = document.createElement('div');
      this.panel.appendChild(this.errorHolder);
    }
    else {
      this.panel = document.createElement('div');
      this.container.appendChild(this.panel);
    }

    this.panel.appendChild(this.table);
    this.controls = this.theme.getButtonHolder();
    this.panel.appendChild(this.controls);

    if(this.itemHasChildEditors) {
      var ce = tmp.getChildEditors();
      var order = tmp.propertyOrder || Object.keys(ce);
      for(var i=0; i<order.length; i++) {
        var th = self.theme.getTableHeaderCell(ce[order[i]].getTitle());
         if(ce[order[i]].options.hidden) { th.style.display = 'none'; }
        self.headerRow.appendChild(th);
      }
    }
    else {
      self.headerRow.appendChild(self.theme.getTableHeaderCell(this.itemTitle));
    }

    tmp.destroy();
    this.rowHolder.innerHTML = '';

    // Row Controls column
    this.controlsHeaderCell = self.theme.getTableHeaderCell(' ');
    self.headerRow.appendChild(this.controlsHeaderCell);

    // Add controls
    this.addControls();
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this._super();
  },
  getItemDefault: function() {
    return $extend({},{'default':this.itemDefault})['default'];
  },
  getItemTitle: function() {
    return this.itemTitle;
  },
  getElementEditor: function(i,ignore) {
    var schemaCopy = $extend({},this.schema.items);
    var editor = this.jsoneditor.getEditorClass(schemaCopy, this.jsoneditor);
    var row = this.rowHolder.appendChild(this.theme.getTableRow());
    var holder = row;
    if(!this.itemHasChildEditors) {
      holder = this.theme.getTableCell();
      row.appendChild(holder);
    }

    var ret = this.jsoneditor.createEditor(editor,{
      jsoneditor: this.jsoneditor,
      schema: schemaCopy,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      compact: true,
      tableRow: true
    });
    
    ret.preBuild();
    if(!ignore) {
      ret.build();
      ret.postBuild();

      ret.controlsCell = row.appendChild(this.theme.getTableCell());
      ret.row = row;
      ret.tableControls = this.theme.getButtonHolder();
      ret.controlsCell.appendChild(ret.tableControls);
      ret.tableControls.style.margin = 0;
      ret.tableControls.style.padding = 0;
    }
    
    return ret;
  },
  destroy: function() {
    this.innerHTML = '';
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.description && this.description.parentNode) { this.description.parentNode.removeChild(this.description); }
     if(this.rowHolder && this.rowHolder.parentNode) { this.rowHolder.parentNode.removeChild(this.rowHolder); }
     if(this.table && this.table.parentNode) { this.table.parentNode.removeChild(this.table); }
     if(this.panel && this.panel.parentNode) { this.panel.parentNode.removeChild(this.panel); }

    this.rows = this.title = this.description = this.rowHolder = this.table = this.panel = null;

    this._super();
  },
  setValue: function(value, initial) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemDefault());
      }
    }
    if(this.schema.maxItems && value.length > this.schema.maxItems) {
      value = value.slice(0,this.schema.maxItems);
    }
    
    var serialized = JSON.stringify(value);
     if(serialized === this.serialized) { return; }

    var numrowsChanged = false;

    var self = this;
    $each(value,function(i,val) {
      if(self.rows[i]) {
        // TODO: don't set the row's value if it hasn't changed
        self.rows[i].setValue(val);
      }
      else {
        self.addRow(val);
        numrowsChanged = true;
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      var holder = self.rows[j].container;
      if(!self.itemHasChildEditors) {
        self.rows[j].row.parentNode.removeChild(self.rows[j].row);
      }
      self.rows[j].destroy();
       if(holder.parentNode) { holder.parentNode.removeChild(holder); }
      self.rows[j] = null;
      numrowsChanged = true;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();
     if(numrowsChanged || initial) { self.refreshRowButtons(); }

    self.onChange();
          
    // TODO: sortable
  },
  refreshRowButtons: function() {
    var self = this;
    
    // If we currently have minItems items in the array
    var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;
    
    var needRowButtons = false;
    $each(this.rows,function(i,editor) {
      // Hide the move down button for the last row
      if(editor.movedownButton) {
        if(i === self.rows.length - 1) {
          editor.movedownButton.style.display = 'none';
        }
        else {
          needRowButtons = true;
          editor.movedownButton.style.display = '';
        }
      }

      // Hide the delete button if we have minItems items
      if(editor.deleteButton) {
        if(minItems) {
          editor.deleteButton.style.display = 'none';
        }
        else {
          needRowButtons = true;
          editor.deleteButton.style.display = '';
        }
      }
      
      if(editor.moveupButton) {
        needRowButtons = true;
      }
    });
    
    // Show/hide controls column in table
    $each(this.rows,function(i,editor) {
      if(needRowButtons) {
        editor.controlsCell.style.display = '';
      }
      else {
        editor.controlsCell.style.display = 'none';
      }
    });
    if(needRowButtons) {
      this.controlsHeaderCell.style.display = '';
    }
    else {
      this.controlsHeaderCell.style.display = 'none';
    }
    
    var controlsNeeded = false;
  
    if(!this.value.length) {
      this.deleteLastRowButton.style.display = 'none';
      this.removeAllRowsButton.style.display = 'none';
      this.table.style.display = 'none';
    }
    else if(this.value.length === 1  || this.hideDeleteButtons) {
      this.table.style.display = '';
      this.removeAllRowsButton.style.display = 'none';

      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems || this.hideDeleteButtons) {
        this.deleteLastRowButton.style.display = 'none';
      }
      else {
        this.deleteLastRowButton.style.display = '';
        controlsNeeded = true;
      }
    }
    else {
      this.table.style.display = '';
      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems || this.hideDeleteButtons) {
        this.deleteLastRowButton.style.display = 'none';
        this.removeAllRowsButton.style.display = 'none';
      }
      else {
        this.deleteLastRowButton.style.display = '';
        this.removeAllRowsButton.style.display = '';
        controlsNeeded = true;
      }
    }

    // If there are maxItems in the array, hide the add button beneath the rows
    if((this.schema.maxItems && this.schema.maxItems <= this.rows.length) || this.hideAddButton) {
      this.addRowButton.style.display = 'none';
    }
    else {
      this.addRowButton.style.display = '';
      controlsNeeded = true;
    }
    
    if(!controlsNeeded) {
      this.controls.style.display = 'none';
    }
    else {
      this.controls.style.display = '';
    }
  },
  refreshValue: function() {
    var self = this;
    this.value = [];

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      self.value[i] = editor.getValue();
    });
    this.serialized = JSON.stringify(this.value);
  },
  addRow: function(value) {
    var self = this;
    var i = this.rows.length;

    self.rows[i] = this.getElementEditor(i);

    var controlsHolder = self.rows[i].tableControls;

    // Buttons to delete row, move row up, and move row down
    if(!this.hideDeleteButtons) {
      self.rows[i].deleteButton = this.getButton('','delete','Delete');
      self.rows[i].deleteButton.className += ' delete';
      self.rows[i].deleteButton.setAttribute('data-i',i);
      self.rows[i].deleteButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

        var value = self.getValue();

        var newval = [];
        $each(value,function(j,row) {
          if(j===i) { return; } // If this is the one we're deleting
          newval.push(row);
        });
        self.setValue(newval);
        self.onChange(true);
      });
      controlsHolder.appendChild(self.rows[i].deleteButton);
    }

    
    if(i && !this.hideMoveButtons) {
      self.rows[i].moveupButton = this.getButton('','moveup','Move up');
      self.rows[i].moveupButton.className += ' moveup';
      self.rows[i].moveupButton.setAttribute('data-i',i);
      self.rows[i].moveupButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

         if(i<=0) { return; }
        var rows = self.getValue();
        var tmp = rows[i-1];
        rows[i-1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.onChange(true);
      });
      controlsHolder.appendChild(self.rows[i].moveupButton);
    }
    
    if(!this.hideMoveButtons) {
      self.rows[i].movedownButton = this.getButton('','movedown','Move down');
      self.rows[i].movedownButton.className += ' movedown';
      self.rows[i].movedownButton.setAttribute('data-i',i);
      self.rows[i].movedownButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;
        var rows = self.getValue();
         if(i>=rows.length-1) { return; }
        var tmp = rows[i+1];
        rows[i+1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.onChange(true);
      });
      controlsHolder.appendChild(self.rows[i].movedownButton);
    }

     if(value) { self.rows[i].setValue(value); }
  },
  addControls: function() {
    var self = this;

    this.collapsed = false;
    this.toggleButton = this.getButton('','collapse','Collapse');
    if(this.titleControls) {
      this.titleControls.appendChild(this.toggleButton);
      this.toggleButton.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();

        if(self.collapsed) {
          self.collapsed = false;
          self.panel.style.display = '';
          self.setButtonText(this,'','collapse','Collapse');
        }
        else {
          self.collapsed = true;
          self.panel.style.display = 'none';
          self.setButtonText(this,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggleButton,'click');
      }

      // Collapse button disabled
      if(this.schema.options && typeof this.schema.options.disableCollapse !== 'undefined') {
         if(this.schema.options.disableCollapse) { this.toggleButton.style.display = 'none'; }
      }
      else if(this.jsoneditor.options.disableCollapse) {
        this.toggleButton.style.display = 'none';
      }
    }

    // Add 'new row' and 'delete last' buttons below editor
    this.addRowButton = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle());
    this.addRowButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      self.addRow();
      self.refreshValue();
      self.refreshRowButtons();
      self.onChange(true);
    });
    self.controls.appendChild(this.addRowButton);

    this.deleteLastRowButton = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle());
    this.deleteLastRowButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      var rows = self.getValue();
      rows.pop();
      self.setValue(rows);
      self.onChange(true);
    });
    self.controls.appendChild(this.deleteLastRowButton);

    this.removeAllRowsButton = this.getButton('All','delete','Delete All');
    this.removeAllRowsButton.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      self.setValue([]);
      self.onChange(true);
    });
    self.controls.appendChild(this.removeAllRowsButton);
  }
});

// Multiple Editor (for when `type` is an array)
JSONEditor.defaults.editors.multiple = JSONEditor.AbstractEditor.extend({
  register: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
         if(!this.editors[i]) { continue; }
        this.editors[i].unregister();
      }
       if(this.editors[this.type]) { this.editors[this.type].register(); }
    }
    this._super();
  },
  unregister: function() {
    this._super();
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
         if(!this.editors[i]) { continue; }
        this.editors[i].unregister();
      }
    }
  },
  getNumColumns: function() {
     if(!this.editors[this.type]) { return 4; }
    return Math.max(this.editors[this.type].getNumColumns(),4);
  },
  enable: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
         if(!this.editors[i]) { continue; }
        this.editors[i].enable();
      }
    }
    this.switcher.disabled = false;
    this._super();
  },
  disable: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
         if(!this.editors[i]) { continue; }
        this.editors[i].disable();
      }
    }
    this.switcher.disabled = true;
    this._super();
  },
  switchEditor: function(i) {
    var self = this;

    if(!this.editors[i]) {
      this.buildChildEditor(i);
    }

    self.type = i;

    self.register();

    var currentValue = self.getValue();

    $each(self.editors,function(type,editor) {
       if(!editor) { return; }
      if(self.type === type) {
         if(self.keepValues) { editor.setValue(currentValue,true); }
        editor.container.style.display = '';
      }
      else { editor.container.style.display = 'none'; }
    });
    self.refreshValue();
    self.refreshHeaderText();
  },
  buildChildEditor: function(i) {
    var self = this;
    var type = this.types[i];
    var holder = self.theme.getChildEditorHolder();
    self.editorHolder.appendChild(holder);

    var schema;

    if(typeof type === 'string') {
      schema = $extend({},self.schema);
      schema.type = type;
    }
    else {
      schema = $extend({},self.schema,type);
      schema = self.jsoneditor.expandRefs(schema);

      // If we need to merge `required` arrays
      if(type.required && Array.isArray(type.required) && self.schema.required && Array.isArray(self.schema.required)) {
        schema.required = self.schema.required.concat(type.required);
      }
    }

    var editor = self.jsoneditor.getEditorClass(schema);

    self.editors[i] = self.jsoneditor.createEditor(editor,{
      jsoneditor: self.jsoneditor,
      schema: schema,
      container: holder,
      path: self.path,
      parent: self,
      required: true
    });
    self.editors[i].preBuild();
    self.editors[i].build();
    self.editors[i].postBuild();

     if(self.editors[i].header) { self.editors[i].header.style.display = 'none'; }

    self.editors[i].option = self.switcherOptions[i];

    holder.addEventListener('changeHeaderText',function() {
      self.refreshHeaderText();
    });

     if(i !== self.type) { holder.style.display = 'none'; }
  },
  preBuild: function() {
    var self = this;

    this.types = [];
    this.type = 0;
    this.editors = [];
    this.validators = [];

    this.keepValues = true;
     if(typeof this.jsoneditor.options.keepOneofValues !== 'undefined') { this.keepValues = this.jsoneditor.options.keepOneofValues; }
     if(typeof this.options.keepOneofValues !== 'undefined') { this.keepValues = this.options.keepOneofValues; }

    if(this.schema.oneOf) {
      this.oneOf = true;
      this.types = this.schema.oneOf;
      $each(this.types,function(i,oneof) {
        //self.types[i] = self.jsoneditor.expandSchema(oneof);
      });
      delete this.schema.oneOf;
    }
    else {
      if(!this.schema.type || this.schema.type === 'any') {
        this.types = ['string','number','integer','boolean','object','array','null'];

        // If any of these primitive types are disallowed
        if(this.schema.disallow) {
          var disallow = this.schema.disallow;
          if(typeof disallow !== 'object' || !(Array.isArray(disallow))) {
            disallow = [disallow];
          }
          var allowedTypes = [];
          $each(this.types,function(i,type) {
             if(disallow.indexOf(type) === -1) { allowedTypes.push(type); }
          });
          this.types = allowedTypes;
        }
      }
      else if(Array.isArray(this.schema.type)) {
        this.types = this.schema.type;
      }
      else {
        this.types = [this.schema.type];
      }
      delete this.schema.type;
    }

    this.displayText = this.getDisplayText(this.types);
  },
  build: function() {
    var self = this;
    var container = this.container;

    this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    this.container.appendChild(this.header);

    this.switcher = this.theme.getSwitcher(this.displayText);
    container.appendChild(this.switcher);
    this.switcher.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      self.switchEditor(self.displayText.indexOf(this.value));
      self.onChange(true);
    });

    this.editorHolder = document.createElement('div');
    container.appendChild(this.editorHolder);

    this.switcherOptions = this.theme.getSwitcherOptions(this.switcher);
    $each(this.types,function(i,type) {
      self.editors[i] = false;

      var schema;

      if(typeof type === 'string') {
        schema = $extend({},self.schema);
        schema.type = type;
      }
      else {
        schema = $extend({},self.schema,type);

        // If we need to merge `required` arrays
        if(type.required && Array.isArray(type.required) && self.schema.required && Array.isArray(self.schema.required)) {
          schema.required = self.schema.required.concat(type.required);
        }
      }

      self.validators[i] = new JSONEditor.Validator(self.jsoneditor,schema);
    });

    this.switchEditor(0);
  },
  onChildEditorChange: function(editor) {
    if(this.editors[this.type]) {
      this.refreshValue();
      this.refreshHeaderText();
    }

    this._super();
  },
  refreshHeaderText: function() {
    var displayText = this.getDisplayText(this.types);
    $each(this.switcherOptions, function(i,option) {
      option.textContent = displayText[i];
    });
  },
  refreshValue: function() {
    this.value = this.editors[this.type].getValue();
  },
  setValue: function(val,initial) {
    // Determine type by getting the first one that validates
    var self = this;
    $each(this.validators, function(i,validator) {
      if(!validator.validate(val).length) {
        self.type = i;
        self.switcher.value = self.displayText[i];
        return false;
      }
    });

    this.switchEditor(this.type);

    this.editors[this.type].setValue(val,initial);

    this.refreshValue();
    self.onChange();
  },
  destroy: function() {
    $each(this.editors, function(type,editor) {
       if(editor) { editor.destroy(); }
    });
     if(this.editorHolder && this.editorHolder.parentNode) { this.editorHolder.parentNode.removeChild(this.editorHolder); }
     if(this.switcher && this.switcher.parentNode) { this.switcher.parentNode.removeChild(this.switcher); }
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;

    // oneOf error paths need to remove the oneOf[i] part before passing to child editors
    if(this.oneOf) {
      $each(this.editors,function(i,editor) {
         if(!editor) { return; }
        var check = self.path+'.oneOf['+i+']';
        var newErrors = [];
        $each(errors, function(j,error) {
          if(error.path.substr(0,check.length)===check) {
            var newError = $extend({},error);
            newError.path = self.path+newError.path.substr(check.length);
            newErrors.push(newError);
          }
        });

        editor.showValidationErrors(newErrors);
      });
    }
    else {
      $each(this.editors,function(type,editor) {
         if(!editor) { return; }
        editor.showValidationErrors(errors);
      });
    }
  }
});

// hyper-link describeBy Editor
JSONEditor.defaults.editors.describedBy = JSONEditor.AbstractEditor.extend({
  register: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
         if (!this.editors[i]) { continue; }
        this.editors[i].unregister();
      }

       if (this.editors[this.currentEditor]) { this.editors[this.currentEditor].register(); }
    }

    this._super();
  },
  unregister: function() {
    this._super();

    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
         if (!this.editors[i]) { continue; }
        this.editors[i].unregister();
      }
    }
  },
  getNumColumns: function() {
     if (!this.editors[this.currentEditor]) { return 4; }
    return Math.max(this.editors[this.currentEditor].getNumColumns(), 4);
  },
  enable: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
         if (!this.editors[i]) { continue; }
        this.editors[i].enable();
      }
    }

    this._super();
  },
  disable: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
         if (!this.editors[i]) { continue; }
        this.editors[i].disable();
      }
    }

    this._super();
  },
  switchEditor: function() {
    var self = this;
    var vars = this.getWatchedFieldValues();

     if (!vars) { return; }

    //var ref = this.template.fillFromObject(vars);
    var ref = this.template(vars);

    if (!this.editors[this.refs[ref]]) {
      this.buildChildEditor(ref);
    }

    this.currentEditor = this.refs[ref];

    this.register();

    $each(this.editors, function(ref, editor) {
       if (!editor) { return; }
      if (self.currentEditor === ref) {
        editor.container.style.display = '';
      } else {
        editor.container.style.display = 'none';
      }
    });

    this.refreshValue();
  },
  buildChildEditor: function(ref) {
    var self = this;
    var i = self.editors.length;
    self.refs[ref] = i;

    var holder = self.theme.getChildEditorHolder();
    self.editorHolder.appendChild(holder);

    var schema = $extend({}, self.schema, self.jsoneditor.refs[ref]);

    var editor = self.jsoneditor.getEditorClass(schema);

    self.editors[i] = self.jsoneditor.createEditor(editor, {
      jsoneditor: self.jsoneditor,
      schema: schema,
      container: holder,
      path: self.path,
      parent: self,
      required: true
    });

    self.editors[i].preBuild();
    self.editors[i].build();
    self.editors[i].postBuild();
  },
  preBuild: function() {
    var self = this;

    this.refs = {};
    this.editors = [];
    this.currentEditor = '';

    for (var i = 0; i < this.schema.links.length; i++) {
      if (this.schema.links[i].rel.toLowerCase() === 'describedby') {
        this.template = this.jsoneditor.compileTemplate(this.schema.links[i].href, this.templateEngine);
        break;
      }
    }

    this.schema.links.splice(0, 1);
     if (this.schema.links.length === 0) { delete this.schema.links; }
  },
  build: function() {
    this.editorHolder = document.createElement('div');
    this.container.appendChild(this.editorHolder);
    this.switchEditor();
  },
  onWatchedFieldChange: function() {
    this.switchEditor();
  },
  onChildEditorChange: function(editor) {
    if (this.editors[this.currentEditor]) {
      this.refreshValue();
    }

    this._super(editor);
  },
  refreshValue: function() {
    if (this.editors[this.currentEditor]) {
      this.value = this.editors[this.currentEditor].getValue();
    }
  },
  setValue: function(val, initial) {
    if (this.editors[this.currentEditor]) {
      this.editors[this.currentEditor].setValue(val, initial);
      this.refreshValue();
      this.onChange();
    }
  },
  destroy: function() {
    $each(this.editors, function(i, editor) {
       if (editor) { editor.destroy(); }
    });

    if (this.editorHolder && this.editorHolder.parentNode) {
      this.editorHolder.parentNode.removeChild(this.editorHolder);
    }

    this._super();
  },
  showValidationErrors: function(errors) {
    $each(this.editors, function(i, editor) {
       if (!editor) { return; }
      editor.showValidationErrors(errors);
    });
  }
});
// Enum Editor (used for objects and arrays with enumerated values)
JSONEditor.defaults.editors['enum'] = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {
    var container = this.container;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    this.container.appendChild(this.title);

    this.options.enumTitles = this.options.enumTitles || [];

    this['enum'] = this.schema['enum'];
    this.selected = 0;
    this.selectOptions = [];
    this.htmlValues = [];

    var self = this;
    for(var i=0; i<this['enum'].length; i++) {
      this.selectOptions[i] = this.options.enumTitles[i] || 'Value '+(i+1);
      this.htmlValues[i] = this.getHTML(this['enum'][i]);
    }

    // Switcher
    this.switcher = this.theme.getSwitcher(this.selectOptions);
    this.container.appendChild(this.switcher);

    // Display area
    this.displayArea = this.theme.getIndentedPanel();
    this.container.appendChild(this.displayArea);

     if(this.options.hideDisplay) { this.displayArea.style.display = 'none'; }

    this.switcher.addEventListener('change',function() {
      self.selected = self.selectOptions.indexOf(this.value);
      self.value = self['enum'][self.selected];
      self.refreshValue();
      self.onChange(true);
    });
    this.value = this['enum'][0];
    this.refreshValue();

     if(this['enum'].length === 1) { this.switcher.style.display = 'none'; }
  },
  refreshValue: function() {
    var self = this;
    self.selected = -1;
    var stringified = JSON.stringify(this.value);
    $each(this['enum'], function(i, el) {
      if(stringified === JSON.stringify(el)) {
        self.selected = i;
        return false;
      }
    });

    if(self.selected<0) {
      self.setValue(self['enum'][0]);
      return;
    }

    this.switcher.value = this.selectOptions[this.selected];
    this.displayArea.innerHTML = this.htmlValues[this.selected];
  },
  enable: function() {
     if(!this.alwaysDisabled) { this.switcher.disabled = false; }
    this._super();
  },
  disable: function() {
    this.switcher.disabled = true;
    this._super();
  },
  getHTML: function(el) {
    var self = this;

    if(el === null) {
      return '<em>null</em>';
    }
    // Array or Object
    else if(typeof el === 'object') {
      // TODO: use theme
      var ret = '';

      $each(el,function(i,child) {
        var html = self.getHTML(child);

        // Add the keys to object children
        if(!(Array.isArray(el))) {
          // TODO: use theme
          html = '<div><em>'+i+'</em>: '+html+'</div>';
        }

        // TODO: use theme
        ret += '<li>'+html+'</li>';
      });

       if(Array.isArray(el)) { ret = '<ol>'+ret+'</ol>'; }
      else { ret = "<ul style='margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0;'>"+ret+'</ul>'; }

      return ret;
    }
    // Boolean
    else if(typeof el === 'boolean') {
      return el? 'true' : 'false';
    }
    // String
    else if(typeof el === 'string') {
      return el.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    // Number
    else {
      return el;
    }
  },
  setValue: function(val) {
    if(this.value !== val) {
      this.value = val;
      this.refreshValue();
      this.onChange();
    }
  },
  destroy: function() {
     if(this.displayArea && this.displayArea.parentNode) { this.displayArea.parentNode.removeChild(this.displayArea); }
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.switcher && this.switcher.parentNode) { this.switcher.parentNode.removeChild(this.switcher); }

    this._super();
  }
});

JSONEditor.defaults.editors.select = JSONEditor.AbstractEditor.extend({
  setValue: function(value,initial) {
    value = this.typecast(value||'');

    // Sanitize value before setting it
    var sanitized = value;
    if(this.enumValues.indexOf(sanitized) < 0) {
      sanitized = this.enumValues[0];
    }

    if(this.value === sanitized) {
      return;
    }

    this.input.value = this.enumOptions[this.enumValues.indexOf(sanitized)];
     if(this.select2) { this.select2.select2('val',this.input.value); }
    this.value = sanitized;
    this.onChange();
  },
  register: function() {
    this._super();
     if(!this.input) { return; }
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
     if(!this.input) { return; }
    this.input.removeAttribute('name');
  },
  getNumColumns: function() {
     if(!this.enumOptions) { return 3; }
    var longestText = this.getTitle().length;
    for(var i=0; i<this.enumOptions.length; i++) {
      longestText = Math.max(longestText,this.enumOptions[i].length+4);
    }
    return Math.min(12,Math.max(longestText/7,2));
  },
  typecast: function(value) {
    if(this.schema.type === 'boolean') {
      return !!value;
    }
    else if(this.schema.type === 'number') {
      return 1*value;
    }
    else if(this.schema.type === 'integer') {
      return Math.floor(value*1);
    }
    else {
      return ''+value;
    }
  },
  getValue: function() {
    return this.value;
  },
  preBuild: function() {
    var self = this;
    this.inputType = 'select';
    this.enumOptions = [];
    this.enumValues = [];
    this.enumDisplay = [];

    // Enum options enumerated
    if(this.schema['enum']) {
      var display = this.schema.options && this.schema.options.enumTitles || [];
      
      $each(this.schema['enum'],function(i,option) {
        self.enumOptions[i] = ''+option;
        self.enumDisplay[i] = ''+(display[i] || option);
        self.enumValues[i] = self.typecast(option);
      });

      if(!this.isRequired()){
        self.enumDisplay.unshift(' ');
        self.enumOptions.unshift('undefined');
        self.enumValues.unshift(undefined);
      }
            
    }
    // Boolean
    else if(this.schema.type === 'boolean') {
      self.enumDisplay = this.schema.options && this.schema.options.enumTitles || ['true','false'];
      self.enumOptions = ['1',''];
      self.enumValues = [true,false];
      
      if(!this.isRequired()){
        self.enumDisplay.unshift(' ');
        self.enumOptions.unshift('undefined');
        self.enumValues.unshift(undefined);
      }
    
    }
    // Dynamic Enum
    else if(this.schema.enumSource) {
      this.enumSource = [];
      this.enumDisplay = [];
      this.enumOptions = [];
      this.enumValues = [];
      
      // Shortcut declaration for using a single array
      if(!(Array.isArray(this.schema.enumSource))) {
        if(this.schema.enumValue) {
          this.enumSource = [
            {
              source: this.schema.enumSource,
              value: this.schema.enumValue
            }
          ];
        }
        else {
          this.enumSource = [
            {
              source: this.schema.enumSource
            }
          ];
        }
      }
      else {
        for(i=0; i<this.schema.enumSource.length; i++) {
          // Shorthand for watched variable
          if(typeof this.schema.enumSource[i] === 'string') {
            this.enumSource[i] = {
              source: this.schema.enumSource[i]
            };
          }
          // Make a copy of the schema
          else if(!(Array.isArray(this.schema.enumSource[i]))) {
            this.enumSource[i] = $extend({},this.schema.enumSource[i]);
          }
          else {
            this.enumSource[i] = this.schema.enumSource[i];
          }
        }
      }
      
      // Now, enumSource is an array of sources
      // Walk through this array and fix up the values
      for(i=0; i<this.enumSource.length; i++) {
        if(this.enumSource[i].value) {
          this.enumSource[i].value = this.jsoneditor.compileTemplate(this.enumSource[i].value, this.templateEngine);
        }
        if(this.enumSource[i].title) {
          this.enumSource[i].title = this.jsoneditor.compileTemplate(this.enumSource[i].title, this.templateEngine);
        }
        if(this.enumSource[i].filter) {
          this.enumSource[i].filter = this.jsoneditor.compileTemplate(this.enumSource[i].filter, this.templateEngine);
        }
      }
    }
    // Other, not supported
    else {
      throw "'select' editor requires the enum property to be set.";
    }
  },
  build: function() {
    var self = this;
    if(!this.options.compact) { this.header = this.label = this.theme.getFormInputLabel(this.getTitle()); }
     if(this.schema.description) { this.description = this.theme.getFormInputDescription(this.schema.description); }

     if(this.options.compact) { this.container.className += ' compact'; }

    this.input = this.theme.getSelectInput(this.enumOptions);
    this.theme.setSelectOptions(this.input,this.enumOptions,this.enumDisplay);

    if(this.schema.readOnly || this.schema.readonly) {
      this.alwaysDisabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.onInputChange();
    });

    this.control = this.theme.getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    this.value = this.enumValues[0];
  },
  onInputChange: function() {
    var val = this.input.value;

    var sanitized = val;
    if(this.enumOptions.indexOf(val) === -1) {
      sanitized = this.enumOptions[0];
    }

    this.value = this.enumValues[this.enumOptions.indexOf(val)];

    this.onChange(true);
  },
  setupSelect2: function() {
    // If the Select2 library is loaded use it when we have lots of items
    if(window.jQuery && window.jQuery.fn && window.jQuery.fn.select2 && (this.enumOptions.length > 2 || (this.enumOptions.length && this.enumSource))) {
      var options = $extend({},JSONEditor.plugins.select2);
       if(this.schema.options && this.schema.options.select2Options) { options = $extend(options,this.schema.options.select2Options); }
      this.select2 = window.jQuery(this.input).select2(options);
      var self = this;
      this.select2.on('select2-blur',function() {
        self.input.value = self.select2.select2('val');
        self.onInputChange();
      });
    }
    else {
      this.select2 = null;
    }
  },
  postBuild: function() {
    this._super();
    this.theme.afterInputReady(this.input);
    this.setupSelect2();
  },
  onWatchedFieldChange: function() {
    var self = this, vars, j;
    
    // If this editor uses a dynamic select box
    if(this.enumSource) {
      vars = this.getWatchedFieldValues();
      var selectOptions = [];
      var selectTitles = [];
      
      for(var i=0; i<this.enumSource.length; i++) {
        // Constant values
        if(Array.isArray(this.enumSource[i])) {
          selectOptions = selectOptions.concat(this.enumSource[i]);
          selectTitles = selectTitles.concat(this.enumSource[i]);
        }
        else {
          var items = [];
          // Static list of items
          if(Array.isArray(this.enumSource[i].source)) {
            items = this.enumSource[i].source;
          // A watched field
          } else {
            items = vars[this.enumSource[i].source];
          }
          
          if(items) {
            // Only use a predefined part of the array
            if(this.enumSource[i].slice) {
              items = Array.prototype.slice.apply(items,this.enumSource[i].slice);
            }
            // Filter the items
            if(this.enumSource[i].filter) {
              var newItems = [];
              for(j=0; j<items.length; j++) {
                 if(this.enumSource[i].filter({i:j,item:items[j],watched:vars})) { newItems.push(items[j]); }
              }
              items = newItems;
            }
            
            var itemTitles = [];
            var itemValues = [];
            for(j=0; j<items.length; j++) {
              var item = items[j];
              
              // Rendered value
              if(this.enumSource[i].value) {
                itemValues[j] = this.enumSource[i].value({
                  i: j,
                  item: item
                });
              }
              // Use value directly
              else {
                itemValues[j] = items[j];
              }
              
              // Rendered title
              if(this.enumSource[i].title) {
                itemTitles[j] = this.enumSource[i].title({
                  i: j,
                  item: item
                });
              }
              // Use value as the title also
              else {
                itemTitles[j] = itemValues[j];
              }
            }
            
            // TODO: sort
            
            selectOptions = selectOptions.concat(itemValues);
            selectTitles = selectTitles.concat(itemTitles);
          }
        }
      }
      
      var prevValue = this.value;
      
      this.theme.setSelectOptions(this.input, selectOptions, selectTitles);
      this.enumOptions = selectOptions;
      this.enumDisplay = selectTitles;
      this.enumValues = selectOptions;
      
      if(this.select2) {
        this.select2.select2('destroy');
      }
      
      // If the previous value is still in the new select options, stick with it
      if(selectOptions.indexOf(prevValue) !== -1) {
        this.input.value = prevValue;
        this.value = prevValue;
      }
      // Otherwise, set the value to the first select option
      else {
        this.input.value = selectOptions[0];
        this.value = selectOptions[0] || '';  
         if(this.parent) { this.parent.onChildEditorChange(this); }
        else { this.jsoneditor.onChange(); }
        this.jsoneditor.notifyWatchers(this.path);
      }
      
      this.setupSelect2();
    }

    this._super();
  },
  enable: function() {
    if(!this.alwaysDisabled) {
      this.input.disabled = false;
       if(this.select2) { this.select2.select2('enable',true); }
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
     if(this.select2) { this.select2.select2('enable',false); }
    this._super();
  },
  destroy: function() {
     if(this.label && this.label.parentNode) { this.label.parentNode.removeChild(this.label); }
     if(this.description && this.description.parentNode) { this.description.parentNode.removeChild(this.description); }
     if(this.input && this.input.parentNode) { this.input.parentNode.removeChild(this.input); }
    if(this.select2) {
      this.select2.select2('destroy');
      this.select2 = null;
    }

    this._super();
  }
});

JSONEditor.defaults.editors.multiselect = JSONEditor.AbstractEditor.extend({
  preBuild: function() {
    this._super();

    this.selectOptions = {};
    this.selectValues = {};

    var itemsSchema = this.jsoneditor.expandRefs(this.schema.items || {});

    var e = itemsSchema['enum'] || [];
    this.optionKeys = [];
    for(i=0; i<e.length; i++) {
      // If the sanitized value is different from the enum value, don't include it
       if(this.sanitize(e[i]) !== e[i]) { continue; }

      this.optionKeys.push(e[i]+'');
      this.selectValues[e[i]+''] = e[i];
    }
  },
  build: function() {
    var self = this, i;
    if(!this.options.compact) { this.header = this.label = this.theme.getFormInputLabel(this.getTitle()); }
     if(this.schema.description) { this.description = this.theme.getFormInputDescription(this.schema.description); }

    if((!this.schema.format && this.optionKeys.length < 8) || this.schema.format === 'checkbox') {
      this.inputType = 'checkboxes';

      this.inputs = {};
      this.controls = {};
      for(i=0; i<this.optionKeys.length; i++) {
        this.inputs[this.optionKeys[i]] = this.theme.getCheckbox();
        this.selectOptions[this.optionKeys[i]] = this.inputs[this.optionKeys[i]];
        var label = this.theme.getCheckboxLabel(this.optionKeys[i]);
        this.controls[this.optionKeys[i]] = this.theme.getFormControl(label, this.inputs[this.optionKeys[i]]);
      }

      this.control = this.theme.getMultiCheckboxHolder(this.controls,this.label,this.description);
    }
    else {
      this.inputType = 'select';
      this.input = this.theme.getSelectInput(this.optionKeys);
      this.input.multiple = true;
      this.input.size = Math.min(10,this.optionKeys.length);

      for(i=0; i<this.optionKeys.length; i++) {
        this.selectOptions[this.optionKeys[i]] = this.input.children[i];
      }

      if(this.schema.readOnly || this.schema.readonly) {
        this.alwaysDisabled = true;
        this.input.disabled = true;
      }

      this.control = this.theme.getFormControl(this.label, this.input, this.description);
    }

    this.container.appendChild(this.control);
    this.control.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      var newValue = [];
      for(i = 0; i<self.optionKeys.length; i++) {
         if(self.selectOptions[self.optionKeys[i]].selected || self.selectOptions[self.optionKeys[i]].checked) { newValue.push(self.selectValues[self.optionKeys[i]]); }
      }

      self.updateValue(newValue);
      self.onChange(true);
    });
  },
  setValue: function(value, initial) {
    var i;
    value = value || [];
     if(typeof value !== 'object') { value = [value]; }
    else if(!(Array.isArray(value))) { value = []; }

    // Make sure we are dealing with an array of strings so we can check for strict equality
    for(i=0; i<value.length; i++) {
       if(typeof value[i] !== 'string') { value[i] += ''; }
    }

    // Update selected status of options
    for(i in this.selectOptions) {
       if(!this.selectOptions.hasOwnProperty(i)) { continue; }

      this.selectOptions[i][this.inputType === 'select'? 'selected' : 'checked'] = (value.indexOf(i) !== -1);
    }

    this.updateValue(value);
    this.onChange();
  },
  setupSelect2: function() {
    if(window.jQuery && window.jQuery.fn && window.jQuery.fn.select2) {
        var options = window.jQuery.extend({},JSONEditor.plugins.select2);
         if(this.schema.options && this.schema.options.select2Options) { options = $extend(options,this.schema.options.select2Options); }
        this.select2 = window.jQuery(this.input).select2(options);
        var self = this;
        this.select2.on('select2-blur',function() {
            var val =self.select2.select2('val');
            self.value = val;
            self.onChange(true);
        });
    }
    else {
        this.select2 = null;
    }
  },
  onInputChange: function() {
      this.value = this.input.value;
      this.onChange(true);
  },
  postBuild: function() {
      this._super();
      this.setupSelect2();
  },
  register: function() {
    this._super();
     if(!this.input) { return; }
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
     if(!this.input) { return; }
    this.input.removeAttribute('name');
  },
  getNumColumns: function() {
    var longestText = this.getTitle().length;
    for(var i in this.selectValues) {
       if(!this.selectValues.hasOwnProperty(i)) { continue; }
      longestText = Math.max(longestText,(this.selectValues[i]+'').length+4);
    }

    return Math.min(12,Math.max(longestText/7,2));
  },
  updateValue: function(value) {
    var changed = false;
    var newValue = [];
    for(var i=0; i<value.length; i++) {
      if(!this.selectOptions[value[i]+'']) {
        changed = true;
        continue;
      }
      var sanitized = this.sanitize(this.selectValues[value[i]]);
      newValue.push(sanitized);
       if(sanitized !== value[i]) { changed = true; }
    }
    this.value = newValue;
     if(this.select2) { this.select2.select2('val',this.value); }
    return changed;
  },
  sanitize: function(value) {
    if(this.schema.items.type === 'number') {
      return 1*value;
    }
    else if(this.schema.items.type === 'integer') {
      return Math.floor(value*1);
    }
    else {
      return ''+value;
    }
  },
  enable: function() {
    if(!this.alwaysDisabled) {
      if(this.input) {
        this.input.disabled = false;
      }
      else if(this.inputs) {
        for(var i in this.inputs) {
           if(!this.inputs.hasOwnProperty(i)) { continue; }
          this.inputs[i].disabled = false;
        }
      }
       if(this.select2) { this.select2.select2('enable',true); }
    }
    this._super();
  },
  disable: function() {
    if(this.input) {
      this.input.disabled = true;
    }
    else if(this.inputs) {
      for(var i in this.inputs) {
         if(!this.inputs.hasOwnProperty(i)) { continue; }
        this.inputs[i].disabled = true;
      }
    }
     if(this.select2) { this.select2.select2('enable',false); }
    this._super();
  },
  destroy: function() {
    if(this.select2) {
        this.select2.select2('destroy');
        this.select2 = null;
    }
    this._super();
  }
});

JSONEditor.defaults.editors.base64 = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {
    var self = this;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());

    // Input that holds the base64 string
    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);
    
    // Don't show uploader if this is readonly
    if(!this.schema.readOnly && !this.schema.readonly) {
       if(!window.FileReader) { throw 'FileReader required for base64 editor'; }
      
      // File uploader
      this.uploader = this.theme.getFormInputField('file');
      
      this.uploader.addEventListener('change',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if(this.files && this.files.length) {
          var fr = new FileReader();
          fr.onload = function(evt) {
            self.value = evt.target.result;
            self.refreshPreview();
            self.onChange(true);
            fr = null;
          };
          fr.readAsDataURL(this.files[0]);
        }
      });
    }

    this.preview = this.theme.getFormInputDescription(this.schema.description);
    this.container.appendChild(this.preview);

    this.control = this.theme.getFormControl(this.label, this.uploader||this.input, this.preview);
    this.container.appendChild(this.control);
  },
  refreshPreview: function() {
     if(this.lastPreview === this.value) { return; }
    this.lastPreview = this.value;
    
    this.preview.innerHTML = '';
    
     if(!this.value) { return; }
    
    var mime = this.value.match(/^data:([^;,]+)[;,]/);
     if(mime) { mime = mime[1]; }
    
    if(!mime) {
      this.preview.innerHTML = '<em>Invalid data URI</em>';
    }
    else {
      this.preview.innerHTML = '<strong>Type:</strong> '+mime+', <strong>Size:</strong> '+Math.floor((this.value.length-this.value.split(',')[0].length-1)/1.33333)+' bytes';
      if(mime.substr(0,5)==='image') {
        this.preview.innerHTML += '<br>';
        var img = document.createElement('img');
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100px';
        img.src = this.value;
        this.preview.appendChild(img);
      }
    }
  },
  enable: function() {
     if(this.uploader) { this.uploader.disabled = false; }
    this._super();
  },
  disable: function() {
     if(this.uploader) { this.uploader.disabled = true; }
    this._super();
  },
  setValue: function(val) {
    if(this.value !== val) {
      this.value = val;
      this.input.value = this.value;
      this.refreshPreview();
      this.onChange();
    }
  },
  destroy: function() {
     if(this.preview && this.preview.parentNode) { this.preview.parentNode.removeChild(this.preview); }
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.input && this.input.parentNode) { this.input.parentNode.removeChild(this.input); }
     if(this.uploader && this.uploader.parentNode) { this.uploader.parentNode.removeChild(this.uploader); }

    this._super();
  }
});

JSONEditor.defaults.editors.upload = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {
    var self = this;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());

    // Input that holds the base64 string
    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);
    
    // Don't show uploader if this is readonly
    if(!this.schema.readOnly && !this.schema.readonly) {

       if(!this.jsoneditor.options.upload) { throw 'Upload handler required for upload editor'; }

      // File uploader
      this.uploader = this.theme.getFormInputField('file');
      
      this.uploader.addEventListener('change',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if(this.files && this.files.length) {
          var fr = new FileReader();
          fr.onload = function(evt) {
            self.previewValue = evt.target.result;
            self.refreshPreview();
            self.onChange(true);
            fr = null;
          };
          fr.readAsDataURL(this.files[0]);
        }
      });
    }

    var description = this.schema.description;
     if (!description) { description = ''; }

    this.preview = this.theme.getFormInputDescription(description);
    this.container.appendChild(this.preview);

    this.control = this.theme.getFormControl(this.label, this.uploader||this.input, this.preview);
    this.container.appendChild(this.control);
  },
  refreshPreview: function() {
     if(this.lastPreview === this.previewValue) { return; }
    this.lastPreview = this.previewValue;

    this.preview.innerHTML = '';
    
     if(!this.previewValue) { return; }

    var self = this;

    var mime = this.previewValue.match(/^data:([^;,]+)[;,]/);
     if(mime) { mime = mime[1]; }
     if(!mime) { mime = 'unknown'; }

    var file = this.uploader.files[0];

    this.preview.innerHTML = '<strong>Type:</strong> '+mime+', <strong>Size:</strong> '+file.size+' bytes';
    if(mime.substr(0,5)==='image') {
      this.preview.innerHTML += '<br>';
      var img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100px';
      img.src = this.previewValue;
      this.preview.appendChild(img);
    }

    this.preview.innerHTML += '<br>';
    var uploadButton = this.getButton('Upload', 'upload', 'Upload');
    this.preview.appendChild(uploadButton);
    uploadButton.addEventListener('click',function(event) {
      event.preventDefault();

      uploadButton.setAttribute('disabled', 'disabled');
      self.theme.removeInputError(self.uploader);

      if (self.theme.getProgressBar) {
        self.progressBar = self.theme.getProgressBar();
        self.preview.appendChild(self.progressBar);
      }

      self.jsoneditor.options.upload(self.path, file, {
        success: function(url) {
          self.setValue(url);

           if(self.parent) { self.parent.onChildEditorChange(self); }
          else { self.jsoneditor.onChange(); }

           if (self.progressBar) { self.preview.removeChild(self.progressBar); }
          uploadButton.removeAttribute('disabled');
        },
        failure: function(error) {
          self.theme.addInputError(self.uploader, error);
           if (self.progressBar) { self.preview.removeChild(self.progressBar); }
          uploadButton.removeAttribute('disabled');
        },
        updateProgress: function(progress) {
          if (self.progressBar) {
             if (progress) { self.theme.updateProgressBar(self.progressBar, progress); }
            else { self.theme.updateProgressBarUnknown(self.progressBar); }
          }
        }
      });
    });
  },
  enable: function() {
     if(this.uploader) { this.uploader.disabled = false; }
    this._super();
  },
  disable: function() {
     if(this.uploader) { this.uploader.disabled = true; }
    this._super();
  },
  setValue: function(val) {
    if(this.value !== val) {
      this.value = val;
      this.input.value = this.value;
      this.onChange();
    }
  },
  destroy: function() {
     if(this.preview && this.preview.parentNode) { this.preview.parentNode.removeChild(this.preview); }
     if(this.title && this.title.parentNode) { this.title.parentNode.removeChild(this.title); }
     if(this.input && this.input.parentNode) { this.input.parentNode.removeChild(this.input); }
     if(this.uploader && this.uploader.parentNode) { this.uploader.parentNode.removeChild(this.uploader); }

    this._super();
  }
});

JSONEditor.defaults.editors.checkbox = JSONEditor.AbstractEditor.extend({
  setValue: function(value,initial) {
    this.value = !!value;
    this.input.checked = this.value;
    this.onChange();
  },
  register: function() {
    this._super();
     if(!this.input) { return; }
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
     if(!this.input) { return; }
    this.input.removeAttribute('name');
  },
  getNumColumns: function() {
    return Math.min(12,Math.max(this.getTitle().length/7,2));
  },
  build: function() {
    var self = this;
    if(!this.options.compact) {
      this.label = this.header = this.theme.getCheckboxLabel(this.getTitle());
    }
     if(this.schema.description) { this.description = this.theme.getFormInputDescription(this.schema.description); }
     if(this.options.compact) { this.container.className += ' compact'; }

    this.input = this.theme.getCheckbox();
    this.control = this.theme.getFormControl(this.label, this.input, this.description);

    if(this.schema.readOnly || this.schema.readonly) {
      this.alwaysDisabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.value = this.checked;
      self.onChange(true);
    });

    this.container.appendChild(this.control);
  },
  enable: function() {
    if(!this.alwaysDisabled) {
      this.input.disabled = false;
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  destroy: function() {
     if(this.label && this.label.parentNode) { this.label.parentNode.removeChild(this.label); }
     if(this.description && this.description.parentNode) { this.description.parentNode.removeChild(this.description); }
     if(this.input && this.input.parentNode) { this.input.parentNode.removeChild(this.input); }
    this._super();
  }
});

var matchKey = (function () {
  var elem = document.documentElement;

   if (elem.matches) { return 'matches'; }
  else if (elem.webkitMatchesSelector) { return 'webkitMatchesSelector'; }
  else if (elem.mozMatchesSelector) { return 'mozMatchesSelector'; }
  else if (elem.msMatchesSelector) { return 'msMatchesSelector'; }
  else if (elem.oMatchesSelector) { return 'oMatchesSelector'; }
})();

JSONEditor.AbstractTheme = Class.extend({
  getContainer: function() {
    return document.createElement('div');
  },
  getFloatRightLinkHolder: function() {
    var el = document.createElement('div');
    el.style = el.style || {};
    el.style.cssFloat = 'right';
    el.style.marginLeft = '10px';
    return el;
  },
  getModal: function() {
    var el = document.createElement('div');
    el.style.backgroundColor = 'white';
    el.style.border = '1px solid black';
    el.style.boxShadow = '3px 3px black';
    el.style.position = 'absolute';
    el.style.zIndex = '10';
    el.style.display = 'none';
    return el;
  },
  getGridContainer: function() {
    var el = document.createElement('div');
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.className = 'row';
    return el;
  },
  getGridColumn: function() {
    var el = document.createElement('div');
    return el;
  },
  setGridColumnSize: function(el,size) {

  },
  getLink: function(text) {
    var el = document.createElement('a');
    el.setAttribute('href','#');
    el.appendChild(document.createTextNode(text));
    return el;
  },
  disableHeader: function(header) {
    header.style.color = '#ccc';
  },
  disableLabel: function(label) {
    label.style.color = '#ccc';
  },
  enableHeader: function(header) {
    header.style.color = '';
  },
  enableLabel: function(label) {
    label.style.color = '';
  },
  getFormInputLabel: function(text) {
    var el = document.createElement('label');
    el.appendChild(document.createTextNode(text));
    return el;
  },
  getCheckboxLabel: function(text) {
    var el = this.getFormInputLabel(text);
    el.style.fontWeight = 'normal';
    return el;
  },
  getHeader: function(text) {
    var el = document.createElement('h3');
    if(typeof text === 'string') {
      el.textContent = text;
    }
    else {
      el.appendChild(text);
    }

    return el;
  },
  getCheckbox: function() {
    var el = this.getFormInputField('checkbox');
    el.style.display = 'inline-block';
    el.style.width = 'auto';
    return el;
  },
  getMultiCheckboxHolder: function(controls,label,description) {
    var el = document.createElement('div');

    if(label) {
      label.style.display = 'block';
      el.appendChild(label);
    }

    for(var i in controls) {
       if(!controls.hasOwnProperty(i)) { continue; }
      controls[i].style.display = 'inline-block';
      controls[i].style.marginRight = '20px';
      el.appendChild(controls[i]);
    }

     if(description) { el.appendChild(description); }

    return el;
  },
  getSelectInput: function(options) {
    var select = document.createElement('select');
     if(options) { this.setSelectOptions(select, options); }
    return select;
  },
  getSwitcher: function(options) {
    var switcher = this.getSelectInput(options);
    switcher.style.backgroundColor = 'transparent';
    switcher.style.display = 'inline-block';
    switcher.style.fontStyle = 'italic';
    switcher.style.fontWeight = 'normal';
    switcher.style.height = 'auto';
    switcher.style.marginBottom = 0;
    switcher.style.marginLeft = '5px';
    switcher.style.padding = '0 0 0 3px';
    switcher.style.width = 'auto';
    return switcher;
  },
  getSwitcherOptions: function(switcher) {
    return switcher.getElementsByTagName('option');
  },
  setSwitcherOptions: function(switcher, options, titles) {
    this.setSelectOptions(switcher, options, titles);
  },
  setSelectOptions: function(select, options, titles) {
    titles = titles || [];
    select.innerHTML = '';
    for(var i=0; i<options.length; i++) {
      var option = document.createElement('option');
      option.setAttribute('value',options[i]);
      option.textContent = titles[i] || options[i];
      select.appendChild(option);
    }
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.style = el.style || {};
    el.style.width = '100%';
    el.style.height = '300px';
    el.style.boxSizing = 'border-box';
    return el;
  },
  getRangeInput: function(min,max,step) {
    var el = this.getFormInputField('range');
    el.setAttribute('min',min);
    el.setAttribute('max',max);
    el.setAttribute('step',step);
    return el;
  },
  getFormInputField: function(type) {
    var el = document.createElement('input');
    el.setAttribute('type',type);
    return el;
  },
  afterInputReady: function(input) {

  },
  getFormControl: function(label, input, description) {
    var el = document.createElement('div');
    el.className = 'form-control';
     if(label) { el.appendChild(label); }
    if(input.type === 'checkbox') {
      label.insertBefore(input,label.firstChild);
    }
    else {
      el.appendChild(input);
    }

     if(description) { el.appendChild(description); }
    return el;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.style = el.style || {};
    el.style.paddingLeft = '10px';
    el.style.marginLeft = '10px';
    el.style.borderLeft = '1px solid #ccc';
    return el;
  },
  getChildEditorHolder: function() {
    return document.createElement('div');
  },
  getDescription: function(text) {
    var el = document.createElement('p');
    el.innerHTML = text;
    return el;
  },
  getCheckboxDescription: function(text) {
    return this.getDescription(text);
  },
  getFormInputDescription: function(text) {
    return this.getDescription(text);
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder();
  },
  getButtonHolder: function() {
    return document.createElement('div');
  },
  getButton: function(text, icon, title) {
    var el = document.createElement('button');
    el.type = 'button';
    this.setButtonText(el,text,icon,title);
    return el;
  },
  setButtonText: function(button, text, icon, title) {
    button.innerHTML = '';
    if(icon) {
      button.appendChild(icon);
      button.innerHTML += ' ';
    }
    button.appendChild(document.createTextNode(text));
     if(title) { button.setAttribute('title',title); }
  },
  getTable: function() {
    return document.createElement('table');
  },
  getTableRow: function() {
    return document.createElement('tr');
  },
  getTableHead: function() {
    return document.createElement('thead');
  },
  getTableBody: function() {
    return document.createElement('tbody');
  },
  getTableHeaderCell: function(text) {
    var el = document.createElement('th');
    el.textContent = text;
    return el;
  },
  getTableCell: function() {
    var el = document.createElement('td');
    return el;
  },
  getErrorMessage: function(text) {
    var el = document.createElement('p');
    el.style = el.style || {};
    el.style.color = 'red';
    el.appendChild(document.createTextNode(text));
    return el;
  },
  addInputError: function(input, text) {
  },
  removeInputError: function(input) {
  },
  addTableRowError: function(row) {
  },
  removeTableRowError: function(row) {
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div style='float: left; width: 130px;' class='tabs'></div><div class='content' style='margin-left: 130px;'></div><div style='clear:both;'></div>";
    return el;
  },
  applyStyles: function(el,styles) {
    el.style = el.style || {};
    for(var i in styles) {
       if(!styles.hasOwnProperty(i)) { continue; }
      el.style[i] = styles[i];
    }
  },
  closest: function(elem, selector) {
    while (elem && elem !== document) {
      if (matchKey) {
        if (elem[matchKey](selector)) {
          return elem;
        } else {
          elem = elem.parentNode;
        }
      }
      else {
        return false;
      }
    }
    return false;
  },
  getTab: function(span) {
    var el = document.createElement('div');
    el.appendChild(span);
    el.style = el.style || {};
    this.applyStyles(el,{
      border: '1px solid #ccc',
      borderWidth: '1px 0 1px 1px',
      textAlign: 'center',
      lineHeight: '30px',
      borderRadius: '5px',
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
      fontWeight: 'bold',
      cursor: 'pointer'
    });
    return el;
  },
  getTabContentHolder: function(tabHolder) {
    return tabHolder.children[1];
  },
  getTabContent: function() {
    return this.getIndentedPanel();
  },
  markTabActive: function(tab) {
    this.applyStyles(tab,{
      opacity: 1,
      background: 'white'
    });
  },
  markTabInactive: function(tab) {
    this.applyStyles(tab,{
      opacity:0.5,
      background: ''
    });
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  },
  getBlockLink: function() {
    var link = document.createElement('a');
    link.style.display = 'block';
    return link;
  },
  getBlockLinkHolder: function() {
    var el = document.createElement('div');
    return el;
  },
  getLinksHolder: function() {
    var el = document.createElement('div');
    return el;
  },
  createMediaLink: function(holder,link,media) {
    holder.appendChild(link);
    media.style.width='100%';
    holder.appendChild(media);
  },
  createImageLink: function(holder,link,image) {
    holder.appendChild(link);
    link.appendChild(image);
  }
});

JSONEditor.defaults.themes.bootstrap2 = JSONEditor.AbstractTheme.extend({
  getRangeInput: function(min, max, step) {
    // TODO: use bootstrap slider
    return this._super(min, max, step);
  },
  getGridContainer: function() {
    var el = document.createElement('div');
    el.className = 'container-fluid';
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.className = 'row-fluid';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'inline-block';
    el.style.fontWeight = 'bold';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'span'+size;
  },
  getSelectInput: function(options) {
    var input = this._super(options);
    input.style.width = 'auto';
    input.style.maxWidth = '98%';
    return input;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    el.style.width = '98%';
    return el;
  },
  afterInputReady: function(input) {
     if(input.controlgroup) { return; }
    input.controlgroup = this.closest(input,'.control-group');
    input.controls = this.closest(input,'.controls');
    if(this.closest(input,'.compact')) {
      input.controlgroup.className = input.controlgroup.className.replace(/control-group/g,'').replace(/[ ]{2,}/g,' ');
      input.controls.className = input.controlgroup.className.replace(/controls/g,'').replace(/[ ]{2,}/g,' ');
      input.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-small';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-inline';
    el.textContent = text;
    return el;
  },
  getFormControl: function(label, input, description) {
    var ret = document.createElement('div');
    ret.className = 'control-group';

    var controls = document.createElement('div');
    controls.className = 'controls';

    if(label && input.getAttribute('type') === 'checkbox') {
      ret.appendChild(controls);
      label.className += ' checkbox';
      label.appendChild(input);
      controls.appendChild(label);
      controls.style.height = '30px';
    }
    else {
      if(label) {
        label.className += ' control-label';
        ret.appendChild(label);
      }
      controls.appendChild(input);
      ret.appendChild(controls);
    }

     if(description) { controls.appendChild(description); }

    return ret;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el =  this._super(text, icon, title);
    el.className += ' btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },
  addInputError: function(input,text) {
     if(!input.controlgroup || !input.controls) { return; }
    input.controlgroup.className += ' error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
      input.controls.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
     if(!input.errmsg) { return; }
    input.errmsg.style.display = 'none';
    input.controlgroup.className = input.controlgroup.className.replace(/\s?error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'tabbable tabs-left';
    el.innerHTML = "<ul class='nav nav-tabs span2' style='margin-right: 0;'></ul><div class='tab-content span10' style='overflow:visible;'></div>";
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tabHolder) {
    return tabHolder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'tab-pane active';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  },
  getProgressBar: function() {
    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = '0%';
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
     if (!progressBar) { return; }

    progressBar.firstChild.style.width = progress + '%';
  },
  updateProgressBarUnknown: function(progressBar) {
     if (!progressBar) { return; }

    progressBar.className = 'progress progress-striped active';
    progressBar.firstChild.style.width = '100%';
  }
});

JSONEditor.defaults.themes.bootstrap3 = JSONEditor.AbstractTheme.extend({
  getSelectInput: function(options) {
    var el = this._super(options);
    el.className += 'form-control';
    //el.style.width = 'auto';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'col-md-'+size;
  },
  afterInputReady: function(input) {
     if(input.controlgroup) { return; }
    input.controlgroup = this.closest(input,'.form-group');
    if(this.closest(input,'.compact')) {
      input.controlgroup.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.className = 'form-control';
    return el;
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super(min, max, step);
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    if(type !== 'checkbox') {
      el.className += 'form-control';
    }
    return el;
  },
  getFormControl: function(label, input, description) {
    var group = document.createElement('div');

    if(label && input.type === 'checkbox') {
      group.className += ' checkbox';
      label.appendChild(input);
      label.style.fontSize = '14px';
      group.style.marginTop = '0';
      group.appendChild(label);
      input.style.position = 'relative';
      input.style.cssFloat = 'left';
    } 
    else {
      group.className += ' form-group';
      if(label) {
        label.className += ' control-label';
        group.appendChild(label);
      }
      group.appendChild(input);
    }

     if(description) { group.appendChild(description); }

    return group;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-sm';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-block';
    el.innerHTML = text;
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += 'btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },

  addInputError: function(input,text) {
     if(!input.controlgroup) { return; }
    input.controlgroup.className += ' has-error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
      input.controlgroup.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
     if(!input.errmsg) { return; }
    input.errmsg.style.display = 'none';
    input.controlgroup.className = input.controlgroup.className.replace(/\s?has-error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div class='tabs list-group col-md-2'></div><div class='col-md-10'></div>";
    el.className = 'rows';
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('a');
    el.className = 'list-group-item';
    el.setAttribute('href','#');
    el.appendChild(text);
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  getProgressBar: function() {
    var min = 0, max = 100, start = 0;

    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', start);
    bar.setAttribute('aria-valuemin', min);
    bar.setAttribute('aria-valuenax', max);
    bar.innerHTML = start + '%';
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
     if (!progressBar) { return; }

    var bar = progressBar.firstChild;
    var percentage = progress + '%';
    bar.setAttribute('aria-valuenow', progress);
    bar.style.width = percentage;
    bar.innerHTML = percentage;
  },
  updateProgressBarUnknown: function(progressBar) {
     if (!progressBar) { return; }

    var bar = progressBar.firstChild;
    progressBar.className = 'progress progress-striped active';
    bar.removeAttribute('aria-valuenow');
    bar.style.width = '100%';
    bar.innerHTML = '';
  }
});

// Base Foundation theme
JSONEditor.defaults.themes.foundation = JSONEditor.AbstractTheme.extend({
  getChildEditorHolder: function() {
    var el = document.createElement('div');
    el.style.marginBottom = '15px';
    return el;
  },
  getSelectInput: function(options) {
    var el = this._super(options);
    el.style.minWidth = 'none';
    el.style.padding = '5px';
    el.style.marginTop = '3px';
    return el;
  },
  getSwitcher: function(options) {
    var el = this._super(options);
    el.style.paddingRight = '8px';
    return el;
  },
  afterInputReady: function(input) {
    if(this.closest(input,'.compact')) {
      input.style.marginBottom = 0;
    }
    input.group = this.closest(input,'.form-control');
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'inline-block';
    return el;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    el.style.width = '100%';
    el.style.marginBottom = type==='checkbox'? '0' : '12px';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.textContent = text;
    el.style.marginTop = '-10px';
    el.style.fontStyle = 'italic';
    return el;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'panel';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.display = 'inline-block';
    el.style.marginLeft = '10px';
    el.style.verticalAlign = 'middle';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'button-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += ' small button';
    return el;
  },
  addInputError: function(input,text) {
     if(!input.group) { return; }
    input.group.className += ' error';
    
    if(!input.errmsg) {
      input.insertAdjacentHTML('afterend','<small class="error"></small>');
      input.errmsg = input.parentNode.getElementsByClassName('error')[0];
    }
    else {
      input.errmsg.style.display = '';
    }
    
    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
     if(!input.errmsg) { return; }
    input.group.className = input.group.className.replace(/ error/g,'');
    input.errmsg.style.display = 'none';
  },
  getProgressBar: function() {
    var progressBar = document.createElement('div');
    progressBar.className = 'progress';

    var meter = document.createElement('span');
    meter.className = 'meter';
    meter.style.width = '0%';
    progressBar.appendChild(meter);
    return progressBar;
  },
  updateProgressBar: function(progressBar, progress) {
     if (!progressBar) { return; }
    progressBar.firstChild.style.width = progress + '%';
  },
  updateProgressBarUnknown: function(progressBar) {
     if (!progressBar) { return; }
    progressBar.firstChild.style.width = '100%';
  }
});

// Foundation 3 Specific Theme
JSONEditor.defaults.themes.foundation3 = JSONEditor.defaults.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    var el = this._super();
    el.style.fontSize = '.6em';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.fontWeight = 'bold';
    return el;
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = "<dl class='tabs vertical two columns'></dl><div class='tabs-content ten columns'></div>";
    return el;
  },
  setGridColumnSize: function(el,size) {
    var sizes = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
    el.className = 'columns '+sizes[size];
  },
  getTab: function(text) {
    var el = document.createElement('dd');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tabHolder) {
    return tabHolder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'content active';
    el.style.paddingLeft = '5px';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  }
});

// Foundation 4 Specific Theme
JSONEditor.defaults.themes.foundation4 = JSONEditor.defaults.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    var el = this._super();
    el.style.fontSize = '.6em';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'columns large-'+size;
  },
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8rem';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.fontWeight = 'bold';
    return el;
  }
});

// Foundation 5 Specific Theme
JSONEditor.defaults.themes.foundation5 = JSONEditor.defaults.themes.foundation.extend({
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8rem';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'columns medium-'+size;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text,icon,title);
    el.className = el.className.replace(/\s*small/g,'') + ' tiny';
    return el;
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<dl class='tabs vertical'></dl><div class='tabs-content vertical'></div>";
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('dd');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tabHolder) {
    return tabHolder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'content active';
    el.style.paddingLeft = '5px';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  }
});

JSONEditor.defaults.themes.html = JSONEditor.AbstractTheme.extend({
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'block';
    el.style.marginBottom = '3px';
    el.style.fontWeight = 'bold';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8em';
    el.style.margin = 0;
    el.style.display = 'inline-block';
    el.style.fontStyle = 'italic';
    return el;
  },
  getIndentedPanel: function() {
    var el = this._super();
    el.style.border = '1px solid #ddd';
    el.style.padding = '5px';
    el.style.margin = '5px';
    el.style.borderRadius = '3px';
    return el;
  },
  getChildEditorHolder: function() {
    var el = this._super();
    el.style.marginBottom = '8px';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.display = 'inline-block';
    el.style.marginLeft = '10px';
    el.style.fontSize = '.8em';
    el.style.verticalAlign = 'middle';
    return el;
  },
  getTable: function() {
    var el = this._super();
    el.style.borderBottom = '1px solid #ccc';
    el.style.marginBottom = '5px';
    return el;
  },
  addInputError: function(input, text) {
    input.style.borderColor = 'red';
    
    if(!input.errmsg) {
      var group = this.closest(input,'.form-control');
      input.errmsg = document.createElement('div');
      input.errmsg.setAttribute('class','errmsg');
      input.errmsg.style = input.errmsg.style || {};
      input.errmsg.style.color = 'red';
      group.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = 'block';
    }
    
    input.errmsg.innerHTML = '';
    input.errmsg.appendChild(document.createTextNode(text));
  },
  removeInputError: function(input) {
    input.style.borderColor = '';
     if(input.errmsg) { input.errmsg.style.display = 'none'; }
  },
  getProgressBar: function() {
    var max = 100, start = 0;

    var progressBar = document.createElement('progress');
    progressBar.setAttribute('max', max);
    progressBar.setAttribute('value', start);
    return progressBar;
  },
  updateProgressBar: function(progressBar, progress) {
     if (!progressBar) { return; }
    progressBar.setAttribute('value', progress);
  },
  updateProgressBarUnknown: function(progressBar) {
     if (!progressBar) { return; }
    progressBar.removeAttribute('value');
  }
});

JSONEditor.defaults.themes.jqueryui = JSONEditor.AbstractTheme.extend({
  getTable: function() {
    var el = this._super();
    el.setAttribute('cellpadding',5);
    el.setAttribute('cellspacing',0);
    return el;
  },
  getTableHeaderCell: function(text) {
    var el = this._super(text);
    el.className = 'ui-state-active';
    el.style.fontWeight = 'bold';
    return el;
  },
  getTableCell: function() {
    var el = this._super();
    el.className = 'ui-widget-content';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    el.style.fontSize = '.6em';
    el.style.display = 'inline-block';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this.getDescription(text);
    el.style.marginLeft = '10px';
    el.style.display = 'inline-block';
    return el;
  },
  getFormControl: function(label, input, description) {
    var el = this._super(label,input,description);
    if(input.type === 'checkbox') {
      el.style.lineHeight = '25px';
      
      el.style.padding = '3px 0';
    }
    else {
      el.style.padding = '4px 0 8px 0';
    }
    return el;
  },
  getDescription: function(text) {
    var el = document.createElement('span');
    el.style.fontSize = '.8em';
    el.style.fontStyle = 'italic';
    el.textContent = text;
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'ui-buttonset';
    el.style.fontSize = '.7em';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = document.createElement('label');
    el.style.fontWeight = 'bold';
    el.style.display = 'block';
    el.textContent = text;
    return el;
  },
  getButton: function(text, icon, title) {
    var button = document.createElement('button');
    button.className = 'ui-button ui-widget ui-state-default ui-corner-all';

    // Icon only
    if(icon && !text) {
      button.className += ' ui-button-icon-only';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Icon and Text
    else if(icon) {
      button.className += ' ui-button-text-icon-primary';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Text only
    else {
      button.className += ' ui-button-text-only';
    }

    var el = document.createElement('span');
    el.className = 'ui-button-text';
    el.textContent = text||title||'.';
    button.appendChild(el);

    button.setAttribute('title',title);
    
    return button;
  },
  setButtonText: function(button,text, icon, title) {
    button.innerHTML = '';
    button.className = 'ui-button ui-widget ui-state-default ui-corner-all';

    // Icon only
    if(icon && !text) {
      button.className += ' ui-button-icon-only';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Icon and Text
    else if(icon) {
      button.className += ' ui-button-text-icon-primary';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Text only
    else {
      button.className += ' ui-button-text-only';
    }

    var el = document.createElement('span');
    el.className = 'ui-button-text';
    el.textContent = text||title||'.';
    button.appendChild(el);

    button.setAttribute('title',title);
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'ui-widget-content ui-corner-all';
    el.style.padding = '1em 1.4em';
    el.style.marginBottom = '20px';
    return el;
  },
  afterInputReady: function(input) {
     if(input.controls) { return; }
    input.controls = this.closest(input,'.form-control');
  },
  addInputError: function(input,text) {
     if(!input.controls) { return; }
    if(!input.errmsg) {
      input.errmsg = document.createElement('div');
      input.errmsg.className = 'ui-state-error';
      input.controls.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
     if(!input.errmsg) { return; }
    input.errmsg.style.display = 'none';
  },
  markTabActive: function(tab) {
    tab.className = tab.className.replace(/\s*ui-widget-header/g,'')+' ui-state-active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*ui-state-active/g,'')+' ui-widget-header';
  }
});

JSONEditor.AbstractIconLib = Class.extend({
  mapping: {
    collapse: '',
    expand: '',
    'delete': '',
    edit: '',
    add: '',
    cancel: '',
    save: '',
    moveup: '',
    movedown: ''
  },
  iconPrefix: '',
  getIconClass: function(key) {
     if(this.mapping[key]) { return this.iconPrefix+this.mapping[key]; }
    else { return null; }
  },
  getIcon: function(key) {
    var iconclass = this.getIconClass(key);
    
     if(!iconclass) { return null; }
    
    var i = document.createElement('i');
    i.className = iconclass;
    return i;
  }
});

JSONEditor.defaults.iconlibs.bootstrap2 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-up',
    'delete': 'trash',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'ok',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  iconPrefix: 'icon-'
});

JSONEditor.defaults.iconlibs.bootstrap3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    'delete': 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'floppy-remove',
    save: 'floppy-saved',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  iconPrefix: 'glyphicon glyphicon-'
});

JSONEditor.defaults.iconlibs.fontawesome3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    'delete': 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  iconPrefix: 'icon-'
});

JSONEditor.defaults.iconlibs.fontawesome4 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'caret-square-o-down',
    expand: 'caret-square-o-right',
    'delete': 'times',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  iconPrefix: 'fa fa-'
});

JSONEditor.defaults.iconlibs.foundation2 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    'delete': 'remove',
    edit: 'edit',
    add: 'add-doc',
    cancel: 'error',
    save: 'checkmark',
    moveup: 'up-arrow',
    movedown: 'down-arrow'
  },
  iconPrefix: 'foundicon-'
});

JSONEditor.defaults.iconlibs.foundation3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    'delete': 'x',
    edit: 'pencil',
    add: 'page-add',
    cancel: 'x-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  iconPrefix: 'fi-'
});

JSONEditor.defaults.iconlibs.jqueryui = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'triangle-1-s',
    expand: 'triangle-1-e',
    'delete': 'trash',
    edit: 'pencil',
    add: 'plusthick',
    cancel: 'closethick',
    save: 'disk',
    moveup: 'arrowthick-1-n',
    movedown: 'arrowthick-1-s'
  },
  iconPrefix: 'ui-icon ui-icon-'
});

JSONEditor.defaults.templates['default'] = function() {
  return {
    compile: function(template) {
      var matches = template.match(/{{\s*([a-zA-Z0-9\-_ \.]+)\s*}}/g);
      var l = matches && matches.length;

      // Shortcut if the template contains no variables
       if(!l) { return function() { return template; }; }

      // Pre-compute the search/replace functions
      // This drastically speeds up template execution
      var replacements = [];
      var getReplacement = function(i) {
        var p = matches[i].replace(/[{}]+/g,'').trim().split('.');
        var n = p.length;
        var func;
        
        if(n > 1) {
          var cur;
          func = function(vars) {
            cur = vars;
            for(i=0; i<n; i++) {
              cur = cur[p[i]];
               if(!cur) { break; }
            }
            return cur;
          };
        }
        else {
          p = p[0];
          func = function(vars) {
            return vars[p];
          };
        }
        
        replacements.push({
          s: matches[i],
          r: func
        });
      };
      for(var i=0; i<l; i++) {
        getReplacement(i);
      }

      // The compiled function
      return function(vars) {
        var ret = template+'';
        var r;
        for(i=0; i<l; i++) {
          r = replacements[i];
          ret = ret.replace(r.s, r.r(vars));
        }
        return ret;
      };
    }
  };
};

JSONEditor.defaults.templates.ejs = function() {
   if(!window.EJS) { return false; }

  return {
    compile: function(template) {
      var compiled = new window.EJS({
        text: template
      });

      return function(context) {
        return compiled.render(context);
      };
    }
  };
};

JSONEditor.defaults.templates.handlebars = function() {
  return window.Handlebars;
};

JSONEditor.defaults.templates.hogan = function() {
   if(!window.Hogan) { return false; }

  return {
    compile: function(template) {
      var compiled = window.Hogan.compile(template);
      return function(context) {
        return compiled.render(context);
      };
    }
  };
};

JSONEditor.defaults.templates.markup = function() {
   if(!window.Mark || !window.Mark.up) { return false; }

  return {
    compile: function(template) {
      return function(context) {
        return window.Mark.up(template,context);
      };
    }
  };
};

JSONEditor.defaults.templates.mustache = function() {
   if(!window.Mustache) { return false; }

  return {
    compile: function(template) {
      return function(view) {
        return window.Mustache.render(template, view);
      };
    }
  };
};

JSONEditor.defaults.templates.swig = function() {
  return window.swig;
};

JSONEditor.defaults.templates.underscore = function() {
   if(!window._) { return false; }

  return {
    compile: function(template) {
      return function(context) {
        return window._.template(template, context);
      };
    }
  };
};

// Set the default theme
JSONEditor.defaults.theme = 'html';

// Set the default template engine
JSONEditor.defaults.template = 'default';

// Default options when initializing JSON Editor
JSONEditor.defaults.options = {};

// String translate function
JSONEditor.defaults.translate = function(key, variables) {
  var lang = JSONEditor.defaults.languages[JSONEditor.defaults.language];
   if(!lang) { throw 'Unknown language '+JSONEditor.defaults.language; }
  
  var string = lang[key] || JSONEditor.defaults.languages[JSONEditor.defaults.defaultLanguage][key];
  
   if(typeof string === 'undefined') { throw 'Unknown translate string '+key; }
  
  if(variables) {
    for(var i=0; i<variables.length; i++) {
      string = string.replace(new RegExp('\\{\\{'+i+'}}','g'),variables[i]);
    }
  }
  
  return string;
};

// Translation strings and default languages
JSONEditor.defaults.defaultLanguage = 'en';
JSONEditor.defaults.language = JSONEditor.defaults.defaultLanguage;
JSONEditor.defaults.languages.en = {
  /**
   * When a property is not set
   */
  errorNotset: 'Property must be set',
  /**
   * When a string must not be empty
   */
  errorNotempty: 'Value required',
  /**
   * When a value is not one of the enumerated values
   */
  errorEnum: 'Value must be one of the enumerated values',
  /**
   * When a value doesn't validate any schema of a 'anyOf' combination
   */
  errorAnyOf: 'Value must validate against at least one of the provided schemas',
  /**
   * When a value doesn't validate
   * @variables This key takes one variable: The number of schemas the value does not validate
   */
  errorOneOf: 'Value must validate against exactly one of the provided schemas. It currently validates against {{0}} of the schemas.',
  /**
   * When a value does not validate a 'not' schema
   */
  errorNot: 'Value must not validate against the provided schema',
  /**
   * When a value does not match any of the provided types
   */
  errorTypeUnion: 'Value must be one of the provided types',
  /**
   * When a value does not match the given type
   * @variables This key takes one variable: The type the value should be of
   */
  errorType: 'Value must be of type {{0}}',
  /**
   *  When the value validates one of the disallowed types
   */
  errorDisallowUnion: 'Value must not be one of the provided disallowed types',
  /**
   *  When the value validates a disallowed type
   * @variables This key takes one variable: The type the value should not be of
   */
  errorDisallow: 'Value must not be of type {{0}}',
  /**
   * When a value is not a multiple of or divisible by a given number
   * @variables This key takes one variable: The number mentioned above
   */
  errorMultipleOf: 'Value must be a multiple of {{0}}',
  /**
   * When a value is greater than it's supposed to be (exclusive)
   * @variables This key takes one variable: The maximum
   */
  errorMaximumExcl: 'Value must be less than {{0}}',
  /**
   * When a value is greater than it's supposed to be (inclusive
   * @variables This key takes one variable: The maximum
   */
  errorMaximumIncl: 'Value must at most {{0}}',
  /**
   * When a value is lesser than it's supposed to be (exclusive)
   * @variables This key takes one variable: The minimum
   */
  errorMinimumExcl: 'Value must be greater than {{0}}',
  /**
   * When a value is lesser than it's supposed to be (inclusive)
   * @variables This key takes one variable: The minimum
   */
  errorMinimumIncl: 'Value must be at least {{0}}',
  /**
   * When a value have too many characters
   * @variables This key takes one variable: The maximum character count
   */
  errorMaxLength: 'Value must be at most {{0}} characters long',
  /**
   * When a value does not have enough characters
   * @variables This key takes one variable: The minimum character count
   */
  errorMinLength: 'Value must be at least {{0}} characters long',
  /**
   * When a value does not match a given pattern
   */
  errorPattern: 'Value must match the provided pattern',
  /**
   * When an array has additional items whereas it is not supposed to
   */
  errorAdditionalItems: 'No additional items allowed in this array',
  /**
   * When there are to many items in an array
   * @variables This key takes one variable: The maximum item count
   */
  errorMaxItems: 'Value must have at most {{0}} items',
  /**
   * When there are not enough items in an array
   * @variables This key takes one variable: The minimum item count
   */
  errorMinItems: 'Value must have at least {{0}} items',
  /**
   * When an array is supposed to have unique items but has duplicates
   */
  errorUniqueItems: 'Array must have unique items',
  /**
   * When there are too many properties in an object
   * @variables This key takes one variable: The maximum property count
   */
  errorMaxProperties: 'Object must have at most {{0}} properties',
  /**
   * When there are not enough properties in an object
   * @variables This key takes one variable: The minimum property count
   */
  errorMinProperties: 'Object must have at least {{0}} properties',
  /**
   * When a required property is not defined
   * @variables This key takes one variable: The name of the missing property
   */
  errorRequired: 'Object is missing the required property "{{0}}"',
  /**
   * When there is an additional property is set whereas there should be none
   * @variables This key takes one variable: The name of the additional property
   */
  errorAdditionalProperties: 'No additional properties allowed, but property {{0}} is set',
  /**
   * When a dependency is not resolved
   * @variables This key takes one variable: The name of the missing property for the dependency
   */
  errorDependency: 'Must have property {{0}}'
};

// Miscellaneous Plugin Settings
JSONEditor.plugins = {
  ace: {
    theme: ''
  },
  epiceditor: {

  },
  sceditor: {

  },
  select2: {
    
  }
};

// Default per-editor options
for(var i in JSONEditor.defaults.editors) {
   if(!JSONEditor.defaults.editors.hasOwnProperty(i)) { continue; }
  JSONEditor.defaults.editors[i].options = JSONEditor.defaults.editors.options || {};
}

// Set the default resolvers
// Use 'multiple' as a fall back for everything
JSONEditor.defaults.resolvers.unshift(function(schema) {
   if(typeof schema.type !== 'string') { return 'multiple'; }
});
// If the type is set and it's a basic type, use the primitive editor
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If the schema is a simple type
   if(typeof schema.type === 'string') { return schema.type; }
});
// Boolean editors
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.type === 'boolean') {
    // If explicitly set to 'checkbox', use that
    if(schema.format === 'checkbox' || (schema.options && schema.options.checkbox)) {
      return 'checkbox';
    }
    // Otherwise, default to select menu
    return 'select';
  }
});
// Use the multiple editor for schemas where the `type` is set to 'any'
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If the schema can be of any type
   if(schema.type === 'any') { return 'multiple'; }
});
// Editor for base64 encoded files
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If the schema can be of any type
  if(schema.type === 'string' && schema.media && schema.media.binaryEncoding==='base64') {
    return 'base64';
  }
});
// Editor for uploading files
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.type === 'string' && schema.format === 'url' && schema.options && schema.options.upload === true) {
     if(window.FileReader) { return 'upload'; }
  }
});
// Use the table editor for arrays with the format set to `table`
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // Type `array` with format set to `table`
  if(schema.type === 'array' && schema.format === 'table') {
    return 'table';
  }
});
// Use the `select` editor for dynamic enumSource enums
JSONEditor.defaults.resolvers.unshift(function(schema) {
   if(schema.enumSource) { return 'select'; }
});
// Use the `enum` or `select` editors for schemas with enumerated properties
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema['enum']) {
    if(schema.type === 'array' || schema.type === 'object') {
      return 'enum';
    }
    else if(schema.type === 'number' || schema.type === 'integer' || schema.type === 'string') {
      return 'select';
    }
  }
});
// Use the 'multiselect' editor for arrays of enumerated strings/numbers/integers
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.type === 'array' && schema.items && !(Array.isArray(schema.items)) && schema.uniqueItems && schema.items['enum'] && ['string','number','integer'].indexOf(schema.items.type) >= 0) {
    return 'multiselect';
  }
});
// Use the multiple editor for schemas with `oneOf` set
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If this schema uses `oneOf`
   if(schema.oneOf) { return 'multiple'; }
});

JSONEditor.defaults.resolvers.unshift(function(schema) {
  if (schema.links) {
    for (var i = 0; i < schema.links.length; i++) {
      if (schema.links[i].rel.toLowerCase() === 'describedby') {
        return 'describedBy';
      }
    }
  }
});

/**
 * This is a small wrapper for using JSON Editor like a typical jQuery plugin.
 */
(function() {
  if(window.jQuery || window.Zepto) {
    var $ = window.jQuery || window.Zepto;
    $.jsoneditor = JSONEditor.defaults;
    
    $.fn.jsoneditor = function(options) {
      var self = this;
      var editor = this.data('jsoneditor');
      if(options === 'value') {
         if(!editor) { throw 'Must initialize jsoneditor before getting/setting the value'; }
        
        // Set value
        if(arguments.length > 1) {
          editor.setValue(arguments[1]);
        }
        // Get value
        else {
          return editor.getValue();
        }
      }
      else if(options === 'validate') {
         if(!editor) { throw 'Must initialize jsoneditor before validating'; }
        
        // Validate a specific value
        if(arguments.length > 1) {
          return editor.validate(arguments[1]);
        }
        // Validate current value
        else {
          return editor.validate();
        }
      }
      else if(options === 'destroy') {
        if(editor) {
          editor.destroy();
          this.data('jsoneditor',null);
        }
      }
      else {
        // Destroy first
        if(editor) {
          editor.destroy();
        }
        
        // Create editor
        editor = new JSONEditor(this.get(0),options);
        this.data('jsoneditor',editor);
        
        // Setup event listeners
        editor.on('change',function() {
          self.trigger('change');
        });
        editor.on('ready',function() {
          self.trigger('ready');
        });
      }
      
      return this;
    };
  }
})();

  window.JSONEditor = JSONEditor;
})();

//# sourceMappingURL=jsoneditor.js.map
