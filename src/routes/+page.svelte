<script lang="ts">
	import { onMount } from 'svelte';

	// palooza
	import Peer from 'peerjs';
	let id = $state('ba817084-b8c5-49aa-ada9-cd012e0df4bd');
	// const peer = new Peer();
	// peer.on('open', (e) => (id = e));

	function checkP() {
		console.log();
	}
</script>

<iframe
	width="800"
	height="540"
	src="https://www.youtube.com/embed/ql1SFKTLLMI"
	title="player"
	frameborder="0"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	referrerpolicy="strict-origin-when-cross-origin"
	allowfullscreen
></iframe>
