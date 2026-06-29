"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DASocket = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

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

var _socket = _interopRequireDefault(require("socket.io-client"));

var _emittery = _interopRequireDefault(require("emittery"));

var _types = require("./types");

var _symbols = require("./symbols");

var _parsers = require("./parsers");

var _constants = require("../constants");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _wrapRegExp(re, groups) { _wrapRegExp = function _wrapRegExp(re, groups) { return new BabelRegExp(re, undefined, groups); }; var _RegExp = (0, _wrapNativeSuper2["default"])(RegExp); var _super = RegExp.prototype; var _groups = new WeakMap(); function BabelRegExp(re, flags, groups) { var _this = _RegExp.call(this, re, flags); _groups.set(_this, groups || _groups.get(re)); return _this; } (0, _inherits2["default"])(BabelRegExp, _RegExp); BabelRegExp.prototype.exec = function (str) { var result = _super.exec.call(this, str); if (result) result.groups = buildGroups(result, this); return result; }; BabelRegExp.prototype[Symbol.replace] = function (str, substitution) { if (typeof substitution === "string") { var groups = _groups.get(this); return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) { return "$" + groups[name]; })); } else if (typeof substitution === "function") { var _this = this; return _super[Symbol.replace].call(this, str, function () { var args = []; args.push.apply(args, arguments); if (_typeof(args[args.length - 1]) !== "object") { args.push(buildGroups(args, _this)); } return substitution.apply(this, args); }); } else { return _super[Symbol.replace].call(this, str, substitution); } }; function buildGroups(result, re) { var g = _groups.get(re); return Object.keys(g).reduce(function (groups, name) { groups[name] = result[g[name]]; return groups; }, Object.create(null)); } return _wrapRegExp.apply(this, arguments); }

var regexSocketUrl = /*#__PURE__*/_wrapRegExp(/io\(('|")([\.-:A-Z_a-z]+)\1/, {
  url: 2
});

var DASocket = /*#__PURE__*/function (_Emittery) {
  (0, _inherits2["default"])(DASocket, _Emittery);

  var _super2 = _createSuper(DASocket);

  function DASocket(token) {
    var _this2;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        socketUrl = _ref.socketUrl,
        _ref$autoConnect = _ref.autoConnect,
        autoConnect = _ref$autoConnect === void 0 ? true : _ref$autoConnect;

    (0, _classCallCheck2["default"])(this, DASocket);
    _this2 = _super2.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "token", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "socketUrl", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "socket", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), _symbols.GOT, _got["default"].extend({
      prefixUrl: _constants.DA_URL
    }));
    _this2.token = token;
    _this2.socketUrl = typeof socketUrl === "number" ? "wss://socket".concat(socketUrl, ".donationalerts.ru") : socketUrl;
    if (autoConnect) _this2.connect();
    return _this2;
  }

  (0, _createClass2["default"])(DASocket, [{
    key: "crawlWidget",
    value: function () {
      var _crawlWidget = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _regexSocketUrl$exec, _regexSocketUrl$exec$;

        var body, socketUrl, prev;
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
                socketUrl = (_regexSocketUrl$exec = regexSocketUrl.exec(body)) === null || _regexSocketUrl$exec === void 0 ? void 0 : (_regexSocketUrl$exec$ = _regexSocketUrl$exec.groups) === null || _regexSocketUrl$exec$ === void 0 ? void 0 : _regexSocketUrl$exec$.url;

                if (socketUrl) {
                  _context.next = 6;
                  break;
                }

                throw new Error("Could not parse socket url");

              case 6:
                prev = {
                  socketUrl: this.socketUrl
                };
                this.socketUrl = socketUrl;
                return _context.abrupt("return", {
                  prev: prev,
                  socketUrl: socketUrl
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
    key: "connect",
    value: function () {
      var _connect = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _this$socket,
            _this$socket2,
            _this3 = this,
            _callbacks;

        var _ref2,
            _ref2$addUser,
            addUser,
            _ref2$clientType,
            clientType,
            callbacks,
            _loop,
            _i,
            _Object$entries,
            _args2 = arguments;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _ref2 = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : {}, _ref2$addUser = _ref2.addUser, addUser = _ref2$addUser === void 0 ? true : _ref2$addUser, _ref2$clientType = _ref2.clientType, clientType = _ref2$clientType === void 0 ? _types.ClientType.Minor : _ref2$clientType;

                if (this.socketUrl) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 4;
                return this.crawlWidget();

              case 4:
                (_this$socket = this.socket) === null || _this$socket === void 0 ? void 0 : _this$socket.disconnect();
                (_this$socket2 = this.socket) === null || _this$socket2 === void 0 ? void 0 : _this$socket2.removeAllListeners();
                this.socket = (0, _socket["default"])("".concat(this.socketUrl), {
                  reconnection: true,
                  reconnectionDelay: _constants.RECONNECTION_DELAY_MIN,
                  reconnectionDelayMax: _constants.RECONNECTION_DELAY_MAX
                });
                callbacks = (_callbacks = {}, (0, _defineProperty2["default"])(_callbacks, _types.ServerEventName.Donation, function (data) {
                  return _this3.emit(_types.EventName.Donation, (0, _parsers.parseDonation)(data));
                }), (0, _defineProperty2["default"])(_callbacks, _types.ServerEventName.AlertShow, function (_ref3) {
                  var action = _ref3.action,
                      duration = _ref3.duration,
                      group_id = _ref3.group_id,
                      alert_id = _ref3.alert_id,
                      alert_type = _ref3.alert_type,
                      raw = (0, _objectWithoutProperties2["default"])(_ref3, ["action", "duration", "group_id", "alert_id", "alert_type"]);
                  var eventData = {
                    id: +alert_id,
                    type: +alert_type,
                    raw: raw
                  };

                  switch (action) {
                    case _types.AlertShowAction.Start:
                      var startEventData = _objectSpread(_objectSpread({}, eventData), {}, {
                        duration: +(duration || 0),
                        groupId: group_id === undefined ? undefined : +group_id
                      });

                      _this3.emit(_types.EventName.AlertStart, startEventData);

                      break;

                    case _types.AlertShowAction.End:
                      _this3.emit(_types.EventName.AlertEnd, eventData);

                      break;

                    case _types.AlertShowAction.Skip:
                      _this3.emit(_types.EventName.AlertSkip, eventData);

                      break;
                  }
                }), (0, _defineProperty2["default"])(_callbacks, _types.ServerEventName.Media, function (_ref4) {
                  var raw = (0, _extends2["default"])({}, _ref4);
                  // TODO: parse
                  var eventData = {
                    raw: raw
                  };

                  _this3.emit(_types.EventName.Media, eventData);
                  /* {
                      action: 'add',
                      media: {
                          media_id: 0,
                          user_id: '4265646',
                          type: 'video',
                          sub_type: 'youtube',
                          title: 'Darude - Sandstorm',
                          additional_data: '{"video_id":"y6120QOlsfU","alert_id":0,"alert_type":1,"owner":"\\u0418\\u043c\\u044f","url":"https:\\/\\/www.youtube.com\\/watch?v=y6120QOlsfU","start_from":0,"paid_amounts":{"BYN":12.41,"EUR":4.24,"KZT":2126.75,"RUB":362.16,"UAH":133.35,"USD":5,"BRL":26.12,"TRY":42.23,"PLN":19.41}}',
                          date_created: '2021-09-16 21:34:08',
                          is_played: 0,
                          date_played: null
                      }
                  }
                  { action: 'get-pause-state', source: 'media_widget' }
                  {
                      action: 'settings-change',
                      settings: {
                          widget_id: '4983358',
                          user_id: '4265646',
                          is_enabled: '1',
                          background_color: '#00FF00',
                          min_amount: '20.00',
                          video_display: 'manual',
                          sound_container: 'media_widget',
                          volume: '50',
                          amount_per_second_is_enabled: '0',
                          amount_per_second: '0.50',
                          additional_data: '{"video_min_likes_perc":50,"video_min_views":50000}'
                      }
                  } {
                      action: 'play',
                      media: {
                          media_id: 0,
                          user_id: '4265646',
                          type: 'video',
                          sub_type: 'youtube',
                          title: 'Darude - Sandstorm',
                          additional_data: {
                          video_id: 'y6120QOlsfU',
                          alert_id: 0,
                          alert_type: 1,
                          owner: 'Имя',
                          url: 'https://www.youtube.com/watch?v=y6120QOlsfU',
                          start_from: 0,
                          paid_amounts: [Object]
                          },
                          date_created: '2021-09-16 21:36:13',
                          is_played: 0,
                          date_played: null
                      }
                  }
                   {
                      action: 'add',
                      media: {
                          media_id: 0,
                          user_id: '4265646',
                          type: 'video',
                          sub_type: 'youtube',
                          title: 'Rick Astley - Never Gonna Give You Up (Video)',
                          additional_data: '{"video_id":"dQw4w9WgXcQ","alert_id":0,"alert_type":1,"owner":"\\u0418\\u043c\\u044f","url":"https:\\/\\/www.youtube.com\\/watch?v=dQw4w9WgXcQ","start_from":0,"paid_amounts":{"BYN":12.41,"EUR":4.24,"KZT":2126.75,"RUB":362.16,"UAH":133.35,"USD":5,"BRL":26.12,"TRY":42.23,"PLN":19.41}}',
                          date_created: '2021-09-16 21:38:43',
                          is_played: 0,
                          date_played: null
                      }
                  } 
                  { action: 'skip', media: { media_id: 0 } }
                  { action: 'get-current-media', source: 'last_alerts_widget' }
                  { action: 'receive-volume-override', volume: '50' }
                  */

                }), (0, _defineProperty2["default"])(_callbacks, _types.ServerEventName.Stickers, function (_ref5) {
                  var raw = (0, _extends2["default"])({}, _ref5);
                  // TODO: parse
                  var eventData = {
                    raw: raw
                  };

                  _this3.emit(_types.EventName.Stickers, eventData);
                  /* {
                      action: 'add',
                      stickers: [
                          {
                          id: '92397',
                          left: 89,
                          top: 8,
                          scale: 1.45,
                          angle: -219,
                          url: 'https://static.donationalerts.ru/uploads/stickers/4265646/DnkKPqB41S0npMu28BfRiJxDioIxC8qx0UIwMcHQ.png'
                          }
                      ]
                  } */

                }), (0, _defineProperty2["default"])(_callbacks, "update-iss_data", function updateIss_data(data) {// DEBUG
                }), (0, _defineProperty2["default"])(_callbacks, "update-dg_data", function updateDg_data(data) {// DEBUG

                  /*
                  { goal_id: 4170128 }
                  */
                }), (0, _defineProperty2["default"])(_callbacks, "update-alert_widget", function updateAlert_widget(data) {// DEBUG

                  /* alert widget {
                  variations: [
                  {
                  entity_id: '17565030',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/tortik.mp3',
                  image: 'images/4265646/tort.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '7.00',
                  text_delay: '0.00',
                  text_duration: '7.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":1},{"mode":"random","value":3}]',
                  name: null,
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22404274',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/mvideo.mp3',
                  image: 'images/4265646/mvideo.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '13.00',
                  text_delay: '0.00',
                  text_duration: '13.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"1"},{"mode":"amount_equal_to","value":5600}]',
                  name: '5600',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22410449',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/nihuyativiebal.mp3',
                  image: 'images/4265646/nihuyativiebal.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '8.00',
                  text_delay: '0.00',
                  text_duration: '8.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"1"},{"mode":"amount_equal_or_greater_than","value":100}]',
                  name: '100',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22467003',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/presedent.mp3',
                  image: 'images/4265646/presedent.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '7.00',
                  text_delay: '0.00',
                  text_duration: '7.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"1"},{"mode":"amount_equal_or_greater_than","value":500}]',
                  name: '500',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22467239',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/shokolad.mp3',
                  image: 'images/4265646/shoko.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '10.00',
                  text_delay: '0.00',
                  text_duration: '10.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"1"},{"mode":"amount_equal_or_greater_than","value":300}]',
                  name: '300',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22502157',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/delfin.mp3',
                  image: 'images/4265646/delfin.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '8.00',
                  text_delay: '0.00',
                  text_duration: '8.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"1"},{"mode":"amount_equal_or_greater_than","value":1000}]',
                  name: '1000',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} - {amount}!',
                  message_template: null
                  },
                  {
                  entity_id: '22870910',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/tortik.mp3',
                  image: 'images/4265646/tort.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '7.00',
                  text_delay: '0.00',
                  text_duration: '7.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"4"},{"mode":"months_in_a_row","value":1}]',
                  name: '1 мес',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: '{username} стал Бемровичем',
                  message_template: null
                  },
                  {
                  entity_id: '27302266',
                  user_id: '4265646',
                  group_id: '1',
                  window_coor_x: '0',
                  window_coor_y: '0',
                  background_color: '#00FF00',
                  volume: '50',
                  display_pattern: 'image_top__text_bottom',
                  sound: 'sounds/4265646/tortik.mp3',
                  image: 'images/4265646/tort.gif',
                  message_background: 'rgba(0, 0, 0, 0)',
                  is_temporary_disabled: '0',
                  color_1: '#000000',
                  color_2: '#000000',
                  display_duration: '7.00',
                  text_delay: '0.00',
                  text_duration: '7.00',
                  font_size_1: '0',
                  font_size_2: '0',
                  header_text: '{"font_style":{"font-family":"\\"Rubik Mono One\\"","font-size":"80px","color":"#FFFFFF","font-weight":"bold","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"8px","text-shadow_color":"rgba(0, 0, 0, 0.09)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(255, 255, 255, 0)","border-radius":"0px"},"font_animation":{"text-animation":"rubberBand","text-animation-mode":"letters"}}',
                  message_text: '{"font_style":{"font-family":"\\"Rubik\\"","font-size":"50px","color":"rgb(255, 255, 255)","font-weight":"normal","font-style":"normal","text-decoration":"none","text-transform":"none","text-shadow":"7px","text-shadow_color":"rgba(0, 0, 0, 0.03)","letter-spacing":"0px","word-spacing":"0px","text-align":"center","vertical-align":"middle","background-color":"rgba(223, 255, 0, 0)","border-radius":"0px"},"font_animation":{"text-animation":"none","text-animation-mode":"letters"}}',
                  donation_audio_volume: '50',
                  donation_audio_play_scenario: 'after_sound',
                  donation_audio_playback: '0',
                  tts_is_enabled: '1',
                  tts_language: 'ru_RU',
                  tts_scenario: 'after_sound',
                  tts_volume: '30',
                  tts_amount_min: '0.00',
                  tts_voice: 'male,female,3,19,20,',
                  tts_rate: 'medium',
                  variation_conditions: '[{"mode":"alert_type","value":"12"},{"mode":"random","value":3}]',
                  name: 'кастом',
                  is_active: '1',
                  is_deleted: '0',
                  position: '0',
                  additional_data: null,
                  header_template: null,
                  message_template: null
                  }
                  ],
                  _additional: { source: 'zf2' }
                  } */
                }), (0, _defineProperty2["default"])(_callbacks, "update-corona_widget", function updateCorona_widget(data) {// DEBUG
                }), (0, _defineProperty2["default"])(_callbacks, "update-stickers_widget", function updateStickers_widget(data) {// DEBUG
                }), (0, _defineProperty2["default"])(_callbacks, "update-user_general_widget_settings", function updateUser_general_widget_settings(data) {// DEBUG
                }), _callbacks);

                _loop = function _loop() {
                  var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2),
                      event = _Object$entries$_i[0],
                      callback = _Object$entries$_i[1];

                  _this3.socket.on(event, function (data) {
                    return callback(JSON.parse(data));
                  });
                };

                for (_i = 0, _Object$entries = Object.entries(callbacks); _i < _Object$entries.length; _i++) {
                  _loop();
                }

                if (addUser) this.addUser(clientType);

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connect() {
        return _connect.apply(this, arguments);
      }

      return connect;
    }()
  }, {
    key: "disconnect",
    value: function () {
      var _disconnect = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var _this$socket3, _this$socket4;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                (_this$socket3 = this.socket) === null || _this$socket3 === void 0 ? void 0 : _this$socket3.disconnect();
                (_this$socket4 = this.socket) === null || _this$socket4 === void 0 ? void 0 : _this$socket4.removeAllListeners();
                this.socket = undefined;

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function disconnect() {
        return _disconnect.apply(this, arguments);
      }

      return disconnect;
    }()
  }, {
    key: "addUser",
    value: function addUser(type) {
      this.send("add-user", undefined, {
        type: type
      });
    }
  }, {
    key: "alertStart",
    value: function alertStart(_ref6) {
      var duration = _ref6.duration,
          groupId = _ref6.groupId,
          id = _ref6.id,
          type = _ref6.type;
      this.send(_types.ServerEventName.AlertShow, {
        action: _types.AlertShowAction.Start,
        duration: duration,
        group_id: groupId,
        alert_id: id,
        alert_type: type
      });
    }
  }, {
    key: "alertEnd",
    value: function alertEnd(_ref7) {
      var id = _ref7.id,
          type = _ref7.type;
      this.send(_types.ServerEventName.AlertShow, {
        action: _types.AlertShowAction.End,
        alert_id: id,
        alert_type: type
      });
    }
  }, {
    key: "alertSkip",
    value: function alertSkip(_ref8) {
      var id = _ref8.id,
          type = _ref8.type;
      this.send(_types.ServerEventName.AlertShow, {
        action: _types.AlertShowAction.Skip,
        alert_id: id,
        alert_type: type
      });
    }
  }, {
    key: "mediaEnd",
    value: function mediaEnd(id) {
      this.send(_types.ServerEventName.Media, {
        action: "end",
        media: {
          media_id: id
        }
      });
    }
  }, {
    key: "mediaShowWidget",
    value: function mediaShowWidget() {
      this.send(_types.ServerEventName.Media, {
        action: "show-widget"
      });
    }
  }, {
    key: "mediaHideWidget",
    value: function mediaHideWidget() {
      this.send(_types.ServerEventName.Media, {
        action: "hide-widget"
      });
    }
  }, {
    key: "mediaPause",
    value: function mediaPause() {
      this.send(_types.ServerEventName.Media, {
        action: "pause"
      });
    }
  }, {
    key: "mediaUnpause",
    value: function mediaUnpause() {
      this.send(_types.ServerEventName.Media, {
        action: "unpause"
      });
    }
  }, {
    key: "mediaGetPauseState",
    value: function mediaGetPauseState(source) {
      this.send(_types.ServerEventName.Media, {
        action: "get-pause-state",
        source: source
      });
    }
  }, {
    key: "mediaGetCurrent",
    value: function mediaGetCurrent(source) {
      this.send(_types.ServerEventName.Media, {
        action: "get-current-media",
        source: source
      });
    }
  }, {
    key: "mediaGetVolumeOverride",
    value: function mediaGetVolumeOverride(volume) {
      // ???
      this.send(_types.ServerEventName.Media, {
        action: "get-volume-override",
        volume: volume
      });
    }
  }, {
    key: "mediaReceiveVolumeOverride",
    value: function mediaReceiveVolumeOverride(volume) {
      // update volume
      this.send(_types.ServerEventName.Media, {
        action: "receive-volume-override",
        volume: volume
      });
    }
  }, {
    key: "mediaReceivePauseState",
    value: function mediaReceivePauseState(_ref9) {
      var source = _ref9.source,
          media = _ref9.media,
          isPaused = _ref9.isPaused,
          volumeOverride = _ref9.volumeOverride;
      this.send(_types.ServerEventName.Media, {
        action: "receive-current-media",
        source: source,
        media: media,
        is_paused: isPaused,
        volume_override: volumeOverride
      });
    }
  }, {
    key: "mediaReceiveCurrentMedia",
    value: function mediaReceiveCurrentMedia(_ref10) {
      var source = _ref10.source,
          media = _ref10.media,
          isPaused = _ref10.isPaused,
          isDisplaying = _ref10.isDisplaying;
      this.send(_types.ServerEventName.Media, {
        action: "receive-current-media",
        source: source,
        media: media,
        is_paused: isPaused,
        is_displaying: isDisplaying
      });
    }
  }, {
    key: "send",
    value: function send(event) {
      var _this$socket5;

      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      (_this$socket5 = this.socket) === null || _this$socket5 === void 0 ? void 0 : _this$socket5.emit(event, _objectSpread(_objectSpread({}, params), {}, {
        token: this.token,
        message_data: data
      }));
    }
  }, {
    key: "connected",
    get: function get() {
      var _this$socket6;

      return ((_this$socket6 = this.socket) === null || _this$socket6 === void 0 ? void 0 : _this$socket6.connected) || false;
    }
  }]);
  return DASocket;
}(_emittery["default"]);

exports.DASocket = DASocket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvc29ja2V0LnRzIl0sIm5hbWVzIjpbInJlZ2V4U29ja2V0VXJsIiwiREFTb2NrZXQiLCJ0b2tlbiIsInNvY2tldFVybCIsImF1dG9Db25uZWN0IiwiR09UIiwiZ290IiwiZXh0ZW5kIiwicHJlZml4VXJsIiwiREFfVVJMIiwiY29ubmVjdCIsInNlYXJjaFBhcmFtcyIsInJlc29sdmVCb2R5T25seSIsImJvZHkiLCJleGVjIiwiZ3JvdXBzIiwidXJsIiwiRXJyb3IiLCJwcmV2IiwiYWRkVXNlciIsImNsaWVudFR5cGUiLCJDbGllbnRUeXBlIiwiTWlub3IiLCJjcmF3bFdpZGdldCIsInNvY2tldCIsImRpc2Nvbm5lY3QiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJyZWNvbm5lY3Rpb24iLCJyZWNvbm5lY3Rpb25EZWxheSIsIlJFQ09OTkVDVElPTl9ERUxBWV9NSU4iLCJyZWNvbm5lY3Rpb25EZWxheU1heCIsIlJFQ09OTkVDVElPTl9ERUxBWV9NQVgiLCJjYWxsYmFja3MiLCJTZXJ2ZXJFdmVudE5hbWUiLCJEb25hdGlvbiIsImRhdGEiLCJlbWl0IiwiRXZlbnROYW1lIiwiQWxlcnRTaG93IiwiYWN0aW9uIiwiZHVyYXRpb24iLCJncm91cF9pZCIsImFsZXJ0X2lkIiwiYWxlcnRfdHlwZSIsInJhdyIsImV2ZW50RGF0YSIsImlkIiwidHlwZSIsIkFsZXJ0U2hvd0FjdGlvbiIsIlN0YXJ0Iiwic3RhcnRFdmVudERhdGEiLCJncm91cElkIiwidW5kZWZpbmVkIiwiQWxlcnRTdGFydCIsIkVuZCIsIkFsZXJ0RW5kIiwiU2tpcCIsIkFsZXJ0U2tpcCIsIk1lZGlhIiwiU3RpY2tlcnMiLCJldmVudCIsImNhbGxiYWNrIiwib24iLCJKU09OIiwicGFyc2UiLCJPYmplY3QiLCJlbnRyaWVzIiwic2VuZCIsIm1lZGlhIiwibWVkaWFfaWQiLCJzb3VyY2UiLCJ2b2x1bWUiLCJpc1BhdXNlZCIsInZvbHVtZU92ZXJyaWRlIiwiaXNfcGF1c2VkIiwidm9sdW1lX292ZXJyaWRlIiwiaXNEaXNwbGF5aW5nIiwiaXNfZGlzcGxheWluZyIsInBhcmFtcyIsIm1lc3NhZ2VfZGF0YSIsImNvbm5lY3RlZCIsIkVtaXR0ZXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLGNBQWMsNEJBQUcsNkJBQUg7QUFBQTtBQUFBLEVBQXBCOztJQUVhQyxROzs7OztBQWFULG9CQUFZQyxLQUFaLEVBQTRIO0FBQUE7O0FBQUEsbUZBQUosRUFBSTtBQUFBLFFBQS9GQyxTQUErRixRQUEvRkEsU0FBK0Y7QUFBQSxnQ0FBcEZDLFdBQW9GO0FBQUEsUUFBcEZBLFdBQW9GLGlDQUF0RSxJQUFzRTs7QUFBQTtBQUN4SDtBQUR3SDtBQUFBO0FBQUE7QUFBQSxzRkFjbkhDLFlBZG1ILEVBYzVHQyxnQkFBSUMsTUFBSixDQUFXO0FBQ3ZCQyxNQUFBQSxTQUFTLEVBQUVDO0FBRFksS0FBWCxDQWQ0RztBQUd4SCxXQUFLUCxLQUFMLEdBQWFBLEtBQWI7QUFFQSxXQUFLQyxTQUFMLEdBQWlCLE9BQU9BLFNBQVAsS0FBcUIsUUFBckIseUJBQStDQSxTQUEvQywwQkFBK0VBLFNBQWhHO0FBRUEsUUFBR0MsV0FBSCxFQUFnQixPQUFLTSxPQUFMO0FBUHdHO0FBUTNIOzs7Ozs7Ozs7Ozs7Ozt1QkFXc0IsS0FBS0wsWUFBTCxFQUFVLGVBQVYsRUFBMkI7QUFDMUNNLGtCQUFBQSxZQUFZLEVBQUU7QUFDVlQsb0JBQUFBLEtBQUssRUFBRSxLQUFLQTtBQURGLG1CQUQ0QjtBQUkxQ1Usa0JBQUFBLGVBQWUsRUFBRTtBQUp5QixpQkFBM0IsQzs7O0FBQWJDLGdCQUFBQSxJO0FBT0FWLGdCQUFBQSxTLDJCQUFZSCxjQUFjLENBQUNjLElBQWYsQ0FBb0JELElBQXBCLEMsa0ZBQUEscUJBQTJCRSxNLDBEQUEzQixzQkFBbUNDLEc7O29CQUVqRGIsUzs7Ozs7c0JBQWlCLElBQUljLEtBQUosQ0FBVSw0QkFBVixDOzs7QUFFZkMsZ0JBQUFBLEksR0FBTztBQUNUZixrQkFBQUEsU0FBUyxFQUFFLEtBQUtBO0FBRFAsaUI7QUFJYixxQkFBS0EsU0FBTCxHQUFpQkEsU0FBakI7aURBRU87QUFDSGUsa0JBQUFBLElBQUksRUFBSkEsSUFERztBQUVIZixrQkFBQUEsU0FBUyxFQUFUQTtBQUZHLGlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21GQU11RCxFLHdCQUFsRGdCLE8sRUFBQUEsTyw4QkFBVSxJLDJDQUFNQyxVLEVBQUFBLFUsaUNBQWFDLGtCQUFXQyxLOztvQkFDaEQsS0FBS25CLFM7Ozs7Ozt1QkFBaUIsS0FBS29CLFdBQUwsRTs7O0FBRTFCLHFDQUFLQyxNQUFMLDhEQUFhQyxVQUFiO0FBQ0Esc0NBQUtELE1BQUwsZ0VBQWFFLGtCQUFiO0FBRUEscUJBQUtGLE1BQUwsR0FBYyxrQ0FBTSxLQUFLckIsU0FBWCxHQUF3QjtBQUNsQ3dCLGtCQUFBQSxZQUFZLEVBQUUsSUFEb0I7QUFFbENDLGtCQUFBQSxpQkFBaUIsRUFBRUMsaUNBRmU7QUFHbENDLGtCQUFBQSxvQkFBb0IsRUFBRUM7QUFIWSxpQkFBeEIsQ0FBZDtBQU1NQyxnQkFBQUEsUyxrRUFDREMsdUJBQWdCQyxRLEVBQVcsVUFBQ0MsSUFBRDtBQUFBLHlCQUFlLE1BQUksQ0FBQ0MsSUFBTCxDQUFVQyxpQkFBVUgsUUFBcEIsRUFBOEIsNEJBQWNDLElBQWQsQ0FBOUIsQ0FBZjtBQUFBLGlCLGdEQUMzQkYsdUJBQWdCSyxTLEVBQVksaUJBYXZCO0FBQUEsc0JBWkZDLE1BWUUsU0FaRkEsTUFZRTtBQUFBLHNCQVhGQyxRQVdFLFNBWEZBLFFBV0U7QUFBQSxzQkFWRkMsUUFVRSxTQVZGQSxRQVVFO0FBQUEsc0JBVEZDLFFBU0UsU0FURkEsUUFTRTtBQUFBLHNCQVJGQyxVQVFFLFNBUkZBLFVBUUU7QUFBQSxzQkFQQ0MsR0FPRDtBQUNGLHNCQUFNQyxTQUF5QixHQUFHO0FBQzlCQyxvQkFBQUEsRUFBRSxFQUFFLENBQUNKLFFBRHlCO0FBRTlCSyxvQkFBQUEsSUFBSSxFQUFFLENBQUNKLFVBRnVCO0FBRzlCQyxvQkFBQUEsR0FBRyxFQUFIQTtBQUg4QixtQkFBbEM7O0FBTUEsMEJBQU9MLE1BQVA7QUFDSSx5QkFBS1MsdUJBQWdCQyxLQUFyQjtBQUNJLDBCQUFNQyxjQUFtQyxtQ0FDbENMLFNBRGtDO0FBRXJDTCx3QkFBQUEsUUFBUSxFQUFFLEVBQUVBLFFBQVEsSUFBSSxDQUFkLENBRjJCO0FBR3JDVyx3QkFBQUEsT0FBTyxFQUFFVixRQUFRLEtBQUtXLFNBQWIsR0FBeUJBLFNBQXpCLEdBQXFDLENBQUNYO0FBSFYsd0JBQXpDOztBQU1BLHNCQUFBLE1BQUksQ0FBQ0wsSUFBTCxDQUFVQyxpQkFBVWdCLFVBQXBCLEVBQWdDSCxjQUFoQzs7QUFDQTs7QUFDSix5QkFBS0YsdUJBQWdCTSxHQUFyQjtBQUNJLHNCQUFBLE1BQUksQ0FBQ2xCLElBQUwsQ0FBVUMsaUJBQVVrQixRQUFwQixFQUE4QlYsU0FBOUI7O0FBQ0E7O0FBQ0oseUJBQUtHLHVCQUFnQlEsSUFBckI7QUFDSSxzQkFBQSxNQUFJLENBQUNwQixJQUFMLENBQVVDLGlCQUFVb0IsU0FBcEIsRUFBK0JaLFNBQS9COztBQUNBO0FBZlI7QUFpQkgsaUIsZ0RBQ0FaLHVCQUFnQnlCLEssRUFBUSxpQkFHbkI7QUFBQSxzQkFGQ2QsR0FFRDtBQUNGO0FBQ0Esc0JBQU1DLFNBQWtCLEdBQUc7QUFDdkJELG9CQUFBQSxHQUFHLEVBQUhBO0FBRHVCLG1CQUEzQjs7QUFJQSxrQkFBQSxNQUFJLENBQUNSLElBQUwsQ0FBVUMsaUJBQVVxQixLQUFwQixFQUEyQmIsU0FBM0I7QUFDQTtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ2EsaUIsZ0RBQ0FaLHVCQUFnQjBCLFEsRUFBVyxpQkFHdEI7QUFBQSxzQkFGQ2YsR0FFRDtBQUNGO0FBQ0Esc0JBQU1DLFNBQWtCLEdBQUc7QUFDdkJELG9CQUFBQSxHQUFHLEVBQUhBO0FBRHVCLG1CQUEzQjs7QUFJQSxrQkFBQSxNQUFJLENBQUNSLElBQUwsQ0FBVUMsaUJBQVVzQixRQUFwQixFQUE4QmQsU0FBOUI7QUFDQTtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ2EsaUIsZ0RBQ0QsaUIsRUFBbUIsd0JBQUNWLElBQUQsRUFBZSxDQUM5QjtBQUNILGlCLGdEQUNELGdCLEVBQWtCLHVCQUFDQSxJQUFELEVBQWUsQ0FDN0I7O0FBQ0E7QUFDaEI7QUFDQTtBQUNhLGlCLGdEQUNELHFCLEVBQXVCLDRCQUFDQSxJQUFELEVBQWUsQ0FDbEM7O0FBQ0M7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFhLEVBQUVEO0FBTGMsT0FBakM7QUFPSDs7O3lCQUVZaEIsSyxFQUFtRjtBQUFBOztBQUFBLFVBQXBFekIsSUFBb0UsdUVBQXZDLEVBQXVDO0FBQUEsVUFBbkMyQyxNQUFtQyx1RUFBSixFQUFJO0FBQzVGLDRCQUFLdEQsTUFBTCxnRUFBYVksSUFBYixDQUFrQndCLEtBQWxCLGtDQUNPa0IsTUFEUDtBQUVJNUUsUUFBQUEsS0FBSyxFQUFFLEtBQUtBLEtBRmhCO0FBR0k2RSxRQUFBQSxZQUFZLEVBQUU1QztBQUhsQjtBQUtIOzs7d0JBL3NCZTtBQUFBOztBQUNaLGFBQU8sdUJBQUtYLE1BQUwsZ0VBQWF3RCxTQUFiLEtBQTBCLEtBQWpDO0FBQ0g7OztFQXpCeUJDLG9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGdvdCBmcm9tIFwiZ290XCJcbmltcG9ydCBpbyBmcm9tIFwic29ja2V0LmlvLWNsaWVudFwiIC8vIERBLT52MlxuaW1wb3J0IEVtaXR0ZXJ5IGZyb20gXCJlbWl0dGVyeVwiIFxuXG5pbXBvcnQgeyBBbGVydFNob3dBY3Rpb24sIEFsZXJ0U2hvd0V2ZW50LCBBbGVydFNob3dTdGFydEV2ZW50LCBBbGVydFR5cGUsIFNlcnZlckV2ZW50TmFtZSwgUmF3RGF0YSwgQ2xpZW50VHlwZSwgRXZlbnROYW1lLCBEb25hdGlvbiB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBHT1QgfSBmcm9tIFwiLi9zeW1ib2xzXCI7XG5pbXBvcnQgeyBwYXJzZURvbmF0aW9uIH0gZnJvbSBcIi4vcGFyc2Vyc1wiO1xuXG5pbXBvcnQgeyBEQV9VUkwsIFJFQ09OTkVDVElPTl9ERUxBWV9NQVgsIFJFQ09OTkVDVElPTl9ERUxBWV9NSU4gfSBmcm9tIFwiLi4vY29uc3RhbnRzXCI7XG5cbmNvbnN0IHJlZ2V4U29ja2V0VXJsID0gL2lvXFwoKCd8XCIpKD88dXJsPltcXHdcXC5cXDpcXC9dKylcXDEvXG5cbmV4cG9ydCBjbGFzcyBEQVNvY2tldCBleHRlbmRzIEVtaXR0ZXJ5PHtcbiAgICBbRXZlbnROYW1lLkRvbmF0aW9uXTogRG9uYXRpb24sXG4gICAgW0V2ZW50TmFtZS5BbGVydFN0YXJ0XTogQWxlcnRTaG93U3RhcnRFdmVudCxcbiAgICBbRXZlbnROYW1lLkFsZXJ0RW5kXTogQWxlcnRTaG93RXZlbnQsXG4gICAgW0V2ZW50TmFtZS5BbGVydFNraXBdOiBBbGVydFNob3dFdmVudCxcbiAgICBbRXZlbnROYW1lLk1lZGlhXTogUmF3RGF0YSxcbiAgICBbRXZlbnROYW1lLlN0aWNrZXJzXTogUmF3RGF0YVxufT4ge1xuICAgIHJlYWRvbmx5IHRva2VuOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBzb2NrZXRVcmw/OiBzdHJpbmc7XG5cbiAgICBwcml2YXRlIHNvY2tldD86IFNvY2tldElPQ2xpZW50LlNvY2tldFxuXG4gICAgY29uc3RydWN0b3IodG9rZW46IHN0cmluZywgeyBzb2NrZXRVcmwsIGF1dG9Db25uZWN0ID0gdHJ1ZSB9IDogeyBzb2NrZXRVcmw/OiBudW1iZXIgfCBzdHJpbmcsIGF1dG9Db25uZWN0PzogYm9vbGVhbiB9ID0ge30pIHtcbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIHRoaXMudG9rZW4gPSB0b2tlblxuXG4gICAgICAgIHRoaXMuc29ja2V0VXJsID0gdHlwZW9mIHNvY2tldFVybCA9PT0gXCJudW1iZXJcIiA/IGB3c3M6Ly9zb2NrZXQke3NvY2tldFVybH0uZG9uYXRpb25hbGVydHMucnVgIDogc29ja2V0VXJsXG5cbiAgICAgICAgaWYoYXV0b0Nvbm5lY3QpIHRoaXMuY29ubmVjdCgpXG4gICAgfVxuXG4gICAgZ2V0IGNvbm5lY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc29ja2V0Py5jb25uZWN0ZWQgfHwgZmFsc2VcbiAgICB9XG5cbiAgICBwcml2YXRlIFtHT1RdID0gZ290LmV4dGVuZCh7IFxuICAgICAgICBwcmVmaXhVcmw6IERBX1VSTFxuICAgIH0pXG5cbiAgICBhc3luYyBjcmF3bFdpZGdldCgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHRoaXNbR09UXShcIndpZGdldC9hbGVydHNcIiwge1xuICAgICAgICAgICAgc2VhcmNoUGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgdG9rZW46IHRoaXMudG9rZW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNvbHZlQm9keU9ubHk6IHRydWVcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBzb2NrZXRVcmwgPSByZWdleFNvY2tldFVybC5leGVjKGJvZHkpPy5ncm91cHM/LnVybFxuXG4gICAgICAgIGlmKCFzb2NrZXRVcmwpIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBwYXJzZSBzb2NrZXQgdXJsXCIpXG5cbiAgICAgICAgY29uc3QgcHJldiA9IHtcbiAgICAgICAgICAgIHNvY2tldFVybDogdGhpcy5zb2NrZXRVcmxcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc29ja2V0VXJsID0gc29ja2V0VXJsXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZXYsXG4gICAgICAgICAgICBzb2NrZXRVcmxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGNvbm5lY3QoeyBhZGRVc2VyID0gdHJ1ZSwgY2xpZW50VHlwZSA9IENsaWVudFR5cGUuTWlub3IgfSA9IHt9KSB7XG4gICAgICAgIGlmKCF0aGlzLnNvY2tldFVybCkgYXdhaXQgdGhpcy5jcmF3bFdpZGdldCgpXG5cbiAgICAgICAgdGhpcy5zb2NrZXQ/LmRpc2Nvbm5lY3QoKVxuICAgICAgICB0aGlzLnNvY2tldD8ucmVtb3ZlQWxsTGlzdGVuZXJzKClcblxuICAgICAgICB0aGlzLnNvY2tldCA9IGlvKGAke3RoaXMuc29ja2V0VXJsfWAsIHtcbiAgICAgICAgICAgIHJlY29ubmVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIHJlY29ubmVjdGlvbkRlbGF5OiBSRUNPTk5FQ1RJT05fREVMQVlfTUlOLFxuICAgICAgICAgICAgcmVjb25uZWN0aW9uRGVsYXlNYXg6IFJFQ09OTkVDVElPTl9ERUxBWV9NQVhcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBbU2VydmVyRXZlbnROYW1lLkRvbmF0aW9uXTogKGRhdGE6IGFueSkgPT4gdGhpcy5lbWl0KEV2ZW50TmFtZS5Eb25hdGlvbiwgcGFyc2VEb25hdGlvbihkYXRhKSksIFxuICAgICAgICAgICAgW1NlcnZlckV2ZW50TmFtZS5BbGVydFNob3ddOiAoe1xuICAgICAgICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICBncm91cF9pZCxcbiAgICAgICAgICAgICAgICBhbGVydF9pZCxcbiAgICAgICAgICAgICAgICBhbGVydF90eXBlLFxuICAgICAgICAgICAgICAgIC4uLnJhd1xuICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IHN0cmluZyxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbj86IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgICAgICAgICBncm91cF9pZD86IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgICAgICAgICBhbGVydF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICAgICAgICAgIGFsZXJ0X3R5cGU6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgICAgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50RGF0YTogQWxlcnRTaG93RXZlbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiArYWxlcnRfaWQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICthbGVydF90eXBlIGFzIEFsZXJ0VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcmF3XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoKGFjdGlvbiBhcyBBbGVydFNob3dBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBBbGVydFNob3dBY3Rpb24uU3RhcnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydEV2ZW50RGF0YTogQWxlcnRTaG93U3RhcnRFdmVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ldmVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246ICsoZHVyYXRpb24gfHwgMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogZ3JvdXBfaWQgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6ICtncm91cF9pZFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRXZlbnROYW1lLkFsZXJ0U3RhcnQsIHN0YXJ0RXZlbnREYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBBbGVydFNob3dBY3Rpb24uRW5kOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KEV2ZW50TmFtZS5BbGVydEVuZCwgZXZlbnREYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBBbGVydFNob3dBY3Rpb24uU2tpcDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFdmVudE5hbWUuQWxlcnRTa2lwLCBldmVudERhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbU2VydmVyRXZlbnROYW1lLk1lZGlhXTogKHtcbiAgICAgICAgICAgICAgICAuLi5yYXdcbiAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogcGFyc2VcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudERhdGE6IFJhd0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJhd1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFdmVudE5hbWUuTWVkaWEsIGV2ZW50RGF0YSlcbiAgICAgICAgICAgICAgICAvKiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2FkZCcsXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYV9pZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6ICc0MjY1NjQ2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2aWRlbycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJfdHlwZTogJ3lvdXR1YmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdEYXJ1ZGUgLSBTYW5kc3Rvcm0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkaXRpb25hbF9kYXRhOiAne1widmlkZW9faWRcIjpcInk2MTIwUU9sc2ZVXCIsXCJhbGVydF9pZFwiOjAsXCJhbGVydF90eXBlXCI6MSxcIm93bmVyXCI6XCJcXFxcdTA0MThcXFxcdTA0M2NcXFxcdTA0NGZcIixcInVybFwiOlwiaHR0cHM6XFxcXC9cXFxcL3d3dy55b3V0dWJlLmNvbVxcXFwvd2F0Y2g/dj15NjEyMFFPbHNmVVwiLFwic3RhcnRfZnJvbVwiOjAsXCJwYWlkX2Ftb3VudHNcIjp7XCJCWU5cIjoxMi40MSxcIkVVUlwiOjQuMjQsXCJLWlRcIjoyMTI2Ljc1LFwiUlVCXCI6MzYyLjE2LFwiVUFIXCI6MTMzLjM1LFwiVVNEXCI6NSxcIkJSTFwiOjI2LjEyLFwiVFJZXCI6NDIuMjMsXCJQTE5cIjoxOS40MX19JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVfY3JlYXRlZDogJzIwMjEtMDktMTYgMjE6MzQ6MDgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNfcGxheWVkOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZV9wbGF5ZWQ6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB7IGFjdGlvbjogJ2dldC1wYXVzZS1zdGF0ZScsIHNvdXJjZTogJ21lZGlhX3dpZGdldCcgfVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0dGluZ3MtY2hhbmdlJyxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZGdldF9pZDogJzQ5ODMzNTgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcl9pZDogJzQyNjU2NDYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNfZW5hYmxlZDogJzEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMEZGMDAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluX2Ftb3VudDogJzIwLjAwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvX2Rpc3BsYXk6ICdtYW51YWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRfY29udGFpbmVyOiAnbWVkaWFfd2lkZ2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvbHVtZTogJzUwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudF9wZXJfc2Vjb25kX2lzX2VuYWJsZWQ6ICcwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudF9wZXJfc2Vjb25kOiAnMC41MCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsX2RhdGE6ICd7XCJ2aWRlb19taW5fbGlrZXNfcGVyY1wiOjUwLFwidmlkZW9fbWluX3ZpZXdzXCI6NTAwMDB9J1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3BsYXknLFxuICAgICAgICAgICAgICAgICAgICBtZWRpYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVkaWFfaWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyX2lkOiAnNDI2NTY0NicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndmlkZW8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViX3R5cGU6ICd5b3V0dWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnRGFydWRlIC0gU2FuZHN0b3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxfZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9faWQ6ICd5NjEyMFFPbHNmVScsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydF9pZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0X3R5cGU6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBvd25lcjogJ9CY0LzRjycsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PXk2MTIwUU9sc2ZVJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0X2Zyb206IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlkX2Ftb3VudHM6IFtPYmplY3RdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZV9jcmVhdGVkOiAnMjAyMS0wOS0xNiAyMTozNjoxMycsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc19wbGF5ZWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlX3BsYXllZDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2FkZCcsXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYV9pZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6ICc0MjY1NjQ2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2aWRlbycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJfdHlwZTogJ3lvdXR1YmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdSaWNrIEFzdGxleSAtIE5ldmVyIEdvbm5hIEdpdmUgWW91IFVwIChWaWRlbyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkaXRpb25hbF9kYXRhOiAne1widmlkZW9faWRcIjpcImRRdzR3OVdnWGNRXCIsXCJhbGVydF9pZFwiOjAsXCJhbGVydF90eXBlXCI6MSxcIm93bmVyXCI6XCJcXFxcdTA0MThcXFxcdTA0M2NcXFxcdTA0NGZcIixcInVybFwiOlwiaHR0cHM6XFxcXC9cXFxcL3d3dy55b3V0dWJlLmNvbVxcXFwvd2F0Y2g/dj1kUXc0dzlXZ1hjUVwiLFwic3RhcnRfZnJvbVwiOjAsXCJwYWlkX2Ftb3VudHNcIjp7XCJCWU5cIjoxMi40MSxcIkVVUlwiOjQuMjQsXCJLWlRcIjoyMTI2Ljc1LFwiUlVCXCI6MzYyLjE2LFwiVUFIXCI6MTMzLjM1LFwiVVNEXCI6NSxcIkJSTFwiOjI2LjEyLFwiVFJZXCI6NDIuMjMsXCJQTE5cIjoxOS40MX19JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVfY3JlYXRlZDogJzIwMjEtMDktMTYgMjE6Mzg6NDMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNfcGxheWVkOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZV9wbGF5ZWQ6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgeyBhY3Rpb246ICdza2lwJywgbWVkaWE6IHsgbWVkaWFfaWQ6IDAgfSB9XG4gICAgICAgICAgICAgICAgeyBhY3Rpb246ICdnZXQtY3VycmVudC1tZWRpYScsIHNvdXJjZTogJ2xhc3RfYWxlcnRzX3dpZGdldCcgfVxuICAgICAgICAgICAgICAgIHsgYWN0aW9uOiAncmVjZWl2ZS12b2x1bWUtb3ZlcnJpZGUnLCB2b2x1bWU6ICc1MCcgfVxuICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgW1NlcnZlckV2ZW50TmFtZS5TdGlja2Vyc106ICh7XG4gICAgICAgICAgICAgICAgLi4ucmF3XG4gICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgfSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IHBhcnNlXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnREYXRhOiBSYXdEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICByYXdcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoRXZlbnROYW1lLlN0aWNrZXJzLCBldmVudERhdGEpXG4gICAgICAgICAgICAgICAgLyoge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdhZGQnLFxuICAgICAgICAgICAgICAgICAgICBzdGlja2VyczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICc5MjM5NycsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiA4OSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiAxLjQ1LFxuICAgICAgICAgICAgICAgICAgICAgICAgYW5nbGU6IC0yMTksXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3N0YXRpYy5kb25hdGlvbmFsZXJ0cy5ydS91cGxvYWRzL3N0aWNrZXJzLzQyNjU2NDYvRG5rS1BxQjQxUzBucE11MjhCZlJpSnhEaW9JeEM4cXgwVUl3TWNIUS5wbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ1cGRhdGUtaXNzX2RhdGFcIjogKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERFQlVHXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ1cGRhdGUtZGdfZGF0YVwiOiAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gREVCVUdcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIHsgZ29hbF9pZDogNDE3MDEyOCB9XG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInVwZGF0ZS1hbGVydF93aWRnZXRcIjogKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERFQlVHXG4gICAgICAgICAgICAgICAgIC8qIGFsZXJ0IHdpZGdldCB7XG4gIHZhcmlhdGlvbnM6IFtcbiAgICB7XG4gICAgICBlbnRpdHlfaWQ6ICcxNzU2NTAzMCcsXG4gICAgICB1c2VyX2lkOiAnNDI2NTY0NicsXG4gICAgICBncm91cF9pZDogJzEnLFxuICAgICAgd2luZG93X2Nvb3JfeDogJzAnLFxuICAgICAgd2luZG93X2Nvb3JfeTogJzAnLFxuICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMEZGMDAnLFxuICAgICAgdm9sdW1lOiAnNTAnLFxuICAgICAgZGlzcGxheV9wYXR0ZXJuOiAnaW1hZ2VfdG9wX190ZXh0X2JvdHRvbScsXG4gICAgICBzb3VuZDogJ3NvdW5kcy80MjY1NjQ2L3RvcnRpay5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni90b3J0LmdpZicsXG4gICAgICBtZXNzYWdlX2JhY2tncm91bmQ6ICdyZ2JhKDAsIDAsIDAsIDApJyxcbiAgICAgIGlzX3RlbXBvcmFyeV9kaXNhYmxlZDogJzAnLFxuICAgICAgY29sb3JfMTogJyMwMDAwMDAnLFxuICAgICAgY29sb3JfMjogJyMwMDAwMDAnLFxuICAgICAgZGlzcGxheV9kdXJhdGlvbjogJzcuMDAnLFxuICAgICAgdGV4dF9kZWxheTogJzAuMDAnLFxuICAgICAgdGV4dF9kdXJhdGlvbjogJzcuMDAnLFxuICAgICAgZm9udF9zaXplXzE6ICcwJyxcbiAgICAgIGZvbnRfc2l6ZV8yOiAnMCcsXG4gICAgICBoZWFkZXJfdGV4dDogJ3tcImZvbnRfc3R5bGVcIjp7XCJmb250LWZhbWlseVwiOlwiXFxcXFwiUnViaWsgTW9ubyBPbmVcXFxcXCJcIixcImZvbnQtc2l6ZVwiOlwiODBweFwiLFwiY29sb3JcIjpcIiNGRkZGRkZcIixcImZvbnQtd2VpZ2h0XCI6XCJib2xkXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI4cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDkpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJydWJiZXJCYW5kXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBtZXNzYWdlX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjUwcHhcIixcImNvbG9yXCI6XCJyZ2IoMjU1LCAyNTUsIDI1NSlcIixcImZvbnQtd2VpZ2h0XCI6XCJub3JtYWxcIixcImZvbnQtc3R5bGVcIjpcIm5vcm1hbFwiLFwidGV4dC1kZWNvcmF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LXRyYW5zZm9ybVwiOlwibm9uZVwiLFwidGV4dC1zaGFkb3dcIjpcIjdweFwiLFwidGV4dC1zaGFkb3dfY29sb3JcIjpcInJnYmEoMCwgMCwgMCwgMC4wMylcIixcImxldHRlci1zcGFjaW5nXCI6XCIwcHhcIixcIndvcmQtc3BhY2luZ1wiOlwiMHB4XCIsXCJ0ZXh0LWFsaWduXCI6XCJjZW50ZXJcIixcInZlcnRpY2FsLWFsaWduXCI6XCJtaWRkbGVcIixcImJhY2tncm91bmQtY29sb3JcIjpcInJnYmEoMjIzLCAyNTUsIDAsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBkb25hdGlvbl9hdWRpb192b2x1bWU6ICc1MCcsXG4gICAgICBkb25hdGlvbl9hdWRpb19wbGF5X3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheWJhY2s6ICcwJyxcbiAgICAgIHR0c19pc19lbmFibGVkOiAnMScsXG4gICAgICB0dHNfbGFuZ3VhZ2U6ICdydV9SVScsXG4gICAgICB0dHNfc2NlbmFyaW86ICdhZnRlcl9zb3VuZCcsXG4gICAgICB0dHNfdm9sdW1lOiAnMzAnLFxuICAgICAgdHRzX2Ftb3VudF9taW46ICcwLjAwJyxcbiAgICAgIHR0c192b2ljZTogJ21hbGUsZmVtYWxlLDMsMTksMjAsJyxcbiAgICAgIHR0c19yYXRlOiAnbWVkaXVtJyxcbiAgICAgIHZhcmlhdGlvbl9jb25kaXRpb25zOiAnW3tcIm1vZGVcIjpcImFsZXJ0X3R5cGVcIixcInZhbHVlXCI6MX0se1wibW9kZVwiOlwicmFuZG9tXCIsXCJ2YWx1ZVwiOjN9XScsXG4gICAgICBuYW1lOiBudWxsLFxuICAgICAgaXNfYWN0aXZlOiAnMScsXG4gICAgICBpc19kZWxldGVkOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJzAnLFxuICAgICAgYWRkaXRpb25hbF9kYXRhOiBudWxsLFxuICAgICAgaGVhZGVyX3RlbXBsYXRlOiAne3VzZXJuYW1lfSAtIHthbW91bnR9IScsXG4gICAgICBtZXNzYWdlX3RlbXBsYXRlOiBudWxsXG4gICAgfSxcbiAgICB7XG4gICAgICBlbnRpdHlfaWQ6ICcyMjQwNDI3NCcsXG4gICAgICB1c2VyX2lkOiAnNDI2NTY0NicsXG4gICAgICBncm91cF9pZDogJzEnLFxuICAgICAgd2luZG93X2Nvb3JfeDogJzAnLFxuICAgICAgd2luZG93X2Nvb3JfeTogJzAnLFxuICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMEZGMDAnLFxuICAgICAgdm9sdW1lOiAnNTAnLFxuICAgICAgZGlzcGxheV9wYXR0ZXJuOiAnaW1hZ2VfdG9wX190ZXh0X2JvdHRvbScsXG4gICAgICBzb3VuZDogJ3NvdW5kcy80MjY1NjQ2L212aWRlby5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni9tdmlkZW8uZ2lmJyxcbiAgICAgIG1lc3NhZ2VfYmFja2dyb3VuZDogJ3JnYmEoMCwgMCwgMCwgMCknLFxuICAgICAgaXNfdGVtcG9yYXJ5X2Rpc2FibGVkOiAnMCcsXG4gICAgICBjb2xvcl8xOiAnIzAwMDAwMCcsXG4gICAgICBjb2xvcl8yOiAnIzAwMDAwMCcsXG4gICAgICBkaXNwbGF5X2R1cmF0aW9uOiAnMTMuMDAnLFxuICAgICAgdGV4dF9kZWxheTogJzAuMDAnLFxuICAgICAgdGV4dF9kdXJhdGlvbjogJzEzLjAwJyxcbiAgICAgIGZvbnRfc2l6ZV8xOiAnMCcsXG4gICAgICBmb250X3NpemVfMjogJzAnLFxuICAgICAgaGVhZGVyX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrIE1vbm8gT25lXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjgwcHhcIixcImNvbG9yXCI6XCIjRkZGRkZGXCIsXCJmb250LXdlaWdodFwiOlwiYm9sZFwiLFwiZm9udC1zdHlsZVwiOlwibm9ybWFsXCIsXCJ0ZXh0LWRlY29yYXRpb25cIjpcIm5vbmVcIixcInRleHQtdHJhbnNmb3JtXCI6XCJub25lXCIsXCJ0ZXh0LXNoYWRvd1wiOlwiOHB4XCIsXCJ0ZXh0LXNoYWRvd19jb2xvclwiOlwicmdiYSgwLCAwLCAwLCAwLjA5KVwiLFwibGV0dGVyLXNwYWNpbmdcIjpcIjBweFwiLFwid29yZC1zcGFjaW5nXCI6XCIwcHhcIixcInRleHQtYWxpZ25cIjpcImNlbnRlclwiLFwidmVydGljYWwtYWxpZ25cIjpcIm1pZGRsZVwiLFwiYmFja2dyb3VuZC1jb2xvclwiOlwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwicnViYmVyQmFuZFwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgbWVzc2FnZV90ZXh0OiAne1wiZm9udF9zdHlsZVwiOntcImZvbnQtZmFtaWx5XCI6XCJcXFxcXCJSdWJpa1xcXFxcIlwiLFwiZm9udC1zaXplXCI6XCI1MHB4XCIsXCJjb2xvclwiOlwicmdiKDI1NSwgMjU1LCAyNTUpXCIsXCJmb250LXdlaWdodFwiOlwibm9ybWFsXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI3cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDMpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDIyMywgMjU1LCAwLCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwibm9uZVwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgZG9uYXRpb25fYXVkaW9fdm9sdW1lOiAnNTAnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheV9zY2VuYXJpbzogJ2FmdGVyX3NvdW5kJyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3BsYXliYWNrOiAnMCcsXG4gICAgICB0dHNfaXNfZW5hYmxlZDogJzEnLFxuICAgICAgdHRzX2xhbmd1YWdlOiAncnVfUlUnLFxuICAgICAgdHRzX3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgdHRzX3ZvbHVtZTogJzMwJyxcbiAgICAgIHR0c19hbW91bnRfbWluOiAnMC4wMCcsXG4gICAgICB0dHNfdm9pY2U6ICdtYWxlLGZlbWFsZSwzLDE5LDIwLCcsXG4gICAgICB0dHNfcmF0ZTogJ21lZGl1bScsXG4gICAgICB2YXJpYXRpb25fY29uZGl0aW9uczogJ1t7XCJtb2RlXCI6XCJhbGVydF90eXBlXCIsXCJ2YWx1ZVwiOlwiMVwifSx7XCJtb2RlXCI6XCJhbW91bnRfZXF1YWxfdG9cIixcInZhbHVlXCI6NTYwMH1dJyxcbiAgICAgIG5hbWU6ICc1NjAwJyxcbiAgICAgIGlzX2FjdGl2ZTogJzEnLFxuICAgICAgaXNfZGVsZXRlZDogJzAnLFxuICAgICAgcG9zaXRpb246ICcwJyxcbiAgICAgIGFkZGl0aW9uYWxfZGF0YTogbnVsbCxcbiAgICAgIGhlYWRlcl90ZW1wbGF0ZTogJ3t1c2VybmFtZX0gLSB7YW1vdW50fSEnLFxuICAgICAgbWVzc2FnZV90ZW1wbGF0ZTogbnVsbFxuICAgIH0sXG4gICAge1xuICAgICAgZW50aXR5X2lkOiAnMjI0MTA0NDknLFxuICAgICAgdXNlcl9pZDogJzQyNjU2NDYnLFxuICAgICAgZ3JvdXBfaWQ6ICcxJyxcbiAgICAgIHdpbmRvd19jb29yX3g6ICcwJyxcbiAgICAgIHdpbmRvd19jb29yX3k6ICcwJyxcbiAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMDBGRjAwJyxcbiAgICAgIHZvbHVtZTogJzUwJyxcbiAgICAgIGRpc3BsYXlfcGF0dGVybjogJ2ltYWdlX3RvcF9fdGV4dF9ib3R0b20nLFxuICAgICAgc291bmQ6ICdzb3VuZHMvNDI2NTY0Ni9uaWh1eWF0aXZpZWJhbC5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni9uaWh1eWF0aXZpZWJhbC5naWYnLFxuICAgICAgbWVzc2FnZV9iYWNrZ3JvdW5kOiAncmdiYSgwLCAwLCAwLCAwKScsXG4gICAgICBpc190ZW1wb3JhcnlfZGlzYWJsZWQ6ICcwJyxcbiAgICAgIGNvbG9yXzE6ICcjMDAwMDAwJyxcbiAgICAgIGNvbG9yXzI6ICcjMDAwMDAwJyxcbiAgICAgIGRpc3BsYXlfZHVyYXRpb246ICc4LjAwJyxcbiAgICAgIHRleHRfZGVsYXk6ICcwLjAwJyxcbiAgICAgIHRleHRfZHVyYXRpb246ICc4LjAwJyxcbiAgICAgIGZvbnRfc2l6ZV8xOiAnMCcsXG4gICAgICBmb250X3NpemVfMjogJzAnLFxuICAgICAgaGVhZGVyX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrIE1vbm8gT25lXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjgwcHhcIixcImNvbG9yXCI6XCIjRkZGRkZGXCIsXCJmb250LXdlaWdodFwiOlwiYm9sZFwiLFwiZm9udC1zdHlsZVwiOlwibm9ybWFsXCIsXCJ0ZXh0LWRlY29yYXRpb25cIjpcIm5vbmVcIixcInRleHQtdHJhbnNmb3JtXCI6XCJub25lXCIsXCJ0ZXh0LXNoYWRvd1wiOlwiOHB4XCIsXCJ0ZXh0LXNoYWRvd19jb2xvclwiOlwicmdiYSgwLCAwLCAwLCAwLjA5KVwiLFwibGV0dGVyLXNwYWNpbmdcIjpcIjBweFwiLFwid29yZC1zcGFjaW5nXCI6XCIwcHhcIixcInRleHQtYWxpZ25cIjpcImNlbnRlclwiLFwidmVydGljYWwtYWxpZ25cIjpcIm1pZGRsZVwiLFwiYmFja2dyb3VuZC1jb2xvclwiOlwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwicnViYmVyQmFuZFwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgbWVzc2FnZV90ZXh0OiAne1wiZm9udF9zdHlsZVwiOntcImZvbnQtZmFtaWx5XCI6XCJcXFxcXCJSdWJpa1xcXFxcIlwiLFwiZm9udC1zaXplXCI6XCI1MHB4XCIsXCJjb2xvclwiOlwicmdiKDI1NSwgMjU1LCAyNTUpXCIsXCJmb250LXdlaWdodFwiOlwibm9ybWFsXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI3cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDMpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDIyMywgMjU1LCAwLCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwibm9uZVwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgZG9uYXRpb25fYXVkaW9fdm9sdW1lOiAnNTAnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheV9zY2VuYXJpbzogJ2FmdGVyX3NvdW5kJyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3BsYXliYWNrOiAnMCcsXG4gICAgICB0dHNfaXNfZW5hYmxlZDogJzEnLFxuICAgICAgdHRzX2xhbmd1YWdlOiAncnVfUlUnLFxuICAgICAgdHRzX3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgdHRzX3ZvbHVtZTogJzMwJyxcbiAgICAgIHR0c19hbW91bnRfbWluOiAnMC4wMCcsXG4gICAgICB0dHNfdm9pY2U6ICdtYWxlLGZlbWFsZSwzLDE5LDIwLCcsXG4gICAgICB0dHNfcmF0ZTogJ21lZGl1bScsXG4gICAgICB2YXJpYXRpb25fY29uZGl0aW9uczogJ1t7XCJtb2RlXCI6XCJhbGVydF90eXBlXCIsXCJ2YWx1ZVwiOlwiMVwifSx7XCJtb2RlXCI6XCJhbW91bnRfZXF1YWxfb3JfZ3JlYXRlcl90aGFuXCIsXCJ2YWx1ZVwiOjEwMH1dJyxcbiAgICAgIG5hbWU6ICcxMDAnLFxuICAgICAgaXNfYWN0aXZlOiAnMScsXG4gICAgICBpc19kZWxldGVkOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJzAnLFxuICAgICAgYWRkaXRpb25hbF9kYXRhOiBudWxsLFxuICAgICAgaGVhZGVyX3RlbXBsYXRlOiAne3VzZXJuYW1lfSAtIHthbW91bnR9IScsXG4gICAgICBtZXNzYWdlX3RlbXBsYXRlOiBudWxsXG4gICAgfSxcbiAgICB7XG4gICAgICBlbnRpdHlfaWQ6ICcyMjQ2NzAwMycsXG4gICAgICB1c2VyX2lkOiAnNDI2NTY0NicsXG4gICAgICBncm91cF9pZDogJzEnLFxuICAgICAgd2luZG93X2Nvb3JfeDogJzAnLFxuICAgICAgd2luZG93X2Nvb3JfeTogJzAnLFxuICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMEZGMDAnLFxuICAgICAgdm9sdW1lOiAnNTAnLFxuICAgICAgZGlzcGxheV9wYXR0ZXJuOiAnaW1hZ2VfdG9wX190ZXh0X2JvdHRvbScsXG4gICAgICBzb3VuZDogJ3NvdW5kcy80MjY1NjQ2L3ByZXNlZGVudC5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni9wcmVzZWRlbnQuZ2lmJyxcbiAgICAgIG1lc3NhZ2VfYmFja2dyb3VuZDogJ3JnYmEoMCwgMCwgMCwgMCknLFxuICAgICAgaXNfdGVtcG9yYXJ5X2Rpc2FibGVkOiAnMCcsXG4gICAgICBjb2xvcl8xOiAnIzAwMDAwMCcsXG4gICAgICBjb2xvcl8yOiAnIzAwMDAwMCcsXG4gICAgICBkaXNwbGF5X2R1cmF0aW9uOiAnNy4wMCcsXG4gICAgICB0ZXh0X2RlbGF5OiAnMC4wMCcsXG4gICAgICB0ZXh0X2R1cmF0aW9uOiAnNy4wMCcsXG4gICAgICBmb250X3NpemVfMTogJzAnLFxuICAgICAgZm9udF9zaXplXzI6ICcwJyxcbiAgICAgIGhlYWRlcl90ZXh0OiAne1wiZm9udF9zdHlsZVwiOntcImZvbnQtZmFtaWx5XCI6XCJcXFxcXCJSdWJpayBNb25vIE9uZVxcXFxcIlwiLFwiZm9udC1zaXplXCI6XCI4MHB4XCIsXCJjb2xvclwiOlwiI0ZGRkZGRlwiLFwiZm9udC13ZWlnaHRcIjpcImJvbGRcIixcImZvbnQtc3R5bGVcIjpcIm5vcm1hbFwiLFwidGV4dC1kZWNvcmF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LXRyYW5zZm9ybVwiOlwibm9uZVwiLFwidGV4dC1zaGFkb3dcIjpcIjhweFwiLFwidGV4dC1zaGFkb3dfY29sb3JcIjpcInJnYmEoMCwgMCwgMCwgMC4wOSlcIixcImxldHRlci1zcGFjaW5nXCI6XCIwcHhcIixcIndvcmQtc3BhY2luZ1wiOlwiMHB4XCIsXCJ0ZXh0LWFsaWduXCI6XCJjZW50ZXJcIixcInZlcnRpY2FsLWFsaWduXCI6XCJtaWRkbGVcIixcImJhY2tncm91bmQtY29sb3JcIjpcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIixcImJvcmRlci1yYWRpdXNcIjpcIjBweFwifSxcImZvbnRfYW5pbWF0aW9uXCI6e1widGV4dC1hbmltYXRpb25cIjpcInJ1YmJlckJhbmRcIixcInRleHQtYW5pbWF0aW9uLW1vZGVcIjpcImxldHRlcnNcIn19JyxcbiAgICAgIG1lc3NhZ2VfdGV4dDogJ3tcImZvbnRfc3R5bGVcIjp7XCJmb250LWZhbWlseVwiOlwiXFxcXFwiUnViaWtcXFxcXCJcIixcImZvbnQtc2l6ZVwiOlwiNTBweFwiLFwiY29sb3JcIjpcInJnYigyNTUsIDI1NSwgMjU1KVwiLFwiZm9udC13ZWlnaHRcIjpcIm5vcm1hbFwiLFwiZm9udC1zdHlsZVwiOlwibm9ybWFsXCIsXCJ0ZXh0LWRlY29yYXRpb25cIjpcIm5vbmVcIixcInRleHQtdHJhbnNmb3JtXCI6XCJub25lXCIsXCJ0ZXh0LXNoYWRvd1wiOlwiN3B4XCIsXCJ0ZXh0LXNoYWRvd19jb2xvclwiOlwicmdiYSgwLCAwLCAwLCAwLjAzKVwiLFwibGV0dGVyLXNwYWNpbmdcIjpcIjBweFwiLFwid29yZC1zcGFjaW5nXCI6XCIwcHhcIixcInRleHQtYWxpZ25cIjpcImNlbnRlclwiLFwidmVydGljYWwtYWxpZ25cIjpcIm1pZGRsZVwiLFwiYmFja2dyb3VuZC1jb2xvclwiOlwicmdiYSgyMjMsIDI1NSwgMCwgMClcIixcImJvcmRlci1yYWRpdXNcIjpcIjBweFwifSxcImZvbnRfYW5pbWF0aW9uXCI6e1widGV4dC1hbmltYXRpb25cIjpcIm5vbmVcIixcInRleHQtYW5pbWF0aW9uLW1vZGVcIjpcImxldHRlcnNcIn19JyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3ZvbHVtZTogJzUwJyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3BsYXlfc2NlbmFyaW86ICdhZnRlcl9zb3VuZCcsXG4gICAgICBkb25hdGlvbl9hdWRpb19wbGF5YmFjazogJzAnLFxuICAgICAgdHRzX2lzX2VuYWJsZWQ6ICcxJyxcbiAgICAgIHR0c19sYW5ndWFnZTogJ3J1X1JVJyxcbiAgICAgIHR0c19zY2VuYXJpbzogJ2FmdGVyX3NvdW5kJyxcbiAgICAgIHR0c192b2x1bWU6ICczMCcsXG4gICAgICB0dHNfYW1vdW50X21pbjogJzAuMDAnLFxuICAgICAgdHRzX3ZvaWNlOiAnbWFsZSxmZW1hbGUsMywxOSwyMCwnLFxuICAgICAgdHRzX3JhdGU6ICdtZWRpdW0nLFxuICAgICAgdmFyaWF0aW9uX2NvbmRpdGlvbnM6ICdbe1wibW9kZVwiOlwiYWxlcnRfdHlwZVwiLFwidmFsdWVcIjpcIjFcIn0se1wibW9kZVwiOlwiYW1vdW50X2VxdWFsX29yX2dyZWF0ZXJfdGhhblwiLFwidmFsdWVcIjo1MDB9XScsXG4gICAgICBuYW1lOiAnNTAwJyxcbiAgICAgIGlzX2FjdGl2ZTogJzEnLFxuICAgICAgaXNfZGVsZXRlZDogJzAnLFxuICAgICAgcG9zaXRpb246ICcwJyxcbiAgICAgIGFkZGl0aW9uYWxfZGF0YTogbnVsbCxcbiAgICAgIGhlYWRlcl90ZW1wbGF0ZTogJ3t1c2VybmFtZX0gLSB7YW1vdW50fSEnLFxuICAgICAgbWVzc2FnZV90ZW1wbGF0ZTogbnVsbFxuICAgIH0sXG4gICAge1xuICAgICAgZW50aXR5X2lkOiAnMjI0NjcyMzknLFxuICAgICAgdXNlcl9pZDogJzQyNjU2NDYnLFxuICAgICAgZ3JvdXBfaWQ6ICcxJyxcbiAgICAgIHdpbmRvd19jb29yX3g6ICcwJyxcbiAgICAgIHdpbmRvd19jb29yX3k6ICcwJyxcbiAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMDBGRjAwJyxcbiAgICAgIHZvbHVtZTogJzUwJyxcbiAgICAgIGRpc3BsYXlfcGF0dGVybjogJ2ltYWdlX3RvcF9fdGV4dF9ib3R0b20nLFxuICAgICAgc291bmQ6ICdzb3VuZHMvNDI2NTY0Ni9zaG9rb2xhZC5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni9zaG9rby5naWYnLFxuICAgICAgbWVzc2FnZV9iYWNrZ3JvdW5kOiAncmdiYSgwLCAwLCAwLCAwKScsXG4gICAgICBpc190ZW1wb3JhcnlfZGlzYWJsZWQ6ICcwJyxcbiAgICAgIGNvbG9yXzE6ICcjMDAwMDAwJyxcbiAgICAgIGNvbG9yXzI6ICcjMDAwMDAwJyxcbiAgICAgIGRpc3BsYXlfZHVyYXRpb246ICcxMC4wMCcsXG4gICAgICB0ZXh0X2RlbGF5OiAnMC4wMCcsXG4gICAgICB0ZXh0X2R1cmF0aW9uOiAnMTAuMDAnLFxuICAgICAgZm9udF9zaXplXzE6ICcwJyxcbiAgICAgIGZvbnRfc2l6ZV8yOiAnMCcsXG4gICAgICBoZWFkZXJfdGV4dDogJ3tcImZvbnRfc3R5bGVcIjp7XCJmb250LWZhbWlseVwiOlwiXFxcXFwiUnViaWsgTW9ubyBPbmVcXFxcXCJcIixcImZvbnQtc2l6ZVwiOlwiODBweFwiLFwiY29sb3JcIjpcIiNGRkZGRkZcIixcImZvbnQtd2VpZ2h0XCI6XCJib2xkXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI4cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDkpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJydWJiZXJCYW5kXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBtZXNzYWdlX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjUwcHhcIixcImNvbG9yXCI6XCJyZ2IoMjU1LCAyNTUsIDI1NSlcIixcImZvbnQtd2VpZ2h0XCI6XCJub3JtYWxcIixcImZvbnQtc3R5bGVcIjpcIm5vcm1hbFwiLFwidGV4dC1kZWNvcmF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LXRyYW5zZm9ybVwiOlwibm9uZVwiLFwidGV4dC1zaGFkb3dcIjpcIjdweFwiLFwidGV4dC1zaGFkb3dfY29sb3JcIjpcInJnYmEoMCwgMCwgMCwgMC4wMylcIixcImxldHRlci1zcGFjaW5nXCI6XCIwcHhcIixcIndvcmQtc3BhY2luZ1wiOlwiMHB4XCIsXCJ0ZXh0LWFsaWduXCI6XCJjZW50ZXJcIixcInZlcnRpY2FsLWFsaWduXCI6XCJtaWRkbGVcIixcImJhY2tncm91bmQtY29sb3JcIjpcInJnYmEoMjIzLCAyNTUsIDAsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBkb25hdGlvbl9hdWRpb192b2x1bWU6ICc1MCcsXG4gICAgICBkb25hdGlvbl9hdWRpb19wbGF5X3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheWJhY2s6ICcwJyxcbiAgICAgIHR0c19pc19lbmFibGVkOiAnMScsXG4gICAgICB0dHNfbGFuZ3VhZ2U6ICdydV9SVScsXG4gICAgICB0dHNfc2NlbmFyaW86ICdhZnRlcl9zb3VuZCcsXG4gICAgICB0dHNfdm9sdW1lOiAnMzAnLFxuICAgICAgdHRzX2Ftb3VudF9taW46ICcwLjAwJyxcbiAgICAgIHR0c192b2ljZTogJ21hbGUsZmVtYWxlLDMsMTksMjAsJyxcbiAgICAgIHR0c19yYXRlOiAnbWVkaXVtJyxcbiAgICAgIHZhcmlhdGlvbl9jb25kaXRpb25zOiAnW3tcIm1vZGVcIjpcImFsZXJ0X3R5cGVcIixcInZhbHVlXCI6XCIxXCJ9LHtcIm1vZGVcIjpcImFtb3VudF9lcXVhbF9vcl9ncmVhdGVyX3RoYW5cIixcInZhbHVlXCI6MzAwfV0nLFxuICAgICAgbmFtZTogJzMwMCcsXG4gICAgICBpc19hY3RpdmU6ICcxJyxcbiAgICAgIGlzX2RlbGV0ZWQ6ICcwJyxcbiAgICAgIHBvc2l0aW9uOiAnMCcsXG4gICAgICBhZGRpdGlvbmFsX2RhdGE6IG51bGwsXG4gICAgICBoZWFkZXJfdGVtcGxhdGU6ICd7dXNlcm5hbWV9IC0ge2Ftb3VudH0hJyxcbiAgICAgIG1lc3NhZ2VfdGVtcGxhdGU6IG51bGxcbiAgICB9LFxuICAgIHtcbiAgICAgIGVudGl0eV9pZDogJzIyNTAyMTU3JyxcbiAgICAgIHVzZXJfaWQ6ICc0MjY1NjQ2JyxcbiAgICAgIGdyb3VwX2lkOiAnMScsXG4gICAgICB3aW5kb3dfY29vcl94OiAnMCcsXG4gICAgICB3aW5kb3dfY29vcl95OiAnMCcsXG4gICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzAwRkYwMCcsXG4gICAgICB2b2x1bWU6ICc1MCcsXG4gICAgICBkaXNwbGF5X3BhdHRlcm46ICdpbWFnZV90b3BfX3RleHRfYm90dG9tJyxcbiAgICAgIHNvdW5kOiAnc291bmRzLzQyNjU2NDYvZGVsZmluLm1wMycsXG4gICAgICBpbWFnZTogJ2ltYWdlcy80MjY1NjQ2L2RlbGZpbi5naWYnLFxuICAgICAgbWVzc2FnZV9iYWNrZ3JvdW5kOiAncmdiYSgwLCAwLCAwLCAwKScsXG4gICAgICBpc190ZW1wb3JhcnlfZGlzYWJsZWQ6ICcwJyxcbiAgICAgIGNvbG9yXzE6ICcjMDAwMDAwJyxcbiAgICAgIGNvbG9yXzI6ICcjMDAwMDAwJyxcbiAgICAgIGRpc3BsYXlfZHVyYXRpb246ICc4LjAwJyxcbiAgICAgIHRleHRfZGVsYXk6ICcwLjAwJyxcbiAgICAgIHRleHRfZHVyYXRpb246ICc4LjAwJyxcbiAgICAgIGZvbnRfc2l6ZV8xOiAnMCcsXG4gICAgICBmb250X3NpemVfMjogJzAnLFxuICAgICAgaGVhZGVyX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrIE1vbm8gT25lXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjgwcHhcIixcImNvbG9yXCI6XCIjRkZGRkZGXCIsXCJmb250LXdlaWdodFwiOlwiYm9sZFwiLFwiZm9udC1zdHlsZVwiOlwibm9ybWFsXCIsXCJ0ZXh0LWRlY29yYXRpb25cIjpcIm5vbmVcIixcInRleHQtdHJhbnNmb3JtXCI6XCJub25lXCIsXCJ0ZXh0LXNoYWRvd1wiOlwiOHB4XCIsXCJ0ZXh0LXNoYWRvd19jb2xvclwiOlwicmdiYSgwLCAwLCAwLCAwLjA5KVwiLFwibGV0dGVyLXNwYWNpbmdcIjpcIjBweFwiLFwid29yZC1zcGFjaW5nXCI6XCIwcHhcIixcInRleHQtYWxpZ25cIjpcImNlbnRlclwiLFwidmVydGljYWwtYWxpZ25cIjpcIm1pZGRsZVwiLFwiYmFja2dyb3VuZC1jb2xvclwiOlwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwicnViYmVyQmFuZFwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgbWVzc2FnZV90ZXh0OiAne1wiZm9udF9zdHlsZVwiOntcImZvbnQtZmFtaWx5XCI6XCJcXFxcXCJSdWJpa1xcXFxcIlwiLFwiZm9udC1zaXplXCI6XCI1MHB4XCIsXCJjb2xvclwiOlwicmdiKDI1NSwgMjU1LCAyNTUpXCIsXCJmb250LXdlaWdodFwiOlwibm9ybWFsXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI3cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDMpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDIyMywgMjU1LCAwLCAwKVwiLFwiYm9yZGVyLXJhZGl1c1wiOlwiMHB4XCJ9LFwiZm9udF9hbmltYXRpb25cIjp7XCJ0ZXh0LWFuaW1hdGlvblwiOlwibm9uZVwiLFwidGV4dC1hbmltYXRpb24tbW9kZVwiOlwibGV0dGVyc1wifX0nLFxuICAgICAgZG9uYXRpb25fYXVkaW9fdm9sdW1lOiAnNTAnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheV9zY2VuYXJpbzogJ2FmdGVyX3NvdW5kJyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3BsYXliYWNrOiAnMCcsXG4gICAgICB0dHNfaXNfZW5hYmxlZDogJzEnLFxuICAgICAgdHRzX2xhbmd1YWdlOiAncnVfUlUnLFxuICAgICAgdHRzX3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgdHRzX3ZvbHVtZTogJzMwJyxcbiAgICAgIHR0c19hbW91bnRfbWluOiAnMC4wMCcsXG4gICAgICB0dHNfdm9pY2U6ICdtYWxlLGZlbWFsZSwzLDE5LDIwLCcsXG4gICAgICB0dHNfcmF0ZTogJ21lZGl1bScsXG4gICAgICB2YXJpYXRpb25fY29uZGl0aW9uczogJ1t7XCJtb2RlXCI6XCJhbGVydF90eXBlXCIsXCJ2YWx1ZVwiOlwiMVwifSx7XCJtb2RlXCI6XCJhbW91bnRfZXF1YWxfb3JfZ3JlYXRlcl90aGFuXCIsXCJ2YWx1ZVwiOjEwMDB9XScsXG4gICAgICBuYW1lOiAnMTAwMCcsXG4gICAgICBpc19hY3RpdmU6ICcxJyxcbiAgICAgIGlzX2RlbGV0ZWQ6ICcwJyxcbiAgICAgIHBvc2l0aW9uOiAnMCcsXG4gICAgICBhZGRpdGlvbmFsX2RhdGE6IG51bGwsXG4gICAgICBoZWFkZXJfdGVtcGxhdGU6ICd7dXNlcm5hbWV9IC0ge2Ftb3VudH0hJyxcbiAgICAgIG1lc3NhZ2VfdGVtcGxhdGU6IG51bGxcbiAgICB9LFxuICAgIHtcbiAgICAgIGVudGl0eV9pZDogJzIyODcwOTEwJyxcbiAgICAgIHVzZXJfaWQ6ICc0MjY1NjQ2JyxcbiAgICAgIGdyb3VwX2lkOiAnMScsXG4gICAgICB3aW5kb3dfY29vcl94OiAnMCcsXG4gICAgICB3aW5kb3dfY29vcl95OiAnMCcsXG4gICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzAwRkYwMCcsXG4gICAgICB2b2x1bWU6ICc1MCcsXG4gICAgICBkaXNwbGF5X3BhdHRlcm46ICdpbWFnZV90b3BfX3RleHRfYm90dG9tJyxcbiAgICAgIHNvdW5kOiAnc291bmRzLzQyNjU2NDYvdG9ydGlrLm1wMycsXG4gICAgICBpbWFnZTogJ2ltYWdlcy80MjY1NjQ2L3RvcnQuZ2lmJyxcbiAgICAgIG1lc3NhZ2VfYmFja2dyb3VuZDogJ3JnYmEoMCwgMCwgMCwgMCknLFxuICAgICAgaXNfdGVtcG9yYXJ5X2Rpc2FibGVkOiAnMCcsXG4gICAgICBjb2xvcl8xOiAnIzAwMDAwMCcsXG4gICAgICBjb2xvcl8yOiAnIzAwMDAwMCcsXG4gICAgICBkaXNwbGF5X2R1cmF0aW9uOiAnNy4wMCcsXG4gICAgICB0ZXh0X2RlbGF5OiAnMC4wMCcsXG4gICAgICB0ZXh0X2R1cmF0aW9uOiAnNy4wMCcsXG4gICAgICBmb250X3NpemVfMTogJzAnLFxuICAgICAgZm9udF9zaXplXzI6ICcwJyxcbiAgICAgIGhlYWRlcl90ZXh0OiAne1wiZm9udF9zdHlsZVwiOntcImZvbnQtZmFtaWx5XCI6XCJcXFxcXCJSdWJpayBNb25vIE9uZVxcXFxcIlwiLFwiZm9udC1zaXplXCI6XCI4MHB4XCIsXCJjb2xvclwiOlwiI0ZGRkZGRlwiLFwiZm9udC13ZWlnaHRcIjpcImJvbGRcIixcImZvbnQtc3R5bGVcIjpcIm5vcm1hbFwiLFwidGV4dC1kZWNvcmF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LXRyYW5zZm9ybVwiOlwibm9uZVwiLFwidGV4dC1zaGFkb3dcIjpcIjhweFwiLFwidGV4dC1zaGFkb3dfY29sb3JcIjpcInJnYmEoMCwgMCwgMCwgMC4wOSlcIixcImxldHRlci1zcGFjaW5nXCI6XCIwcHhcIixcIndvcmQtc3BhY2luZ1wiOlwiMHB4XCIsXCJ0ZXh0LWFsaWduXCI6XCJjZW50ZXJcIixcInZlcnRpY2FsLWFsaWduXCI6XCJtaWRkbGVcIixcImJhY2tncm91bmQtY29sb3JcIjpcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIixcImJvcmRlci1yYWRpdXNcIjpcIjBweFwifSxcImZvbnRfYW5pbWF0aW9uXCI6e1widGV4dC1hbmltYXRpb25cIjpcInJ1YmJlckJhbmRcIixcInRleHQtYW5pbWF0aW9uLW1vZGVcIjpcImxldHRlcnNcIn19JyxcbiAgICAgIG1lc3NhZ2VfdGV4dDogJ3tcImZvbnRfc3R5bGVcIjp7XCJmb250LWZhbWlseVwiOlwiXFxcXFwiUnViaWtcXFxcXCJcIixcImZvbnQtc2l6ZVwiOlwiNTBweFwiLFwiY29sb3JcIjpcInJnYigyNTUsIDI1NSwgMjU1KVwiLFwiZm9udC13ZWlnaHRcIjpcIm5vcm1hbFwiLFwiZm9udC1zdHlsZVwiOlwibm9ybWFsXCIsXCJ0ZXh0LWRlY29yYXRpb25cIjpcIm5vbmVcIixcInRleHQtdHJhbnNmb3JtXCI6XCJub25lXCIsXCJ0ZXh0LXNoYWRvd1wiOlwiN3B4XCIsXCJ0ZXh0LXNoYWRvd19jb2xvclwiOlwicmdiYSgwLCAwLCAwLCAwLjAzKVwiLFwibGV0dGVyLXNwYWNpbmdcIjpcIjBweFwiLFwid29yZC1zcGFjaW5nXCI6XCIwcHhcIixcInRleHQtYWxpZ25cIjpcImNlbnRlclwiLFwidmVydGljYWwtYWxpZ25cIjpcIm1pZGRsZVwiLFwiYmFja2dyb3VuZC1jb2xvclwiOlwicmdiYSgyMjMsIDI1NSwgMCwgMClcIixcImJvcmRlci1yYWRpdXNcIjpcIjBweFwifSxcImZvbnRfYW5pbWF0aW9uXCI6e1widGV4dC1hbmltYXRpb25cIjpcIm5vbmVcIixcInRleHQtYW5pbWF0aW9uLW1vZGVcIjpcImxldHRlcnNcIn19JyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3ZvbHVtZTogJzUwJyxcbiAgICAgIGRvbmF0aW9uX2F1ZGlvX3BsYXlfc2NlbmFyaW86ICdhZnRlcl9zb3VuZCcsXG4gICAgICBkb25hdGlvbl9hdWRpb19wbGF5YmFjazogJzAnLFxuICAgICAgdHRzX2lzX2VuYWJsZWQ6ICcxJyxcbiAgICAgIHR0c19sYW5ndWFnZTogJ3J1X1JVJyxcbiAgICAgIHR0c19zY2VuYXJpbzogJ2FmdGVyX3NvdW5kJyxcbiAgICAgIHR0c192b2x1bWU6ICczMCcsXG4gICAgICB0dHNfYW1vdW50X21pbjogJzAuMDAnLFxuICAgICAgdHRzX3ZvaWNlOiAnbWFsZSxmZW1hbGUsMywxOSwyMCwnLFxuICAgICAgdHRzX3JhdGU6ICdtZWRpdW0nLFxuICAgICAgdmFyaWF0aW9uX2NvbmRpdGlvbnM6ICdbe1wibW9kZVwiOlwiYWxlcnRfdHlwZVwiLFwidmFsdWVcIjpcIjRcIn0se1wibW9kZVwiOlwibW9udGhzX2luX2Ffcm93XCIsXCJ2YWx1ZVwiOjF9XScsXG4gICAgICBuYW1lOiAnMSDQvNC10YEnLFxuICAgICAgaXNfYWN0aXZlOiAnMScsXG4gICAgICBpc19kZWxldGVkOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJzAnLFxuICAgICAgYWRkaXRpb25hbF9kYXRhOiBudWxsLFxuICAgICAgaGVhZGVyX3RlbXBsYXRlOiAne3VzZXJuYW1lfSDRgdGC0LDQuyDQkdC10LzRgNC+0LLQuNGH0LXQvCcsXG4gICAgICBtZXNzYWdlX3RlbXBsYXRlOiBudWxsXG4gICAgfSxcbiAgICB7XG4gICAgICBlbnRpdHlfaWQ6ICcyNzMwMjI2NicsXG4gICAgICB1c2VyX2lkOiAnNDI2NTY0NicsXG4gICAgICBncm91cF9pZDogJzEnLFxuICAgICAgd2luZG93X2Nvb3JfeDogJzAnLFxuICAgICAgd2luZG93X2Nvb3JfeTogJzAnLFxuICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMEZGMDAnLFxuICAgICAgdm9sdW1lOiAnNTAnLFxuICAgICAgZGlzcGxheV9wYXR0ZXJuOiAnaW1hZ2VfdG9wX190ZXh0X2JvdHRvbScsXG4gICAgICBzb3VuZDogJ3NvdW5kcy80MjY1NjQ2L3RvcnRpay5tcDMnLFxuICAgICAgaW1hZ2U6ICdpbWFnZXMvNDI2NTY0Ni90b3J0LmdpZicsXG4gICAgICBtZXNzYWdlX2JhY2tncm91bmQ6ICdyZ2JhKDAsIDAsIDAsIDApJyxcbiAgICAgIGlzX3RlbXBvcmFyeV9kaXNhYmxlZDogJzAnLFxuICAgICAgY29sb3JfMTogJyMwMDAwMDAnLFxuICAgICAgY29sb3JfMjogJyMwMDAwMDAnLFxuICAgICAgZGlzcGxheV9kdXJhdGlvbjogJzcuMDAnLFxuICAgICAgdGV4dF9kZWxheTogJzAuMDAnLFxuICAgICAgdGV4dF9kdXJhdGlvbjogJzcuMDAnLFxuICAgICAgZm9udF9zaXplXzE6ICcwJyxcbiAgICAgIGZvbnRfc2l6ZV8yOiAnMCcsXG4gICAgICBoZWFkZXJfdGV4dDogJ3tcImZvbnRfc3R5bGVcIjp7XCJmb250LWZhbWlseVwiOlwiXFxcXFwiUnViaWsgTW9ubyBPbmVcXFxcXCJcIixcImZvbnQtc2l6ZVwiOlwiODBweFwiLFwiY29sb3JcIjpcIiNGRkZGRkZcIixcImZvbnQtd2VpZ2h0XCI6XCJib2xkXCIsXCJmb250LXN0eWxlXCI6XCJub3JtYWxcIixcInRleHQtZGVjb3JhdGlvblwiOlwibm9uZVwiLFwidGV4dC10cmFuc2Zvcm1cIjpcIm5vbmVcIixcInRleHQtc2hhZG93XCI6XCI4cHhcIixcInRleHQtc2hhZG93X2NvbG9yXCI6XCJyZ2JhKDAsIDAsIDAsIDAuMDkpXCIsXCJsZXR0ZXItc3BhY2luZ1wiOlwiMHB4XCIsXCJ3b3JkLXNwYWNpbmdcIjpcIjBweFwiLFwidGV4dC1hbGlnblwiOlwiY2VudGVyXCIsXCJ2ZXJ0aWNhbC1hbGlnblwiOlwibWlkZGxlXCIsXCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJydWJiZXJCYW5kXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBtZXNzYWdlX3RleHQ6ICd7XCJmb250X3N0eWxlXCI6e1wiZm9udC1mYW1pbHlcIjpcIlxcXFxcIlJ1YmlrXFxcXFwiXCIsXCJmb250LXNpemVcIjpcIjUwcHhcIixcImNvbG9yXCI6XCJyZ2IoMjU1LCAyNTUsIDI1NSlcIixcImZvbnQtd2VpZ2h0XCI6XCJub3JtYWxcIixcImZvbnQtc3R5bGVcIjpcIm5vcm1hbFwiLFwidGV4dC1kZWNvcmF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LXRyYW5zZm9ybVwiOlwibm9uZVwiLFwidGV4dC1zaGFkb3dcIjpcIjdweFwiLFwidGV4dC1zaGFkb3dfY29sb3JcIjpcInJnYmEoMCwgMCwgMCwgMC4wMylcIixcImxldHRlci1zcGFjaW5nXCI6XCIwcHhcIixcIndvcmQtc3BhY2luZ1wiOlwiMHB4XCIsXCJ0ZXh0LWFsaWduXCI6XCJjZW50ZXJcIixcInZlcnRpY2FsLWFsaWduXCI6XCJtaWRkbGVcIixcImJhY2tncm91bmQtY29sb3JcIjpcInJnYmEoMjIzLCAyNTUsIDAsIDApXCIsXCJib3JkZXItcmFkaXVzXCI6XCIwcHhcIn0sXCJmb250X2FuaW1hdGlvblwiOntcInRleHQtYW5pbWF0aW9uXCI6XCJub25lXCIsXCJ0ZXh0LWFuaW1hdGlvbi1tb2RlXCI6XCJsZXR0ZXJzXCJ9fScsXG4gICAgICBkb25hdGlvbl9hdWRpb192b2x1bWU6ICc1MCcsXG4gICAgICBkb25hdGlvbl9hdWRpb19wbGF5X3NjZW5hcmlvOiAnYWZ0ZXJfc291bmQnLFxuICAgICAgZG9uYXRpb25fYXVkaW9fcGxheWJhY2s6ICcwJyxcbiAgICAgIHR0c19pc19lbmFibGVkOiAnMScsXG4gICAgICB0dHNfbGFuZ3VhZ2U6ICdydV9SVScsXG4gICAgICB0dHNfc2NlbmFyaW86ICdhZnRlcl9zb3VuZCcsXG4gICAgICB0dHNfdm9sdW1lOiAnMzAnLFxuICAgICAgdHRzX2Ftb3VudF9taW46ICcwLjAwJyxcbiAgICAgIHR0c192b2ljZTogJ21hbGUsZmVtYWxlLDMsMTksMjAsJyxcbiAgICAgIHR0c19yYXRlOiAnbWVkaXVtJyxcbiAgICAgIHZhcmlhdGlvbl9jb25kaXRpb25zOiAnW3tcIm1vZGVcIjpcImFsZXJ0X3R5cGVcIixcInZhbHVlXCI6XCIxMlwifSx7XCJtb2RlXCI6XCJyYW5kb21cIixcInZhbHVlXCI6M31dJyxcbiAgICAgIG5hbWU6ICfQutCw0YHRgtC+0LwnLFxuICAgICAgaXNfYWN0aXZlOiAnMScsXG4gICAgICBpc19kZWxldGVkOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJzAnLFxuICAgICAgYWRkaXRpb25hbF9kYXRhOiBudWxsLFxuICAgICAgaGVhZGVyX3RlbXBsYXRlOiBudWxsLFxuICAgICAgbWVzc2FnZV90ZW1wbGF0ZTogbnVsbFxuICAgIH1cbiAgXSxcbiAgX2FkZGl0aW9uYWw6IHsgc291cmNlOiAnemYyJyB9XG59ICovXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ1cGRhdGUtY29yb25hX3dpZGdldFwiOiAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gREVCVUdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInVwZGF0ZS1zdGlja2Vyc193aWRnZXRcIjogKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERFQlVHXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ1cGRhdGUtdXNlcl9nZW5lcmFsX3dpZGdldF9zZXR0aW5nc1wiOiAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gREVCVUdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihjb25zdCBbZXZlbnQsIGNhbGxiYWNrXSBvZiBPYmplY3QuZW50cmllcyhjYWxsYmFja3MpKVxuICAgICAgICAgICAgdGhpcy5zb2NrZXQub24oZXZlbnQsIChkYXRhOiBzdHJpbmcpID0+IGNhbGxiYWNrKEpTT04ucGFyc2UoZGF0YSkpKVxuXG4gICAgICAgIGlmKGFkZFVzZXIpIHRoaXMuYWRkVXNlcihjbGllbnRUeXBlKVxuICAgIH1cblxuICAgIGFzeW5jIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuc29ja2V0Py5kaXNjb25uZWN0KClcbiAgICAgICAgdGhpcy5zb2NrZXQ/LnJlbW92ZUFsbExpc3RlbmVycygpXG5cbiAgICAgICAgdGhpcy5zb2NrZXQgPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBhZGRVc2VyKHR5cGU6IENsaWVudFR5cGUpIHtcbiAgICAgICAgdGhpcy5zZW5kKFwiYWRkLXVzZXJcIiwgdW5kZWZpbmVkLCB7XG4gICAgICAgICAgICB0eXBlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYWxlcnRTdGFydCh7XG4gICAgICAgIGR1cmF0aW9uLCBcbiAgICAgICAgZ3JvdXBJZCwgLy8gc3RyaW5nXG4gICAgICAgIGlkLFxuICAgICAgICB0eXBlIC8vIHN0cmluZ1xuICAgIH0gOiB7XG4gICAgICAgIGlkOiBudW1iZXIsXG4gICAgICAgIHR5cGU6IEFsZXJ0VHlwZSxcbiAgICAgICAgZ3JvdXBJZD86IG51bWJlcixcbiAgICAgICAgZHVyYXRpb24/OiBudW1iZXJcbiAgICB9KSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuQWxlcnRTaG93LCB7XG4gICAgICAgICAgICBhY3Rpb246IEFsZXJ0U2hvd0FjdGlvbi5TdGFydCxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICBhbGVydF9pZDogaWQsXG4gICAgICAgICAgICBhbGVydF90eXBlOiB0eXBlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYWxlcnRFbmQoe1xuICAgICAgICBpZCxcbiAgICAgICAgdHlwZVxuICAgIH0gOiB7XG4gICAgICAgIGlkOiBudW1iZXIsXG4gICAgICAgIHR5cGU6IEFsZXJ0VHlwZVxuICAgIH0pIHtcbiAgICAgICAgdGhpcy5zZW5kKFNlcnZlckV2ZW50TmFtZS5BbGVydFNob3csIHtcbiAgICAgICAgICAgIGFjdGlvbjogQWxlcnRTaG93QWN0aW9uLkVuZCxcbiAgICAgICAgICAgIGFsZXJ0X2lkOiBpZCxcbiAgICAgICAgICAgIGFsZXJ0X3R5cGU6IHR5cGVcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhbGVydFNraXAoe1xuICAgICAgICBpZCxcbiAgICAgICAgdHlwZVxuICAgIH0gOiB7XG4gICAgICAgIGlkOiBudW1iZXIsXG4gICAgICAgIHR5cGU6IEFsZXJ0VHlwZVxuICAgIH0pIHtcbiAgICAgICAgdGhpcy5zZW5kKFNlcnZlckV2ZW50TmFtZS5BbGVydFNob3csIHtcbiAgICAgICAgICAgIGFjdGlvbjogQWxlcnRTaG93QWN0aW9uLlNraXAsXG4gICAgICAgICAgICBhbGVydF9pZDogaWQsXG4gICAgICAgICAgICBhbGVydF90eXBlOiB0eXBlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgbWVkaWFFbmQoaWQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnNlbmQoU2VydmVyRXZlbnROYW1lLk1lZGlhLCB7XG4gICAgICAgICAgICBhY3Rpb246IFwiZW5kXCIsXG4gICAgICAgICAgICBtZWRpYToge1xuICAgICAgICAgICAgICAgIG1lZGlhX2lkOiBpZFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBcbiAgICBtZWRpYVNob3dXaWRnZXQoKSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJzaG93LXdpZGdldFwiXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgbWVkaWFIaWRlV2lkZ2V0KCkge1xuICAgICAgICB0aGlzLnNlbmQoU2VydmVyRXZlbnROYW1lLk1lZGlhLCB7XG4gICAgICAgICAgICBhY3Rpb246IFwiaGlkZS13aWRnZXRcIlxuICAgICAgICB9KVxuICAgIH1cblxuICAgIG1lZGlhUGF1c2UoKSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJwYXVzZVwiXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgbWVkaWFVbnBhdXNlKCkge1xuICAgICAgICB0aGlzLnNlbmQoU2VydmVyRXZlbnROYW1lLk1lZGlhLCB7XG4gICAgICAgICAgICBhY3Rpb246IFwidW5wYXVzZVwiXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgbWVkaWFHZXRQYXVzZVN0YXRlKHNvdXJjZTogYW55KSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJnZXQtcGF1c2Utc3RhdGVcIixcbiAgICAgICAgICAgIHNvdXJjZVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIG1lZGlhR2V0Q3VycmVudChzb3VyY2U6IGFueSkge1xuICAgICAgICB0aGlzLnNlbmQoU2VydmVyRXZlbnROYW1lLk1lZGlhLCB7XG4gICAgICAgICAgICBhY3Rpb246IFwiZ2V0LWN1cnJlbnQtbWVkaWFcIixcbiAgICAgICAgICAgIHNvdXJjZVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIG1lZGlhR2V0Vm9sdW1lT3ZlcnJpZGUodm9sdW1lOiBudW1iZXIpIHsgLy8gPz8/XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJnZXQtdm9sdW1lLW92ZXJyaWRlXCIsXG4gICAgICAgICAgICB2b2x1bWVcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBtZWRpYVJlY2VpdmVWb2x1bWVPdmVycmlkZSh2b2x1bWU6IG51bWJlcikgeyAvLyB1cGRhdGUgdm9sdW1lXG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJyZWNlaXZlLXZvbHVtZS1vdmVycmlkZVwiLFxuICAgICAgICAgICAgdm9sdW1lXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIG1lZGlhUmVjZWl2ZVBhdXNlU3RhdGUoe1xuICAgICAgICBzb3VyY2UsXG4gICAgICAgIG1lZGlhLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgdm9sdW1lT3ZlcnJpZGVcbiAgICB9IDoge1xuICAgICAgICBzb3VyY2U6IHN0cmluZyxcbiAgICAgICAgbWVkaWE6IGFueSxcbiAgICAgICAgaXNQYXVzZWQ6IGJvb2xlYW4sXG4gICAgICAgIHZvbHVtZU92ZXJyaWRlOiBudW1iZXJcbiAgICB9KSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJyZWNlaXZlLWN1cnJlbnQtbWVkaWFcIixcbiAgICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgICAgaXNfcGF1c2VkOiBpc1BhdXNlZCxcbiAgICAgICAgICAgIHZvbHVtZV9vdmVycmlkZTogdm9sdW1lT3ZlcnJpZGVcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBtZWRpYVJlY2VpdmVDdXJyZW50TWVkaWEoe1xuICAgICAgICBzb3VyY2UsIC8vIGxhc3RfYWxlcnRzX3dpZGdldFxuICAgICAgICBtZWRpYSwgLy8ge1wibWVkaWFfaWRcIjowLFwidXNlcl9pZFwiOlwiNDI2NTY0NlwiLFwidHlwZVwiOlwidmlkZW9cIixcInN1Yl90eXBlXCI6XCJ5b3V0dWJlXCIsXCJ0aXRsZVwiOlwiRGFydWRlIC0gU2FuZHN0b3JtXCIsXCJhZGRpdGlvbmFsX2RhdGFcIjp7XCJ2aWRlb19pZFwiOlwieTYxMjBRT2xzZlVcIixcImFsZXJ0X2lkXCI6MCxcImFsZXJ0X3R5cGVcIjoxLFwib3duZXJcIjpcIk5hbWVcIixcInVybFwiOlwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj15NjEyMFFPbHNmVVwiLFwic3RhcnRfZnJvbVwiOjAsXCJwYWlkX2Ftb3VudHNcIjp7XCJCWU5cIjoxMi40LFwiRVVSXCI6NC4yNSxcIktaVFwiOjIxMjkuMjUsXCJSVUJcIjozNjIuOCxcIlVBSFwiOjEzMy42OCxcIlVTRFwiOjUsXCJCUkxcIjoyNi4yOCxcIlRSWVwiOjQyLjkzLFwiUExOXCI6MTkuNDN9fSxcImRhdGVfY3JlYXRlZFwiOlwiMjAyMS0wOS0xOSAxMTo1MjoxNlwiLFwiaXNfcGxheWVkXCI6MCxcImRhdGVfcGxheWVkXCI6bnVsbCxcImFsbG93ZWRfdG9fZGlzcGxheVwiOmZhbHNlfVxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNEaXNwbGF5aW5nXG4gICAgfSA6IHtcbiAgICAgICAgc291cmNlOiBzdHJpbmcsXG4gICAgICAgIG1lZGlhOiBhbnksXG4gICAgICAgIGlzUGF1c2VkOiBib29sZWFuLFxuICAgICAgICBpc0Rpc3BsYXlpbmc6IGJvb2xlYW5cbiAgICB9KSB7XG4gICAgICAgIHRoaXMuc2VuZChTZXJ2ZXJFdmVudE5hbWUuTWVkaWEsIHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJyZWNlaXZlLWN1cnJlbnQtbWVkaWFcIixcbiAgICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgICAgaXNfcGF1c2VkOiBpc1BhdXNlZCxcbiAgICAgICAgICAgIGlzX2Rpc3BsYXlpbmc6IGlzRGlzcGxheWluZ1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIHByaXZhdGUgc2VuZChldmVudDogc3RyaW5nLCBkYXRhOiB7IFt4OiBzdHJpbmddOiBhbnkgfSA9IHt9LCBwYXJhbXM6IHsgW3g6IHN0cmluZ106IGFueSB9ID0ge30pIHtcbiAgICAgICAgdGhpcy5zb2NrZXQ/LmVtaXQoZXZlbnQsIHtcbiAgICAgICAgICAgIC4uLnBhcmFtcyxcbiAgICAgICAgICAgIHRva2VuOiB0aGlzLnRva2VuLFxuICAgICAgICAgICAgbWVzc2FnZV9kYXRhOiBkYXRhXG4gICAgICAgIH0pXG4gICAgfVxuXG59Il19