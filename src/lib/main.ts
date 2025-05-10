class EventListener {
	listeners: any;
	constructor() {
		this.listeners = {};
	}
	/**
	 * Add an event listener to certain interactions of the function.
	 * Uses the standard JS addEventListener naming scheme and functions
	 * how you would expect it to.
	 * @param event - Event name
	 * @param callback - Callback function
	 */
	addEventListener(event: string, callback: (...args: any) => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	/**
	 * Remove an event listener from the object.
	 * Uses the standard JS removeEventListener naming scheme and functions
	 * how you would expect it to.
	 * @param event - Event name
	 * @param callback - Callback function to remove
	 */
	removeEventListener(event: string, callback: () => void) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event].filter(
				(listener: () => void) => listener !== callback
			);
		}
	}

	/**
	 * Runs all events that the object contains.
	 * Uses the standard JS dispatchEvent naming scheme and functions
	 * how you would expect it to.
	 * @param event - Event name
	 * @param data - Data for the callback
	 */
	dispatchEvent(event: string, data: any) {
		if (this.listeners[event]) {
			this.listeners[event].forEach((callback: (data: any) => void) => callback(data));
		}
	}
}

class SignalService extends EventListener {
	socket: WebSocket | null = null;
	base: string = '';
	debug: number;

	/**
	 * Create a Signal Service object
	 * @constructor
	 *
	 * @param [debug=0]
	 * @param [ip='0.0.0.0']
	 * @param [port='25565']
	 */
	constructor(ip = '0.0.0.0', port = '25565', debug = 0) {
		super();
		this.debug = debug;
		this.base = `ws://${ip}:${port}/`;
	}

	message_handler(e: MessageEvent) {
		this.dispatchEvent('message', e); // Forward Message to custom event handler
		if (this.debug >= 3) console.log('[SignalService] Message: ', e);
	}
	close(e: Event) {
		this.dispatchEvent('close', e); // Forward Message to custom event handler
		if (this.debug >= 3) console.log('[SignalService] Closed Connection to Signal Server: ', e);
	}
	open(e: Event) {
		this.dispatchEvent('open', e); // Forward Message to custom event handler
		if (this.debug >= 3) console.log('[SignalService] Opened Socket: ', e);
	}
	error(e: Event) {
		this.dispatchEvent('error', e); // Forward Message to custom event handler
		if (this.debug >= 3) console.log('[SignalService] An Error Occured: ', e);
	}

	subscriber(ws: WebSocket) {
		ws.addEventListener('message', (e) => this.message_handler(e));
		ws.addEventListener('error', (e) => this.error(e));
		ws.addEventListener('close', (e) => this.close(e));
		ws.addEventListener('open', (e) => this.open(e));
	}

	unsubscriber(ws: WebSocket) {
		ws.addEventListener('message', (e) => this.message_handler(e));
		ws.addEventListener('error', (e) => this.error(e));
		ws.addEventListener('close', (e) => this.close(e));
		ws.addEventListener('open', (e) => this.open(e));
	}
	/**
	 * Asks the socket server for a room id
	 *
	 * If an id is received it will update the room id value of this object.
	 *
	 * @param room_id - Optional Room ID for saved rooms
	 */
	generate_room(room_id?: string) {
		const socket = new WebSocket(this.base + 'generate_room');
		this.subscriber(socket);

		socket.onopen = () => {
			socket.send(JSON.stringify({ room_id: room_id ? room_id : '' }));
		};

		socket.onclose = () => {
			this.unsubscriber(socket);
		};
	}

	/**
	 * Asks the socket server for a socket for the client
	 *
	 * If a socket is created it will return true.
	 *
	 * @param room - Room ID to connect to
	 */
	join_room(room_id: string) {
		this.socket = new WebSocket(this.base + 'client_endpoint');
		this.subscriber(this.socket);

		this.socket.onopen = () => {
			this.socket!.send(JSON.stringify(room_id ? { room_id: room_id } : ''));
		};
		this.socket.onclose = () => {
			this.unsubscriber(this.socket!);
		};
	}
}

class Palooza extends EventListener {
	peer: RTCPeerConnection | null;
	cmd_channel: RTCDataChannel | null;

	signal: SignalService | null;
	connection_status: boolean;
	configuration: RTCConfiguration;
	room_id: string | null;

	/**
	 * Create a Palooza object
	 * @constructor
	 * @param configuration - RTCConfiguration json object.
	 */
	constructor(configuration?: RTCConfiguration) {
		super();
		this.configuration = configuration || {
			iceServers: [
				// { urls: 'STUN:freestun.net:3478' },
				{
					urls: 'TURN:freestun.net:3478',
					username: 'free',
					credential: 'free'
				}
			]
		};
		this.peer = null;
		this.cmd_channel = null;
		this.room_id = null;
		this.signal = null;
		this.connection_status = false;
	}

	/**
	 * Initialise the object. It will create a session for you.
	 * It will automatically create a room and join it on the signal
	 * server.
	 *
	 * Upon receiving a session token it will create and offer
	 *
	 * It will dispatch the "offer" event
	 *
	 * @returns id - This is the id provided by the signalling server
	 */
	async create_session(): Promise<string | null> {
		this.signal = new SignalService();
		this.signal.addEventListener('message', (message) => {
			const data = JSON.parse(message.data);
			if (data.message) {
				console.log(data.message);
			} else if (data.room_id) {
				this.room_id = data.room_id;
				this.signal!.join_room(data.room_id);
				return;
			} else if (data.connected === true) {
				this.connection_status = true;
				return;
			}
		});
		this.signal.generate_room();

		this.peer = new RTCPeerConnection(this.configuration);
		this.cmd_channel = this.peer.createDataChannel('cmd');

		const offer = await this.peer.createOffer();
		this.peer.setLocalDescription(offer);

		this.dispatchEvent('offer', offer);
		return this.room_id;
	}
	async kill_session(): Promise<void> {
		this.signal?.socket?.close();
	}
}

export { Palooza, SignalService };
