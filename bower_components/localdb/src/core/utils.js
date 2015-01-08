// Generated by CoffeeScript 1.8.0
define(function(require, exports, module) {
  "use strict";
  var ObjectID, Utils, eq, toString, _isType;
  ObjectID = require("lib/bson");
  Utils = {};
  toString = Object.prototype.toString;

  /*
   *  isEqual function is implemented by underscore and I just rewrite in coffee.
   *  https://github.com/jashkenas/underscore/blob/master/underscore.js
   */
  eq = function(a, b, aStack, bStack) {
    var aCtor, areArrays, bCtor, className, key, keys, length, result, size;
    if (a === b) {
      return a !== 0 || 1 / a === 1 / b;
    }
    if (a === null && b === void 0) {
      return false;
    }
    if (a === void 0 && b === null) {
      return false;
    }
    className = toString.call(a);
    if (className !== toString.call(b)) {
      return false;
    }
    switch (className) {
      case "[object RegExp]":
        return "" + a === "" + b;
      case "[object String]":
        return "" + a === "" + b;
      case "[object Number]":
        if (+a !== +a) {
          return +b !== +b;
        }
        if (+a === 0) {
          return 1 / +a === 1 / b;
        } else {
          return +a === +b;
        }
      case "[object Date]":
        return +a === +b;
      case "[object Boolean]":
        return +a === +b;
    }
    areArrays = className === "[object Array]";
    if (!areArrays) {
      if (typeof a !== "object" || typeof b !== "object") {
        return false;
      }
      aCtor = a.constructor;
      bCtor = b.constructor;
      if ((aCtor !== bCtor) && !(Utils.isFunction(aCtor) && aCtor instanceof aCtor && Utils.isFunction(bCtor) && bCtor instanceof bCtor) && ("constructor" in a && "constructor" in b)) {
        return false;
      }
    }
    length = aStack.length;
    while (length--) {
      if (aStack[length] === a) {
        return bStack[length] === b;
      }
    }
    aStack.push(a);
    bStack.push(b);
    if (areArrays) {
      size = a.length;
      result = size === b.length;
      if (result) {
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) {
            break;
          }
        }
      }
    } else {
      keys = Utils.keys(a);
      size = keys.length;
      result = Utils.keys(b).length === size;
      if (result) {
        while (size--) {
          key = keys[size];
          if (!(result = Utils.has(b, key) && eq(a[key], b[key], aStack, bStack))) {
            break;
          }
        }
      }
    }
    aStack.pop();
    bStack.pop();
    return result;
  };
  _isType = function(type) {
    return function(obj) {
      return toString.call(obj).toLowerCase() === ("[object " + type + "]").toLowerCase();
    };
  };
  Utils.isType = function(ele, type) {
    return _isType(type)(ele);
  };
  Utils.isObject = _isType("object");
  Utils.isString = _isType("string");
  Utils.isNumber = _isType("number");
  Utils.isArray = _isType("array");
  Utils.isFunction = _isType("function");
  Utils.isRegex = _isType("regexp");
  Utils.keys = function(obj) {
    if (!Utils.isObject(obj)) {
      return [];
    }
    if (Object.keys) {
      return Object.keys(obj);
    }
  };
  Utils.has = function(obj, key) {
    return (obj != null) && Object.prototype.hasOwnProperty.call(obj, key);
  };
  Utils.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };
  Utils.createObjectId = function() {
    return (new ObjectID()).inspect();
  };
  Utils.stringify = function(arr) {
    if ((arr == null) || !Utils.isArray(arr)) {
      return "[]";
    }
    return JSON.stringify(arr, function(key, value) {
      if (Utils.isRegex(value) || Utils.isFunction(value)) {
        return value.toString();
      }
      return value;
    });
  };
  Utils.parse = function(str) {
    if ((str == null) || !Utils.isString(str)) {
      return [];
    }
    return JSON.parse(str, function(key, value) {
      var v;
      try {
        v = eval(value);
      } catch (_error) {}
      if ((v != null) && Utils.isRegex(v)) {
        return v;
      }
      try {
        v = eval("(" + value + ")");
      } catch (_error) {}
      if ((v != null) && Utils.isFunction(v)) {
        return v;
      }
      return value;
    });
  };
  Utils.parseParas = function(paras) {
    var callback, options;
    options = {};
    callback = null;
    if (paras.length === 1) {
      if (Utils.isObject(paras[0])) {
        options = paras[0];
      } else if (Utils.isFunction(paras[0])) {
        callback = paras[0];
      }
    } else if (paras.length === 2) {
      if (Utils.isObject(paras[0])) {
        options = paras[0];
      }
      if (Utils.isFunction(paras[1])) {
        callback = paras[1];
      }
    }
    return [options, callback];
  };
  Utils.getTimestamp = function(objectId) {
    return (new ObjectID(objectId)).getTimestamp();
  };
  Utils.getTime = function(objectId) {
    return (new ObjectID(objectId)).getTime();
  };
  Utils.toUnicode = function(string) {
    var char, index, result, uniChar;
    result = [""];
    index = 1;
    while (index <= string.length) {
      char = string.charCodeAt(index - 1);
      uniChar = "00" + char.toString(16);
      uniChar = uniChar.slice(-4);
      result.push(uniChar);
      index += 1;
    }
    return result.join("\\u");
  };
  Utils.fromUnicode = function(string) {
    return unescape(string.replace(/\\/g, "%"));
  };
  Utils.getSubValue = function(value, key) {
    var k, keyArr, _i, _len;
    if (value == null) {
      return value;
    }
    keyArr = key.split(".");
    for (_i = 0, _len = keyArr.length; _i < _len; _i++) {
      k = keyArr[_i];
      value = value[k];
      if (value == null) {
        return value;
      }
    }
    return value;
  };

  /*
    * 快速排序
    * @param array 待排序数组
    * @param key 排序字段
    * @param order 排序方式（1:升序，-1降序）
   */
  Utils.quickSort = function(array, key, order) {
    var compareValue, leftArr, pointCompareValue, pointValue, rightArr, value, _i, _len;
    if (!Utils.isString(key)) {
      throw new Error("type Error: key");
    }
    if (array.length <= 1) {
      return array;
    }
    pointValue = array.splice(0, 1)[0];
    pointCompareValue = Utils.getSubValue(pointValue, key);
    leftArr = [];
    rightArr = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      value = array[_i];
      compareValue = Utils.getSubValue(value, key);
      ((compareValue == null) || compareValue < pointCompareValue ? leftArr : rightArr).push(value);
    }
    return Utils.quickSort((order === 1 ? leftArr : rightArr), key, order).concat([pointValue], Utils.quickSort((order === 1 ? rightArr : leftArr), key, order));
  };

  /*
    * 数据排序
   */
  Utils.sortObj = function(data, sortObj) {
    var key, order, result, sort, sortArr, _i, _len;
    if (sortObj == null) {
      return data;
    }
    result = data;
    sortArr = [];
    for (key in sortObj) {
      order = sortObj[key];
      sortArr.unshift({
        key: key,
        order: order
      });
    }
    for (_i = 0, _len = sortArr.length; _i < _len; _i++) {
      sort = sortArr[_i];
      result = Utils.quickSort(result, sort.key, sort.order);
    }
    return result;
  };

  /*
   *  根据src获取iframe
   */
  Utils.getIframe = function(src) {
    var allFrames, frame, _i, _len;
    allFrames = document.getElementsByTagName("iframe");
    for (_i = 0, _len = allFrames.length; _i < _len; _i++) {
      frame = allFrames[_i];
      if (frame.src.indexOf(src) === 0) {
        return frame;
      }
    }
    return null;
  };

  /*
   *  创建Iframe
   */
  Utils.createIframe = function(src) {
    var iframe;
    iframe = Utils.getIframe(src);
    if (iframe != null) {
      return iframe;
    }
    iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    return iframe;
  };
  Utils.getDomain = function(url) {
    return url.match(/(https?:\/\/)?([^\/]+)/)[2].split(":")[0];
  };
  Utils.getOrigin = function(url) {
    return url.match(/(https?:\/\/)?([^\/]+)/)[0];
  };
  return module.exports = Utils;
});
