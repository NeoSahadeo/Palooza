<script lang="ts">
	import { SignalService } from '$lib/main';

	let socket_conn_status = $state(false);
	let message_content = $state('');
	let socket_endpoint = $state('ws://0.0.0.0:25565/');
	let room_id = $state('');
	let ext_room_id = $state('');

	let signal = $state<SignalService>(new SignalService());

	signal.addEventListener('message', (message) => {
		const data = JSON.parse(message.data);
		console.log(data);
		if (data.message) {
			data.message;
			return;
		}

		if (data.room_id) {
			room_id = data.room_id;
			ext_room_id = data.room_id;
			return;
		}
		if (data.connected === true) {
			socket_conn_status = true;
			return;
		}
	});

	async function generate_room() {
		signal.generate_room('Steins;Gate');
	}

	async function send_message() {
		signal?.socket?.send(
			JSON.stringify({
				room_id: ext_room_id,
				message: message_content
			})
		);
		message_content = '';
	}

	async function join_room() {
		if (signal) {
			signal.join_room(ext_room_id);
		}
	}
</script>

<div class="pl-2">
	<h1 class="mb-3 text-xl">Test Signalling Server</h1>
	<div class="flex flex-col gap-3">
		<h2>
			<span class="font-bold">Current ID: </span>
			{#if room_id}
				{room_id}
			{:else}
				Not Connected
			{/if}
		</h2>
		<button class={`btn  btn-primary mt-2 max-w-min text-nowrap`} onclick={generate_room}
			>Generate Room ID</button
		>

		<h2 class="text-lg">Join Room</h2>
		<input
			type="text"
			class={`input input-primary`}
			bind:value={ext_room_id}
			onkeypress={(e) => {
				if (e.key === 'Enter') {
					join_room();
				}
			}}
		/>
		<button class={`btn  btn-primary max-w-min text-nowrap `} onclick={join_room}>Join</button>

		<h2 class="text-lg">Web Socket</h2>
		<input
			type="text"
			class={`input input-primary`}
			bind:value={socket_endpoint}
			disabled={!socket_conn_status}
		/>
		<h2 class="text-lg">Message</h2>
		<input
			type="text"
			class={`input input-primary`}
			bind:value={message_content}
			onkeypress={(e) => {
				if (e.key === 'Enter') {
					send_message();
				}
			}}
			disabled={!socket_conn_status}
		/>
		<button
			class={`btn  max-w-min text-nowrap ${socket_conn_status ? 'btn-primary ' : 'btn-disabled'}`}
			onclick={send_message}>Send</button
		>
		<!-- <h2 class="text-lg">Ping Server</h2> -->
		<!-- <button -->
		<!-- 	class={`btn  max-w-min text-nowrap ${socket_conn_status ? 'btn-primary ' : ''}`} -->
		<!-- 	onclick={create_heartbeat}>Start Heartbeat</button -->
		<!-- > -->
	</div>
</div>
