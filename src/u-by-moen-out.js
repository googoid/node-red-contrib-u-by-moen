module.exports = function (RED) {
  const clients = require('../lib/clients');

  // The main node definition - most things happen in here
  function OutputNode(n) {
    let client;

    const config = RED.nodes.getNode(n.account);

    if (config) {
      client = config.client;

      client.subscribe(n.shower);
    }

    // Create a RED node
    RED.nodes.createNode(this, n);

    this.on('input', msg => {
      if (client) {
        client.control(n.shower, msg.payload).then();
      }
    });

    this.on('close', () => {
      if (client) {
        client.removeListener('reported', onReported);
        client.unsubscribe(n.shower);
        client = null;
      }
    });
  }

  // Register the node by name. This must be called before overriding any of the
  // Node functions.
  RED.nodes.registerType('u-by-moen-out', OutputNode);
};
