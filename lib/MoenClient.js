const Pusher = require('pusher-js');
const request = require('superagent');
const { EventEmitter } = require('events');

const BASE_API = 'https://www.moen-iot.com';
const AUTHENTICATE_API = `${BASE_API}/v2/authenticate`;
const SHOWERS_API = `${BASE_API}/v2/showers`;
const SHOWER_DETAILS_API = `${BASE_API}/v5/showers`;
const CREDENTIALS_API = `${BASE_API}/v2/credentials`;

const debug = require('debug')('u-by-moen:client');

class MoenClient extends EventEmitter {
  constructor(email, password) {
    super();
    this.email = email;
    this.password = password;

    this.authenticated = new Promise((resolve, reject) => {
      this.once('authenticated', resolve);
    });

    this.authenticate();

    this.pushers = new Map();
    this.channels = new Map();
    this.showers = new Map();
  }

  async authenticate() {
    this.token = (
      await request(AUTHENTICATE_API)
        .set('Accept', '*/*')
        .query({ email: this.email, password: this.password })
    ).body.token;

    debug('authenticated');
    this.emit('authenticated');

    return this.token;
  }

  async getShowers() {
    return (
      await request(SHOWERS_API)
        .set('Accept', '*/*')
        .set('User-Token', this.token)
    ).body;
  }

  async getCredentials(serial_number) {
    return (
      await request(CREDENTIALS_API)
        .set('Accept', '*/*')
        .query({ user_token: this.token, serial_number })
    ).body;
  }

  async subscribe(serial_number) {
    if (this.showers.has(serial_number)) {
      debug('already subscribed');
      await this.showers.get(serial_number).subscribed;
      return;
    }

    let resolveShower;
    this.showers.set(serial_number, {
      subscribed: new Promise(resolve => (resolveShower = resolve))
    });

    await this.authenticated;

    const {
      app_key,
      cluster,
      channel: channelId
    } = await this.getCredentials(serial_number);

    debug('got pusher credentials');

    const pusher = new Pusher(app_key, {
      cluster,
      channelAuthorization: {
        endpoint: `${BASE_API}/v2/pusher-auth`,
        params: {
          user_token: this.token,
          serial_number
        }
      }
    });
    this.pushers.set(serial_number, pusher);

    const channel = await pusher.subscribe('private-' + channelId);

    return new Promise((resolve, reject) => {
      channel.bind('pusher:subscription_succeeded', () => {
        this.channels.set(serial_number, channel);
        debug('%s subscribed to channel %s', serial_number, channelId);
        resolve();
        resolveShower();

        channel.bind('client-state-desired', data => {
          debug('client-state-desired', data);
        });

        channel.bind('client-state-reported', data => {
          // debug('client state reported', data);
          this.emit('reported', data);
        });
      });
    });
  }

  async unsubscribe(serial_number) {
    const pusher = this.pushers.get(serial_number);
    if (!pusher) {
      return;
    }

    await pusher.unsubscribe();
    debug('%s unsubscribed', serial_number);
    pusher.disconnect();
    this.channels.delete(serial_number);
    this.showers.delete(serial_number);
  }

  async control(serial_number, data) {
    await this.showers.get(serial_number);
    return await this.channels
      .get(serial_number)
      .trigger('client-state-desired', {
        type: 'control',
        data
      });
  }
}

module.exports = MoenClient;

// (async function start() {
//   token = await authenticate();
//   const showers = await getShowers();
//   const { serial_number } = showers.find(s => s.name === preferredShower);
//   const { app_key, cluster, channel } = await getCredentials(serial_number);

//   const pusher = new Pusher(app_key, {
//     cluster,
//     channelAuthorization: {
//       endpoint: `${BASE_API}/v2/pusher-auth`,
//       params: {
//         user_token: token,
//         serial_number
//       }
//     }
//   });
//   const ch = await pusher.subscribe('private-' + channel);
//   ch.bind('pusher:subscription_succeeded', () => {
//     ch.bind('client-state-desired', data => {
//       console.log('client-state-desired', data);
//     });
//     // ch.bind('client-state-reported', (a, b, c) => {
//     //   console.log('client-state-reported', a, b, c);
//     // });
//     ch.bind('client-command', data => {
//       console.log('client-command', data);
//     });
//     ch.bind('client-command-resp', data => {
//       console.log('client-command-resp', data);
//     });

//     console.log(
//       ch.trigger('client-state-desired', {
//         type: 'control',
//         data: { action: 'shower_on', params: { preset: '0' } }
//       })
//     );

//     setTimeout(() => {
//       ch.trigger('client-state-desired', {
//         type: 'control',
//         data: { action: 'shower_off', params: {} }
//       });
//     }, 5000);
//   });
// })().catch(console.error);
