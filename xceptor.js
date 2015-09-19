var XCeptor = function() {
  if(XMLHttpRequest.XCeptor) return XMLHttpRequest.XCeptor;

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
      var xceptor = this;
      for(var i in xhr) {
        try {
          // Accessing may be throw on Android 4.3
          if(typeof xhr[i] !== 'function') xceptor[i] = xhr[i];
        } catch(error) {}
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
        responseType: xceptor.responseType,
        responseText: xceptor.responseText,
        responseXML: xceptor.responseXML,
        response: xceptor.response, 
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
      // Events mapping
      void function() {
        xhr.onreadystatechange = function() {
          // Read from 'xhr'
          var i, property;
          xceptor.readyState = xhr.readyState;
          if(xhr.readyState === 3) updateResponseHeaders();
          if(xhr.readyState === 4) {
            // Read from 'xhr'
            for(i = 0; property = RESPONSEX[i]; i++) response[property] = xhr[property];
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
  }(XMLHttpRequest);

  // Define xceptor methods
  return XMLHttpRequest.XCeptor = new function() {
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
