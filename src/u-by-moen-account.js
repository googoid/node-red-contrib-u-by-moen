module.exports = function (RED) {
  const clients = require('../lib/clients');
  const MoenClient = require('../lib/MoenClient');

  function Account(n) {
    let node = this;
    RED.nodes.createNode(node, n);

    const client = (this.client = new MoenClient(n.email, n.password));
    clients.set(n.id, client);

    node.on('close', async () => {
      try {
        for (let key of clients.keys()) {
          for (let shower of clients.get(key).showers.keys()) {
            await clients.get(shower).subscribed;
            client.unsubscribe(shower);
          }
          client.delete(key);
        }
      } catch (e) {
        node.debug(e);
      }
    });
  }

  RED.nodes.registerType('u-by-moen-account', Account);

  RED.httpAdmin.get('/u-by-moen/showers', function (req, res) {
    if (!req.query.account_id) {
      res.status(500).send('Missing arguments');
      return;
    }

    if (clients.has(req.query.account_id)) {
      const client = clients.get(req.query.account_id);

      client.authenticated
        .then(getShowers)
        .catch(e => res.status(500).send(e.message));

      function getShowers() {
        client.getShowers().then(showers => {
          res.set({ 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(showers));
        });
      }

      return;
    }

    res.status(404).send('No configuration found for specified account');
    return;
  });

  RED.httpAdmin.post('/u-by-moen/create-client', function (req, res) {
    if (!req.query.account_id) {
      res.status(500).send('Missing arguments');
      return;
    }

    const { email, password } = req.body;
    const client = new MoenClient(email, password);
    clients.set(req.query.account_id, client);

    client.authenticated
      .then(() => {
        res.status(200);
      })
      .catch(e =>
        res.status(404).send('No configuration found for specified account')
      );

    // Query server for information
    // if (clients.has(req.query.account_id)) {
    //   var client = clients.get(req.query.account_id);

    //   if (!client.token) {
    //     client.once('authenticated', () => {
    //       getShowers();
    //     });
    //   } else {
    //     getShowers();
    //   }

    //   function getShowers() {
    //     client.getShowers().then(showers => {
    //       res.set({ 'content-type': 'application/json; charset=utf-8' });
    //       res.end(JSON.stringify(showers));
    //     });
    //   }

    //   return;
    // }
  });
};
