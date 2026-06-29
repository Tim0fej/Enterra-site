"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DAAPI = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

var _got = _interopRequireDefault(require("got"));

var _events = require("events");

var _symbols = require("./symbols");

var _parsers = require("./parsers");

var _constants = require("../constants");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _wrapRegExp(re, groups) { _wrapRegExp = function _wrapRegExp(re, groups) { return new BabelRegExp(re, undefined, groups); }; var _RegExp = (0, _wrapNativeSuper2["default"])(RegExp); var _super = RegExp.prototype; var _groups = new WeakMap(); function BabelRegExp(re, flags, groups) { var _this = _RegExp.call(this, re, flags); _groups.set(_this, groups || _groups.get(re)); return _this; } (0, _inherits2["default"])(BabelRegExp, _RegExp); BabelRegExp.prototype.exec = function (str) { var result = _super.exec.call(this, str); if (result) result.groups = buildGroups(result, this); return result; }; BabelRegExp.prototype[Symbol.replace] = function (str, substitution) { if (typeof substitution === "string") { var groups = _groups.get(this); return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) { return "$" + groups[name]; })); } else if (typeof substitution === "function") { var _this = this; return _super[Symbol.replace].call(this, str, function () { var args = []; args.push.apply(args, arguments); if (_typeof(args[args.length - 1]) !== "object") { args.push(buildGroups(args, _this)); } return substitution.apply(this, args); }); } else { return _super[Symbol.replace].call(this, str, substitution); } }; function buildGroups(result, re) { var g = _groups.get(re); return Object.keys(g).reduce(function (groups, name) { groups[name] = result[g[name]]; return groups; }, Object.create(null)); } return _wrapRegExp.apply(this, arguments); }

var regexAccessToken = /*#__PURE__*/_wrapRegExp(/access_token[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*=[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*('|")([\x2D\.0-9A-Z\\_a-z]+)\1/, {
  token: 2
});
/*
GET /api/v1/speechsynthesis?alert_id=&alert_type=&text=
POST /api/createsubscriber { "alert_type" : "youtube_membership" | "twitch_follow", "token" : token, "is_shown": 1 || 0, "event_data" : JSON.stringify(value) }
POST /api/createhost { "token" : _0x538a46, "channel_id" : _0x1f9e8e.channel_id, "is_shown" : 0, "event_data" : JSON.stringify({ "channel" : _0x518cd9, "username" : _0x39b86b, "viewers" : _0x1eb2ec, "autohost" : _0x5dfb47 }) }

/api/v1/widgetlog

/api/createraid
/api/createcheer
/api/createreward
/api/creategiftpaidupgrade
/api/getisswidgetdata
/api/createmysterygift

getPayList() {
        return ApiService.get('/payin/systems')
    },

    getCurrencyList() {
        return ApiService.get('/payin/systems/currencies')
    },

    getResult({ amount, system, currency }) {
        return ApiService.get(`/payin/systems/commission?amount=${ amount }&system=${ system }&currency=${ currency }&currency_expected=${ currency }`)
    }


      getLocalization(params = '') {
        return ApiService.post('/localization', params)
    }

     getStickerBalance(userId) {
        return ApiService.get('/sticker/list?user_id=' + userId)
    },

    getStreamPreview(userId) {
        return ApiService.get('/stream?user_id=' + userId)
    },

    getStickers(userId) {
        return ApiService.get('/sticker?user_id=' + userId)
    },

    postStickers(data) {
        return ApiService.post('/sticker', data)
    },

    putSticker({id, is_active}) {
        return ApiService.put(`/sticker/${ id }`, {
            is_active,
        })
    },

    delStickers(id) {
        return ApiService.delete('/sticker/' + id)
    },

    putStickers({stickers_ids, is_active}) {
        return ApiService.put('/sticker', {
            stickers_ids,
            is_active,
        })
    },

    https://www.donationalerts.com/dashboard/send-offers

    emitWidgetEvent: function(e, n) {
                        Object(r["a"])(e);
                        var i = n.event,
                            a = n.eventData,
                            o = void 0 === a ? null : a;
                        t.post("/widgets/emit-event", {
                            event: i,
                            eventData: o
                        })
                    },
                    createCustomAlert: function(e, n) {
                        Object(r["a"])(e);
                        var i = n.header,
                            a = n.message,
                            o = n.isShown,
                            s = void 0 === o ? 1 : o;
                        return t.post("/custom_alert", {
                            header: i,
                            message: a,
                            is_shown: s
                        })

                        this.addTestAlert = function(widget_id) {
		$.ajax({
			url: '/alert-variations/addtestalert',
			type: 'POST',
			data: { widget_id: widget_id },
			cache: false,
			dataType: 'json',
			context: this,
			resultContainer: this.grid_container_id,
			success: function(data, textStatus, jqXHR){
				addStatusMessage(data.status, data.text);
			}
		});
	}

	this.removeAlertQueue = function(alert_type) {
		if (confirm(translateString('alert_variations_clear_queue_warning'))) {
			$.ajax({
				url: '/alert-variations/removealertqueue',
				type: 'POST',
				data: { alert_type: alert_type },
				cache: false,
				dataType: 'json',
				context: this,
				resultContainer: this.grid_container_id,
				success: function(data, textStatus, jqXHR){
					addStatusMessage(data.status, data.text);
				}
			});
		};
	}

*/


var DAAPI = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(DAAPI, _EventEmitter);

  var _super2 = _createSuper(DAAPI);

  function DAAPI(token) {
    var _this2;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        accessToken = _ref.accessToken;

    (0, _classCallCheck2["default"])(this, DAAPI);
    _this2 = _super2.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "token", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "accessToken", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), _symbols.GOT, _got["default"].extend({
      prefixUrl: _constants.DA_URL
    }));
    _this2.token = token;
    _this2.accessToken = accessToken;
    return _this2;
  }

  (0, _createClass2["default"])(DAAPI, [{
    key: "crawlWidget",
    value: function () {
      var _crawlWidget = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _regexAccessToken$exe, _regexAccessToken$exe2;

        var body, accessToken, prev;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this[_symbols.GOT]("widget/alerts", {
                  searchParams: {
                    token: this.token
                  },
                  resolveBodyOnly: true
                });

              case 2:
                body = _context.sent;
                accessToken = (_regexAccessToken$exe = regexAccessToken.exec(body)) === null || _regexAccessToken$exe === void 0 ? void 0 : (_regexAccessToken$exe2 = _regexAccessToken$exe.groups) === null || _regexAccessToken$exe2 === void 0 ? void 0 : _regexAccessToken$exe2.token;

                if (accessToken) {
                  _context.next = 6;
                  break;
                }

                throw new Error("Could not parse access token");

              case 6:
                prev = {
                  accessToken: this.accessToken
                };
                this.accessToken = accessToken;
                return _context.abrupt("return", {
                  prev: prev,
                  accessToken: accessToken
                });

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function crawlWidget() {
        return _crawlWidget.apply(this, arguments);
      }

      return crawlWidget;
    }()
  }, {
    key: "getUser",
    value: function () {
      var _getUser = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _yield$this$requestAp, data;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.requestApi("user");

              case 2:
                _yield$this$requestAp = _context2.sent;
                data = _yield$this$requestAp.data;
                return _context2.abrupt("return", (0, _parsers.parseUser)(data));

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getUser() {
        return _getUser.apply(this, arguments);
      }

      return getUser;
    }()
  }, {
    key: "markAlertShown",
    value: function () {
      var _markAlertShown = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(_ref2) {
        var id, type, _yield$this$requestIn, message;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                id = _ref2.id, type = _ref2.type;
                _context3.next = 3;
                return this.requestInternalApi("markalertshown", {
                  params: {
                    alert: id,
                    alert_type: type
                  }
                });

              case 3:
                _yield$this$requestIn = _context3.sent;
                message = _yield$this$requestIn.message;
                return _context3.abrupt("return", message);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function markAlertShown(_x) {
        return _markAlertShown.apply(this, arguments);
      }

      return markAlertShown;
    }()
  }, {
    key: "repeatAlert",
    value: function () {
      var _repeatAlert = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(_ref3) {
        var id, type, _yield$this$requestIn2, message;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                id = _ref3.id, type = _ref3.type;
                _context4.next = 3;
                return this.requestInternalApi("repeatalert", {
                  params: {
                    alert: id,
                    alert_type: type
                  }
                });

              case 3:
                _yield$this$requestIn2 = _context4.sent;
                message = _yield$this$requestIn2.message;
                return _context4.abrupt("return", message);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function repeatAlert(_x2) {
        return _repeatAlert.apply(this, arguments);
      }

      return repeatAlert;
    }()
  }, {
    key: "skipAlert",
    value: function () {
      var _skipAlert = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(_ref4) {
        var id, type, _yield$this$requestIn3, message;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                id = _ref4.id, type = _ref4.type;
                _context5.next = 3;
                return this.requestInternalApi("skipalert", {
                  params: {
                    alert: id,
                    alert_type: type
                  }
                });

              case 3:
                _yield$this$requestIn3 = _context5.sent;
                message = _yield$this$requestIn3.message;
                return _context5.abrupt("return", message);

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function skipAlert(_x3) {
        return _skipAlert.apply(this, arguments);
      }

      return skipAlert;
    }()
  }, {
    key: "skipMedia",
    value: function () {
      var _skipMedia = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(id) {
        var _yield$this$requestIn4, message;

        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.requestInternalApi("skipmedia", {
                  params: {
                    media_id: id
                  }
                });

              case 2:
                _yield$this$requestIn4 = _context6.sent;
                message = _yield$this$requestIn4.message;
                return _context6.abrupt("return", message);

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function skipMedia(_x4) {
        return _skipMedia.apply(this, arguments);
      }

      return skipMedia;
    }()
  }, {
    key: "markMediaPlayed",
    value: function () {
      var _markMediaPlayed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(id) {
        var _yield$this$requestIn5, message;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.requestInternalApi("markmediaplayed", {
                  params: {
                    media_id: id
                  }
                });

              case 2:
                _yield$this$requestIn5 = _context7.sent;
                message = _yield$this$requestIn5.message;
                return _context7.abrupt("return", message);

              case 5:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function markMediaPlayed(_x5) {
        return _markMediaPlayed.apply(this, arguments);
      }

      return markMediaPlayed;
    }()
  }, {
    key: "getMedia",
    value: function () {
      var _getMedia = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        var _yield$this$requestIn6, media;

        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.requestInternalApi("getmediadata");

              case 2:
                _yield$this$requestIn6 = _context8.sent;
                media = _yield$this$requestIn6.media;
                return _context8.abrupt("return", {
                  raw: media
                });

              case 5:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function getMedia() {
        return _getMedia.apply(this, arguments);
      }

      return getMedia;
    }()
  }, {
    key: "getPollWidget",
    value: function () {
      var _getPollWidget = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        var _yield$this$requestIn7, data;

        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.requestInternalApi("getpollwidgetdata");

              case 2:
                _yield$this$requestIn7 = _context9.sent;
                data = _yield$this$requestIn7.data;
                return _context9.abrupt("return", {
                  raw: data
                });

              case 5:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getPollWidget() {
        return _getPollWidget.apply(this, arguments);
      }

      return getPollWidget;
    }()
  }, {
    key: "getWidget",
    value: function () {
      var _getWidget = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        var _yield$this$requestIn8, alerts, settings, tts_mins, raw;

        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.requestInternalApi("getwidgetdata");

              case 2:
                _yield$this$requestIn8 = _context10.sent;
                alerts = _yield$this$requestIn8.alerts;
                settings = _yield$this$requestIn8.settings;
                tts_mins = _yield$this$requestIn8.tts_mins;
                raw = (0, _objectWithoutProperties2["default"])(_yield$this$requestIn8, ["alerts", "settings", "tts_mins"]);
                return _context10.abrupt("return", {
                  alerts: (0, _toConsumableArray2["default"])(alerts).map(_parsers.parseDonation),
                  settings: {
                    raw: settings // TODO: parse

                  },
                  ttsMins: Object.entries(tts_mins).reduce(function (prev, _ref5, i) {
                    var _ref6 = (0, _slicedToArray2["default"])(_ref5, 2),
                        key = _ref6[0],
                        value = _ref6[1];

                    return _objectSpread(_objectSpread({}, prev), {}, (0, _defineProperty2["default"])({}, key, +value));
                  }, {}),
                  raw: raw
                });

              case 8:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getWidget() {
        return _getWidget.apply(this, arguments);
      }

      return getWidget;
    }()
  }, {
    key: "requestApi",
    value: function () {
      var _requestApi = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(endpoint) {
        var _ref7,
            _ref7$version,
            version,
            _ref7$method,
            method,
            data,
            params,
            body,
            _args11 = arguments;

        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _ref7 = _args11.length > 1 && _args11[1] !== undefined ? _args11[1] : {}, _ref7$version = _ref7.version, version = _ref7$version === void 0 ? 1 : _ref7$version, _ref7$method = _ref7.method, method = _ref7$method === void 0 ? "GET" : _ref7$method, data = _ref7.data, params = _ref7.params;

                if (this.accessToken) {
                  _context11.next = 4;
                  break;
                }

                _context11.next = 4;
                return this.crawlWidget();

              case 4:
                _context11.next = 6;
                return this[_symbols.GOT]("api/v".concat(version, "/").concat(endpoint), {
                  headers: {
                    Authorization: "Bearer ".concat(this.accessToken),
                    "Accept-Language": undefined // set lang

                  },
                  responseType: "json",
                  resolveBodyOnly: true,
                  method: method,
                  json: data,
                  searchParams: params
                });

              case 6:
                body = _context11.sent;
                return _context11.abrupt("return", body);

              case 8:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function requestApi(_x6) {
        return _requestApi.apply(this, arguments);
      }

      return requestApi;
    }()
  }, {
    key: "requestInternalApi",
    value: function () {
      var _requestInternalApi = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(endpoint) {
        var _ref8,
            _ref8$method,
            method,
            data,
            params,
            body,
            response,
            status,
            raw,
            _args12 = arguments;

        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _ref8 = _args12.length > 1 && _args12[1] !== undefined ? _args12[1] : {}, _ref8$method = _ref8.method, method = _ref8$method === void 0 ? "GET" : _ref8$method, data = _ref8.data, params = _ref8.params;
                _context12.next = 3;
                return this[_symbols.GOT]("api/".concat(endpoint), {
                  headers: {
                    "Accept-Language": undefined // set lang

                  },
                  responseType: "text",
                  resolveBodyOnly: true,
                  method: method,
                  json: data,
                  searchParams: _objectSpread(_objectSpread({}, params), {}, {
                    token: this.token
                  })
                });

              case 3:
                body = _context12.sent;
                response = JSON.parse(body.replace(/^\((.+)\)$/, "$1"));
                _context12.t0 = response.status;
                _context12.next = _context12.t0 === "error" ? 8 : _context12.t0 === "success" ? 9 : 9;
                break;

              case 8:
                throw new Error(response.message);

              case 9:
                status = response.status, raw = (0, _objectWithoutProperties2["default"])(response, ["status"]);
                return _context12.abrupt("return", raw);

              case 11:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function requestInternalApi(_x7) {
        return _requestInternalApi.apply(this, arguments);
      }

      return requestInternalApi;
    }()
  }]);
  return DAAPI;
}(_events.EventEmitter);

exports.DAAPI = DAAPI;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvYXBpLnRzIl0sIm5hbWVzIjpbInJlZ2V4QWNjZXNzVG9rZW4iLCJEQUFQSSIsInRva2VuIiwiYWNjZXNzVG9rZW4iLCJHT1QiLCJnb3QiLCJleHRlbmQiLCJwcmVmaXhVcmwiLCJEQV9VUkwiLCJzZWFyY2hQYXJhbXMiLCJyZXNvbHZlQm9keU9ubHkiLCJib2R5IiwiZXhlYyIsImdyb3VwcyIsIkVycm9yIiwicHJldiIsInJlcXVlc3RBcGkiLCJkYXRhIiwiaWQiLCJ0eXBlIiwicmVxdWVzdEludGVybmFsQXBpIiwicGFyYW1zIiwiYWxlcnQiLCJhbGVydF90eXBlIiwibWVzc2FnZSIsIm1lZGlhX2lkIiwibWVkaWEiLCJyYXciLCJhbGVydHMiLCJzZXR0aW5ncyIsInR0c19taW5zIiwibWFwIiwicGFyc2VEb25hdGlvbiIsInR0c01pbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwicmVkdWNlIiwiaSIsImtleSIsInZhbHVlIiwiZW5kcG9pbnQiLCJ2ZXJzaW9uIiwibWV0aG9kIiwiY3Jhd2xXaWRnZXQiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsInVuZGVmaW5lZCIsInJlc3BvbnNlVHlwZSIsImpzb24iLCJyZXNwb25zZSIsIkpTT04iLCJwYXJzZSIsInJlcGxhY2UiLCJzdGF0dXMiLCJFdmVudEVtaXR0ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsZ0JBQWdCLDRCQUFHLHFMQUFIO0FBQUE7QUFBQSxFQUF0QjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFFYUMsSzs7Ozs7QUFTVCxpQkFBWUMsS0FBWixFQUE0RTtBQUFBOztBQUFBLG1GQUFKLEVBQUk7QUFBQSxRQUEvQ0MsV0FBK0MsUUFBL0NBLFdBQStDOztBQUFBO0FBQ3hFO0FBRHdFO0FBQUE7QUFBQSxzRkFKbkVDLFlBSW1FLEVBSjVEQyxnQkFBSUMsTUFBSixDQUFXO0FBQ3ZCQyxNQUFBQSxTQUFTLEVBQUVDO0FBRFksS0FBWCxDQUk0RDtBQUd4RSxXQUFLTixLQUFMLEdBQWFBLEtBQWI7QUFDQSxXQUFLQyxXQUFMLEdBQW1CQSxXQUFuQjtBQUp3RTtBQUszRTs7Ozs7Ozs7Ozs7Ozs7dUJBR3NCLEtBQUtDLFlBQUwsRUFBVSxlQUFWLEVBQTJCO0FBQzFDSyxrQkFBQUEsWUFBWSxFQUFFO0FBQ1ZQLG9CQUFBQSxLQUFLLEVBQUUsS0FBS0E7QUFERixtQkFENEI7QUFJMUNRLGtCQUFBQSxlQUFlLEVBQUU7QUFKeUIsaUJBQTNCLEM7OztBQUFiQyxnQkFBQUEsSTtBQU9BUixnQkFBQUEsVyw0QkFBY0gsZ0JBQWdCLENBQUNZLElBQWpCLENBQXNCRCxJQUF0QixDLG9GQUFBLHNCQUE2QkUsTSwyREFBN0IsdUJBQXFDWCxLOztvQkFFckRDLFc7Ozs7O3NCQUFtQixJQUFJVyxLQUFKLENBQVUsOEJBQVYsQzs7O0FBRWpCQyxnQkFBQUEsSSxHQUFPO0FBQ1RaLGtCQUFBQSxXQUFXLEVBQUUsS0FBS0E7QUFEVCxpQjtBQUliLHFCQUFLQSxXQUFMLEdBQW1CQSxXQUFuQjtpREFFTztBQUNIWSxrQkFBQUEsSUFBSSxFQUFKQSxJQURHO0FBRUhaLGtCQUFBQSxXQUFXLEVBQVhBO0FBRkcsaUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkFPZ0IsS0FBS2EsVUFBTCxDQUFnQixNQUFoQixDOzs7O0FBQWZDLGdCQUFBQSxJLHlCQUFBQSxJO2tEQUVELHdCQUFVQSxJQUFWLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSVBDLGdCQUFBQSxFLFNBQUFBLEUsRUFDQUMsSSxTQUFBQSxJOzt1QkFLMEIsS0FBS0Msa0JBQUwsQ0FBd0IsZ0JBQXhCLEVBQTBDO0FBQ2hFQyxrQkFBQUEsTUFBTSxFQUFFO0FBQ0pDLG9CQUFBQSxLQUFLLEVBQUVKLEVBREg7QUFFSkssb0JBQUFBLFVBQVUsRUFBRUo7QUFGUjtBQUR3RCxpQkFBMUMsQzs7OztBQUFsQkssZ0JBQUFBLE8seUJBQUFBLE87a0RBT0RBLE87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSVBOLGdCQUFBQSxFLFNBQUFBLEUsRUFDQUMsSSxTQUFBQSxJOzt1QkFLMEIsS0FBS0Msa0JBQUwsQ0FBd0IsYUFBeEIsRUFBdUM7QUFDN0RDLGtCQUFBQSxNQUFNLEVBQUU7QUFDSkMsb0JBQUFBLEtBQUssRUFBRUosRUFESDtBQUVKSyxvQkFBQUEsVUFBVSxFQUFFSjtBQUZSO0FBRHFELGlCQUF2QyxDOzs7O0FBQWxCSyxnQkFBQUEsTywwQkFBQUEsTztrREFPREEsTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJUE4sZ0JBQUFBLEUsU0FBQUEsRSxFQUNBQyxJLFNBQUFBLEk7O3VCQUswQixLQUFLQyxrQkFBTCxDQUF3QixXQUF4QixFQUFxQztBQUMzREMsa0JBQUFBLE1BQU0sRUFBRTtBQUNKQyxvQkFBQUEsS0FBSyxFQUFFSixFQURIO0FBRUpLLG9CQUFBQSxVQUFVLEVBQUVKO0FBRlI7QUFEbUQsaUJBQXJDLEM7Ozs7QUFBbEJLLGdCQUFBQSxPLDBCQUFBQSxPO2tEQU9EQSxPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VIQUdLTixFOzs7Ozs7Ozt1QkFDYyxLQUFLRSxrQkFBTCxDQUF3QixXQUF4QixFQUFxQztBQUMzREMsa0JBQUFBLE1BQU0sRUFBRTtBQUNKSSxvQkFBQUEsUUFBUSxFQUFFUDtBQUROO0FBRG1ELGlCQUFyQyxDOzs7O0FBQWxCTSxnQkFBQUEsTywwQkFBQUEsTztrREFNREEsTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2SEFHV04sRTs7Ozs7Ozs7dUJBQ1EsS0FBS0Usa0JBQUwsQ0FBd0IsaUJBQXhCLEVBQTJDO0FBQ2pFQyxrQkFBQUEsTUFBTSxFQUFFO0FBQ0pJLG9CQUFBQSxRQUFRLEVBQUVQO0FBRE47QUFEeUQsaUJBQTNDLEM7Ozs7QUFBbEJNLGdCQUFBQSxPLDBCQUFBQSxPO2tEQU1EQSxPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUJBSWlCLEtBQUtKLGtCQUFMLENBQXdCLGNBQXhCLEM7Ozs7QUFBaEJNLGdCQUFBQSxLLDBCQUFBQSxLO2tEQUVEO0FBQUVDLGtCQUFBQSxHQUFHLEVBQUVEO0FBQVAsaUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkFJZ0IsS0FBS04sa0JBQUwsQ0FBd0IsbUJBQXhCLEM7Ozs7QUFBZkgsZ0JBQUFBLEksMEJBQUFBLEk7a0RBRUQ7QUFBRVUsa0JBQUFBLEdBQUcsRUFBRVY7QUFBUCxpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQUk4QyxLQUFLRyxrQkFBTCxDQUF3QixlQUF4QixDOzs7O0FBQTdDUSxnQkFBQUEsTSwwQkFBQUEsTTtBQUFRQyxnQkFBQUEsUSwwQkFBQUEsUTtBQUFVQyxnQkFBQUEsUSwwQkFBQUEsUTtBQUFhSCxnQkFBQUEsRzttREFFaEM7QUFDSEMsa0JBQUFBLE1BQU0sRUFBRSxvQ0FBSUEsTUFBSixFQUFZRyxHQUFaLENBQWdCQyxzQkFBaEIsQ0FETDtBQUVISCxrQkFBQUEsUUFBUSxFQUFFO0FBQ05GLG9CQUFBQSxHQUFHLEVBQUVFLFFBREMsQ0FDUTs7QUFEUixtQkFGUDtBQUtISSxrQkFBQUEsT0FBTyxFQUFFQyxNQUFNLENBQUNDLE9BQVAsQ0FBdUJMLFFBQXZCLEVBQWlDTSxNQUFqQyxDQUF3QyxVQUFDckIsSUFBRCxTQUFxQnNCLENBQXJCO0FBQUE7QUFBQSx3QkFBUUMsR0FBUjtBQUFBLHdCQUFhQyxLQUFiOztBQUFBLDJEQUFpQ3hCLElBQWpDLDRDQUF3Q3VCLEdBQXhDLEVBQTBELENBQUNDLEtBQTNEO0FBQUEsbUJBQXhDLEVBQXdJLEVBQXhJLENBTE47QUFNSFosa0JBQUFBLEdBQUcsRUFBSEE7QUFORyxpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt5SEFVTWEsUTs7Ozs7Ozs7Ozs7Ozs7O3NGQVNiLEUsd0JBUkFDLE8sRUFBQUEsTyw4QkFBVSxDLHVDQUNWQyxNLEVBQUFBLE0sNkJBQVMsSyxpQkFDVHpCLEksU0FBQUEsSSxFQUNBSSxNLFNBQUFBLE07O29CQU1JLEtBQUtsQixXOzs7Ozs7dUJBQW1CLEtBQUt3QyxXQUFMLEU7Ozs7dUJBRVQsS0FBS3ZDLFlBQUwsaUJBQWtCcUMsT0FBbEIsY0FBNkJELFFBQTdCLEdBQXlDO0FBQ3hESSxrQkFBQUEsT0FBTyxFQUFFO0FBQ0xDLG9CQUFBQSxhQUFhLG1CQUFZLEtBQUsxQyxXQUFqQixDQURSO0FBRUwsdUNBQW1CMkMsU0FGZCxDQUV3Qjs7QUFGeEIsbUJBRCtDO0FBS3hEQyxrQkFBQUEsWUFBWSxFQUFFLE1BTDBDO0FBTXhEckMsa0JBQUFBLGVBQWUsRUFBRSxJQU51QztBQU94RGdDLGtCQUFBQSxNQUFNLEVBQU5BLE1BUHdEO0FBUXhETSxrQkFBQUEsSUFBSSxFQUFFL0IsSUFSa0Q7QUFTeERSLGtCQUFBQSxZQUFZLEVBQUVZO0FBVDBDLGlCQUF6QyxDOzs7QUFBYlYsZ0JBQUFBLEk7bURBWUNBLEk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUlBR2M2QixROzs7Ozs7Ozs7Ozs7Ozs7O3NGQVFyQixFLHVCQVBBRSxNLEVBQUFBLE0sNkJBQVMsSyxpQkFDVHpCLEksU0FBQUEsSSxFQUNBSSxNLFNBQUFBLE07O3VCQU1tQixLQUFLakIsWUFBTCxnQkFBaUJvQyxRQUFqQixHQUE2QjtBQUM1Q0ksa0JBQUFBLE9BQU8sRUFBRTtBQUNMLHVDQUFtQkUsU0FEZCxDQUN3Qjs7QUFEeEIsbUJBRG1DO0FBSTVDQyxrQkFBQUEsWUFBWSxFQUFFLE1BSjhCO0FBSzVDckMsa0JBQUFBLGVBQWUsRUFBRSxJQUwyQjtBQU01Q2dDLGtCQUFBQSxNQUFNLEVBQU5BLE1BTjRDO0FBTzVDTSxrQkFBQUEsSUFBSSxFQUFFL0IsSUFQc0M7QUFRNUNSLGtCQUFBQSxZQUFZLGtDQUNMWSxNQURLO0FBRVJuQixvQkFBQUEsS0FBSyxFQUFFLEtBQUtBO0FBRko7QUFSZ0MsaUJBQTdCLEM7OztBQUFiUyxnQkFBQUEsSTtBQWNBc0MsZ0JBQUFBLFEsR0FLRkMsSUFBSSxDQUFDQyxLQUFMLENBQVd4QyxJQUFJLENBQUN5QyxPQUFMLENBQWEsWUFBYixFQUEyQixJQUEzQixDQUFYLEM7Z0NBRUdILFFBQVEsQ0FBQ0ksTTtvREFDUCxPLHlCQUdBLFM7Ozs7c0JBRkssSUFBSXZDLEtBQUosQ0FBVW1DLFFBQVEsQ0FBQ3pCLE9BQW5CLEM7OztBQUdFNkIsZ0JBQUFBLE0sR0FBbUJKLFEsQ0FBbkJJLE0sRUFBVzFCLEcsNkNBQVFzQixRO21EQUNwQnRCLEc7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQTdNSTJCLG9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGdvdCwgeyBNZXRob2QgfSBmcm9tIFwiZ290XCJcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJldmVudHNcIiBcblxuaW1wb3J0IHsgQWxlcnRUeXBlLCBDdXJyZW5jeSB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBHT1QgfSBmcm9tIFwiLi9zeW1ib2xzXCI7XG5pbXBvcnQgeyBwYXJzZURvbmF0aW9uLCBwYXJzZVVzZXIgfSBmcm9tIFwiLi9wYXJzZXJzXCI7XG5cbmltcG9ydCB7IERBX1VSTCB9IGZyb20gXCIuLi9jb25zdGFudHNcIjtcblxuY29uc3QgcmVnZXhBY2Nlc3NUb2tlbiA9IC9hY2Nlc3NfdG9rZW5cXHMqPVxccyooJ3xcIikoPzx0b2tlbj5bXFx3XFwuXFxcXC1dKylcXDEvXG5cbi8qXG5HRVQgL2FwaS92MS9zcGVlY2hzeW50aGVzaXM/YWxlcnRfaWQ9JmFsZXJ0X3R5cGU9JnRleHQ9XG5QT1NUIC9hcGkvY3JlYXRlc3Vic2NyaWJlciB7IFwiYWxlcnRfdHlwZVwiIDogXCJ5b3V0dWJlX21lbWJlcnNoaXBcIiB8IFwidHdpdGNoX2ZvbGxvd1wiLCBcInRva2VuXCIgOiB0b2tlbiwgXCJpc19zaG93blwiOiAxIHx8IDAsIFwiZXZlbnRfZGF0YVwiIDogSlNPTi5zdHJpbmdpZnkodmFsdWUpIH1cblBPU1QgL2FwaS9jcmVhdGVob3N0IHsgXCJ0b2tlblwiIDogXzB4NTM4YTQ2LCBcImNoYW5uZWxfaWRcIiA6IF8weDFmOWU4ZS5jaGFubmVsX2lkLCBcImlzX3Nob3duXCIgOiAwLCBcImV2ZW50X2RhdGFcIiA6IEpTT04uc3RyaW5naWZ5KHsgXCJjaGFubmVsXCIgOiBfMHg1MThjZDksIFwidXNlcm5hbWVcIiA6IF8weDM5Yjg2YiwgXCJ2aWV3ZXJzXCIgOiBfMHgxZWIyZWMsIFwiYXV0b2hvc3RcIiA6IF8weDVkZmI0NyB9KSB9XG5cbi9hcGkvdjEvd2lkZ2V0bG9nXG5cbi9hcGkvY3JlYXRlcmFpZFxuL2FwaS9jcmVhdGVjaGVlclxuL2FwaS9jcmVhdGVyZXdhcmRcbi9hcGkvY3JlYXRlZ2lmdHBhaWR1cGdyYWRlXG4vYXBpL2dldGlzc3dpZGdldGRhdGFcbi9hcGkvY3JlYXRlbXlzdGVyeWdpZnRcblxuZ2V0UGF5TGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIEFwaVNlcnZpY2UuZ2V0KCcvcGF5aW4vc3lzdGVtcycpXG4gICAgfSxcblxuICAgIGdldEN1cnJlbmN5TGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIEFwaVNlcnZpY2UuZ2V0KCcvcGF5aW4vc3lzdGVtcy9jdXJyZW5jaWVzJylcbiAgICB9LFxuXG4gICAgZ2V0UmVzdWx0KHsgYW1vdW50LCBzeXN0ZW0sIGN1cnJlbmN5IH0pIHtcbiAgICAgICAgcmV0dXJuIEFwaVNlcnZpY2UuZ2V0KGAvcGF5aW4vc3lzdGVtcy9jb21taXNzaW9uP2Ftb3VudD0keyBhbW91bnQgfSZzeXN0ZW09JHsgc3lzdGVtIH0mY3VycmVuY3k9JHsgY3VycmVuY3kgfSZjdXJyZW5jeV9leHBlY3RlZD0keyBjdXJyZW5jeSB9YClcbiAgICB9XG5cblxuICAgICAgZ2V0TG9jYWxpemF0aW9uKHBhcmFtcyA9ICcnKSB7XG4gICAgICAgIHJldHVybiBBcGlTZXJ2aWNlLnBvc3QoJy9sb2NhbGl6YXRpb24nLCBwYXJhbXMpXG4gICAgfVxuXG4gICAgIGdldFN0aWNrZXJCYWxhbmNlKHVzZXJJZCkge1xuICAgICAgICByZXR1cm4gQXBpU2VydmljZS5nZXQoJy9zdGlja2VyL2xpc3Q/dXNlcl9pZD0nICsgdXNlcklkKVxuICAgIH0sXG5cbiAgICBnZXRTdHJlYW1QcmV2aWV3KHVzZXJJZCkge1xuICAgICAgICByZXR1cm4gQXBpU2VydmljZS5nZXQoJy9zdHJlYW0/dXNlcl9pZD0nICsgdXNlcklkKVxuICAgIH0sXG5cbiAgICBnZXRTdGlja2Vycyh1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIEFwaVNlcnZpY2UuZ2V0KCcvc3RpY2tlcj91c2VyX2lkPScgKyB1c2VySWQpXG4gICAgfSxcblxuICAgIHBvc3RTdGlja2VycyhkYXRhKSB7XG4gICAgICAgIHJldHVybiBBcGlTZXJ2aWNlLnBvc3QoJy9zdGlja2VyJywgZGF0YSlcbiAgICB9LFxuXG4gICAgcHV0U3RpY2tlcih7aWQsIGlzX2FjdGl2ZX0pIHtcbiAgICAgICAgcmV0dXJuIEFwaVNlcnZpY2UucHV0KGAvc3RpY2tlci8keyBpZCB9YCwge1xuICAgICAgICAgICAgaXNfYWN0aXZlLFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBkZWxTdGlja2VycyhpZCkge1xuICAgICAgICByZXR1cm4gQXBpU2VydmljZS5kZWxldGUoJy9zdGlja2VyLycgKyBpZClcbiAgICB9LFxuXG4gICAgcHV0U3RpY2tlcnMoe3N0aWNrZXJzX2lkcywgaXNfYWN0aXZlfSkge1xuICAgICAgICByZXR1cm4gQXBpU2VydmljZS5wdXQoJy9zdGlja2VyJywge1xuICAgICAgICAgICAgc3RpY2tlcnNfaWRzLFxuICAgICAgICAgICAgaXNfYWN0aXZlLFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBodHRwczovL3d3dy5kb25hdGlvbmFsZXJ0cy5jb20vZGFzaGJvYXJkL3NlbmQtb2ZmZXJzXG5cbiAgICBlbWl0V2lkZ2V0RXZlbnQ6IGZ1bmN0aW9uKGUsIG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdChyW1wiYVwiXSkoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IG4uZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYSA9IG4uZXZlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8gPSB2b2lkIDAgPT09IGEgPyBudWxsIDogYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQucG9zdChcIi93aWRnZXRzL2VtaXQtZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YTogb1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlQ3VzdG9tQWxlcnQ6IGZ1bmN0aW9uKGUsIG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdChyW1wiYVwiXSkoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IG4uaGVhZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgPSBuLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbyA9IG4uaXNTaG93bixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzID0gdm9pZCAwID09PSBvID8gMSA6IG87XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdC5wb3N0KFwiL2N1c3RvbV9hbGVydFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNfc2hvd246IHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkVGVzdEFsZXJ0ID0gZnVuY3Rpb24od2lkZ2V0X2lkKSB7XG5cdFx0JC5hamF4KHtcblx0XHRcdHVybDogJy9hbGVydC12YXJpYXRpb25zL2FkZHRlc3RhbGVydCcsXG5cdFx0XHR0eXBlOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiB7IHdpZGdldF9pZDogd2lkZ2V0X2lkIH0sXG5cdFx0XHRjYWNoZTogZmFsc2UsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0Y29udGV4dDogdGhpcyxcblx0XHRcdHJlc3VsdENvbnRhaW5lcjogdGhpcy5ncmlkX2NvbnRhaW5lcl9pZCxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKXtcblx0XHRcdFx0YWRkU3RhdHVzTWVzc2FnZShkYXRhLnN0YXR1cywgZGF0YS50ZXh0KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHRoaXMucmVtb3ZlQWxlcnRRdWV1ZSA9IGZ1bmN0aW9uKGFsZXJ0X3R5cGUpIHtcblx0XHRpZiAoY29uZmlybSh0cmFuc2xhdGVTdHJpbmcoJ2FsZXJ0X3ZhcmlhdGlvbnNfY2xlYXJfcXVldWVfd2FybmluZycpKSkge1xuXHRcdFx0JC5hamF4KHtcblx0XHRcdFx0dXJsOiAnL2FsZXJ0LXZhcmlhdGlvbnMvcmVtb3ZlYWxlcnRxdWV1ZScsXG5cdFx0XHRcdHR5cGU6ICdQT1NUJyxcblx0XHRcdFx0ZGF0YTogeyBhbGVydF90eXBlOiBhbGVydF90eXBlIH0sXG5cdFx0XHRcdGNhY2hlOiBmYWxzZSxcblx0XHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdFx0Y29udGV4dDogdGhpcyxcblx0XHRcdFx0cmVzdWx0Q29udGFpbmVyOiB0aGlzLmdyaWRfY29udGFpbmVyX2lkLFxuXHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUil7XG5cdFx0XHRcdFx0YWRkU3RhdHVzTWVzc2FnZShkYXRhLnN0YXR1cywgZGF0YS50ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fVxuXG4qL1xuXG5leHBvcnQgY2xhc3MgREFBUEkgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIHJlYWRvbmx5IHRva2VuOiBzdHJpbmc7XG5cbiAgICBwcml2YXRlIGFjY2Vzc1Rva2VuPzogc3RyaW5nO1xuXG4gICAgcHJpdmF0ZSBbR09UXSA9IGdvdC5leHRlbmQoeyBcbiAgICAgICAgcHJlZml4VXJsOiBEQV9VUkxcbiAgICB9KVxuXG4gICAgY29uc3RydWN0b3IodG9rZW46IHN0cmluZywgeyBhY2Nlc3NUb2tlbiB9IDogeyBhY2Nlc3NUb2tlbj86IHN0cmluZyB9ID0ge30pIHtcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIHRoaXMudG9rZW4gPSB0b2tlblxuICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW5cbiAgICB9XG5cbiAgICBhc3luYyBjcmF3bFdpZGdldCgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHRoaXNbR09UXShcIndpZGdldC9hbGVydHNcIiwge1xuICAgICAgICAgICAgc2VhcmNoUGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgdG9rZW46IHRoaXMudG9rZW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNvbHZlQm9keU9ubHk6IHRydWVcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IHJlZ2V4QWNjZXNzVG9rZW4uZXhlYyhib2R5KT8uZ3JvdXBzPy50b2tlblxuXG4gICAgICAgIGlmKCFhY2Nlc3NUb2tlbikgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHBhcnNlIGFjY2VzcyB0b2tlblwiKVxuXG4gICAgICAgIGNvbnN0IHByZXYgPSB7XG4gICAgICAgICAgICBhY2Nlc3NUb2tlbjogdGhpcy5hY2Nlc3NUb2tlblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbiA9IGFjY2Vzc1Rva2VuXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZXYsXG4gICAgICAgICAgICBhY2Nlc3NUb2tlblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VXNlcigpIHtcbiAgICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCB0aGlzLnJlcXVlc3RBcGkoXCJ1c2VyXCIpXG5cbiAgICAgICAgcmV0dXJuIHBhcnNlVXNlcihkYXRhKVxuICAgIH1cblxuICAgIGFzeW5jIG1hcmtBbGVydFNob3duKHtcbiAgICAgICAgaWQsXG4gICAgICAgIHR5cGVcbiAgICB9IDoge1xuICAgICAgICBpZDogbnVtYmVyLFxuICAgICAgICB0eXBlOiBBbGVydFR5cGVcbiAgICB9KSB7XG4gICAgICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gYXdhaXQgdGhpcy5yZXF1ZXN0SW50ZXJuYWxBcGkoXCJtYXJrYWxlcnRzaG93blwiLCB7IFxuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgYWxlcnQ6IGlkLFxuICAgICAgICAgICAgICAgIGFsZXJ0X3R5cGU6IHR5cGVcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIG1lc3NhZ2VcbiAgICB9XG5cbiAgICBhc3luYyByZXBlYXRBbGVydCh7XG4gICAgICAgIGlkLFxuICAgICAgICB0eXBlXG4gICAgfSA6IHtcbiAgICAgICAgaWQ6IG51bWJlcixcbiAgICAgICAgdHlwZTogQWxlcnRUeXBlXG4gICAgfSkge1xuICAgICAgICBjb25zdCB7IG1lc3NhZ2UgfSA9IGF3YWl0IHRoaXMucmVxdWVzdEludGVybmFsQXBpKFwicmVwZWF0YWxlcnRcIiwgeyBcbiAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIGFsZXJ0OiBpZCxcbiAgICAgICAgICAgICAgICBhbGVydF90eXBlOiB0eXBlXG4gICAgICAgICAgICB9IFxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBtZXNzYWdlXG4gICAgfVxuXG4gICAgYXN5bmMgc2tpcEFsZXJ0KHtcbiAgICAgICAgaWQsXG4gICAgICAgIHR5cGVcbiAgICB9IDoge1xuICAgICAgICBpZDogbnVtYmVyLFxuICAgICAgICB0eXBlOiBBbGVydFR5cGVcbiAgICB9KSB7XG4gICAgICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gYXdhaXQgdGhpcy5yZXF1ZXN0SW50ZXJuYWxBcGkoXCJza2lwYWxlcnRcIiwgeyBcbiAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIGFsZXJ0OiBpZCxcbiAgICAgICAgICAgICAgICBhbGVydF90eXBlOiB0eXBlXG4gICAgICAgICAgICB9IFxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBtZXNzYWdlXG4gICAgfVxuXG4gICAgYXN5bmMgc2tpcE1lZGlhKGlkOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgeyBtZXNzYWdlIH0gPSBhd2FpdCB0aGlzLnJlcXVlc3RJbnRlcm5hbEFwaShcInNraXBtZWRpYVwiLCB7IFxuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgbWVkaWFfaWQ6IGlkXG4gICAgICAgICAgICB9IFxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBtZXNzYWdlXG4gICAgfVxuXG4gICAgYXN5bmMgbWFya01lZGlhUGxheWVkKGlkOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgeyBtZXNzYWdlIH0gPSBhd2FpdCB0aGlzLnJlcXVlc3RJbnRlcm5hbEFwaShcIm1hcmttZWRpYXBsYXllZFwiLCB7IFxuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgbWVkaWFfaWQ6IGlkXG4gICAgICAgICAgICB9IFxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBtZXNzYWdlXG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0TWVkaWEoKSB7XG4gICAgICAgIGNvbnN0IHsgbWVkaWEgfSA9IGF3YWl0IHRoaXMucmVxdWVzdEludGVybmFsQXBpKFwiZ2V0bWVkaWFkYXRhXCIpXG5cbiAgICAgICAgcmV0dXJuIHsgcmF3OiBtZWRpYSB9IC8vIEFycmF5P1xuICAgIH1cblxuICAgIGFzeW5jIGdldFBvbGxXaWRnZXQoKSB7XG4gICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgdGhpcy5yZXF1ZXN0SW50ZXJuYWxBcGkoXCJnZXRwb2xsd2lkZ2V0ZGF0YVwiKVxuXG4gICAgICAgIHJldHVybiB7IHJhdzogZGF0YSB9IC8vIGJvb2xlYW4/XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0V2lkZ2V0KCkge1xuICAgICAgICBjb25zdCB7IGFsZXJ0cywgc2V0dGluZ3MsIHR0c19taW5zLCAuLi5yYXcgfSA9IGF3YWl0IHRoaXMucmVxdWVzdEludGVybmFsQXBpKFwiZ2V0d2lkZ2V0ZGF0YVwiKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhbGVydHM6IFsuLi5hbGVydHNdLm1hcChwYXJzZURvbmF0aW9uKSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgcmF3OiBzZXR0aW5ncyAvLyBUT0RPOiBwYXJzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHR0c01pbnM6IE9iamVjdC5lbnRyaWVzPG51bWJlcj4odHRzX21pbnMpLnJlZHVjZSgocHJldiwgW2tleSwgdmFsdWVdLCBpKSA9PiAoeyAuLi5wcmV2LCBba2V5IGFzIEN1cnJlbmN5XTogK3ZhbHVlIH0pLCA8e1t4IGluIEN1cnJlbmN5XTogbnVtYmVyfT57IH0pLFxuICAgICAgICAgICAgcmF3XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyByZXF1ZXN0QXBpKGVuZHBvaW50OiBzdHJpbmcsIHsgXG4gICAgICAgIHZlcnNpb24gPSAxLFxuICAgICAgICBtZXRob2QgPSBcIkdFVFwiLCBcbiAgICAgICAgZGF0YSwgXG4gICAgICAgIHBhcmFtcyBcbiAgICB9OiB7IHZlcnNpb24/OiBudW1iZXIsIFxuICAgICAgICBtZXRob2Q/OiBNZXRob2QsIFxuICAgICAgICBkYXRhPzogYW55LCBcbiAgICAgICAgcGFyYW1zPzogeyBbeDogc3RyaW5nXTogYW55IH0gXG4gICAgfSA9IHt9KSB7XG4gICAgICAgIGlmKCF0aGlzLmFjY2Vzc1Rva2VuKSBhd2FpdCB0aGlzLmNyYXdsV2lkZ2V0KClcblxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgdGhpc1tHT1RdKGBhcGkvdiR7dmVyc2lvbn0vJHtlbmRwb2ludH1gLCB7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMuYWNjZXNzVG9rZW59YCxcbiAgICAgICAgICAgICAgICBcIkFjY2VwdC1MYW5ndWFnZVwiOiB1bmRlZmluZWQgLy8gc2V0IGxhbmdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNwb25zZVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgcmVzb2x2ZUJvZHlPbmx5OiB0cnVlLFxuICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAganNvbjogZGF0YSxcbiAgICAgICAgICAgIHNlYXJjaFBhcmFtczogcGFyYW1zXG4gICAgICAgIH0pIGFzIHsgW3g6IHN0cmluZ106IGFueSB9XG5cbiAgICAgICAgcmV0dXJuIGJvZHlcbiAgICB9XG5cbiAgICBhc3luYyByZXF1ZXN0SW50ZXJuYWxBcGkoZW5kcG9pbnQ6IHN0cmluZywgeyBcbiAgICAgICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICAgICAgZGF0YSxcbiAgICAgICAgcGFyYW1zXG4gICAgfTogeyBcbiAgICAgICAgbWV0aG9kPzogTWV0aG9kLFxuICAgICAgICBkYXRhPzogYW55LFxuICAgICAgICBwYXJhbXM/OiB7IFt4OiBzdHJpbmddOiBhbnl9XG4gICAgfSA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCB0aGlzW0dPVF0oYGFwaS8ke2VuZHBvaW50fWAsIHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcIkFjY2VwdC1MYW5ndWFnZVwiOiB1bmRlZmluZWQgLy8gc2V0IGxhbmdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNwb25zZVR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgcmVzb2x2ZUJvZHlPbmx5OiB0cnVlLFxuICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAganNvbjogZGF0YSxcbiAgICAgICAgICAgIHNlYXJjaFBhcmFtczoge1xuICAgICAgICAgICAgICAgIC4uLnBhcmFtcyxcbiAgICAgICAgICAgICAgICB0b2tlbjogdGhpcy50b2tlblxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlOiB7XG4gICAgICAgICAgICBzdGF0dXM/OiBcInN1Y2Nlc3NcIlxuICAgICAgICB9IHwge1xuICAgICAgICAgICAgc3RhdHVzOiAgXCJlcnJvclwiLFxuICAgICAgICAgICAgbWVzc2FnZTogc3RyaW5nXG4gICAgICAgIH0gPSBKU09OLnBhcnNlKGJvZHkucmVwbGFjZSgvXlxcKCguKylcXCkkLywgXCIkMVwiKSlcblxuICAgICAgICBzd2l0Y2gocmVzcG9uc2Uuc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcG9uc2UubWVzc2FnZSlcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjYXNlIFwic3VjY2Vzc1wiOlxuICAgICAgICAgICAgICAgIGNvbnN0IHsgc3RhdHVzLCAuLi5yYXcgfSA9IHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdyBhcyB7IFt4OiBzdHJpbmddOiBhbnkgfVxuXG4gICAgICAgIH1cbiAgICB9XG59Il19