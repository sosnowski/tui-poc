// Sample environments + their variables. The active env drives variable
// substitution in the URL bar / headers.

import type { Environment } from "./types";

export const ENVIRONMENTS: Environment[] = [
	{
		id: "local",
		name: "Local",
		active: false,
		vars: [
			{ key: "base_url", value: "http://localhost:3000", secret: false },
			{ key: "api_token", value: "dev-token-xxxx", secret: true },
		],
	},
	{
		id: "staging",
		name: "Staging",
		active: true,
		vars: [
			{ key: "base_url", value: "https://jsonplaceholder.typicode.com", secret: false },
			{ key: "api_token", value: "stg_8f3a2c1b9e7d4f6a8c2e1b5d3f7a9c4e", secret: true },
			{ key: "user_id", value: "7", secret: false },
			{ key: "tenant", value: "acme-corp", secret: false },
		],
	},
	{
		id: "prod",
		name: "Production",
		active: false,
		vars: [
			{ key: "base_url", value: "https://api.example.com", secret: false },
			{ key: "api_token", value: "prd_xxxxxxxxxxxxxxxxx", secret: true },
		],
	},
];
