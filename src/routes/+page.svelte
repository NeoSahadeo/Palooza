<script lang="ts">
	import { onMount } from 'svelte';

	// palooza
	import Peer, { type DataConnection } from 'peerjs';

	let client = $state<Peer>();
	let client_id = $state<string>('not set');
	let conn_client = $state<any>();

	let peer_id_add = $state<string>();
	let active_connections = $state<
		{
			id: string;
			conn: DataConnection;
		}[]
	>([]);
	let messages = $state<string[]>([]);

	let message_content = $state<string>('');

	function create_client() {
		client = new Peer();
		client.on('open', (id) => (client_id = id));
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
			active_connections = active_connections.filter((e, index) => {
				if (e.id === id) {
					return false;
				}
				return true;
			});
		}
		messages.push(data);
	}

	function open_connection() {
		if (!client || client!.id === peer_id_add) {
			return;
		}

		let exists = false;
		active_connections.forEach((e) => {
			if (e.id === peer_id_add) {
				exists = true;
			}
		});
		if (exists) return;

		const conn = client.connect(peer_id_add as string);
		conn.on('open', function () {
			conn.on('data', receive_message);
			active_connections.push({
				id: peer_id_add as string,
				conn: conn
			});
			peer_id_add = '';

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
			e.conn.send(output);
		});
		message_content = '';
	}

	function close_connection() {
		active_connections = active_connections.filter((e, index) => {
			if (e.id === this.value) {
				send_message(`cid:${client!.id}`);
				e.conn.close();
				return false;
			}
			return true;
		});
	}
</script>

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold">Palooza Tester</h1>
			<p class="py-6">
				A site to troubleshoot and provide basic tooling for the <a
					class="link link-primary"
					href="#">Palooza</a
				> extension. Available soon!
			</p>
			<p>
				Theme by <a
					class="link link-secondary"
					href="https://www.linkedin.com/in/uveer-madho-824ba21a2/">Uveer Madho</a
				>
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
		{#if client}
			<button onclick={close_client} class="btn btn-secondary"> Close Client</button>
			<div class="inline-grid *:[grid-area:1/1]">
				<div class="status status-success animate-ping"></div>
				<div class="status status-success"></div>
			</div>
			Client running
		{:else}
			<button onclick={create_client} class="btn btn-primary"> Activate Client</button>
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
						<td>{index}</td>
						<td>{value.id}</td>
						<td
							><button value={value.id} onclick={close_connection} class="btn btn-secondary"
								>Close Connection</button
							></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<span class="flex flex-row gap-2">
		<input bind:value={peer_id_add} class="input" type="text" placeholder="Peer ID" />
		<button onclick={open_connection} class={`btn ${client ? 'btn-primary' : 'btn-disabled'}`}
			>Open Connection</button
		>
	</span>

	<div class="flex w-full flex-col">
		<div class="divider"></div>
	</div>
	<h2 class=" text-lg font-bold">Messenger</h2>
	<div class="max-h-40 min-h-40 overflow-scroll rounded bg-black">
		{#each messages as value}
			<div class="chat-bubble my-1">{value}</div>
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
			onclick={send_message}
			class={`btn ${client ? 'btn-primary' : 'btn-disabled'} text-nowrap`}
			>Send Message
		</button>
	</div>
</div>
