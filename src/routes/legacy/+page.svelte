<script lang="ts">
	// palooza
	import './app.css';
	import Peer, { type DataConnection } from 'peerjs';
	import palooaza from '$lib/assets/paloozaLogo.png';

	let client = $state<Peer>();
	let client_state = $state<Boolean>(false);
	let client_id = $state<string>('not set');
	// let conn_client = $state<any>();

	let peer_id_add = $state<string>();
	let active_connections = $state<
		{
			id: string;
			conn: DataConnection;
		}[]
	>([]);
	let messages = $state<string[]>([]);

	let message_content = $state<string>('');
	let message_box = $state<HTMLElement>();

	$effect(() => {
		messages.length;
		message_box!.scrollTop = message_box!.scrollHeight;
	});

	function create_client() {
		client_state = true;
		// https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b?permalink_comment_id=4727522#gistcomment-4727522
		client = new Peer({
			config: {
				iceServers: [
					{ urls: 'STUN:freestun.net:3478' },
					{
						urls: 'TURN:freestun.net:3478',
						username: 'free',
						credential: 'free'
					}
				]
			},
			debug: 3
		});
		client.on('open', (id) => {
			client_id = id;
			client_state = false;
		});
		client.on('error', () => {
			client_id = 'error contacting ICE servers';
			client_state = false;
		});
		client!.on('close', () => (client_id = 'not set'));
		client.on('connection', (conn) => {
			active_connections.push({
				id: conn.peer as string,
				conn: conn
			});
			conn.on('data', receive_message);
			conn.on('open', () => {
				active_connections.forEach((e) => {
					if (e.id !== conn.peer) send_message(`oid:${e.id}`);
				});
			});
		});
	}
	function close_client() {
		send_message(`cid:${client!.id}`);
		active_connections.forEach((e) => {
			e.conn.close();
		});
		active_connections = [];
		client!.destroy();
		client = null as any;
	}

	function receive_message(data: any) {
		// Handle Open and Close
		if ((data as string).includes('oid:')) {
			const id = data.slice(4);
			let exists = false;
			if (id !== client!.id) {
				active_connections.forEach((e) => {
					if (e.id === id) {
						exists = true;
					}
				});
				if (!exists) {
					peer_id_add = id;
					open_connection();
				}
			}
		} else if ((data as string).includes('cid:')) {
			const id = data.slice(4);
			if (id === client!.id) {
				active_connections.forEach((e) => {
					e.conn.close();
				});
				active_connections = [];
			} else {
				active_connections = active_connections.filter((e, index) => {
					if (e.id === id) {
						return false;
					}
					return true;
				});
			}
		}
		messages.push(data);
	}

	function open_connection() {
		if (!client || client!.id === peer_id_add || !peer_id_add) {
			return;
		}

		for (let x = 0; x < active_connections.length; x++) {
			if (active_connections[x].id === peer_id_add) {
				return;
			}
		}

		const conn = client.connect(peer_id_add as string);
		conn.on('open', function () {
			active_connections.push({
				id: peer_id_add as string,
				conn: conn
			});
			peer_id_add = '';
			conn.on('data', receive_message);

			active_connections.forEach((e) => {
				if (e.id !== conn.peer) send_message(`oid:${e.id}`);
			});
		});
	}

	function send_message(msg?: null | string) {
		let output = '';
		if (msg) {
			output = msg;
		} else {
			output = message_content;
		}
		messages.push(`self: ${output}`);
		active_connections.forEach((e) => {
			try {
				e.conn.send(output);
			} catch (e) {
				console.log(e);
			}
		});
		message_content = '';
	}

	function close_connection() {
		active_connections = active_connections.filter((e, index) => {
			if (e.id === this.value) {
				send_message(`cid:${e.id}`);
				e.conn.close();
				return false;
			}
			return true;
		});
	}
</script>

<div class="hero bg-base-200 mt-10">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<img src={palooaza} alt="Palooza" />
			<h1 class="text-5xl font-bold">Palooza Tester Legacy (PeerJS)</h1>
			<p class="py-6">
				A site to troubleshoot and provide basic tooling for the <a
					class="link link-primary"
					href="https://codeberg.org/NeoSahadeo/Palooza">Palooza</a
				> extension. Available soon!
			</p>
		</div>
	</div>
</div>
<div class="flex w-full flex-col">
	<div class="divider"></div>
</div>
<div class="bg-base-100 flex flex-col gap-3 pt-3 pl-3">
	<h2 class="text-lg font-bold">Client Status</h2>
	<p>
		Client ID: {client_id}
	</p>
	<span class="flex items-center gap-2">
		{#if client && !client_state}
			<button onclick={close_client} class="btn btn-secondary"> Kill Client</button>
			<div class="inline-grid *:[grid-area:1/1]">
				<div class="status status-success animate-ping"></div>
				<div class="status status-success"></div>
			</div>
			Client running
		{:else}
			<button
				onclick={create_client}
				class={`btn ${client_state ? 'btn-disabled' : 'btn-primary'}`}
			>
				Enable Client</button
			>
			<div class="inline-grid *:[grid-area:1/1]">
				<div class="status status-error animate-ping"></div>
				<div class="status status-error"></div>
			</div>
			Client does not exist
		{/if}
	</span>

	<div class="flex w-full flex-col">
		<div class="divider"></div>
	</div>

	<h2 class="text-lg font-bold">Test Connection Status</h2>
	<div class="overflow-x-auto">
		<table class="table-zebra table">
			<!-- head -->
			<thead>
				<tr>
					<th>#</th>
					<th>ID</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each active_connections as value, index}
					<tr>
						<td>{index + 1}</td>
						<td>{value.id}</td>
						<td
							><button
								value={value.id}
								onclick={close_connection}
								class="btn btn-secondary text-nowrap">Close Connection</button
							></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<span class="flex flex-row gap-2">
		<input bind:value={peer_id_add} class="input" type="text" placeholder="Peer ID" />
		<button onclick={open_connection} class={`btn ${client?.id ? 'btn-primary' : 'btn-disabled'}`}
			>Open Connection</button
		>
	</span>

	<div class="flex w-full flex-col">
		<div class="divider"></div>
	</div>
	<h2 class=" text-lg font-bold">Messenger</h2>
	<div bind:this={message_box} class="max-h-40 min-h-40 overflow-scroll rounded bg-black">
		{#each messages as value}
			{#if value.includes('self: ')}
				<div class="chat-bubble chat-bubble-neutral my-1">
					{value.slice(6)}
				</div>
			{:else}
				<div class="chat-bubble my-1">{value}</div>
			{/if}
		{/each}
	</div>
	<div class="flex flex-row items-center justify-end gap-2">
		<input
			onkeypress={(e) => {
				if (message_content && client && e.key === 'Enter') {
					send_message();
				}
			}}
			bind:value={message_content}
			type="text"
			class="input w-full"
		/>
		<button
			onclick={() => send_message()}
			class={`btn ${client?.id ? 'btn-primary' : 'btn-disabled'} text-nowrap`}
			>Send Message
		</button>
	</div>
</div>

<div class="flex w-full flex-col">
	<div class="divider"></div>
</div>
<footer class="footer footer-horizontal footer-center bg-base-200 text-base-content rounded p-10">
	<nav>
		<div class="grid grid-flow-col gap-4">
			<a href="https://x.com/NeoSahadeo_/">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
					><!-- Icon from Huge Icons by Hugeicons - undefined --><path
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="m3 21l7.548-7.548M21 3l-7.548 7.548m0 0L8 3H3l7.548 10.452m2.904-2.904L21 21h-5l-5.452-7.548"
						color="currentColor"
					/></svg
				>
			</a>
			<a href="https://neosahadeo.github.io/journal">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"
					><!-- Icon from IonIcons by Ben Sperry - https://github.com/ionic-team/ionicons/blob/main/LICENSE --><path
						d="M92.1 32C76.6 32 64 44.6 64 60.1V452c0 15.5 12.6 28.1 28.1 28.1H432c8.8 0 16-7.2 16-16s-7.2-16-16-16H112.5c-8.2 0-15.4-6-16.4-14.1-1.1-9.7 6.5-18 15.9-18h208V32H92.1z"
						fill="currentColor"
					/><path
						d="M432 416c8.8 0 16-7.2 16-16V60.1c0-15.5-12.6-28.1-28.1-28.1H368v384h64z"
						fill="currentColor"
					/></svg
				>
			</a>
		</div>
	</nav>
	<aside>
		<p>Palooza © {new Date().getFullYear()} - All right reserved by Neo Sahadeo</p>
	</aside>
</footer>
