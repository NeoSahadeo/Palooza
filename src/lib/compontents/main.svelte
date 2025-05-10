<script lang="ts">
	import { Palooza } from '$lib/main';
	import { set_client_status, get_client_status } from '$lib/state.svelte';

	let client = $state<Palooza>();
	let id = $state<null | undefined | string>(null);
	let loading = $state(false);

	let messages = $state<string[]>([]);

	async function toggle_client() {
		if (id) {
			await client!.kill_session();
			id = null;
			set_client_status('offline');
		} else {
			loading = true;

			// Create Palooza
			client = new Palooza();
			// client.addEventListener('offer', (e) => {
			// 	console.log(e);
			// });

			id = await client.create_session();
			client.signal?.addEventListener('message', (e) => {
				id = client?.room_id;
			});
			set_client_status('online');
			loading = false;
		}
	}
</script>

<div class="pl-2">
	<div class="grid grid-rows-3 gap-2">
		<div class="flex flex-row items-center gap-3">
			Client Status:
			{#if get_client_status() === 'offline'}
				<div class="inline-grid *:[grid-area:1/1]">
					<div class="status status-error animate-ping"></div>
					<div class="status status-error"></div>
				</div>
			{:else}
				<div class="inline-grid *:[grid-area:1/1]">
					<div class="status status-success animate-ping"></div>
					<div class="status status-success"></div>
				</div>
			{/if}
			{get_client_status()}
		</div>
		<button
			class="btn btn-accent btn-outline max-w-min text-nowrap"
			value={id}
			onclick={() => {
				navigator.clipboard.writeText(id ? id : '');
			}}
		>
			ID: {id}
		</button>
		<button
			onclick={toggle_client}
			class={`btn  max-w-min text-nowrap ${id ? 'btn-secondary' : 'btn-primary'} `}
			disabled={loading}
		>
			{#if id}
				Kill Client
			{:else}
				Activate Client
			{/if}
		</button>
	</div>
	{messages}
</div>
