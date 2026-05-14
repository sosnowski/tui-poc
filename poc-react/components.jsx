// Shared low-level components for TUI Postman.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Method tag (colored 4-7 char chip)
function MethodTag({ method, dim = false }) {
	const m = method.toUpperCase();
	const cls = `method method-${m.toLowerCase()}` + (dim ? " dim" : "");
	// Pad to 6 chars so columns align in the list
	const padded = m.padEnd(6, "\u00A0");
	return <span className={cls}>{padded}</span>;
}

// Status code chip
function StatusChip({ code }) {
	let kind = "ok";
	if (code >= 500) kind = "err";
	else if (code >= 400) kind = "err";
	else if (code >= 300) kind = "warn";
	else if (code >= 200) kind = "ok";
	const text =
		{
			200: "200 OK",
			201: "201 Created",
			204: "204 No Content",
			301: "301 Moved",
			302: "302 Found",
			400: "400 Bad Request",
			401: "401 Unauthorized",
			403: "403 Forbidden",
			404: "404 Not Found",
			422: "422 Unprocessable",
			429: "429 Too Many",
			500: "500 Server Error",
			502: "502 Bad Gateway",
			503: "503 Unavailable",
		}[code] || `${code}`;
	return <span className={`status status-${kind}`}>● {text}</span>;
}

// Box border using single-line drawing chars. Title sits inline on top.
function Box({
	title,
	children,
	accent = false,
	focused = false,
	footer = null,
	className = "",
	flex = false,
}) {
	return (
		<div
			className={`box ${focused ? "focused" : ""} ${accent ? "accent" : ""} ${className}`}
			style={
				flex
					? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
					: undefined
			}
		>
			<div className="box-top">
				<span className="box-corner">┌─</span>
				{title && <span className="box-title"> {title} </span>}
				<span className="box-line">{"─".repeat(400)}</span>
				<span className="box-corner">─┐</span>
			</div>
			<div className="box-body" style={flex ? { flex: 1, minHeight: 0 } : undefined}>
				<span className="box-side">│</span>
				<div className="box-content">{children}</div>
				<span className="box-side">│</span>
			</div>
			{footer && (
				<div className="box-foot-extra">
					<span className="box-side">│</span>
					<div className="box-content">{footer}</div>
					<span className="box-side">│</span>
				</div>
			)}
			<div className="box-bot">
				<span className="box-corner">└─</span>
				<span className="box-line">{"─".repeat(400)}</span>
				<span className="box-corner">─┘</span>
			</div>
		</div>
	);
}

// JSON syntax highlighter (returns array of spans)
function highlightJSON(value, indent = 0) {
	const out = [];
	const pad = (n) => "  ".repeat(n);
	let key = 0;
	const push = (cls, text) =>
		out.push(
			<span key={key++} className={cls}>
				{text}
			</span>,
		);

	function walk(v, depth, trailingComma = false) {
		if (v === null) {
			push("j-null", "null");
		} else if (typeof v === "boolean") {
			push("j-bool", String(v));
		} else if (typeof v === "number") {
			push("j-num", String(v));
		} else if (typeof v === "string") {
			push("j-str", JSON.stringify(v));
		} else if (Array.isArray(v)) {
			if (v.length === 0) {
				push("j-punct", "[]");
			} else {
				push("j-punct", "[\n");
				v.forEach((item, i) => {
					push("j-plain", pad(depth + 1));
					walk(item, depth + 1, i < v.length - 1);
					push("j-plain", "\n");
				});
				push("j-plain", pad(depth));
				push("j-punct", "]");
			}
		} else if (typeof v === "object") {
			const keys = Object.keys(v);
			if (keys.length === 0) {
				push("j-punct", "{}");
			} else {
				push("j-punct", "{\n");
				keys.forEach((k, i) => {
					push("j-plain", pad(depth + 1));
					push("j-key", JSON.stringify(k));
					push("j-punct", ": ");
					walk(v[k], depth + 1, i < keys.length - 1);
					push("j-plain", "\n");
				});
				push("j-plain", pad(depth));
				push("j-punct", "}");
			}
		}
		if (trailingComma) push("j-punct", ",");
	}
	walk(value, indent);
	return out;
}

// Simple keybinding pill for footer
function Key({ k, label }) {
	return (
		<span className="kb">
			<span className="kb-key">{k}</span>
			<span className="kb-label">{label}</span>
		</span>
	);
}

Object.assign(window, {
	MethodTag,
	StatusChip,
	Box,
	highlightJSON,
	Key,
});
