export function initialize(application) {
  application.inject('controller', 'faye', 'service:faye');
  application.inject('route', 'faye', 'service:faye');
}

export default {
  name: 'faye',
  initialize
};
