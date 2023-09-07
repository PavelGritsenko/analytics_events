(function() {
  window.GaEvents = {};

  GaEvents.Event = (function() {
    Event.prototype.adapter = null;

    Event.list = [];

    Event.may_flush = false;

    Event.header_key = "x-ga-events";

    Event.html_key = "ga-events";

    Event.require_user_consent = false;

    Event.user_consent_given = false;

    Event.prototype.klass = Event;

    Event.from_json = function(string) {
      var events;
      events = JSON.parse(string);
      return $.map(events, (function(_this) {
        return function(event) {
          var event_name;
          if (event_name = event.__event__) {
            delete event.__event__;
            return new _this(event_name, event);
          }
        };
      })(this));
    };

    Event.from_dom = function() {
      var data_attribute, dom_events;
      data_attribute = "data-" + this.html_key;
      dom_events = $("div[" + data_attribute + "]").attr(data_attribute);
      if (dom_events != null) {
        return this.from_json(dom_events);
      }
    };

    Event.flush = function() {
      if (this.require_user_consent && !this.user_consent_given) {
        return;
      }
      if (this.list.length > 0 && this.may_flush) {
        $.map(this.list, function(event) {
          return event.push_to_adapter();
        });
        return this.list = [];
      }
    };

    function Event(event_name1, options1) {
      this.event_name = event_name1;
      this.options = options1 != null ? options1 : {};
      this.klass.list.push(this);
      this.klass.flush();
    }

    Event.prototype.push_to_adapter = function() {
      if (this.is_valid_event_name()) {
        return this.klass.adapter().push(this.event_name, this.options);
      } else {
        if (console) {
          return console.warn("GA4 event name \"" + this.event_name + "\" is invalid.");
        }
      }
    };

    Event.prototype.is_valid_event_name = function() {
      return /^[a-z]+[a-z0-9_]*$/i.test(this.event_name);
    };

    jQuery(function() {
      var process_xhr;
      Event.may_flush = true;
      Event.flush();
      process_xhr = function(xhr) {
        var xhr_events;
        xhr_events = xhr.getResponseHeader(Event.header_key);
        if (xhr_events != null) {
          return Event.from_json(decodeURIComponent(xhr_events));
        }
      };
      $(document).ajaxComplete(function(_, xhr) {
        return process_xhr(xhr);
      });
      $(document).on("turbolinks:request-end", function(event) {
        var xhr;
        xhr = event.originalEvent.data.xhr;
        return process_xhr(xhr);
      });
      return Event.from_dom();
    });

    return Event;

  })();

  GaEvents.GTagAdapter = (function() {
    function GTagAdapter(options) {
      this.analytics_object_name = (options != null ? options.analytics_object_name : void 0) || 'gtag';
      this.tracker_name = (options != null ? options.tracker_name : void 0) || false;
    }

    GTagAdapter.prototype.push = function(event_name, data) {
      if (this.tracker_name) {
        data.send_to = this.tracker_name;
      }
      return window[this.analytics_object_name]("event", event_name, data);
    };

    return GTagAdapter;

  })();

  GaEvents.NullAdapter = (function() {
    function NullAdapter() {}

    NullAdapter.prototype.push = function(event_name, data) {
      if (typeof console !== "undefined" && console !== null) {
        return console.log(event_name, data);
      }
    };

    return NullAdapter;

  })();

  GaEvents.GoogleTagManagerAdapter = (function() {
    function GoogleTagManagerAdapter(event1) {
      this.event = event1 != null ? event1 : "ga_event";
    }

    GoogleTagManagerAdapter.prototype.push = function(event_name, data) {
      data.event = this.event;
      data.event_name = event_name;
      data.non_interaction = true;
      return window.dataLayer.push(data);
    };

    return GoogleTagManagerAdapter;

  })();

  GaEvents.TestAdapter = (function() {
    function TestAdapter() {}

    TestAdapter.prototype.push = function(event_name, data) {
      var loggedEvent;
      loggedEvent = Object.assign({
        event_name: event_name
      }, data);
      if (window.events == null) {
        window.events = [];
      }
      return window.events.push(loggedEvent);
    };

    return TestAdapter;

  })();

}).call(this);
