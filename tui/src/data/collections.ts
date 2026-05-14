import type { Collection } from "./types";

export const COLLECTIONS: Collection[] = [
	{
		id: "jsonph",
		name: "JSONPlaceholder",
		expanded: true,
		children: [
			{
				id: "users",
				name: "users",
				expanded: true,
				children: [],
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
				children: [],
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
				children: [],
				requests: [
					{ id: "r10", method: "GET", name: "List albums", url: "{{base_url}}/albums" },
					{ id: "r11", method: "GET", name: "Get album", url: "{{base_url}}/albums/:id" },
				],
			},
		],
		requests: [],
	},
	{
		id: "internal",
		name: "Internal Services",
		expanded: true,
		children: [
			{
				id: "auth",
				name: "auth",
				expanded: false,
				children: [],
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
				children: [],
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
		requests: [],
	},
	{
		id: "scratch",
		name: "Scratchpad",
		expanded: false,
		children: [
			{
				id: "misc",
				name: "misc",
				expanded: false,
				children: [],
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
		requests: [],
	},
];
