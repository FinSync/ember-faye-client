import Ember from 'ember';
const { getOwner, Logger, Service } = Ember;
import { Authentication } from 'ember-faye-client/utils/faye-extensions';

export default Service.extend({
  client: null,
  config: null,
  subscriptions: {},

  init() {
    Logger.debug('Initializing Ember Faye service...');
    this._super(...arguments);
    let config = (getOwner(this).resolveRegistration('config:environment') || {}).faye || {};
    this.set('config', config);

    this.setupServiceClient();
  },

  createClient() {
    let config = this.get('config');
    let client = new Faye.Client(config.URL, config.options);

    client._authToken = config.authToken;
    client.addExtension(Authentication);

    return client;
  },

  setupServiceClient(client = null) {
    if (!client) {
      client = this.createClient();
    }

    this.set('client', client);
  },

  publish(channel, payload, options = {}) {
    return this.get('client').publish(channel, payload, options);
  },

  subscribe(channel, callback, binding) {
    if (!binding) {
      binding = this;
    }

    let bindCallback = callback.bind(binding);

    console.debug(`Subscribing to ${channel}...`);
    let subscription = this.get('client').subscribe(
      channel,
      (message) => {
        bindCallback(message, channel);
      }
    ).then(() => {
      console.debug(`Subscribed to ${channel}.`);
    });

    let subscriptions = this.get('subscriptions');
    if (!subscriptions[channel]) {
      subscriptions[channel] = [];
    }
    subscriptions[channel].push(subscription);
    this.set('subscriptions', subscriptions);

    return subscription;
  }
});
