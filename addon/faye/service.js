import Ember from 'ember';
const { getOwner, Logger, Service } = Ember;

export default Service.extend({
  client: null,
  config: null,
  listeners: null,
  channels: null,

  init() {
    Logger.debug('Initializing Ember Faye service...');
    this._super(...arguments);
    let config = (getOwner(this).resolveRegistration('config:environment') || {}).faye || {};
    this.set('config', config);
    this.set('listeners', new Set());
    this.set('channels', new Set());

    this._setupServiceClient();
  },

  addListener(listener) {
    if (this._isExistingListener(listener)) {
      return false;
    }

    if (!this.isConnected()) {
      this.get('client').connect(this._onConnected, this);
    }

    this._listenOn(listener);
    this.get('listeners').add(listener);
  },

  removeListener(listener) {
    if (!this._isExistingListener(listener)) {
      return false;
    }

    if (!this.isConnected()) {
      this.get('client').connect(this._onConnected, this);
    }

    this._listenOff(listener);
    this.get('listeners').delete(listener);
  },

  publish(channel, data) {
    return this.get('client').publish(channel, data);
  },

  isConnected() {
    return (this.get('client')._state == Faye.Client.CONNECTED);
  },

  _createClient() {
    let config = this.get('config');
    let client = new Faye.Client(config.URL, config.options);

    const Authentication = {
      outgoing(message, callback) {
        message.ext = { authToken: config.authToken };
        callback(message);
      }
    };
    client.addExtension(Authentication);

    client.disable('autodisconnect');

    return client;
  },

  _setupServiceClient(client = null) {
    if (!client) {
      client = this._createClient();
    }

    this.set('client', client);
  },

  _listenOn(listener) {
    let [channelName, eventName] = this._channelData(listener);

    if (this._isExistingChannel(channelName)) {
      return false;
    }

    let callback = (data) => {
      this._propagate(eventName, data);
    };
    this.get('client').subscribe(channelName, callback, this);
    this.get('channels').add(channelName);
  },

  _listenOff(listener) {
    let [channelName, eventName] = this._channelData(listener);

    if (this._isExistingChannel(channelName)) {
      let callback = (data) => {
        this._propagate(eventName, data);
      }
      this.get('client').unsubscribe(channelName, callback, this);
      this.get('channels').remove(channelName);
    }
  },

  _propagate(event, data) {
    let listeners = this.get('listeners').filter((listener) => {
      return (listener.event == event);
    });

    let action = Ember.String.camelize(event + '_handler');

    listeners.forEach((l) => {
      l.context.send(action, data);
    });
  },

  _isExistingListener(listener) {
    let existingListeners = this.get('listeners').filter((l) => {
      return (listener.event == l.event) &&
             (listener.context == l.context) &&
             (listener.tenantId == l.tenantId);
    });

    return (existingListeners.length > 0);
  },

  _isExistingChannel(channelName) {
    let existingChannels = this.get('channels').filter((c) => {
      return (channelName == c);
    });

    return (existingChannels.length > 0);
  },

  _onConnected() { },

  _channelData(listener) {
    let eventName = listener.channel;

    let channelName = '/' + Ember.String.decamelize(eventName);
    if ((listener.tenantId != undefined) && (listener.tenantId != null)) {
      channelName = '/' + listener.tenantId + channelName;
    }

    return [channelName, eventName];
  }
});
