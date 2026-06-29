"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DAWidget = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _socket = require("./socket");

var _api = require("./api");

var _ = require(".");

var _symbols = require("./symbols");

var voidPromise = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function voidPromise() {
    return _ref.apply(this, arguments);
  };
}();

var DAWidget = /*#__PURE__*/function () {
  (0, _createClass2["default"])(DAWidget, [{
    key: "widgetBehavior",
    get: function get() {
      return this._widgetBehavior;
    },
    set: function set(value) {
      if (value === this._widgetBehavior) return;
      this._widgetBehavior = value;
      if (value) this.socket.on(_.EventName.Donation, this.onDonation);else this.socket.off(_.EventName.Donation, this.onDonation);
    }
  }]);

  function DAWidget(token) {
    var _this = this;

    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$widgetBehavior = _ref2.widgetBehavior,
        widgetBehavior = _ref2$widgetBehavior === void 0 ? true : _ref2$widgetBehavior,
        _ref2$alertDuration = _ref2.alertDuration,
        alertDuration = _ref2$alertDuration === void 0 ? 10000 : _ref2$alertDuration,
        _ref2$autoOpen = _ref2.autoOpen,
        autoOpen = _ref2$autoOpen === void 0 ? true : _ref2$autoOpen;

    (0, _classCallCheck2["default"])(this, DAWidget);
    (0, _defineProperty2["default"])(this, "api", void 0);
    (0, _defineProperty2["default"])(this, "socket", void 0);
    (0, _defineProperty2["default"])(this, "_widgetBehavior", false);
    (0, _defineProperty2["default"])(this, "alertDuration", void 0);
    (0, _defineProperty2["default"])(this, "lastTask", Promise.resolve());
    (0, _defineProperty2["default"])(this, _symbols.SKIP, voidPromise);
    (0, _defineProperty2["default"])(this, "onDonation", /*#__PURE__*/function () {
      var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(data) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _this.lastTask;

              case 2:
                _this.lastTask = new Promise(function (resolve) {
                  _this.socket.alertStart({
                    duration: _this.alertDuration,
                    id: data.id,
                    type: data.type
                  });

                  _this.api.markAlertShown({
                    id: data.id,
                    type: data.type
                  });

                  var timeout = setTimeout(function () {
                    _this[_symbols.SKIP] = voidPromise;

                    _this.socket.alertEnd({
                      id: data.id,
                      type: data.type
                    });

                    resolve();
                  }, _this.alertDuration);
                  _this[_symbols.SKIP] = /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
                    return _regenerator["default"].wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            clearTimeout(timeout);
                            _this[_symbols.SKIP] = voidPromise;

                            _this.socket.alertSkip({
                              id: data.id,
                              type: data.type
                            });

                            _context2.next = 5;
                            return _this.api.skipAlert({
                              id: data.id,
                              type: data.type
                            });

                          case 5:
                            resolve();

                          case 6:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));
                });

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x) {
        return _ref3.apply(this, arguments);
      };
    }());
    this.api = new _api.DAAPI(token);
    this.socket = new _socket.DASocket(token, {
      autoConnect: !autoOpen
    });
    this.alertDuration = alertDuration;
    this.widgetBehavior = widgetBehavior;
    if (autoOpen) this.open();
  }

  (0, _createClass2["default"])(DAWidget, [{
    key: "skipCurrentAlert",
    value: function () {
      var _skipCurrentAlert = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this[_symbols.SKIP]();

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function skipCurrentAlert() {
        return _skipCurrentAlert.apply(this, arguments);
      }

      return skipCurrentAlert;
    }()
  }, {
    key: "open",
    value: function () {
      var _open = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.close();

              case 2:
                _context5.next = 4;
                return this.api.crawlWidget();

              case 4:
                _context5.next = 6;
                return this.socket.crawlWidget();

              case 6:
                _context5.next = 8;
                return this.socket.connect({
                  clientType: _.ClientType.AlertWidget
                });

              case 8:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function open() {
        return _open.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.socket.disconnect();

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }]);
  return DAWidget;
}();

exports.DAWidget = DAWidget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvd2lkZ2V0LnRzIl0sIm5hbWVzIjpbInZvaWRQcm9taXNlIiwiREFXaWRnZXQiLCJfd2lkZ2V0QmVoYXZpb3IiLCJ2YWx1ZSIsInNvY2tldCIsIm9uIiwiRXZlbnROYW1lIiwiRG9uYXRpb24iLCJvbkRvbmF0aW9uIiwib2ZmIiwidG9rZW4iLCJ3aWRnZXRCZWhhdmlvciIsImFsZXJ0RHVyYXRpb24iLCJhdXRvT3BlbiIsIlByb21pc2UiLCJyZXNvbHZlIiwiU0tJUCIsImRhdGEiLCJsYXN0VGFzayIsImFsZXJ0U3RhcnQiLCJkdXJhdGlvbiIsImlkIiwidHlwZSIsImFwaSIsIm1hcmtBbGVydFNob3duIiwidGltZW91dCIsInNldFRpbWVvdXQiLCJhbGVydEVuZCIsImNsZWFyVGltZW91dCIsImFsZXJ0U2tpcCIsInNraXBBbGVydCIsIkRBQVBJIiwiREFTb2NrZXQiLCJhdXRvQ29ubmVjdCIsIm9wZW4iLCJjbG9zZSIsImNyYXdsV2lkZ2V0IiwiY29ubmVjdCIsImNsaWVudFR5cGUiLCJDbGllbnRUeXBlIiwiQWxlcnRXaWRnZXQiLCJkaXNjb25uZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsV0FBVztBQUFBLDJGQUFHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FBSDs7QUFBQSxrQkFBWEEsV0FBVztBQUFBO0FBQUE7QUFBQSxHQUFqQjs7SUFFYUMsUTs7O3dCQUtZO0FBQ2pCLGFBQU8sS0FBS0MsZUFBWjtBQUNILEs7c0JBQ2tCQyxLLEVBQWdCO0FBQy9CLFVBQUdBLEtBQUssS0FBSyxLQUFLRCxlQUFsQixFQUFtQztBQUVuQyxXQUFLQSxlQUFMLEdBQXVCQyxLQUF2QjtBQUVBLFVBQUdBLEtBQUgsRUFDSSxLQUFLQyxNQUFMLENBQVlDLEVBQVosQ0FBZUMsWUFBVUMsUUFBekIsRUFBbUMsS0FB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QUFBLFdBQVcsRUFBRSxDQUFDcEI7QUFBaEIsS0FBcEIsQ0FBZDtBQUVBLFNBQUtELGFBQUwsR0FBcUJBLGFBQXJCO0FBQ0EsU0FBS0QsY0FBTCxHQUFzQkEsY0FBdEI7QUFFQSxRQUFHRSxRQUFILEVBQWEsS0FBS3FCLElBQUw7QUFDaEI7Ozs7Ozs7Ozs7O3VCQTJCUyxLQUFLbEIsYUFBTCxHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQUlBLEtBQUttQixLQUFMLEU7Ozs7dUJBRUEsS0FBS1osR0FBTCxDQUFTYSxXQUFULEU7Ozs7dUJBQ0EsS0FBS2hDLE1BQUwsQ0FBWWdDLFdBQVosRTs7Ozt1QkFFQSxLQUFLaEMsTUFBTCxDQUFZaUMsT0FBWixDQUFvQjtBQUFFQyxrQkFBQUEsVUFBVSxFQUFFQyxhQUFXQztBQUF6QixpQkFBcEIsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkFJQSxLQUFLcEMsTUFBTCxDQUFZcUMsVUFBWixFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgREFTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXRcIjtcbmltcG9ydCB7IERBQVBJIH0gZnJvbSBcIi4vYXBpXCI7XG5pbXBvcnQgeyBDbGllbnRUeXBlLCBEb25hdGlvbiwgRXZlbnROYW1lIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IFNLSVAgfSBmcm9tIFwiLi9zeW1ib2xzXCI7XG5cbmNvbnN0IHZvaWRQcm9taXNlID0gYXN5bmMgKCkgPT4ge31cblxuZXhwb3J0IGNsYXNzIERBV2lkZ2V0IHtcbiAgICByZWFkb25seSBhcGk6IERBQVBJXG4gICAgcmVhZG9ubHkgc29ja2V0OiBEQVNvY2tldFxuXG4gICAgcHJpdmF0ZSBfd2lkZ2V0QmVoYXZpb3IgPSBmYWxzZVxuICAgIGdldCB3aWRnZXRCZWhhdmlvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dpZGdldEJlaGF2aW9yXG4gICAgfVxuICAgIHNldCB3aWRnZXRCZWhhdmlvcih2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICBpZih2YWx1ZSA9PT0gdGhpcy5fd2lkZ2V0QmVoYXZpb3IpIHJldHVyblxuXG4gICAgICAgIHRoaXMuX3dpZGdldEJlaGF2aW9yID0gdmFsdWVcblxuICAgICAgICBpZih2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuc29ja2V0Lm9uKEV2ZW50TmFtZS5Eb25hdGlvbiwgdGhpcy5vbkRvbmF0aW9uKVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgdGhpcy5zb2NrZXQub2ZmKEV2ZW50TmFtZS5Eb25hdGlvbiwgdGhpcy5vbkRvbmF0aW9uKVxuICAgIH1cblxuICAgIGFsZXJ0RHVyYXRpb246IG51bWJlclxuXG4gICAgcHJpdmF0ZSBsYXN0VGFzaz0gUHJvbWlzZS5yZXNvbHZlKClcbiAgICBwcml2YXRlIFtTS0lQXSA9IHZvaWRQcm9taXNlXG5cbiAgICBjb25zdHJ1Y3Rvcih0b2tlbjogc3RyaW5nLCB7IHdpZGdldEJlaGF2aW9yID0gdHJ1ZSwgYWxlcnREdXJhdGlvbiA9IDEwMDAwLCBhdXRvT3BlbiA9IHRydWUgfSA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXBpID0gbmV3IERBQVBJKHRva2VuKVxuICAgICAgICB0aGlzLnNvY2tldCA9IG5ldyBEQVNvY2tldCh0b2tlbiwgeyBhdXRvQ29ubmVjdDogIWF1dG9PcGVuIH0pXG4gICAgXG4gICAgICAgIHRoaXMuYWxlcnREdXJhdGlvbiA9IGFsZXJ0RHVyYXRpb25cbiAgICAgICAgdGhpcy53aWRnZXRCZWhhdmlvciA9IHdpZGdldEJlaGF2aW9yXG5cbiAgICAgICAgaWYoYXV0b09wZW4pIHRoaXMub3BlbigpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkRvbmF0aW9uID0gYXN5bmMgKGRhdGE6IERvbmF0aW9uKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMubGFzdFRhc2tcbiAgICAgICAgdGhpcy5sYXN0VGFzayA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5zb2NrZXQuYWxlcnRTdGFydCh7IGR1cmF0aW9uOiB0aGlzLmFsZXJ0RHVyYXRpb24sIGlkOiBkYXRhLmlkLCB0eXBlOiBkYXRhLnR5cGUgfSlcbiAgICAgICAgICAgIHRoaXMuYXBpLm1hcmtBbGVydFNob3duKHsgaWQ6IGRhdGEuaWQsIHR5cGU6IGRhdGEudHlwZSB9KVxuXG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpc1tTS0lQXSA9IHZvaWRQcm9taXNlXG5cbiAgICAgICAgICAgICAgICB0aGlzLnNvY2tldC5hbGVydEVuZCh7IGlkOiBkYXRhLmlkLCB0eXBlOiBkYXRhLnR5cGUgfSlcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0sIHRoaXMuYWxlcnREdXJhdGlvbilcblxuICAgICAgICAgICAgdGhpc1tTS0lQXSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgICAgICAgICAgICB0aGlzW1NLSVBdID0gdm9pZFByb21pc2VcblxuICAgICAgICAgICAgICAgIHRoaXMuc29ja2V0LmFsZXJ0U2tpcCh7IGlkOiBkYXRhLmlkLCB0eXBlOiBkYXRhLnR5cGUgfSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwaS5za2lwQWxlcnQoeyBpZDogZGF0YS5pZCwgdHlwZTogZGF0YS50eXBlIH0pXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYXN5bmMgc2tpcEN1cnJlbnRBbGVydCgpIHtcbiAgICAgICAgYXdhaXQgdGhpc1tTS0lQXSgpXG4gICAgfVxuXG4gICAgYXN5bmMgb3BlbigpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5jbG9zZSgpXG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcGkuY3Jhd2xXaWRnZXQoKVxuICAgICAgICBhd2FpdCB0aGlzLnNvY2tldC5jcmF3bFdpZGdldCgpXG5cbiAgICAgICAgYXdhaXQgdGhpcy5zb2NrZXQuY29ubmVjdCh7IGNsaWVudFR5cGU6IENsaWVudFR5cGUuQWxlcnRXaWRnZXQgfSlcbiAgICB9XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zb2NrZXQuZGlzY29ubmVjdCgpXG4gICAgfVxufSJdfQ==