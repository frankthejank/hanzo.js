var Hanzo = (function () {
'use strict';

var updateParam;

var isFunction = function(fn) {
  return typeof fn === 'function';
};



var statusOk = function(res) {
  return res.status === 200;
};

var statusCreated = function(res) {
  return res.status === 201;
};



var GET = 'GET';

var POST = 'POST';

var PATCH = 'PATCH';

var newError = function(data, res, err) {
  var message, ref, ref1, ref2, ref3, ref4;
  if (res == null) {
    res = {};
  }
  message = (ref = (ref1 = res.data) != null ? (ref2 = ref1.error) != null ? ref2.message : void 0 : void 0) != null ? ref : 'Request failed';
  if (err == null) {
    err = new Error(message);
  }
  err.data = res.data;
  err.msg = message;
  err.req = data;
  err.responseText = res.data;
  err.status = res.status;
  err.type = (ref3 = res.data) != null ? (ref4 = ref3.error) != null ? ref4.type : void 0 : void 0;
  return err;
};

updateParam = function(url, key, value) {
  var hash, re, separator;
  re = new RegExp('([?&])' + key + '=.*?(&|#|$)(.*)', 'gi');
  if (re.test(url)) {
    if (value != null) {
      return url.replace(re, '$1' + key + '=' + value + '$2$3');
    } else {
      hash = url.split('#');
      url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
      if (hash[1] != null) {
        url += '#' + hash[1];
      }
      return url;
    }
  } else {
    if (value != null) {
      separator = url.indexOf('?') !== -1 ? '&' : '?';
      hash = url.split('#');
      url = hash[0] + separator + key + '=' + value;
      if (hash[1] != null) {
        url += '#' + hash[1];
      }
      return url;
    } else {
      return url;
    }
  }
};

var updateQuery$1 = function(url, data) {
  var k, v;
  if (typeof data !== 'object') {
    return url;
  }
  for (k in data) {
    v = data[k];
    url = updateParam(url, k, v);
  }
  return url;
};

var Api;

Api = (function() {
  Api.BLUEPRINTS = {};

  Api.CLIENT = null;

  function Api(opts) {
    var blueprints, client, k, v;
    if (opts == null) {
      opts = {};
    }
    if (!(this instanceof Api)) {
      return new Api(opts);
    }
    blueprints = opts.blueprints, client = opts.client;
    this.client = client || new this.constructor.CLIENT(opts);
    if (blueprints == null) {
      blueprints = this.constructor.BLUEPRINTS;
    }
    for (k in blueprints) {
      v = blueprints[k];
      this.addBlueprints(k, v);
    }
  }

  Api.prototype.addBlueprints = function(api, blueprints) {
    var bp, name;
    if (this[api] == null) {
      this[api] = {};
    }
    for (name in blueprints) {
      bp = blueprints[name];
      this.addBlueprint(api, name, bp);
    }
  };

  Api.prototype.addBlueprint = function(api, name, bp) {
    var method;
    if (isFunction(bp)) {
      return this[api][name] = (function(_this) {
        return function() {
          return bp.apply(_this, arguments);
        };
      })(this);
    }
    if (bp.expects == null) {
      bp.expects = statusOk;
    }
    if (bp.method == null) {
      bp.method = GET;
    }
    method = (function(_this) {
      return function(data, cb) {
        var key;
        key = void 0;
        if (bp.useCustomerToken) {
          key = _this.client.getCustomerToken();
        }
        return _this.client.request(bp, data, key).then(function(res) {
          var ref, ref1;
          if (((ref = res.data) != null ? ref.error : void 0) != null) {
            throw newError(data, res);
          }
          if (!bp.expects(res)) {
            throw newError(data, res);
          }
          if (bp.process != null) {
            bp.process.call(_this, res);
          }
          return (ref1 = res.data) != null ? ref1 : res.body;
        }).callback(cb);
      };
    })(this);
    return this[api][name] = method;
  };

  Api.prototype.setKey = function(key) {
    return this.client.setKey(key);
  };

  Api.prototype.setCustomerToken = function(key) {
    return this.client.setCustomerToken(key);
  };

  Api.prototype.deleteCustomerToken = function() {
    return this.client.deleteCustomerToken();
  };

  Api.prototype.setStore = function(id) {
    this.storeId = id;
    return this.client.setStore(id);
  };

  return Api;

})();

var Api$1 = Api;

var PromiseInspection;

var PromiseInspection$1 = PromiseInspection = (function() {
  function PromiseInspection(arg) {
    this.state = arg.state, this.value = arg.value, this.reason = arg.reason;
  }

  PromiseInspection.prototype.isFulfilled = function() {
    return this.state === 'fulfilled';
  };

  PromiseInspection.prototype.isRejected = function() {
    return this.state === 'rejected';
  };

  return PromiseInspection;

})();

var _undefined$1 = void 0;

var _undefinedString$1 = 'undefined';

var soon;

soon = (function() {
  var bufferSize, callQueue, cqYield, fq, fqStart;
  fq = [];
  fqStart = 0;
  bufferSize = 1024;
  callQueue = function() {
    var err;
    while (fq.length - fqStart) {
      try {
        fq[fqStart]();
      } catch (error) {
        err = error;
        if (global.console) {
          global.console.error(err);
        }
      }
      fq[fqStart++] = _undefined$1;
      if (fqStart === bufferSize) {
        fq.splice(0, bufferSize);
        fqStart = 0;
      }
    }
  };
  cqYield = (function() {
    var dd, mo;
    if (typeof MutationObserver !== _undefinedString$1) {
      dd = document.createElement('div');
      mo = new MutationObserver(callQueue);
      mo.observe(dd, {
        attributes: true
      });
      return function() {
        dd.setAttribute('a', 0);
      };
    }
    if (typeof setImmediate !== _undefinedString$1) {
      return function() {
        setImmediate(callQueue);
      };
    }
    return function() {
      setTimeout(callQueue, 0);
    };
  })();
  return function(fn) {
    fq.push(fn);
    if (fq.length - fqStart === 1) {
      cqYield();
    }
  };
})();

var soon$1 = soon;

var Promise$1;
var STATE_FULFILLED;
var STATE_PENDING;
var STATE_REJECTED;
var _undefined;
var rejectClient;
var resolveClient;

_undefined = void 0;

STATE_PENDING = _undefined;

STATE_FULFILLED = 'fulfilled';

STATE_REJECTED = 'rejected';

resolveClient = function(c, arg) {
  var err, yret;
  if (typeof c.y === 'function') {
    try {
      yret = c.y.call(_undefined, arg);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.resolve(arg);
  }
};

rejectClient = function(c, reason) {
  var err, yret;
  if (typeof c.n === 'function') {
    try {
      yret = c.n.call(_undefined, reason);
      c.p.resolve(yret);
    } catch (error) {
      err = error;
      c.p.reject(err);
    }
  } else {
    c.p.reject(reason);
  }
};

Promise$1 = (function() {
  function Promise(fn) {
    if (fn) {
      fn((function(_this) {
        return function(arg) {
          return _this.resolve(arg);
        };
      })(this), (function(_this) {
        return function(arg) {
          return _this.reject(arg);
        };
      })(this));
    }
  }

  Promise.prototype.resolve = function(value) {
    var clients, err, first, next;
    if (this.state !== STATE_PENDING) {
      return;
    }
    if (value === this) {
      return this.reject(new TypeError('Attempt to resolve promise with self'));
    }
    if (value && (typeof value === 'function' || typeof value === 'object')) {
      try {
        first = true;
        next = value.then;
        if (typeof next === 'function') {
          next.call(value, (function(_this) {
            return function(ra) {
              if (first) {
                if (first) {
                  first = false;
                }
                _this.resolve(ra);
              }
            };
          })(this), (function(_this) {
            return function(rr) {
              if (first) {
                first = false;
                _this.reject(rr);
              }
            };
          })(this));
          return;
        }
      } catch (error) {
        err = error;
        if (first) {
          this.reject(err);
        }
        return;
      }
    }
    this.state = STATE_FULFILLED;
    this.v = value;
    if (clients = this.c) {
      soon$1((function(_this) {
        return function() {
          var c, i, len;
          for (i = 0, len = clients.length; i < len; i++) {
            c = clients[i];
            resolveClient(c, value);
          }
        };
      })(this));
    }
  };

  Promise.prototype.reject = function(reason) {
    var clients;
    if (this.state !== STATE_PENDING) {
      return;
    }
    this.state = STATE_REJECTED;
    this.v = reason;
    if (clients = this.c) {
      soon$1(function() {
        var c, i, len;
        for (i = 0, len = clients.length; i < len; i++) {
          c = clients[i];
          rejectClient(c, reason);
        }
      });
    } else if (!Promise.suppressUncaughtRejectionError && global.console) {
      global.console.log('Broken Promise, please catch rejections: ', reason, reason ? reason.stack : null);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var a, client, p, s;
    p = new Promise;
    client = {
      y: onFulfilled,
      n: onRejected,
      p: p
    };
    if (this.state === STATE_PENDING) {
      if (this.c) {
        this.c.push(client);
      } else {
        this.c = [client];
      }
    } else {
      s = this.state;
      a = this.v;
      soon$1(function() {
        if (s === STATE_FULFILLED) {
          resolveClient(client, a);
        } else {
          rejectClient(client, a);
        }
      });
    }
    return p;
  };

  Promise.prototype["catch"] = function(cfn) {
    return this.then(null, cfn);
  };

  Promise.prototype["finally"] = function(cfn) {
    return this.then(cfn, cfn);
  };

  Promise.prototype.timeout = function(ms, msg) {
    msg = msg || 'timeout';
    return new Promise((function(_this) {
      return function(resolve, reject) {
        setTimeout(function() {
          return reject(Error(msg));
        }, ms);
        _this.then(function(val) {
          resolve(val);
        }, function(err) {
          reject(err);
        });
      };
    })(this));
  };

  Promise.prototype.callback = function(cb) {
    if (typeof cb === 'function') {
      this.then(function(val) {
        return cb(null, val);
      });
      this["catch"](function(err) {
        return cb(err, null);
      });
    }
    return this;
  };

  return Promise;

})();

var Promise$2 = Promise$1;

var resolve = function(val) {
  var z;
  z = new Promise$2;
  z.resolve(val);
  return z;
};

var reject = function(err) {
  var z;
  z = new Promise$2;
  z.reject(err);
  return z;
};

var all = function(ps) {
  var i, j, len, p, rc, resolvePromise, results, retP;
  results = [];
  rc = 0;
  retP = new Promise$2();
  resolvePromise = function(p, i) {
    if (!p || typeof p.then !== 'function') {
      p = resolve(p);
    }
    p.then(function(yv) {
      results[i] = yv;
      rc++;
      if (rc === ps.length) {
        retP.resolve(results);
      }
    }, function(nv) {
      retP.reject(nv);
    });
  };
  for (i = j = 0, len = ps.length; j < len; i = ++j) {
    p = ps[i];
    resolvePromise(p, i);
  }
  if (!ps.length) {
    retP.resolve(results);
  }
  return retP;
};

var reflect = function(promise) {
  return new Promise$2(function(resolve, reject) {
    return promise.then(function(value) {
      return resolve(new PromiseInspection$1({
        state: 'fulfilled',
        value: value
      }));
    })["catch"](function(err) {
      return resolve(new PromiseInspection$1({
        state: 'rejected',
        reason: err
      }));
    });
  });
};

var settle = function(promises) {
  return all(promises.map(reflect));
};

Promise$2.all = all;

Promise$2.reflect = reflect;

Promise$2.reject = reject;

Promise$2.resolve = resolve;

Promise$2.settle = settle;

Promise$2.soon = soon$1;

var getOwnPropertySymbols;
var hasOwnProperty;
var objectAssign;
var propIsEnumerable;
var shouldUseNative;
var toObject;
var slice = [].slice;

getOwnPropertySymbols = Object.getOwnPropertySymbols;

hasOwnProperty = Object.prototype.hasOwnProperty;

propIsEnumerable = Object.prototype.propertyIsEnumerable;

toObject = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative = function() {
  var err, i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    err = error;
    return false;
  }
};

var index$1 = objectAssign = (function() {
  if (shouldUseNative()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    to = toObject(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnPropertySymbols) {
        ref = getOwnPropertySymbols(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (propIsEnumerable.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

var index_1 = index$1;

var isArray;
var parseHeaders;
var trim;

trim = function(s) {
  return s.replace(/^\s*|\s*$/g, '');
};

isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var parseHeaders$1 = parseHeaders = function(headers) {
  var i, index, key, len, ref, result, row, value;
  if (!headers) {
    return {};
  }
  result = {};
  ref = trim(headers).split('\n');
  for (i = 0, len = ref.length; i < len; i++) {
    row = ref[i];
    index = row.indexOf(':');
    key = trim(row.slice(0, index)).toLowerCase();
    value = trim(row.slice(index + 1));
    if (typeof result[key] === 'undefined') {
      result[key] = value;
    } else if (isArray(result[key])) {
      result[key].push(value);
    } else {
      result[key] = [result[key], value];
    }
    return;
  }
  return result;
};

/*
 * Copyright 2015 Scott Brady
 * MIT License
 * https://github.com/scottbrady/xhr-promise/blob/master/LICENSE
 */
var XMLHttpRequestPromise;

/*
 * Module to wrap an XMLHttpRequest in a promise.
 */

var index = XMLHttpRequestPromise = (function() {
  function XMLHttpRequestPromise() {}

  XMLHttpRequestPromise.DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';

  XMLHttpRequestPromise.Promise = Promise$2;


  /*
   * XMLHttpRequestPromise.send(options) -> Promise
   * - options (Object): URL, method, data, etc.
   *
   * Create the XHR object and wire up event handlers to use a promise.
   */

  XMLHttpRequestPromise.prototype.send = function(options) {
    var defaults;
    if (options == null) {
      options = {};
    }
    defaults = {
      method: 'GET',
      data: null,
      headers: {},
      async: true,
      username: null,
      password: null
    };
    options = index_1({}, defaults, options);
    return new Promise$2((function(_this) {
      return function(resolve, reject) {
        var e, header, ref, value, xhr;
        if (!XMLHttpRequest) {
          _this._handleError('browser', reject, null, "browser doesn't support XMLHttpRequest");
          return;
        }
        if (typeof options.url !== 'string' || options.url.length === 0) {
          _this._handleError('url', reject, null, 'URL is a required parameter');
          return;
        }
        _this._xhr = xhr = new XMLHttpRequest;
        xhr.onload = function() {
          var responseText;
          _this._detachWindowUnload();
          try {
            responseText = _this._getResponseText();
          } catch (error) {
            _this._handleError('parse', reject, null, 'invalid JSON response');
            return;
          }
          return resolve({
            url: _this._getResponseUrl(),
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: responseText,
            headers: _this._getHeaders(),
            xhr: xhr
          });
        };
        xhr.onerror = function() {
          return _this._handleError('error', reject);
        };
        xhr.ontimeout = function() {
          return _this._handleError('timeout', reject);
        };
        xhr.onabort = function() {
          return _this._handleError('abort', reject);
        };
        _this._attachWindowUnload();
        xhr.open(options.method, options.url, options.async, options.username, options.password);
        if ((options.data != null) && !options.headers['Content-Type']) {
          options.headers['Content-Type'] = _this.constructor.DEFAULT_CONTENT_TYPE;
        }
        ref = options.headers;
        for (header in ref) {
          value = ref[header];
          xhr.setRequestHeader(header, value);
        }
        try {
          return xhr.send(options.data);
        } catch (error) {
          e = error;
          return _this._handleError('send', reject, null, e.toString());
        }
      };
    })(this));
  };


  /*
   * XMLHttpRequestPromise.getXHR() -> XMLHttpRequest
   */

  XMLHttpRequestPromise.prototype.getXHR = function() {
    return this._xhr;
  };


  /*
   * XMLHttpRequestPromise._attachWindowUnload()
   *
   * Fix for IE 9 and IE 10
   * Internet Explorer freezes when you close a webpage during an XHR request
   * https://support.microsoft.com/kb/2856746
   *
   */

  XMLHttpRequestPromise.prototype._attachWindowUnload = function() {
    this._unloadHandler = this._handleWindowUnload.bind(this);
    if (window.attachEvent) {
      return window.attachEvent('onunload', this._unloadHandler);
    }
  };


  /*
   * XMLHttpRequestPromise._detachWindowUnload()
   */

  XMLHttpRequestPromise.prototype._detachWindowUnload = function() {
    if (window.detachEvent) {
      return window.detachEvent('onunload', this._unloadHandler);
    }
  };


  /*
   * XMLHttpRequestPromise._getHeaders() -> Object
   */

  XMLHttpRequestPromise.prototype._getHeaders = function() {
    return parseHeaders$1(this._xhr.getAllResponseHeaders());
  };


  /*
   * XMLHttpRequestPromise._getResponseText() -> Mixed
   *
   * Parses response text JSON if present.
   */

  XMLHttpRequestPromise.prototype._getResponseText = function() {
    var responseText;
    responseText = typeof this._xhr.responseText === 'string' ? this._xhr.responseText : '';
    switch (this._xhr.getResponseHeader('Content-Type')) {
      case 'application/json':
      case 'text/javascript':
        responseText = JSON.parse(responseText + '');
    }
    return responseText;
  };


  /*
   * XMLHttpRequestPromise._getResponseUrl() -> String
   *
   * Actual response URL after following redirects.
   */

  XMLHttpRequestPromise.prototype._getResponseUrl = function() {
    if (this._xhr.responseURL != null) {
      return this._xhr.responseURL;
    }
    if (/^X-Request-URL:/m.test(this._xhr.getAllResponseHeaders())) {
      return this._xhr.getResponseHeader('X-Request-URL');
    }
    return '';
  };


  /*
   * XMLHttpRequestPromise._handleError(reason, reject, status, statusText)
   * - reason (String)
   * - reject (Function)
   * - status (String)
   * - statusText (String)
   */

  XMLHttpRequestPromise.prototype._handleError = function(reason, reject, status, statusText) {
    this._detachWindowUnload();
    return reject({
      reason: reason,
      status: status || this._xhr.status,
      statusText: statusText || this._xhr.statusText,
      xhr: this._xhr
    });
  };


  /*
   * XMLHttpRequestPromise._handleWindowUnload()
   */

  XMLHttpRequestPromise.prototype._handleWindowUnload = function() {
    return this._xhr.abort();
  };

  return XMLHttpRequestPromise;

})();

var getOwnPropertySymbols$1;
var hasOwnProperty$1;
var objectAssign$1;
var propIsEnumerable$1;
var shouldUseNative$1;
var toObject$1;
var slice$2 = [].slice;

getOwnPropertySymbols$1 = Object.getOwnPropertySymbols;

hasOwnProperty$1 = Object.prototype.hasOwnProperty;

propIsEnumerable$1 = Object.prototype.propertyIsEnumerable;

toObject$1 = function(val) {
  if (val === null || val === void 0) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
};

shouldUseNative$1 = function() {
  var err, i, j, k, len, letter, order2, ref, test1, test2, test3;
  try {
    if (!Object.assign) {
      return false;
    }
    test1 = new String('abc');
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }
    test2 = {};
    for (i = j = 0; j <= 9; i = ++j) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }
    test3 = {};
    ref = 'abcdefghijklmnopqrst'.split('');
    for (k = 0, len = ref.length; k < len; k++) {
      letter = ref[k];
      test3[letter] = letter;
    }
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (error) {
    err = error;
    return false;
  }
};

var index$2 = objectAssign$1 = (function() {
  if (shouldUseNative$1()) {
    return Object.assign;
  }
  return function() {
    var from, j, k, key, len, len1, ref, source, sources, symbol, target, to;
    target = arguments[0], sources = 2 <= arguments.length ? slice$2.call(arguments, 1) : [];
    to = toObject$1(target);
    for (j = 0, len = sources.length; j < len; j++) {
      source = sources[j];
      from = Object(source);
      for (key in from) {
        if (hasOwnProperty$1.call(from, key)) {
          to[key] = from[key];
        }
      }
      if (getOwnPropertySymbols$1) {
        ref = getOwnPropertySymbols$1(from);
        for (k = 0, len1 = ref.length; k < len1; k++) {
          symbol = ref[k];
          if (propIsEnumerable$1.call(from, symbol)) {
            to[symbol] = from[symbol];
          }
        }
      }
    }
    return to;
  };
})();

var NON_HOST_TYPES;
var base64Regex;
var classic;
var hexRegex;
var isActualNaN;
var isArgs;
var isFn;
var objProto;
var owns;
var symbolValueOf;
var toStr;

objProto = Object.prototype;

owns = objProto.hasOwnProperty;

toStr = objProto.toString;

symbolValueOf = void 0;

if (typeof Symbol === 'function') {
  symbolValueOf = Symbol.prototype.valueOf;
}

isActualNaN = function(value) {
  return value !== value;
};

NON_HOST_TYPES = {
  'boolean': 1,
  number: 1,
  string: 1,
  undefined: 1
};

base64Regex = /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/;

hexRegex = /^[A-Fa-f0-9]+$/;

var isType = function(value, type) {
  return typeof value === type;
};

var isDefined = function(value) {
  return typeof value !== 'undefined';
};

var isEmpty = function(value) {
  var key, type;
  type = toStr.call(value);
  if (type === '[object Array]' || type === '[object Arguments]' || type === '[object String]') {
    return value.length === 0;
  }
  if (type === '[object Object]') {
    for (key in value) {
      if (owns.call(value, key)) {
        return false;
      }
    }
    return true;
  }
  return !value;
};

var isEqual = function(value, other) {
  var key, type;
  if (value === other) {
    return true;
  }
  type = toStr.call(value);
  if (type !== toStr.call(other)) {
    return false;
  }
  if (type === '[object Object]') {
    for (key in value) {
      if (!isEqual(value[key], other[key]) || !(key in other)) {
        return false;
      }
    }
    for (key in other) {
      if (!isEqual(value[key], other[key]) || !(key in value)) {
        return false;
      }
    }
    return true;
  }
  if (type === '[object Array]') {
    key = value.length;
    if (key !== other.length) {
      return false;
    }
    while (key--) {
      if (!isEqual(value[key], other[key])) {
        return false;
      }
    }
    return true;
  }
  if (type === '[object Function]') {
    return value.prototype === other.prototype;
  }
  if (type === '[object Date]') {
    return value.getTime() === other.getTime();
  }
  return false;
};

var isHosted = function(value, host) {
  var type;
  type = typeof host[value];
  if (type === 'object') {
    return !!host[value];
  } else {
    return !NON_HOST_TYPES[type];
  }
};

var isInstanceof = function(value, constructor) {
  return value instanceof constructor;
};

var isNil = function(value) {
  return value === null;
};

var isUndefined = function(value) {
  return typeof value === 'undefined';
};

var isArrayLike = function(value) {
  return !!value && !isBool(value) && owns.call(value, 'length') && isFinite(value.length) && isNumber(value.length) && value.length >= 0;
};

var isArguments = isArgs = function(value) {
  var isOldArguments, isStandardArguments;
  isStandardArguments = toStr.call(value) === '[object Arguments]';
  isOldArguments = !isArray$1(value) && isArrayLike(value) && isObject(value) && isFn(value.callee);
  return isStandardArguments || isOldArguments;
};

var isArray$1 = Array.isArray || function(value) {
  return toStr.call(value) === '[object Array]';
};

var isEmptyArgs = function(value) {
  return isArgs(value) && value.length === 0;
};

var isEmptyArray = function(value) {
  return isArray$1(value) && value.length === 0;
};

var isBool = function(value) {
  return toStr.call(value) === '[object Boolean]';
};

var isFalse = function(value) {
  return isBool(value) && Boolean(Number(value)) === false;
};

var isTrue = function(value) {
  return isBool(value) && Boolean(Number(value)) === true;
};

var isDate = function(value) {
  return toStr.call(value) === '[object Date]';
};

var isValidDate = function(value) {
  return isDate(value) && !isNaN(Number(value));
};

var isElement = function(value) {
  return value !== void 0 && typeof HTMLElement !== 'undefined' && value instanceof HTMLElement && value.nodeType === 1;
};

var isError = function(value) {
  return toStr.call(value) === '[object Error]';
};

var isFunction$1 = isFn = function(value) {
  var isAlert, str;
  isAlert = typeof window !== 'undefined' && value === window.alert;
  if (isAlert) {
    return true;
  }
  str = toStr.call(value);
  return str === '[object Function]' || str === '[object GeneratorFunction]' || str === '[object AsyncFunction]';
};

var isNumber = function(value) {
  return toStr.call(value) === '[object Number]';
};

var isInfinite = function(value) {
  return value === 2e308 || value === -2e308;
};

var isDecimal = function(value) {
  return isNumber(value) && !isActualNaN(value) && !isInfinite(value) && value % 1 !== 0;
};

var isDivisibleBy = function(value, n) {
  var isDividendInfinite, isDivisorInfinite, isNonZeroNumber;
  isDividendInfinite = isInfinite(value);
  isDivisorInfinite = isInfinite(n);
  isNonZeroNumber = isNumber(value) && !isActualNaN(value) && isNumber(n) && !isActualNaN(n) && n !== 0;
  return isDividendInfinite || isDivisorInfinite || isNonZeroNumber && value % n === 0;
};

var isInteger = function(value) {
  return isNumber(value) && !isActualNaN(value) && value % 1 === 0;
};

var isMaximum = function(value, others) {
  var len;
  if (isActualNaN(value)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!isArrayLike(others)) {
    throw new TypeError('second argument must be array-like');
  }
  len = others.length;
  while (--len >= 0) {
    if (value < others[len]) {
      return false;
    }
  }
  return true;
};

var isMinimum = function(value, others) {
  var len;
  if (isActualNaN(value)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!isArrayLike(others)) {
    throw new TypeError('second argument must be array-like');
  }
  len = others.length;
  while (--len >= 0) {
    if (value > others[len]) {
      return false;
    }
  }
  return true;
};

var isNan = function(value) {
  return isNumber(value) || value !== value;
};

var isEven = function(value) {
  return isInfinite(value) || isNumber(value) && value === value && value % 2 === 0;
};

var isOdd = function(value) {
  return isInfinite(value) || isNumber(value) && value === value && value % 2 !== 0;
};

var isGe = function(value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !isInfinite(value) && !isInfinite(other) && value >= other;
};

var isGt = function(value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !isInfinite(value) && !isInfinite(other) && value > other;
};

var isLe = function(value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !isInfinite(value) && !isInfinite(other) && value <= other;
};

var isLt = function(value, other) {
  if (isActualNaN(value) || isActualNaN(other)) {
    throw new TypeError('NaN is not a valid value');
  }
  return !isInfinite(value) && !isInfinite(other) && value < other;
};

var isWithin = function(value, start, finish) {
  var isAnyInfinite;
  if (isActualNaN(value) || isActualNaN(start) || isActualNaN(finish)) {
    throw new TypeError('NaN is not a valid value');
  } else if (!isNumber(value) || !isNumber(start) || !isNumber(finish)) {
    throw new TypeError('all arguments must be numbers');
  }
  isAnyInfinite = isInfinite(value) || isInfinite(start) || isInfinite(finish);
  return isAnyInfinite || value >= start && value <= finish;
};

var isObject = function(value) {
  return toStr.call(value) === '[object Object]';
};

var isPrimitive = function(value) {
  if (!value) {
    return true;
  }
  if (typeof value === 'object' || isObject(value) || isFn(value) || isArray$1(value)) {
    return false;
  }
  return true;
};

var isHash = function(value) {
  return isObject(value) && value.constructor === Object && !value.nodeType && !value.setInterval;
};

var isRegexp = function(value) {
  return toStr.call(value) === '[object RegExp]';
};

var isString$1 = function(value) {
  return toStr.call(value) === '[object String]';
};

var isBase64 = function(value) {
  return isString$1(value) && (!value.length || base64Regex.test(value));
};

var isHex = function(value) {
  return isString$1(value) && (!value.length || hexRegex.test(value));
};

var isSymbol = function(value) {
  return typeof Symbol === 'function' && toStr.call(value) === '[object Symbol]' && typeof symbolValueOf.call(value) === 'symbol';
};

classic = {
  type: isType,
  defined: isDefined,
  empty: isEmpty,
  equal: isEqual,
  hosted: isHosted,
  'instanceof': isInstanceof,
  instance: isInstanceof,
  nil: isNil,
  undefined: isUndefined,
  undef: isUndefined,
  'arguments': isArguments,
  args: isArguments,
  array: isArray$1,
  arraylike: isArrayLike,
  bool: isBool,
  "false": isFalse,
  "true": isTrue,
  date: isDate,
  element: isElement,
  error: isError,
  "function": isFunction$1,
  fn: isFunction$1,
  number: isNumber,
  infinite: isInfinite,
  decimal: isDecimal,
  divisibleBy: isDivisibleBy,
  integer: isInteger,
  maximum: isMaximum,
  max: isMaximum,
  minimum: isMinimum,
  min: isMinimum,
  nan: isNan,
  even: isEven,
  odd: isOdd,
  ge: isGe,
  gt: isGt,
  le: isLe,
  lt: isLt,
  within: isWithin,
  object: isObject,
  primitive: isPrimitive,
  hash: isHash,
  regexp: isRegexp,
  string: isString$1,
  base64: isBase64,
  hex: isHex,
  symbol: isSymbol
};

classic.args.empty = isEmptyArgs;

classic.array.empty = isEmptyArray;

classic.date.valid = isValidDate;

var classic$1 = classic;

var Cookie;

Cookie = (function() {
  function Cookie() {}

  Cookie.prototype.contructor = function(defaults) {
    this.defaults = defaults != null ? defaults : {};
  };

  Cookie.prototype.api = function(key, value, attrs) {
    var attr, cookie, cookies, err, expires, i, name, parts, rdecode, result, strAttrs;
    if (typeof document === 'undefined') {
      return;
    }
    if (arguments.length > 1) {
      attrs = index$2({
        path: '/'
      }, this.defaults, attrs);
      if (classic$1(attrs.expires)) {
        expires = new Date;
        expires.setMilliseconds(expires.getMilliseconds() + attrs.expires * 864e+5);
        attrs.expires = expires;
      }
      attrs.expires = attrs.expires ? attrs.expires.toUTCString() : '';
      try {
        result = JSON.stringify(value);
        if (/^[\{\[]/.test(result)) {
          value = result;
        }
      } catch (error) {
        err = error;
      }
      value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
      key = encodeURIComponent(String(key));
      key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
      key = key.replace(/[\(\)]/g, escape);
      strAttrs = '';
      for (name in attrs) {
        attr = attrs[name];
        if (!attr) {
          continue;
        }
        strAttrs += '; ' + name;
        if (attr === true) {
          continue;
        }
        strAttrs += '=' + attr;
      }
      return document.cookie = key + '=' + value + strAttrs;
    }
    if (!key) {
      result = {};
    }
    cookies = document.cookie ? document.cookie.split('; ') : [];
    rdecode = /(%[0-9A-Z]{2})+/g;
    i = 0;
    while (i < cookies.length) {
      parts = cookies[i].split('=');
      cookie = parts.slice(1).join('=');
      if (cookie.charAt(0) === '"') {
        cookie = cookie.slice(1, -1);
      }
      try {
        name = parts[0].replace(rdecode, decodeURIComponent);
        cookie = cookie.replace(rdecode, decodeURIComponent);
        if (key === name) {
          result = cookie;
          break;
        }
        if (!key) {
          result[name] = cookie;
        }
      } catch (error) {
        err = error;
      }
    }
    return result;
  };

  Cookie.prototype.get = function(key) {
    return this.api.get(key);
  };

  Cookie.prototype.getJSON = function(key) {
    var err;
    try {
      return JSON.parse(this.api.get(key));
    } catch (error) {
      err = error;
      return {};
    }
  };

  Cookie.prototype.set = function(key, value, attrs) {
    return this.api(key, value, attrs);
  };

  Cookie.prototype.remove = function(key, attrs) {
    return this.api(key, '', index$2(attrs, {
      expires: -1
    }));
  };

  return Cookie;

})();

var Cookie$1 = Cookie;

var index$1$1 = new Cookie$1();

var Client$1;
var slice$1 = [].slice;

Client$1 = (function() {
  function Client(opts) {
    var k, v;
    if (opts == null) {
      opts = {};
    }
    this.opts = {
      debug: false,
      endpoint: 'https://api.hanzo.io',
      session: {
        name: 'hzo',
        expires: 7 * 24 * 3600 * 1000
      }
    };
    for (k in opts) {
      v = opts[k];
      this.opts[k] = v;
    }
  }

  Client.prototype.getKey = function() {
    return this.opts.key;
  };

  Client.prototype.setKey = function(key) {
    return this.opts.key = key;
  };

  Client.prototype.getCustomerToken = function() {
    var session;
    if ((session = index$1$1.getJSON(this.opts.session.name)) != null) {
      if (session.customerToken != null) {
        this.customerToken = session.customerToken;
      }
    }
    return this.customerToken;
  };

  Client.prototype.setCustomerToken = function(key) {
    index$1$1.set(this.opts.session.name, {
      customerToken: key
    }, {
      expires: this.opts.session.expires
    });
    return this.customerToken = key;
  };

  Client.prototype.deleteCustomerToken = function() {
    index$1$1.set(this.opts.session.name, {
      customerToken: null
    }, {
      expires: this.opts.session.expires
    });
    return this.customerToken = null;
  };

  Client.prototype.url = function(url, data, key) {
    if (isFunction(url)) {
      url = url.call(this, data);
    }
    return updateQuery$1(this.opts.endpoint + url, {
      token: key
    });
  };

  Client.prototype.log = function() {
    var args;
    args = 1 <= arguments.length ? slice$1.call(arguments, 0) : [];
    args.unshift('hanzo.js>');
    if (this.opts.debug && (typeof console !== "undefined" && console !== null)) {
      return console.log.apply(console, args);
    }
  };

  return Client;

})();

var Client$2 = Client$1;

var BrowserClient;
var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
var hasProp = {}.hasOwnProperty;

BrowserClient = (function(superClass) {
  extend(BrowserClient, superClass);

  function BrowserClient(opts) {
    if (!(this instanceof BrowserClient)) {
      return new BrowserClient(opts);
    }
    BrowserClient.__super__.constructor.call(this, opts);
    this.getCustomerToken();
  }

  BrowserClient.prototype.request = function(blueprint, data, key) {
    var opts;
    if (data == null) {
      data = {};
    }
    if (key == null) {
      key = this.getKey();
    }
    opts = {
      url: this.url(blueprint.url, data, key),
      method: blueprint.method
    };
    if (blueprint.method !== 'GET') {
      opts.headers = {
        'Content-Type': 'application/json'
      };
    }
    if (blueprint.method === 'GET') {
      opts.url = updateQuery(opts.url, data);
    } else {
      opts.data = JSON.stringify(data);
    }
    this.log('request', {
      key: key,
      opts: opts
    });
    return (new index).send(opts).then((function(_this) {
      return function(res) {
        _this.log('response', res);
        res.data = res.responseText;
        return res;
      };
    })(this))["catch"]((function(_this) {
      return function(res) {
        var err, ref;
        try {
          res.data = (ref = res.responseText) != null ? ref : JSON.parse(res.xhr.responseText);
        } catch (error) {
          err = error;
        }
        err = newError(data, res, err);
        _this.log('response', res);
        _this.log('error', err);
        throw err;
      };
    })(this));
  };

  return BrowserClient;

})(Client$2);

var Client = BrowserClient;

var sp;

var storePrefixed = sp = function(u) {
  return function(x) {
    var url;
    if (isFunction(u)) {
      url = u(x);
    } else {
      url = u;
    }
    if (this.storeId != null) {
      return ("/store/" + this.storeId) + url;
    } else {
      return url;
    }
  };
};

var byId = function(name) {
  switch (name) {
    case 'coupon':
      return sp(function(x) {
        var ref;
        return "/coupon/" + ((ref = x.code) != null ? ref : x);
      });
    case 'collection':
      return sp(function(x) {
        var ref;
        return "/collection/" + ((ref = x.slug) != null ? ref : x);
      });
    case 'product':
      return sp(function(x) {
        var ref, ref1;
        return "/product/" + ((ref = (ref1 = x.id) != null ? ref1 : x.slug) != null ? ref : x);
      });
    case 'variant':
      return sp(function(x) {
        var ref, ref1;
        return "/variant/" + ((ref = (ref1 = x.id) != null ? ref1 : x.sku) != null ? ref : x);
      });
    case 'site':
      return function(x) {
        var ref, ref1;
        return "/site/" + ((ref = (ref1 = x.id) != null ? ref1 : x.name) != null ? ref : x);
      };
    default:
      return function(x) {
        var ref;
        return "/" + name + "/" + ((ref = x.id) != null ? ref : x);
      };
  }
};

var blueprints;
var createBlueprint;
var fn;
var i;
var len;
var model;
var models;

createBlueprint = function(name) {
  var endpoint;
  endpoint = "/" + name;
  return {
    list: {
      url: endpoint,
      method: GET,
      expects: statusOk
    },
    get: {
      url: byId(name),
      method: GET,
      expects: statusOk
    }
  };
};

blueprints = {
  account: {
    get: {
      url: '/account',
      method: GET,
      expects: statusOk,
      useCustomerToken: true
    },
    update: {
      url: '/account',
      method: PATCH,
      expects: statusOk,
      useCustomerToken: true
    },
    exists: {
      url: function(x) {
        var ref, ref1, ref2;
        return "/account/exists/" + ((ref = (ref1 = (ref2 = x.email) != null ? ref2 : x.username) != null ? ref1 : x.id) != null ? ref : x);
      },
      method: GET,
      expects: statusOk,
      process: function(res) {
        return res.data.exists;
      }
    },
    create: {
      url: '/account/create',
      method: POST,
      expects: statusCreated
    },
    enable: {
      url: function(x) {
        var ref;
        return "/account/enable/" + ((ref = x.tokenId) != null ? ref : x);
      },
      method: POST,
      expects: statusOk
    },
    login: {
      url: '/account/login',
      method: POST,
      expects: statusOk,
      process: function(res) {
        this.setCustomerToken(res.data.token);
        return res;
      }
    },
    logout: function() {
      return this.deleteCustomerToken();
    },
    reset: {
      url: '/account/reset',
      method: POST,
      expects: statusOk,
      useCustomerToken: true
    },
    updateOrder: {
      url: function(x) {
        var ref, ref1;
        return "/account/order/" + ((ref = (ref1 = x.orderId) != null ? ref1 : x.id) != null ? ref : x);
      },
      method: PATCH,
      expects: statusOk,
      useCustomerToken: true
    },
    confirm: {
      url: function(x) {
        var ref;
        return "/account/confirm/" + ((ref = x.tokenId) != null ? ref : x);
      },
      method: POST,
      expects: statusOk,
      useCustomerToken: true
    }
  },
  cart: {
    create: {
      url: '/cart',
      method: POST,
      expects: statusCreated
    },
    update: {
      url: function(x) {
        var ref;
        return "/cart/" + ((ref = x.id) != null ? ref : x);
      },
      method: PATCH,
      expects: statusOk
    },
    discard: {
      url: function(x) {
        var ref;
        return "/cart/" + ((ref = x.id) != null ? ref : x) + "/discard";
      },
      method: POST,
      expects: statusOk
    },
    set: {
      url: function(x) {
        var ref;
        return "/cart/" + ((ref = x.id) != null ? ref : x) + "/set";
      },
      method: POST,
      expects: statusOk
    }
  },
  review: {
    create: {
      url: '/review',
      method: POST,
      expects: statusCreated
    },
    get: {
      url: function(x) {
        var ref;
        return "/review/" + ((ref = x.id) != null ? ref : x);
      },
      method: GET,
      expects: statusOk
    }
  },
  checkout: {
    authorize: {
      url: storePrefixed('/checkout/authorize'),
      method: POST,
      expects: statusOk
    },
    capture: {
      url: storePrefixed(function(x) {
        var ref;
        return "/checkout/capture/" + ((ref = x.orderId) != null ? ref : x);
      }),
      method: POST,
      expects: statusOk
    },
    charge: {
      url: storePrefixed('/checkout/charge'),
      method: POST,
      expects: statusOk
    },
    paypal: {
      url: storePrefixed('/checkout/paypal'),
      method: POST,
      expects: statusOk
    }
  },
  referrer: {
    create: {
      url: '/referrer',
      method: POST,
      expects: statusCreated
    },
    get: {
      url: function(x) {
        var ref;
        return "/referrer/" + ((ref = x.id) != null ? ref : x);
      },
      method: GET,
      expects: statusOk
    }
  }
};

models = ['collection', 'coupon', 'product', 'variant'];

fn = function(model) {
  return blueprints[model] = createBlueprint(model);
};
for (i = 0, len = models.length; i < len; i++) {
  model = models[i];
  fn(model);
}

var blueprints$1 = blueprints;

var Hanzo;

Api$1.BLUEPRINTS = blueprints$1;

Api$1.CLIENT = Client;

Hanzo = function(opts) {
  if (opts == null) {
    opts = {};
  }
  if (opts.client == null) {
    opts.client = new Client(opts);
  }
  if (opts.blueprints == null) {
    opts.blueprints = blueprints$1;
  }
  return new Api$1(opts);
};

Hanzo.Api = Api$1;

Hanzo.Client = Client;

var Hanzo$1 = Hanzo;

return Hanzo$1;

}());
