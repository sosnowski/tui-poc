// Sample data for TUI Postman

const COLLECTIONS = [
	{
		id: "jsonph",
		name: "JSONPlaceholder",
		expanded: true,
		folders: [
			{
				id: "users",
				name: "users",
				expanded: true,
				requests: [
					{ id: "r1", method: "GET", name: "List users", url: "{{base_url}}/users" },
					{
						id: "r2",
						method: "GET",
						name: "Get user by id",
						url: "{{base_url}}/users/:id",
					},
					{ id: "r3", method: "POST", name: "Create user", url: "{{base_url}}/users" },
					{
						id: "r4",
						method: "PATCH",
						name: "Update user",
						url: "{{base_url}}/users/:id",
					},
					{
						id: "r5",
						method: "DELETE",
						name: "Delete user",
						url: "{{base_url}}/users/:id",
					},
				],
			},
			{
				id: "posts",
				name: "posts",
				expanded: true,
				requests: [
					{ id: "r6", method: "GET", name: "List posts", url: "{{base_url}}/posts" },
					{ id: "r7", method: "GET", name: "Get post", url: "{{base_url}}/posts/:id" },
					{ id: "r8", method: "POST", name: "Create post", url: "{{base_url}}/posts" },
					{
						id: "r9",
						method: "GET",
						name: "Comments on post",
						url: "{{base_url}}/posts/:id/comments",
					},
				],
			},
			{
				id: "albums",
				name: "albums",
				expanded: false,
				requests: [
					{ id: "r10", method: "GET", name: "List albums", url: "{{base_url}}/albums" },
					{ id: "r11", method: "GET", name: "Get album", url: "{{base_url}}/albums/:id" },
				],
			},
		],
	},
	{
		id: "internal",
		name: "Internal Services",
		expanded: true,
		folders: [
			{
				id: "auth",
				name: "auth",
				expanded: false,
				requests: [
					{ id: "r12", method: "POST", name: "Login", url: "{{base_url}}/auth/login" },
					{
						id: "r13",
						method: "POST",
						name: "Refresh",
						url: "{{base_url}}/auth/refresh",
					},
				],
			},
			{
				id: "billing",
				name: "billing",
				expanded: false,
				requests: [
					{
						id: "r14",
						method: "GET",
						name: "Invoices",
						url: "{{base_url}}/billing/invoices",
					},
					{
						id: "r15",
						method: "POST",
						name: "Create invoice",
						url: "{{base_url}}/billing/invoices",
					},
				],
			},
		],
	},
	{
		id: "scratch",
		name: "Scratchpad",
		expanded: false,
		folders: [
			{
				id: "misc",
				name: "misc",
				expanded: false,
				requests: [
					{
						id: "r16",
						method: "GET",
						name: "Health check",
						url: "https://httpbin.org/get",
					},
				],
			},
		],
	},
];

// Detailed config for the focused request (r2: GET user by id)
const REQUEST_DETAILS = {
	r1: {
		method: "GET",
		url: "{{base_url}}/users",
		params: [
			{ key: "_limit", value: "20", enabled: true, desc: "page size" },
			{ key: "_page", value: "1", enabled: true, desc: "page number" },
			{ key: "q", value: "", enabled: false, desc: "search query" },
		],
		headers: [
			{ key: "Accept", value: "application/json", enabled: true },
			{ key: "Authorization", value: "Bearer {{api_token}}", enabled: true },
		],
		body: null,
		bodyType: "none",
	},
	r2: {
		method: "GET",
		url: "{{base_url}}/users/:id",
		pathVars: [{ key: "id", value: "7" }],
		params: [
			{ key: "include", value: "address,company", enabled: true, desc: "expand related" },
		],
		headers: [
			{ key: "Accept", value: "application/json", enabled: true },
			{ key: "Authorization", value: "Bearer {{api_token}}", enabled: true },
			{ key: "X-Request-Id", value: "{{$randomUUID}}", enabled: true },
		],
		body: null,
		bodyType: "none",
	},
	r3: {
		method: "POST",
		url: "{{base_url}}/users",
		params: [],
		headers: [
			{ key: "Content-Type", value: "application/json", enabled: true },
			{ key: "Authorization", value: "Bearer {{api_token}}", enabled: true },
		],
		body: `{
  "name": "Ada Lovelace",
  "email": "ada@analyticalengine.org",
  "username": "alovelace",
  "address": {
    "city": "London",
    "zipcode": "WC1E"
  }
}`,
		bodyType: "json",
	},
};

// Sample response for the GET user by id call
const SAMPLE_RESPONSE = {
	status: 200,
	statusText: "OK",
	timeMs: 184,
	sizeBytes: 612,
	headers: [
		{ key: "content-type", value: "application/json; charset=utf-8" },
		{ key: "cache-control", value: "max-age=43200" },
		{ key: "x-ratelimit-remaining", value: "4982" },
		{ key: "x-ratelimit-limit", value: "5000" },
		{ key: "x-powered-by", value: "Express" },
		{ key: "cf-ray", value: "8c4a1f3e9b2d-LHR" },
		{ key: "server", value: "cloudflare" },
	],
	body: {
		id: 7,
		name: "Kurtis Weissnat",
		username: "Elwyn.Skiles",
		email: "Telly.Hoeger@billy.biz",
		phone: "210.067.6132",
		website: "elvis.io",
		address: {
			street: "Rex Trail",
			suite: "Suite 280",
			city: "Howemouth",
			zipcode: "58804-1099",
			geo: { lat: "24.8918", lng: "21.8984" },
		},
		company: {
			name: "Johns Group",
			catchPhrase: "Configurable multimedia task-force",
			bs: "generate enterprise e-tailers",
		},
		tags: ["beta", "premium", "verified"],
		active: true,
		createdAt: "2023-04-12T08:31:20Z",
	},
};

const ENVIRONMENTS = [
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

const HISTORY = [
	{
		id: "h1",
		method: "GET",
		url: "{{base_url}}/users/7",
		status: 200,
		timeMs: 184,
		when: "12:42:08",
	},
	{
		id: "h2",
		method: "GET",
		url: "{{base_url}}/users",
		status: 200,
		timeMs: 211,
		when: "12:41:55",
	},
	{
		id: "h3",
		method: "POST",
		url: "{{base_url}}/posts",
		status: 201,
		timeMs: 342,
		when: "12:38:12",
	},
	{
		id: "h4",
		method: "GET",
		url: "{{base_url}}/posts/1/comments",
		status: 200,
		timeMs: 156,
		when: "12:35:01",
	},
	{
		id: "h5",
		method: "DELETE",
		url: "{{base_url}}/users/12",
		status: 204,
		timeMs: 98,
		when: "12:30:44",
	},
	{
		id: "h6",
		method: "PATCH",
		url: "{{base_url}}/users/3",
		status: 422,
		timeMs: 124,
		when: "12:28:19",
	},
	{
		id: "h7",
		method: "GET",
		url: "{{base_url}}/users/999",
		status: 404,
		timeMs: 87,
		when: "12:25:03",
	},
	{
		id: "h8",
		method: "POST",
		url: "{{base_url}}/auth/login",
		status: 200,
		timeMs: 412,
		when: "12:20:11",
	},
	{
		id: "h9",
		method: "GET",
		url: "{{base_url}}/albums",
		status: 200,
		timeMs: 167,
		when: "12:18:32",
	},
	{
		id: "h10",
		method: "GET",
		url: "{{base_url}}/billing/invoices",
		status: 500,
		timeMs: 1024,
		when: "12:14:09",
	},
];

const COMMANDS = [
	{ cmd: "/send", desc: "Send the active request", hint: "↵" },
	{ cmd: "/save", desc: "Save changes to active request", hint: "⌘s" },
	{ cmd: "/new", desc: "Create a new request", hint: "n" },
	{ cmd: "/duplicate", desc: "Duplicate active request", hint: "d" },
	{ cmd: "/rename", desc: "Rename active request", hint: "r" },
	{ cmd: "/delete", desc: "Delete active request", hint: "x" },
	{ cmd: "/env", desc: "Open environment manager", hint: "e" },
	{ cmd: "/history", desc: "Open request history", hint: "h" },
	{ cmd: "/auth", desc: "Configure auth (Bearer, Basic, OAuth2)", hint: "a" },
	{ cmd: "/headers", desc: "Jump to headers tab", hint: "2" },
	{ cmd: "/body", desc: "Jump to body tab", hint: "3" },
	{ cmd: "/params", desc: "Jump to query params tab", hint: "1" },
	{ cmd: "/copy curl", desc: "Copy request as curl command", hint: "" },
	{ cmd: "/copy fetch", desc: "Copy request as JS fetch()", hint: "" },
	{ cmd: "/import", desc: "Import OpenAPI / Postman collection", hint: "" },
	{ cmd: "/export", desc: "Export collection to file", hint: "" },
	{ cmd: "/theme", desc: "Cycle color theme", hint: "" },
	{ cmd: "/quit", desc: "Quit TUI Postman", hint: "⌘q" },
];

window.TUIDATA = {
	COLLECTIONS,
	REQUEST_DETAILS,
	SAMPLE_RESPONSE,
	ENVIRONMENTS,
	HISTORY,
	COMMANDS,
};
