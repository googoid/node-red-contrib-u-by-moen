module.exports = function (RED) {
  const clients = require('../lib/clients');

  // The main node definition - most things happen in here
  function InputNode(n) {
    let node = this;
    let debug = !!n.debug;

    let client;

    const config = RED.nodes.getNode(n.account);

    if (config) {
      client = config.client;

      client.subscribe(n.shower);
      client.on('reported', onReported);
    }

    // console.log(n);

    // console.log();

    // const client = clients.get(n.account);

    function onReported(data) {
      node.send({ payload: data });
    }

    // Create a RED node
    RED.nodes.createNode(this, n);

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
  RED.nodes.registerType('u-by-moen-in', InputNode);
};
