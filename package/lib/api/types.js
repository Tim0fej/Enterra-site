"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DonationMessageType = exports.Language = exports.Currency = exports.ClientType = exports.AlertType = exports.AlertShowAction = exports.EventName = exports.ServerEventName = exports.UserRole = void 0;
var UserRole;
exports.UserRole = UserRole;

(function (UserRole) {
  UserRole["Streamer"] = "streamer";
})(UserRole || (exports.UserRole = UserRole = {}));

var ServerEventName;
exports.ServerEventName = ServerEventName;

(function (ServerEventName) {
  ServerEventName["Donation"] = "donation";
  ServerEventName["AlertShow"] = "alert-show";
  ServerEventName["Media"] = "media";
  ServerEventName["Stickers"] = "stickers";
})(ServerEventName || (exports.ServerEventName = ServerEventName = {}));

var EventName;
exports.EventName = EventName;

(function (EventName) {
  EventName["Donation"] = "donation";
  EventName["AlertStart"] = "alert-show-start";
  EventName["AlertEnd"] = "alert-show-end";
  EventName["AlertSkip"] = "alert-show-skip";
  EventName["Media"] = "media";
  EventName["Stickers"] = "stickers";
})(EventName || (exports.EventName = EventName = {}));

var AlertShowAction;
exports.AlertShowAction = AlertShowAction;

(function (AlertShowAction) {
  AlertShowAction["Start"] = "start";
  AlertShowAction["End"] = "end";
  AlertShowAction["Skip"] = "skip";
})(AlertShowAction || (exports.AlertShowAction = AlertShowAction = {}));

var AlertType;
exports.AlertType = AlertType;

(function (AlertType) {
  AlertType[AlertType["Donation"] = 1] = "Donation";
  AlertType[AlertType["TwitchSubscription"] = 4] = "TwitchSubscription";
  AlertType[AlertType["TwitchFollow"] = 6] = "TwitchFollow";
  AlertType[AlertType["TwitchBits"] = 11] = "TwitchBits";
  AlertType[AlertType["CustomAlert"] = 12] = "CustomAlert";
  AlertType[AlertType["TwitchGiftedSubscription"] = 13] = "TwitchGiftedSubscription";
  AlertType[AlertType["TwitchGiftedSubscriptionsPaidUpgrade"] = 14] = "TwitchGiftedSubscriptionsPaidUpgrade";
  AlertType[AlertType["TwitchPrimeSubscription"] = 15] = "TwitchPrimeSubscription";
  AlertType[AlertType["TwitchChannelGiftedSubscription"] = 16] = "TwitchChannelGiftedSubscription";
  AlertType[AlertType["TwitchRaid"] = 17] = "TwitchRaid";
  AlertType[AlertType["TwitchHost"] = 18] = "TwitchHost";
  AlertType[AlertType["TwitchChannelPoints"] = 19] = "TwitchChannelPoints";
})(AlertType || (exports.AlertType = AlertType = {}));

var ClientType;
exports.ClientType = ClientType;

(function (ClientType) {
  ClientType["AlertWidget"] = "alert_widget";
  ClientType["Minor"] = "minor";
})(ClientType || (exports.ClientType = ClientType = {}));

var Currency;
exports.Currency = Currency;

(function (Currency) {
  Currency["Euro"] = "EUR";
  Currency["Dollar"] = "USD";
  Currency["Ruble"] = "RUB";
  Currency["BelarusianRuble"] = "BYN";
  Currency["BelarusianRuble2"] = "BYR";
  Currency["Tenge"] = "KZT";
  Currency["Hryvnia"] = "UAH";
  Currency["Real"] = "BRL";
  Currency["Lira"] = "TRY";
})(Currency || (exports.Currency = Currency = {}));

var Language;
exports.Language = Language;

(function (Language) {
  Language["Belarusian"] = "be_BY";
  Language["German"] = "de_DE";
  Language["English"] = "en_US";
  Language["Spanish"] = "es_ES";
  Language["SpanishUSA"] = "es_US";
  Language["Estonian"] = "et_EE";
  Language["French"] = "fr_FR";
  Language["Hebrew"] = "he_HE";
  Language["Italian"] = "it_IT";
  Language["Georgian"] = "ka_GE";
  Language["Kazakh"] = "kk_KZ";
  Language["Korean"] = "ko_KR";
  Language["Latvian"] = "lv_LV";
  Language["Polish"] = "pl_PL";
  Language["Portuguese"] = "pt_BR";
  Language["Russian"] = "ru_RU";
  Language["Swedish"] = "sv_SE";
  Language["Turkish"] = "tr_TR";
  Language["Ukrainian"] = "uk_UA";
  Language["Chinese"] = "zh_CN";
})(Language || (exports.Language = Language = {}));

var DonationMessageType;
exports.DonationMessageType = DonationMessageType;

(function (DonationMessageType) {
  DonationMessageType["Text"] = "text";
  DonationMessageType["Audio"] = "audio";
})(DonationMessageType || (exports.DonationMessageType = DonationMessageType = {}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvdHlwZXMudHMiXSwibmFtZXMiOlsiVXNlclJvbGUiLCJTZXJ2ZXJFdmVudE5hbWUiLCJFdmVudE5hbWUiLCJBbGVydFNob3dBY3Rpb24iLCJBbGVydFR5cGUiLCJDbGllbnRUeXBlIiwiQ3VycmVuY3kiLCJMYW5ndWFnZSIsIkRvbmF0aW9uTWVzc2FnZVR5cGUiXSwibWFwcGluZ3MiOiI7Ozs7OztJQUlZQSxROzs7V0FBQUEsUTtBQUFBQSxFQUFBQSxRO0dBQUFBLFEsd0JBQUFBLFE7O0lBSUFDLGU7OztXQUFBQSxlO0FBQUFBLEVBQUFBLGU7QUFBQUEsRUFBQUEsZTtBQUFBQSxFQUFBQSxlO0FBQUFBLEVBQUFBLGU7R0FBQUEsZSwrQkFBQUEsZTs7SUFPQUMsUzs7O1dBQUFBLFM7QUFBQUEsRUFBQUEsUztBQUFBQSxFQUFBQSxTO0FBQUFBLEVBQUFBLFM7QUFBQUEsRUFBQUEsUztBQUFBQSxFQUFBQSxTO0FBQUFBLEVBQUFBLFM7R0FBQUEsUyx5QkFBQUEsUzs7SUFTQUMsZTs7O1dBQUFBLGU7QUFBQUEsRUFBQUEsZTtBQUFBQSxFQUFBQSxlO0FBQUFBLEVBQUFBLGU7R0FBQUEsZSwrQkFBQUEsZTs7SUFNQUMsUzs7O1dBQUFBLFM7QUFBQUEsRUFBQUEsUyxDQUFBQSxTO0FBQUFBLEVBQUFBLFMsQ0FBQUEsUztBQUFBQSxFQUFBQSxTLENBQUFBLFM7QUFBQUEsRUFBQUEsUyxDQUFBQSxTO0FBQUFBLEVBQUFBLFMsQ0FBQUEsUztBQUFBQSxFQUFBQSxTLENBQUFBLFM7QUFBQUEsRUFBQUEsUyxDQUFBQSxTO0FBQUFBLEVBQUFBLFMsQ0FBQUEsUztBQUFBQSxFQUFBQSxTLENBQUFBLFM7QUFBQUEsRUFBQUEsUyxDQUFBQSxTO0FBQUFBLEVBQUFBLFMsQ0FBQUEsUztBQUFBQSxFQUFBQSxTLENBQUFBLFM7R0FBQUEsUyx5QkFBQUEsUzs7SUFlQUMsVTs7O1dBQUFBLFU7QUFBQUEsRUFBQUEsVTtBQUFBQSxFQUFBQSxVO0dBQUFBLFUsMEJBQUFBLFU7O0lBS0FDLFE7OztXQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0dBQUFBLFEsd0JBQUFBLFE7O0lBWUFDLFE7OztXQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtBQUFBQSxFQUFBQSxRO0FBQUFBLEVBQUFBLFE7QUFBQUEsRUFBQUEsUTtHQUFBQSxRLHdCQUFBQSxROztJQXVCQUMsbUI7OztXQUFBQSxtQjtBQUFBQSxFQUFBQSxtQjtBQUFBQSxFQUFBQSxtQjtHQUFBQSxtQixtQ0FBQUEsbUIiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIFJhd0RhdGEgeyBcbiAgICByYXc6IHsgW3g6IHN0cmluZ106IGFueSB9IFxufVxuXG5leHBvcnQgZW51bSBVc2VyUm9sZSB7XG4gICAgU3RyZWFtZXIgPSBcInN0cmVhbWVyXCJcbn1cblxuZXhwb3J0IGVudW0gU2VydmVyRXZlbnROYW1lIHtcbiAgICBEb25hdGlvbiA9IFwiZG9uYXRpb25cIixcbiAgICBBbGVydFNob3cgPSBcImFsZXJ0LXNob3dcIixcbiAgICBNZWRpYSA9IFwibWVkaWFcIixcbiAgICBTdGlja2VycyA9IFwic3RpY2tlcnNcIlxufVxuXG5leHBvcnQgZW51bSBFdmVudE5hbWUge1xuICAgIERvbmF0aW9uID0gXCJkb25hdGlvblwiLFxuICAgIEFsZXJ0U3RhcnQgPSBcImFsZXJ0LXNob3ctc3RhcnRcIixcbiAgICBBbGVydEVuZCA9IFwiYWxlcnQtc2hvdy1lbmRcIixcbiAgICBBbGVydFNraXAgPSBcImFsZXJ0LXNob3ctc2tpcFwiLFxuICAgIE1lZGlhID0gXCJtZWRpYVwiLFxuICAgIFN0aWNrZXJzID0gXCJzdGlja2Vyc1wiXG59XG5cbmV4cG9ydCBlbnVtIEFsZXJ0U2hvd0FjdGlvbiB7XG4gICAgU3RhcnQgPSBcInN0YXJ0XCIsXG4gICAgRW5kID0gXCJlbmRcIixcbiAgICBTa2lwID0gXCJza2lwXCJcbn1cblxuZXhwb3J0IGVudW0gQWxlcnRUeXBlIHtcbiAgICBEb25hdGlvbiA9IDEsXG4gICAgVHdpdGNoU3Vic2NyaXB0aW9uID0gNCxcbiAgICBUd2l0Y2hGb2xsb3cgPSA2LFxuICAgIFR3aXRjaEJpdHMgPSAxMSxcbiAgICBDdXN0b21BbGVydCA9IDEyLFxuICAgIFR3aXRjaEdpZnRlZFN1YnNjcmlwdGlvbiA9IDEzLFxuICAgIFR3aXRjaEdpZnRlZFN1YnNjcmlwdGlvbnNQYWlkVXBncmFkZSA9IDE0LFxuICAgIFR3aXRjaFByaW1lU3Vic2NyaXB0aW9uID0gMTUsXG4gICAgVHdpdGNoQ2hhbm5lbEdpZnRlZFN1YnNjcmlwdGlvbiA9IDE2LFxuICAgIFR3aXRjaFJhaWQgPSAxNyxcbiAgICBUd2l0Y2hIb3N0ID0gMTgsXG4gICAgVHdpdGNoQ2hhbm5lbFBvaW50cyA9IDE5XG59XG5cbmV4cG9ydCBlbnVtIENsaWVudFR5cGUge1xuICAgIEFsZXJ0V2lkZ2V0ID0gXCJhbGVydF93aWRnZXRcIixcbiAgICBNaW5vciA9ICBcIm1pbm9yXCIgLy8g0L/QvtGB0LvQtdC00L3QuNC1INGB0L7QvtCx0YnQtdC90LjRj1xufVxuXG5leHBvcnQgZW51bSBDdXJyZW5jeSB7IC8vIElTTyA0MjE3XG4gICAgRXVybyA9IFwiRVVSXCIsXG4gICAgRG9sbGFyID0gXCJVU0RcIixcbiAgICBSdWJsZSA9IFwiUlVCXCIsXG4gICAgQmVsYXJ1c2lhblJ1YmxlID0gXCJCWU5cIiwgLy8gPz8/Pz9cbiAgICBCZWxhcnVzaWFuUnVibGUyID0gXCJCWVJcIiwgLy8gPz8/Pz9cbiAgICBUZW5nZSA9IFwiS1pUXCIsXG4gICAgSHJ5dm5pYSA9IFwiVUFIXCIsXG4gICAgUmVhbCA9IFwiQlJMXCIsXG4gICAgTGlyYSA9IFwiVFJZXCJcbn1cblxuZXhwb3J0IGVudW0gTGFuZ3VhZ2Uge1xuICAgIEJlbGFydXNpYW4gPSBcImJlX0JZXCIsXG4gICAgR2VybWFuID0gXCJkZV9ERVwiLFxuICAgIEVuZ2xpc2ggPSBcImVuX1VTXCIsXG4gICAgU3BhbmlzaCA9IFwiZXNfRVNcIixcbiAgICBTcGFuaXNoVVNBID0gXCJlc19VU1wiLFxuICAgIEVzdG9uaWFuID0gXCJldF9FRVwiLFxuICAgIEZyZW5jaCA9IFwiZnJfRlJcIixcbiAgICBIZWJyZXcgPSBcImhlX0hFXCIsXG4gICAgSXRhbGlhbiA9IFwiaXRfSVRcIixcbiAgICBHZW9yZ2lhbiA9IFwia2FfR0VcIixcbiAgICBLYXpha2ggPSBcImtrX0taXCIsXG4gICAgS29yZWFuID0gXCJrb19LUlwiLFxuICAgIExhdHZpYW4gPSBcImx2X0xWXCIsXG4gICAgUG9saXNoID0gXCJwbF9QTFwiLFxuICAgIFBvcnR1Z3Vlc2UgPSBcInB0X0JSXCIsXG4gICAgUnVzc2lhbiA9IFwicnVfUlVcIixcbiAgICBTd2VkaXNoID0gXCJzdl9TRVwiLFxuICAgIFR1cmtpc2ggPSBcInRyX1RSXCIsXG4gICAgVWtyYWluaWFuID0gXCJ1a19VQVwiLFxuICAgIENoaW5lc2UgPSBcInpoX0NOXCJcbn1cblxuZXhwb3J0IGVudW0gRG9uYXRpb25NZXNzYWdlVHlwZSB7XG4gICAgVGV4dCA9IFwidGV4dFwiLFxuICAgIEF1ZGlvID0gXCJhdWRpb1wiXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlciBleHRlbmRzIFJhd0RhdGEgeyBcbiAgICBpZDogbnVtYmVyLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgc29ja2V0Q29ubmVjdGlvblRva2VuOiBzdHJpbmcsXG4gICAgcm9sZXM6IFVzZXJSb2xlW10sXG4gICAgY29kZTogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhdmF0YXI6IHN0cmluZyxcbiAgICBlbWFpbDogc3RyaW5nLFxuICAgIGxhbmd1YWdlOiBzdHJpbmcsXG4gICAgdGltZXpvbmU6IHN0cmluZyxcbiAgICBtYWluQ3VycmVuY3k6IEN1cnJlbmN5LFxuICAgIGJsYWNrTGlzdFdvcmRzOiBzdHJpbmdbXSxcbiAgICBiYWxhbmNlczoge1xuICAgICAgICBiYWxhbmNlOiBudW1iZXIsIGFkdl9iYWxhbmNlOiBudW1iZXIsIGN1cnJlbmN5OiBDdXJyZW5jeVxuICAgIH1bXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERvbmF0aW9uIGV4dGVuZHMgUmF3RGF0YSB7XG4gICAgaWQ6IG51bWJlcixcbiAgICB0eXBlOiBBbGVydFR5cGUsXG4gICAgaXNTaG93bjogYm9vbGVhbixcbiAgICBhZGRpdGlvbmFsRGF0YTogeyBcbiAgICAgICAgcmFuZG9tbmVzcz86IG51bWJlclxuICAgICAgICBmb3JjZVZhcmlhdGlvbj86IG51bWJlcixcbiAgICAgICAgbW9udGhzSW5Sb3c/OiBudW1iZXIsXG4gICAgICAgIGlzQ29tbWlzc2lvbkNvdmVyZWQ/OiBib29sZWFuXG4gICAgICAgIGV2ZW50RGF0YT86IHtcbiAgICAgICAgICAgIHVzZXJOYW1lPzogc3RyaW5nLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU/OiBzdHJpbmcsXG4gICAgICAgICAgICBjaGFubmVsTmFtZT86IHN0cmluZyxcbiAgICAgICAgICAgIHVzZXJJZD86IHN0cmluZyxcbiAgICAgICAgICAgIGNoYW5uZWxJZD86IHN0cmluZyxcbiAgICAgICAgICAgIHRpbWU/OiBudW1iZXIsIC8vID9cbiAgICAgICAgICAgIHN1Yk1lc3NhZ2U/OiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgIGVtb3Rlcz86IHN0cmluZyAvLyBBcnJheT9cbiAgICAgICAgICAgIH0gJiBSYXdEYXRhLFxuICAgICAgICAgICAgc3ViUGxhbj86IG51bWJlcixcbiAgICAgICAgICAgIHN1YlBsYW5OYW1lPzogc3RyaW5nLFxuICAgICAgICAgICAgbW9udGhzPzogbnVtYmVyLFxuICAgICAgICAgICAgY29udGV4dD86IHN0cmluZywgLy8gZW51bT9cbiAgICAgICAgICAgIGNyZWF0ZWRBdD86IERhdGUsXG4gICAgICAgICAgICBub3RpZmljYXRpb25zPzogYm9vbGVhbixcbiAgICAgICAgICAgIHVzZXI/OiB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICBpZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICB0eXBlOiBzdHJpbmcsIC8vIGVudW0/XG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogRGF0ZVxuICAgICAgICAgICAgfSAmIFJhd0RhdGFcbiAgICAgICAgfSAmIFJhd0RhdGEsXG4gICAgICAgIHBheWVyRGF0YT86IHtcbiAgICAgICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgICAgICBjb2RlOiBzdHJpbmcsXG4gICAgICAgICAgICB1cmw6IHN0cmluZyxcbiAgICAgICAgICAgIHNlcnZpY2U6IHN0cmluZyAvLyBlbnVtP1xuICAgICAgICB9ICYgUmF3RGF0YSxcbiAgICAgICAgc2hvd05pdmVhPzogYm9vbGVhblxuICAgIH0gJiBSYXdEYXRhLFxuICAgIGJpbGxpbmdTeXN0ZW0/OiBzdHJpbmcsXG4gICAgYmlsbGluZ1N5c3RlbVR5cGU/OiBzdHJpbmcsXG4gICAgdXNlcm5hbWU/OiBzdHJpbmcsXG4gICAgYW1vdW50OiBzdHJpbmcsXG4gICAgYW1vdW50Rm9ybWF0dGVkOiBzdHJpbmcsXG4gICAgYW1vdW50TWFpbjogbnVtYmVyLFxuICAgIGN1cnJlbmN5OiBDdXJyZW5jeSxcbiAgICBtZXNzYWdlPzogc3RyaW5nLFxuICAgIGhlYWRlcj86IHN0cmluZyxcbiAgICBkYXRlQ3JlYXRlZDogRGF0ZSxcbiAgICBlbW90ZXM/OiBzdHJpbmcsIC8vIEFycmF5P1xuICAgIGFwSWQ/OiBudW1iZXIsXG4gICAgaXNUZXN0QWxlcnQ6IGJvb2xlYW4sXG4gICAgbWVzc2FnZVR5cGU6IERvbmF0aW9uTWVzc2FnZVR5cGUsXG4gICAgcHJlc2V0SWQ/OiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGVydFNob3dFdmVudCBleHRlbmRzIFJhd0RhdGEge1xuICAgIGlkOiBudW1iZXIsXG4gICAgdHlwZTogQWxlcnRUeXBlXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWxlcnRTaG93U3RhcnRFdmVudCBleHRlbmRzIEFsZXJ0U2hvd0V2ZW50IHtcbiAgICBkdXJhdGlvbjogbnVtYmVyLFxuICAgIGdyb3VwSWQ/OiBudW1iZXJcbn0iXX0=