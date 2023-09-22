module.exports = function (RED) {
  const clients = require('../lib/clients');
  const MoenClient = require('../lib/MoenClient');
  // list of servers

  function Account(n) {
    let node = this;
    RED.nodes.createNode(node, n);

    const client = new MoenClient(n.email, n.password);
    clients.set(n.id, client);

    client
      .authenticate()
      .then(() => {})
      .catch(e => node.error(e.stack));

    // self.config = {
    //   name: config.name,
    //   key: config.key,
    //   network: config.network,
    //   interval: config.interval
    // };

    // Create server
    // try {
    //   this.lightServer = new LightServer(config);
    // } catch (e) {
    //   self.error(e.message, e.stack);
    //   return;
    // }

    // Handle close event
    node.on('close', () => {
      clients.delete(n.id);
    });
  }

  RED.nodes.registerType('u-by-moen-account', Account);

  // Get list of lights
  RED.httpAdmin.get('/u-by-moen/showers', function (req, res) {
    if (!req.query.account_id) {
      res.status(500).send('Missing arguments');
      return;
    }

    // Query server for information
    if (clients.has(req.query.account_id)) {
      var client = clients.get(req.query.account_id);

      if (!client.token) {
        client.once('authenticated', () => {
          getShowers();
        });
      } else {
        getShowers();
      }

      function getShowers() {
        client.getShowers().then(showers => {
          res.set({ 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(showers));
        });
      }

      return;
    }

    res.status(500).send('Server not found or not activated');
    return;
  });
};
