const Pusher = require('pusher-js');
const request = require('superagent');
const { EventEmitter } = require('events');

const BASE_API = 'https://www.moen-iot.com';
const AUTHENTICATE_API = `${BASE_API}/v2/authenticate`;
const SHOWERS_API = `${BASE_API}/v2/showers`;
const SHOWER_DETAILS_API = `${BASE_API}/v5/showers`;
const CREDENTIALS_API = `${BASE_API}/v2/credentials`;

class MoenClient extends EventEmitter {
  constructor(email, password) {
    super();
    this.email = email;
    this.password = password;
  }

  async authenticate() {
    this.token = (
      await request(AUTHENTICATE_API)
        .set('Accept', '*/*')
        .query({ email: this.email, password: this.password })
    ).body.token;

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

  async subscribe(serial_number, { app_key, cluster, channel }) {
    this.pusher = new Pusher(app_key, {
      cluster,
      channelAuthorization: {
        endpoint: `${BASE_API}/v2/pusher-auth`,
        params: {
          user_token: this.token,
          serial_number
        }
      }
    });

    this.ch = await this.pusher.subscribe('private-' + channel);

    this.ch.bind('pusher:subscription_succeeded', () => {
      this.emit('subscribed');

      this.ch.bind('client-state-desired', data => {
        // node.send(data)
        // console.log('client-state-desired', data);
      });

      this.ch.bind('client-state-reported', data => {
        this.emit('reported', data);
      });
    });
  }

  async unsubscribe() {
    await this.pusher.unsubscribe();
    this.pusher.disconnect();
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
