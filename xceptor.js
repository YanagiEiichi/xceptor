/**/ void function() { /**/


/* Definitions */

// Avoid duplicate runing
if(XMLHttpRequest.XCeptor) return;

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
          result.then(fixResule, function(error) { throw error; });
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


/* Main Process */

// Create two handlers objects
var requestHandlers = new Handlers();
var responseHandlers = new Handlers();

// Save original XMLHttpRequest class
var OriginalXMLHttpRequest = XMLHttpRequest;

// Get and cache properties of original XMLHttpRequest
var originalKeys = [];
var responsiveKeys = [];
void function() {
  var xhr = new OriginalXMLHttpRequest();
  for(var key in xhr) {
    /**/ try { /* Fuck Android 4.3- */
    /**/   void xhr[key];
    /**/ } catch(error) {
    /**/   continue;
    /**/ }
    if(typeof xhr[key] === 'function') continue;
    originalKeys.push(key);
    if(/^response/.test(key)) responsiveKeys.push(key);
  }
}();

// Create interceptor
XMLHttpRequest = function() {
  var xhr = new OriginalXMLHttpRequest();
  var xceptor = this;
  for(var i = 0; i < originalKeys.length; i++) {
    xceptor[originalKeys[i]] = xhr[originalKeys[i]];
  }
  var request = {
    method: null,
    url: null,
    async: true,
    username: void 0,
    password: void 0,
    headers: [],
    overridedMimeType: void 0,
    timeout: xceptor.timeout,
    withCredentials: xceptor.withCredentials
  };
  var response = {
    status: xceptor.status,
    statusText: xceptor.statusText,
    headers: []
  };
  var Event = function(type) {
    this.type = type;
    this.target = xceptor;
  };
  // Methods mapping
  xceptor.open = function(method, url, async, username, password) {
    // Save to 'request'
    request.method = (method + '').toUpperCase();
    request.url = url + '';
    if(async !== void 0) request.async = !!(async * 1);
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
    header = header + '';
    for(var i = 0; i < headers.length; i++) {
      if(headers[i].header === header) return headers[i].value;
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
    // Invoke interceptor
    requestHandlers.solve([request, response], function() {
      // Actual actions
      xhr.open(request.method, request.url, request.async, request.username, request.password);
      for(var i = 0; i < request.headers.length; i++) {
        xhr.setRequestHeader(request.headers[i].header, request.headers[i].value);
      }
      if(request.overridedMimeType !== void 0) xhr.overrideMimeType(request.overridedMimeType);
      xhr.withCredentials = request.withCredentials;
      xhr.timeout = request.timeout;
      xhr.send(request.data);
    }, function() {
      // Fake actions
      setTimeout(function() {
        response.readyState = 4;
        complete();
        triggerInterfaceEvent('readystatechange');
        triggerInterfaceEvent('load');
      });
    });
  };
  xceptor.abort = function() {
    xhr.abort();
  };
  var triggerInterfaceEvent = function(event) {
    if(typeof xceptor['on' + event] === 'function') xceptor['on' + event](new Event(event));
  };
  var updateResponse = function() {
    for(var i = 0; i < responsiveKeys.length; i++) {
      response[responsiveKeys[i]] = xhr[responsiveKeys[i]];
    }
  };
  var updateResponseHeaders = function() {
    response.headers.splice(0);
    response.status = xhr.status;
    response.statusText = xhr.statusText;
    xhr.getAllResponseHeaders().replace(/.+/g,function(e) {
      e = e.match(/(^.*?): (.*$)/);
      response.headers.push({ header: e[1], value: e[2] });
    });
  };
  var complete = function() {
    responseHandlers.solve([request, response], function() {
      for(var i in response) if(i in xceptor) xceptor[i] = response[i];
    });
  };
  // Mapping response
  updateResponse();
  // Mapping events
  void function() {
    xhr.onreadystatechange = function() {
      // Read from 'xhr'
      var i, property;
      xceptor.readyState = xhr.readyState;
      if(xhr.readyState === 3) updateResponseHeaders();
      if(xhr.readyState === 4) {
        updateResponse();
        complete();
      }
      triggerInterfaceEvent('readystatechange');
    };
    var events = [ 'error', 'load', 'timeout' ];
    var buildEvent = function(name) {
      xhr['on' + name] = function() {
        xceptor.readyState = xhr.readyState;
        triggerInterfaceEvent(name);
      };
    };
    for(var i = 0; i < events.length; i++) buildEvent(events[i]);
  }();
};

// Define xceptor methods
var XCeptor = XMLHttpRequest.XCeptor = new function() {
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

// UMD
switch(true) {
  // AMD
  case typeof define === 'function' && !!define.amd:
    define('XCeptor', function() { return XCeptor; });
    break;
  // CommonJS
  case typeof module === 'object' && !!module.exports:
    module.exports = XCeptor;
    break;
  // Global
  default:
    /**/ try { /* Fuck IE8- */
    /**/   if(typeof execScript === 'object') execScript('var XCeptor');
    /**/ } catch(error) {}
    window.XCeptor = XCeptor;
}

/**/ }(); /**/
