export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface KV {
	key: string;
	value: string;
	enabled?: boolean;
	desc?: string;
}

export interface Request {
	id: string;
	method: HttpMethod;
	name: string;
	url: string;
}

export interface Collection {
	id: string;
	name: string;
	expanded: boolean;
	children: Collection[];
	requests: Request[];
}

export type BodyType = "none" | "json" | "form" | "form-urlencoded" | "binary";

export interface BinaryFile {
	name: string;
	path: string;
	sizeBytes?: number;
}

export type FormDataValueType = "text" | "file";

export interface FormDataField {
	key: string;
	enabled?: boolean;
	valueType: FormDataValueType;
	textValue: string;
	file: BinaryFile | null;
}

export interface Preset {
	pathParams: KV[];
	params: KV[];
	headers: KV[];
	body: string | null;
	bodyType: BodyType;
	formUrlEncoded: KV[];
	formData: FormDataField[];
	binaryFile: BinaryFile | null;
}

export interface RequestDetails {
	method: HttpMethod;
	url: string;
	pathParams: KV[];
	params: KV[];
	headers: KV[];
	body: string | null;
	bodyType: BodyType;
	formUrlEncoded: KV[];
	formData: FormDataField[];
	binaryFile: BinaryFile | null;
}

export interface RequestFile {
	name: string;
	method: HttpMethod;
	url: string;
	presets: Record<string, Preset>;
}

export interface ResponseHeader {
	key: string;
	value: string;
}

export interface SampleResponse {
	status: number;
	statusText: string;
	timeMs: number;
	sizeBytes: number;
	headers: ResponseHeader[];
	body: unknown;
}

export interface EnvVar {
	key: string;
	value: string;
	secret: boolean;
}

export interface Environment {
	id: string;
	name: string;
	active: boolean;
	vars: EnvVar[];
}

export interface HistoryEntry {
	id: string;
	method: HttpMethod;
	url: string;
	status: number;
	timeMs: number;
	when: string;
}

export interface Command {
	cmd: string;
	desc: string;
	hint: string;
}
