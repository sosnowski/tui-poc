// Per-request configuration (params, headers, body) used by the editor pane,
// plus a canned response that we render in the response pane.

import type { RequestDetails, SampleResponse } from "./types";

export const REQUEST_DETAILS: Record<string, RequestDetails> = {
	r1: {
		method: "GET",
		url: "{{base_url}}/users",
		pathParams: [],
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
		pathParams: [{ key: "id", value: "7", enabled: true, desc: "from :id" }],
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
		pathParams: [],
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

export const SAMPLE_RESPONSE: SampleResponse = {
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
