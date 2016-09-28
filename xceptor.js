/**/ void function(scope) {
/**/ 
/**/   // CommonJS
/**/   if (typeof module === 'object' && !!module.exports) return scope(function(name, dependencies, factory) {
/**/     if(factory === void 0) factory = dependencies, dependencies = [];
/**/     var args;
/**/     args = [  ];
/**/     module.exports = factory.apply(module.exports, args) || module.exports;
/**/   });
/**/ 
/**/   // AMD, wrap a 'String' to avoid warn of fucking webpack
/**/   if (String(typeof define) === 'function' && !!define.amd) return scope(define);
/**/ 
/**/   // Global
/**/   scope(function(name, dependencies, factory) {
/**/     if(factory === void 0) factory = dependencies, dependencies = [];
/**/     /**/ try { /* Fuck IE8- */
/**/     /**/   if(typeof execScript === 'object') execScript('var ' + name);
/**/     /**/ } catch(error) {}
/**/     window[name] = {}; 
/**/     var args = [];
/**/     for(var i = 0; i < dependencies.length; i++) args[i] = window[dependencies[i]];
/**/     window[name] = factory.apply(window[name], args) || window[name];
/**/   });
/**/ 
/**/ }(function(define) {

/**/ define('XCeptor', function() { /**/

'use strict';

// Avoid duplicate runing
if(XMLHttpRequest.XCeptor) return XMLHttpRequest.XCeptor;

// Save original XMLHttpRequest class
var OriginalXMLHttpRequest = XMLHttpRequest;

// Handlers internal class
var Handlers = function() {};
// To use equivalence Checking
Handlers.check = function(what, value) {
  // Note, use a '==' here, match 'null' or 'undefined'
  if(what == null || what === value) return true;
  // Check 'test' method, match RegExp or RegExp-like
  if(typeof what.test === 'function') return what.test(value);
  if(typeof what === 'function') return what(value);
}
Handlers.prototype = [];
Handlers.prototype.solve = function(args, resolve, reject) {
  var handlers = this;
  // This is an asynchronous recursion to traverse handlers
  var iterator = function(cursor) {
    // This is an asynchronous recursion to resolve thenable resolve
    var fixResule = function(result) {
      switch(true) {
        case result === true: return resolve && resolve();
        case result === false: return reject && reject();
        // Resolve recursively thenable result
        case result && typeof result.then === 'function':
          return result.then(fixResule, function(error) { throw error; });
        default: iterator(cursor + 1);
      }
    };
    if(cursor < handlers.length) {
      fixResule(handlers[cursor].apply(null, args));
    } else {
      resolve && resolve();
    }
  };
  iterator(0);
};
Handlers.prototype.add = function(handler, method, route) {
  if(typeof handler !== 'function') return;
  this.push(function(request, response) {
    if(Handlers.check(method, request.method) && Handlers.check(route, request.url)) {
      return handler(request, response);
    }
  });
};

// Create two handlers objects
var requestHandlers = new Handlers();
var responseHandlers = new Handlers();

// To sync object keys with xhr
var updateKeys;
void function() {
  var keys = [
    'readyState',
    'timeout',
    'withCredentials',
    'status',
    'statusText',
    'responseURL',
    'responseType',
    'response',
    'responseText',
    'responseXML'
  ];
  updateKeys = function(from, to, filter) {
    for(var i = 0, key; key = keys[i]; i++) {
      if(filter && !filter.test(key)) continue;
      /**/ try { /* Fuck Android 4.3- and IE */
      /**/   void to[key], void from[key];
      /**/ } catch(error) {
      /**/   continue;
      /**/ }
      to[key] = from[key];
    }
  };
}();

// Event internal class
var Event = function(type, target) {
  this.type = type;
  this.target = target;
};

// SimpleEventModel internal decorator
var SimpleEventDecorator = function(Constructor) {
  var token = '__events__';
  var heap = function(object, name) {
    var events = token in object ? object[token] : object[token] = {};
    return name in events ? events[name] : events[name] = [];
  }
  var addEventListener = function(name, handler) {
    heap(this, name).push(handler);
  };
  var removeEventListener = function(name, handler) {
    var list = heap(this, name);
    for(var i = 0; i < list.length; i++) {
      if(list[i] === handler) list.splice(i, 1), i = 0 / 0;
    }
  };
  var dispatchEvent = function(event) {
    var list = heap(this, event.type);
    for(var i = 0; i < list.length; i++) list[i](event);
    var key = 'on' + event.type;
    if(typeof this[key] === 'function') this[key](event);
  };
  var SimpleEventModel = function() {
    Constructor.apply(this, arguments);
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.dispatchEvent = dispatchEvent;
  };
  SimpleEventModel.prototype = Constructor.prototype;
  return SimpleEventModel;
};

/* Main Process */

// Create interceptor
/**/ window. /* Fuck fucking wechat in android */
XMLHttpRequest = function() {
  var xhr = new OriginalXMLHttpRequest();
  var xceptor = this;
  updateKeys(xhr, xceptor);
  var request = {
    method: null,
    url: null,
    isAsync: true,
    username: void 0,
    password: void 0,
    headers: [],
    overridedMimeType: void 0,
    timeout: xceptor.timeout,
    withCredentials: xceptor.withCredentials,
    responseType: ''
  };
  var response = {
    status: xceptor.status,
    statusText: xceptor.statusText,
    headers: []
  };
  // Methods mapping
  xceptor.open = function(method, url, isAsync, username, password) {
    // Save to 'request'
    request.method = (method + '').toUpperCase();
    request.url = url + '';
    if(isAsync !== void 0) request.isAsync = !!(isAsync * 1);
    if(username !== void 0) request.username = username + '';
    if(password !== void 0) request.password = password + '';
  };
  xceptor.setRequestHeader = function(header, value) {
    // Save to 'headers'
    request.headers.push({ header: header + '', value: value + '' });
  };
  xceptor.overrideMimeType = function(mimetype) {
    // Save to 'request'
    request.overridedMimeType = mimetype;
  };
  xceptor.getResponseHeader = function(header) {
    // Read from 'response'
    var headers = response.headers;
    header = String(header).toLowerCase();
    for(var i = 0; i < headers.length; i++) {
      if(headers[i].header.toLowerCase() === header) return headers[i].value;
    }
    return null;
  };
  xceptor.getAllResponseHeaders = function() {
    // Read from 'response'
    var headers = response.headers;
    var allHeaders = [];
    for(var i = 0; i < response.headers.length; i++) {
      allHeaders.push(headers[i].header + ': ' + headers[i].value);
    }
    return allHeaders.join('\r\n');
  };
  xceptor.send = function(data) {
    // Copy setter properties to 'request'
    request.data = data;
    request.withCredentials = xceptor.withCredentials;
    request.timeout = xceptor.timeout;
    request.responseType = xceptor.responseType;
    // Invoke interceptor
    requestHandlers.solve([request, response], function() {
      // Actual actions
      xhr.open(request.method, request.url, request.isAsync, request.username, request.password);
      for(var i = 0; i < request.headers.length; i++) {
        xhr.setRequestHeader(request.headers[i].header, request.headers[i].value);
      }
      if(request.overridedMimeType !== void 0) xhr.overrideMimeType(request.overridedMimeType);
      // Assigning before changes, because it may be thrown in sync mode
      if(xhr.withCredentials !== request.withCredentials) xhr.withCredentials = request.withCredentials;
      if(xhr.timeout !== request.timeout) xhr.timeout = request.timeout;
      if(xhr.responseType !== request.responseType) xhr.responseType = request.responseType;
      xhr.send(request.data);
    }, function() {
      // Fake actions
      var action = function() {
        response.readyState = 3;
        updateKeys(response, xceptor);
        trigger('readystatechange');
        response.readyState = 4;
        updateKeys(response, xceptor);
        complete();
        trigger('readystatechange');
        trigger('load');
      };
      // Fake async
      if(request.isAsync) {
        setTimeout(action);
      } else {
        action();
      }
    });
  };
  xceptor.abort = function() {
    xhr.abort();
  };
  var trigger = function(name) {
    xceptor.dispatchEvent(new Event(name, xceptor));
  };
  var updateResponseHeaders = function() {
    if(updateResponseHeaders.disabled) return;
    updateResponseHeaders.disabled = true;
    response.headers.splice(0, response.headers.length);
    response.status = xhr.status;
    response.statusText = xhr.statusText;
    xhr.getAllResponseHeaders().replace(/.+/g, function($0) {
      var result = $0.match(/(^.*?): (.*$)/);
      if(!result) return;
      response.headers.push({ header: result[1], value: result[2] });
    });
  };
  var complete = function() {
    responseHandlers.solve([request, response], function() {
      updateKeys(response, xceptor);
    });
  };
  // Mapping response
  updateKeys(xhr, response, /^response/);
  // Mapping events
  void function() {
    xhr.onreadystatechange = function() {
      updateKeys(xhr, xceptor);
      updateKeys(xhr, response);
      if(xhr.readyState === 3) updateResponseHeaders();
      if(xhr.readyState === 4) {
        updateResponseHeaders();
        complete();
        setTimeout(function() { trigger('load'); });
      }
      trigger('readystatechange');
    };
    var events = [ 'error', 'timeout' ];
    var buildEvent = function(name) {
      xhr['on' + name] = function() {
        xceptor.readyState = xhr.readyState;
        trigger(name);
      };
    };
    for(var i = 0; i < events.length; i++) buildEvent(events[i]);
  }();
};

XMLHttpRequest.prototype = {
  DONE: 4,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  OPENED: 1,
  UNSENT: 0
};

XMLHttpRequest = SimpleEventDecorator(XMLHttpRequest);

// Define xceptor methods
return XMLHttpRequest.XCeptor = new function() {
  var that = this;
  this.when = function(method, route, requestHandler, responseHandler) {
    requestHandlers.add(requestHandler, method, route);
    responseHandlers.add(responseHandler, method, route);
  };
  void function() {
    var methods = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEADER', 'OPTIONS' ];
    for(var i = 0; i < methods.length; i++) void function(method) {
      that[method.toLowerCase()] = function() {
        var args = Array.prototype.slice.call(arguments);
        return that.when.apply(that, [method].concat(args));
      };
    }(methods[i]);
  }();
};

/**/ }); /**/

/**/ });
