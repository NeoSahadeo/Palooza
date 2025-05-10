<script lang="ts">
	import palooaza from '$lib/assets/paloozaLogo.png';

	import Socket from '$lib/compontents/socket.svelte';
	import Main from '$lib/compontents/main.svelte';
	import Footer from '$lib/compontents/footer.svelte';
</script>

<div class="hero bg-base-200 mt-10">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<img src={palooaza} alt="Palooza" />
			<h1 class="text-5xl font-bold">Palooza Tester</h1>
			<p class="py-6">
				A site to troubleshoot and provide basic tooling for the <a
					class="link link-primary"
					href="https://codeberg.org/NeoSahadeo/Palooza">Palooza</a
				> extension. Available soon!
			</p>
		</div>
	</div>
</div>

<Main />
<div class="divider"></div>
<Socket />
<div class="divider"></div>
<Footer />
