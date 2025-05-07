class Palooza {
	configuration: RTCConfiguration;
	/**
	 * Create a Palooza object
	 * @constructor
	 * @param {RTCConfiguration} configuration - RTCConfiguration json object.
	 */
	constructor(configuration: RTCConfiguration) {
		this.configuration = configuration;
	}
	async create_session() {
		const peer = new RTCPeerConnection(this.configuration);
		const cmd_channel = peer.createDataChannel('cmd');

		const offer = await peer.createOffer();
		peer.setLocalDescription(offer);
	}
}
