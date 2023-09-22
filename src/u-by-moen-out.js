module.exports = function (RED) {
  // The main node definition - most things happen in here
  function OutputNode(n) {
    var node = this;
    var debug = !!n.debug;
    // if(!lx) {
    //     lx = lifx.init();
    // }

    // Create a RED node
    RED.nodes.createNode(this, n);

    // Set default values from node configuration
    // this.state = {
    //     on: !!n.on,
    //     hue: n.hue,
    //     saturation: n.saturation,
    //     luminance: n.luminance,
    //     whiteColor: n.whiteColor,
    //     fadeTime: n.fadeTime,
    // };

    // function setPower(pwr) {
    //     if(pwr) {
    //         node.log("Lights on");
    //         lx.lightsOn();
    //     }
    //     else {
    //         node.log("Lights off");
    //         lx.lightsOff();
    //     }
    // }

    // function setColor(params) {
    //     node.log("Setting color: " + JSON.stringify(params));

    //     lx.lightsColour(
    //         params.hue,
    //         params.saturation,
    //         params.luminance,
    //         params.whiteColor,
    //         params.fadeTime
    //     );
    // }

    // send initial values
    // setPower(this.state.on);
    // setColor(this.state);

    // respond to inputs....
    // this.on('input', function (msg) {
    //     var payload = msg.payload;

    //     this.state = merge(this.state, payload);

    //     setPower(this.state.on);
    //     setColor(this.state);

    //     var out = {
    //         payload: this.state
    //     };
    //     this.send(out);
    // });

    // this.on('close', function() {
    //     lx.close();
    //     lx = null;
    // });
  }

  // Register the node by name. This must be called before overriding any of the
  // Node functions.
  RED.nodes.registerType('u-by-moen-out', OutputNode);
};
