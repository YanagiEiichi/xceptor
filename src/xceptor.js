var XCeptor = (function() {

  'use strict';

  // Avoid duplicate runing
  if (XMLHttpRequest.XCeptor) return XMLHttpRequest.XCeptor;

  // Save original XMLHttpRequest class
  var OriginalXMLHttpRequest = XMLHttpRequest;

  // Handlers internal class
  var Handlers = function() {};
  // To use equivalence Checking
  Handlers.check = function(what, value) {
    // Note, use a '==' here, match 'null' or 'undefined'
    if (what === null || what === value) return true;
    // Check 'test' method, match RegExp or RegExp-like
    if (typeof what.test === 'function') return what.test(value);
    if (typeof what === 'function') return what(value);
  };
  Handlers.prototype = [];
  Handlers.prototype.solve = function(args, resolve, reject) {
    var handlers = this;
    // This is an asynchronous recursion to traverse handlers
    var iterator = function(cursor) {
      // This is an asynchronous recursion to resolve thenable resolve
      var fixResule = function(result) {
        switch (true) {
          case result === true: return resolve && resolve();
          case result === false: return reject && reject();
          // Resolve recursively thenable result
          case result && typeof result.then === 'function':
            return result.then(fixResule, function(error) { throw error; });
          default: iterator(cursor + 1);
        }
      };
      if (cursor < handlers.length) {
        fixResule(handlers[cursor].apply(null, args));
      } else {
        resolve && resolve();
      }
    };
    iterator(0);
  };
  Handlers.prototype.add = function(handler, method, route) {
    if (typeof handler !== 'function') return;
    this.push(function(request, response) {
      if (Handlers.check(method, request.method) && Handlers.check(route, request.url)) {
        return handler(request, response);
      }
    });
  };

  // Create two handlers objects
  var requestHandlers = new Handlers();
  var responseHandlers = new Handlers();

  var propPrefix = '__internal_';
  var propKeys = [
    'readyState',
    'timeout',
    'upload',
    'withCredentials',
    'status',
    'statusText',
    'responseURL',
    'responseType',
    'response',
    'responseText',
    'responseXML'
  ];

  // To sync object keys with xhr
  var updateKeys = function(from, to, filter) {
    for (var i = 0, key; (key = propKeys[i]); i++) {
      if (filter && !filter.test(key)) continue;
      var xKey = propPrefix + key;
      var toKey = xKey in to ? xKey : key;
      var fromKey = xKey in from ? xKey : key;
      /**/ try { /* Fuck Android 4.3- and IE */ // eslint-disable-line no-multi-spaces
      /**/   void to[toKey], void from[fromKey]; // eslint-disable-line no-multi-spaces, indent
      /**/ } catch (error) { // eslint-disable-line no-multi-spaces
      /**/   continue; // eslint-disable-line no-multi-spaces, indent
      /**/ } // eslint-disable-line no-multi-spaces
      to[toKey] = from[fromKey];
    }
  };

  // Event internal class
  var Event = function(type, target) {
    this.type = type;
    this.target = target;
  };

  // SimpleEventModel internal decorator
  var SimpleEventDecorator = function(Constructor) {
    var heap = function(object, name) {
      var events = object.__events__;
      return name in events ? events[name] : events[name] = [];
    };
    var addEventListener = function(name, handler) {
      heap(this, name).push(handler);
    };
    var removeEventListener = function(name, handler) {
      var list = heap(this, name);
      for (var i = 0; i < list.length; i++) {
        if (list[i] === handler) list.splice(i, 1), i = 0 / 0;
      }
    };
    var wrapDispatchEvent = function(context) {
      var dispatchEvent = function(event) {
        var list = heap(this, event.type);
        for (var i = 0; i < list.length; i++) list[i].call(context, event);
        var key = 'on' + event.type;
        if (typeof this[key] === 'function') this[key].call(context, event);
      };
      return dispatchEvent;
    };
    var SimpleEventModel = function() {
      Constructor.apply(this, arguments);
      Object.defineProperty(this, '__events__', { value: {}, configurable: true });
      Object.defineProperty(this, 'addEventListener', { value: addEventListener, configurable: true });
      Object.defineProperty(this, 'removeEventListener', { value: removeEventListener, configurable: true });
      Object.defineProperty(this, 'dispatchEvent', { value: wrapDispatchEvent(this), configurable: true });
    };
    SimpleEventModel.prototype = Constructor.prototype;
    return SimpleEventModel;
  };

  /* Main Process */

  // Create interceptor
  var HijackedXHR = function() {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Failed to construct \'XMLHttpRequest\': Please use the \'new\' operator, this DOM object constructor cannot be called as a function.');
    var xceptor = this;
    var xhr = new OriginalXMLHttpRequest();
    // Init prop slots
    void function() {
      for (var i = 0, key; (key = propKeys[i]); i++) {
        Object.defineProperty(xceptor, propPrefix + key, { configurable: true, writable: true });
      }
    }();
    // Update default values
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
    var response = { status: xceptor.status, statusText: xceptor.statusText, headers: [] };
    var trigger = function(name) { xceptor.dispatchEvent(new Event(name, xceptor)); };
    var complete = function() {
      responseHandlers.solve([xceptor.__request, xceptor.__response], function() {
        updateKeys(xceptor.__response, xceptor);
      });
    };
    Object.defineProperty(xceptor, '__originalXHR', { value: xhr, configurable: true });
    Object.defineProperty(xceptor, '__request', { value: request, configurable: true });
    Object.defineProperty(xceptor, '__response', { value: response, configurable: true });
    Object.defineProperty(xceptor, '__trigger', { value: trigger, configurable: true });
    Object.defineProperty(xceptor, '__complete', { value: complete, configurable: true });
    var updateResponseHeaders = function() {
      if (updateResponseHeaders.disabled) return;
      updateResponseHeaders.disabled = true;
      response.headers.splice(0, response.headers.length);
      response.status = xhr.status;
      response.statusText = xhr.statusText;
      xhr.getAllResponseHeaders().replace(/.+/g, function($0) {
        var result = $0.match(/(^.*?): (.*$)/);
        if (!result) return;
        response.headers.push({ header: result[1], value: result[2] });
      });
    };
    // Mapping response
    updateKeys(xhr, response, /^response/);
    // Mapping events
    void function() {
      xhr.onreadystatechange = function() {
        updateKeys(xhr, xceptor);
        updateKeys(xhr, response);
        if (xhr.readyState > 1) updateResponseHeaders();
        if (xhr.readyState === 4) {
          complete();
          if (request.isAsync) {
            setTimeout(function() { trigger('load'); });
          } else {
            trigger('load');
          }
        }
        trigger('readystatechange');
      };
      var events = [ 'error', 'timeout', 'abort' ];
      var buildEvent = function(name) {
        xhr['on' + name] = function() {
          xceptor.readyState = xhr.readyState;
          trigger(name);
        };
      };
      for (var i = 0; i < events.length; i++) buildEvent(events[i]);
    }();
  };

  // Methods mapping
  HijackedXHR.prototype.open = function(method, url, isAsync, username, password) {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    var request = this.__request;
    // Save to 'request'
    request.method = (method + '').toUpperCase();
    request.url = url + '';
    if (isAsync !== void 0) request.isAsync = !!(isAsync * 1);
    if (username !== void 0) request.username = username + '';
    if (password !== void 0) request.password = password + '';
  };

  HijackedXHR.prototype.setRequestHeader = function(header, value) {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    // Save to 'headers'
    this.__request.headers.push({ header: header + '', value: value });
  };

  HijackedXHR.prototype.overrideMimeType = function(mimetype) {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    // Save to 'request'
    this.__request.overridedMimeType = mimetype;
  };

  HijackedXHR.prototype.getResponseHeader = function(header) {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    // Read from 'response'
    var headers = this.__response.headers;
    header = String(header).toLowerCase();
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].header.toLowerCase() === header) return headers[i].value;
    }
    return null;
  };

  HijackedXHR.prototype.getAllResponseHeaders = function() {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    // Read from 'response'
    var response = this.__response;
    var headers = response.headers;
    var allHeaders = [];
    for (var i = 0; i < response.headers.length; i++) {
      allHeaders.push(headers[i].header + ': ' + headers[i].value);
    }
    return allHeaders.join('\r\n');
  };

  HijackedXHR.prototype.send = function(data) {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    // Copy setter properties to 'request'
    var request = this.__request;
    var response = this.__response;
    request.data = data;
    request.withCredentials = this.withCredentials;
    request.timeout = this.timeout;
    request.responseType = this.responseType;
    var that = this;
    // Invoke interceptor
    requestHandlers.solve([request, response], function() {
      // Actual actions
      var xhr = that.__originalXHR;
      xhr.open(request.method, request.url, request.isAsync, request.username, request.password);
      for (var i = 0; i < request.headers.length; i++) {
        xhr.setRequestHeader(request.headers[i].header, request.headers[i].value);
      }
      if (request.overridedMimeType !== void 0) xhr.overrideMimeType(request.overridedMimeType);
      // Assigning before changes, because it may be thrown in sync mode
      if (xhr.withCredentials !== request.withCredentials) xhr.withCredentials = request.withCredentials;
      if (xhr.timeout !== request.timeout) xhr.timeout = request.timeout;
      if (xhr.responseType !== request.responseType) xhr.responseType = request.responseType;
      xhr.send(request.data);
    }, function() {
      // Fake actions
      var action = function() {
        response.readyState = 3;
        updateKeys(response, that);
        that.__trigger('readystatechange');
        response.readyState = 4;
        updateKeys(response, that);
        that.__complete();
        that.__trigger('readystatechange');
        that.__trigger('load');
      };
      // Fake async
      if (request.isAsync) {
        setTimeout(action);
      } else {
        action();
      }
    });
  };

  HijackedXHR.prototype.abort = function() {
    if (!(this instanceof HijackedXHR)) throw new TypeError('Illegal invocation');
    this.__originalXHR.abort();
  };

  // Set accessor props
  void function() {
    for (var i = 0, key; (key = propKeys[i]); i++) void function(key) {
      Object.defineProperty(HijackedXHR.prototype, key, {
        configurable: true,
        enumerable: true,
        set: function(value) { this[propPrefix + key] = value; },
        get: function() { return this[propPrefix + key]; }
      });
    }(key);
  }();

  HijackedXHR = SimpleEventDecorator(HijackedXHR);

  // Copy constant names to constructor and prototype
  var constantNames = [ 'UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE' ];
  for (var i = 0; i < constantNames.length; i++) {
    HijackedXHR[constantNames[i]] = OriginalXMLHttpRequest[constantNames[i]];
    HijackedXHR.prototype[constantNames[i]] = OriginalXMLHttpRequest[constantNames[i]];
  }

  // Exports
  window.XMLHttpRequest = HijackedXHR;

  // Define xceptor methods
  var XCeptor = new function() {
    var that = this;
    this.when = function(method, route, requestHandler, responseHandler) {
      requestHandlers.add(requestHandler, method, route);
      responseHandlers.add(responseHandler, method, route);
    };
    void function() {
      var methods = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEADER', 'OPTIONS' ];
      for (var i = 0; i < methods.length; i++) void function(method) {
        that[method.toLowerCase()] = function() {
          var args = Array.prototype.slice.call(arguments);
          return that.when.apply(that, [method].concat(args));
        };
      }(methods[i]);
    }();
  };

  Object.defineProperty(HijackedXHR, 'XCeptor', { value: XCeptor, configurable: true });

  return XCeptor;

})();
