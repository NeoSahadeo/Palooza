export const PRODUCTION = false;

let client_status = $state('offline');

export function set_client_status(value: string) {
	client_status = value;
}

export function get_client_status() {
	return client_status;
}
