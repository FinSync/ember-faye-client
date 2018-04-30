import Ember from 'ember';

export const Authentication = {
  outgoing(message, callback) {
    message.ext = { authToken: this._authToken };
    callback(message);
  }
};

const fayeExtensions = {
  Authentication
};

export default fayeExtensions;
