module.exports = function (RED) {
  const clients = require('../lib/clients');

  // The main node definition - most things happen in here
  function InputNode(n) {
    let node = this;
    let debug = !!n.debug;

    const client = clients.get(n.account);
    client.once('authenticated', () => {
      client
        .getCredentials(n.shower)
        .then(creds => {
          client.subscribe(n.shower, creds);
        })
        .catch(node.error);
    });

    client.on('reported', onReported);

    function onReported(data) {
      node.send({ payload: data });
    }

    // Create a RED node
    RED.nodes.createNode(this, n);

    this.on('close', () => {
      client.removeListener('reported', onReported);
      client.unsubscribe();
    });
  }

  // Register the node by name. This must be called before overriding any of the
  // Node functions.
  RED.nodes.registerType('u-by-moen-in', InputNode);
};
