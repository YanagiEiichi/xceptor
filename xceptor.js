/************************************************
  PROJECT: XCeptor
  LATEST: 2015-03-02
  LICENCE: MIT
  AUTHOR: yanagieiichi@web-tinker.com
  GIT: git@github.com:YanagiEiichi/xceptor
************************************************/

var XCeptor = function() {

  var RESPONSEX = [
    'response',
    'responseText',
    'responseType',
    'responseXML'
  ];

  // Define the Handlers internal class
  var Handlers = function() {};
  Handlers.prototype = [];
  Handlers.prototype.solve = function(args, resolve, reject) {
    var that = this;
    var iterator = function(i) {
      var select = function(result) {
        switch(result) {
          case true: return resolve && resolve();
          case false: return reject && reject();
          default:
            if(result && typeof result.then === 'function') {
              result.then(select, function(e) { throw e; });
            } else {
              iterator(i + 1);
            }
        }
      };
      if(i < that.length) {
        select(that[i].apply(null, args));
      } else {
        resolve && resolve();
      }
    };
    iterator(0);
  };

  // Create two handlers objects
  var requestHandlers = new Handlers;
  var responseHandlers = new Handlers;

  // Create interceptor
  void function(XHR) {
    XMLHttpRequest = function() {
      var xhr = new XHR;
      var interface = this;
      for(var i in xhr) if(typeof xhr[i] !== 'function') interface[i] = xhr[i];
      var request = {
        method: null,
        url: null,
        async: true,
        username: void 0,
        password: void 0,
        headers: [],
        overridedMimeType: void 0,
        timeout: interface.timeout,
        withCredentials: interface.withCredentials
      };
      var response = {
        status: interface.status,
        statusText: interface.statusText,
        responseType: interface.responseType,
        responseText: interface.responseText,
        responseXML: interface.responseXML,
        response: interface.response, 
        headers: []
      };
      var parameters = [ request, response ];
      var Event = function(type) {
        this.type = type;
        this.target = interface;
      };
      // Methods mapping
      interface.open = function(method, url, async, username, password) {
        // Save to 'request'
        request.method = (method + '').toUpperCase();
        request.url = url + '';
        if(async !== void 0) request.async = !!(async * 1);
        if(username !== void 0) request.username = username + '';
        if(password !== void 0) request.password = password + '';
      };
      interface.setRequestHeader = function(header, value) {
        // Save to 'headers'
        request.headers.push({ header: header + '', value: value + '' }); 
      };
      interface.overrideMimeType = function(mimetype) {
        // Save to 'request'
        request.overridedMimeType = mimetype;
      };
      interface.getResponseHeader = function(header) {
        // Read from 'response'
        var headers = response.headers;
        header = header + '';
        for(var i = 0; i < headers.length; i++) {
          if(headers[i].header === header) return headers[i].value;
        }
        return null;
      };
      interface.getAllResponseHeaders = function() {
        // Read from 'response'
        var headers = response.headers;
        var allHeaders = [];
        for(var i = 0; i < response.headers.length; i++) {
          allHeaders.push(headers[i].header + ': ' + headers[i].value);
        }
        return allHeaders.join('\r\n');
      };
      interface.send = function(data) {
        // Copy setter properties to 'request'
        request.data = data;
        request.withCredentials = interface.withCredentials;
        request.timeout = interface.timeout;
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
      interface.abort = function() {
        xhr.abort();        
      };
      var triggerInterfaceEvent = function(event) {
        if(typeof interface['on' + event] === 'function') interface['on' + event](new Event(event));
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
          for(var i in response) if(i in interface) interface[i] = response[i];
        });
      };
      // Events mapping
      void function() {
        xhr.onreadystatechange = function() {
          // Read from 'xhr'
          var i, property;
          interface.readyState = xhr.readyState;
          if(xhr.readyState === 3) updateResponseHeaders();
          if(xhr.readyState === 4) {
            // Read from 'xhr'
            for(i = 0; property = RESPONSEX[i]; i++) response[property] = xhr[property];
            complete();
          }
          triggerInterfaceEvent('readystatechange');
        };
        var events = [ 'onerror', 'onload', 'ontimeout' ];
        var buildEvent = function(name) {
          xhr[name] = function() {
            interface.readyState = xhr.readyState;
            triggerInterfaceEvent(name);
          };
        };
        for(var i = 0; i < events.length; i++) buildEvent(events[i]); 
      }();
    };
  }(XMLHttpRequest);

  // Define interface methods
  return new function() {
    var that = this;
    this.when = function(method, route, requestHandler, responseHandler) {
      var isMatched = function(request) {
        return (
          (method.test ? method.test(request.method) : method === request.method) && 
          (route.test ? route.test(request.url) : route === request.url)
        );
      };
      requestHandler && requestHandlers.push(function(request, response) {
        if(isMatched(request)) return requestHandler(request, response);
      });
      responseHandler && responseHandlers.push(function(request, response) {
        if(isMatched(request)) return responseHandler(request, response);
      });
    };
    void function() {
      var methods = ['get', 'post', 'put', 'delete', 'patch', 'header', 'options'];
      for(var i = 0; i < methods.length; i++) void function(method) {
        that[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(method.toUpperCase());
          return that.when.apply(that, args);
        };
      }(methods[i]);
    }();
  };
}();

