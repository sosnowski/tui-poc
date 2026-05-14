// Three main panels for TUI Postman.

const { useState: _us, useEffect: _ue, useRef: _ur, useMemo: _um } = React;

// ──────────────────────────────────────────────────────────────────────
// CollectionsPane (left)
// Tree view: collection > folder > requests
// ──────────────────────────────────────────────────────────────────────
function CollectionsPane({ collections, activeRequestId, onPick, focused, onFocus, env }) {
	const [collState, setCollState] = _us(() => {
		const o = {};
		collections.forEach((c) => {
			o[c.id] = c.expanded;
		});
		return o;
	});
	const [folderState, setFolderState] = _us(() => {
		const o = {};
		collections.forEach((c) =>
			c.folders.forEach((f) => {
				o[f.id] = f.expanded;
			}),
		);
		return o;
	});

	const toggleColl = (id) => setCollState((s) => ({ ...s, [id]: !s[id] }));
	const toggleFolder = (id) => setFolderState((s) => ({ ...s, [id]: !s[id] }));

	return (
		<Box title="collections" focused={focused} flex>
			<div className="pane" onClick={onFocus}>
				<div className="env-strip">
					<span className="dim">env </span>
					<span className="accent">◆ {env.name.toLowerCase()}</span>
					<span className="dim spacer">─ {env.vars.length} vars</span>
				</div>

				{collections.map((coll) => (
					<div key={coll.id}>
						<div className="tree-row coll" onClick={() => toggleColl(coll.id)}>
							<span className="tree-glyph">{collState[coll.id] ? "▾" : "▸"}</span>
							<span className="folder-icon"></span>
							<span className="tree-label">{coll.name}</span>
							<span className="tree-count">
								{coll.folders.reduce((a, f) => a + f.requests.length, 0)}
							</span>
						</div>

						{collState[coll.id] &&
							coll.folders.map((folder) => (
								<div key={folder.id}>
									<div
										className="tree-row folder"
										onClick={() => toggleFolder(folder.id)}
									>
										<span className="tree-indent">│ </span>
										<span className="tree-glyph">
											{folderState[folder.id] ? "▾" : "▸"}
										</span>
										<span className="folder-icon dim">▤</span>
										<span className="tree-label dim">{folder.name}/</span>
										<span className="tree-count">{folder.requests.length}</span>
									</div>

									{folderState[folder.id] &&
										folder.requests.map((req, idx) => {
											const last = idx === folder.requests.length - 1;
											const active = req.id === activeRequestId;
											return (
												<div
													key={req.id}
													className={`tree-row req ${active ? "active" : ""}`}
													onClick={() => onPick(req.id)}
												>
													<span className="tree-indent">│ │ </span>
													<span className="tree-branch">
														{last ? "└─" : "├─"}
													</span>
													<MethodTag method={req.method} />
													<span className="tree-label">{req.name}</span>
												</div>
											);
										})}
								</div>
							))}
					</div>
				))}

				<div className="pane-empty-line"></div>
				<div className="hint dim">
					─── press <kbd>n</kbd> to add request, <kbd>/</kbd> to search
				</div>
			</div>
		</Box>
	);
}

// ──────────────────────────────────────────────────────────────────────
// RequestEditor (top right) — URL bar + tabs (Params / Headers / Body / Auth)
// ──────────────────────────────────────────────────────────────────────
function RequestEditor({ request, focused, onFocus, onSend, sending, activeTab, onTabChange }) {
	const tabs = ["Params", "Headers", "Body", "Auth", "Tests"];
	return (
		<Box title="request" focused={focused} flex>
			<div className="pane" onClick={onFocus}>
				{/* URL bar */}
				<div className="url-row">
					<span className={`url-method method-${request.method.toLowerCase()}`}>
						{request.method}
					</span>
					<span className="url-input">
						<span className="url-text">{parseUrlForHighlight(request.url)}</span>
						<span className="cursor-blink">█</span>
					</span>
					<button
						className={`send-btn ${sending ? "sending" : ""}`}
						onClick={(e) => {
							e.stopPropagation();
							onSend();
						}}
						disabled={sending}
					>
						{sending ? "[ ⠿ sending ]" : "[ ▸ Send ]"}
						<span className="send-key dim"> ⌘↵</span>
					</button>
				</div>

				{/* Tabs */}
				<div className="tab-row">
					{tabs.map((t, i) => (
						<span
							key={t}
							className={`tab ${activeTab === t ? "active" : ""}`}
							onClick={() => onTabChange(t)}
						>
							<span className="tab-num dim">{i + 1}</span> {t}
							{t === "Params" &&
								request.params?.filter((p) => p.enabled).length > 0 && (
									<span className="tab-badge">
										{request.params.filter((p) => p.enabled).length}
									</span>
								)}
							{t === "Headers" &&
								request.headers?.filter((h) => h.enabled).length > 0 && (
									<span className="tab-badge">
										{request.headers.filter((h) => h.enabled).length}
									</span>
								)}
							{t === "Body" && request.body && <span className="tab-badge">●</span>}
						</span>
					))}
					<span className="tab-fill"></span>
				</div>

				{/* Tab content */}
				<div className="tab-content">
					{activeTab === "Params" && <ParamsEditor request={request} />}
					{activeTab === "Headers" && <HeadersEditor request={request} />}
					{activeTab === "Body" && <BodyEditor request={request} />}
					{activeTab === "Auth" && <AuthEditor />}
					{activeTab === "Tests" && <TestsEditor />}
				</div>
			</div>
		</Box>
	);
}

function parseUrlForHighlight(url) {
	// Highlight {{vars}} and :pathParams
	const parts = [];
	let i = 0;
	let key = 0;
	const re = /(\{\{[^}]+\}\})|(:[a-zA-Z_]\w*)/g;
	let m,
		last = 0;
	while ((m = re.exec(url)) !== null) {
		if (m.index > last) parts.push(<span key={key++}>{url.slice(last, m.index)}</span>);
		if (m[1])
			parts.push(
				<span key={key++} className="url-var">
					{m[1]}
				</span>,
			);
		else
			parts.push(
				<span key={key++} className="url-pathvar">
					{m[2]}
				</span>,
			);
		last = m.index + m[0].length;
	}
	if (last < url.length) parts.push(<span key={key++}>{url.slice(last)}</span>);
	return parts;
}

function ParamsEditor({ request }) {
	const params = request.params || [];
	if (params.length === 0) {
		return (
			<div className="empty-tab">
				─── no query params ─── press <kbd>a</kbd> to add
			</div>
		);
	}
	return (
		<div className="kv-table">
			<div className="kv-row kv-head">
				<span className="kv-check"> </span>
				<span className="kv-key">KEY</span>
				<span className="kv-val">VALUE</span>
				<span className="kv-desc">DESCRIPTION</span>
			</div>
			{params.map((p, i) => (
				<div key={i} className={`kv-row ${p.enabled ? "" : "disabled"}`}>
					<span className="kv-check">{p.enabled ? "[×]" : "[ ]"}</span>
					<span className="kv-key">{p.key}</span>
					<span className="kv-val">
						{p.value ? (
							renderValueWithVars(p.value)
						) : (
							<span className="placeholder">─</span>
						)}
					</span>
					<span className="kv-desc dim">{p.desc || ""}</span>
				</div>
			))}
			<div className="kv-row kv-add">
				<span className="kv-check">[ ]</span>
				<span className="kv-key placeholder">+ key</span>
				<span className="kv-val placeholder">value</span>
				<span className="kv-desc placeholder">description</span>
			</div>
		</div>
	);
}

function HeadersEditor({ request }) {
	const headers = request.headers || [];
	return (
		<div className="kv-table">
			<div className="kv-row kv-head">
				<span className="kv-check"> </span>
				<span className="kv-key">KEY</span>
				<span className="kv-val">VALUE</span>
			</div>
			{headers.map((h, i) => (
				<div key={i} className={`kv-row ${h.enabled ? "" : "disabled"}`}>
					<span className="kv-check">{h.enabled ? "[×]" : "[ ]"}</span>
					<span className="kv-key">{h.key}</span>
					<span className="kv-val">{renderValueWithVars(h.value)}</span>
				</div>
			))}
			<div className="kv-row kv-head sub">
				<span className="kv-check"> </span>
				<span className="kv-key dim" style={{ gridColumn: "2 / -1" }}>
					auto-generated (Host, User-Agent, Accept-Encoding…)
				</span>
			</div>
			<div className="kv-row disabled">
				<span className="kv-check">[×]</span>
				<span className="kv-key dim">Host</span>
				<span className="kv-val dim">jsonplaceholder.typicode.com</span>
			</div>
			<div className="kv-row disabled">
				<span className="kv-check">[×]</span>
				<span className="kv-key dim">User-Agent</span>
				<span className="kv-val dim">tuipostman/0.4.1</span>
			</div>
			<div className="kv-row disabled">
				<span className="kv-check">[×]</span>
				<span className="kv-key dim">Accept-Encoding</span>
				<span className="kv-val dim">gzip, deflate, br</span>
			</div>
		</div>
	);
}

function BodyEditor({ request }) {
	if (!request.body) {
		return (
			<div className="body-type-row">
				<span className="dim">body type:</span>
				<span className="opt active">[●] none</span>
				<span className="opt">[ ] form-data</span>
				<span className="opt">[ ] x-www-form-urlencoded</span>
				<span className="opt">[ ] raw / json</span>
				<span className="opt">[ ] binary</span>
			</div>
		);
	}
	return (
		<div>
			<div className="body-type-row">
				<span className="dim">body type:</span>
				<span className="opt">[ ] none</span>
				<span className="opt">[ ] form-data</span>
				<span className="opt active">[●] raw / json</span>
				<span className="opt">[ ] binary</span>
			</div>
			<pre className="json-block">{highlightJSON(JSON.parse(request.body))}</pre>
		</div>
	);
}

function AuthEditor() {
	return (
		<div className="auth-pane">
			<div className="auth-row">
				<span className="dim">type</span>
				<span className="opt">[ ] none</span>
				<span className="opt active">[●] bearer token</span>
				<span className="opt">[ ] basic</span>
				<span className="opt">[ ] api-key</span>
				<span className="opt">[ ] oauth2</span>
			</div>
			<div className="auth-field">
				<span className="dim">token</span>
				<span className="auth-token">{renderValueWithVars("{{api_token}}")}</span>
			</div>
			<div className="auth-resolved dim">
				<span>resolves to:</span>
				<span className="auth-token-resolved">
					{" "}
					Bearer stg_8f3a2c1b9e7d4f6a8c2e1b5d3f7a9c4e
				</span>
			</div>
		</div>
	);
}

function TestsEditor() {
	const code = `// runs after response received
pm.test("status is 200", () => {
  pm.expect(pm.response.code).to.equal(200);
});

pm.test("returns user object", () => {
  const j = pm.response.json();
  pm.expect(j).to.have.property("id");
  pm.expect(j.email).to.match(/.+@.+/);
});`;
	return <pre className="json-block">{code}</pre>;
}

function renderValueWithVars(value) {
	const parts = [];
	const re = /(\{\{[^}]+\}\})/g;
	let last = 0,
		m,
		key = 0;
	while ((m = re.exec(value)) !== null) {
		if (m.index > last) parts.push(<span key={key++}>{value.slice(last, m.index)}</span>);
		parts.push(
			<span key={key++} className="url-var">
				{m[1]}
			</span>,
		);
		last = m.index + m[0].length;
	}
	if (last < value.length) parts.push(<span key={key++}>{value.slice(last)}</span>);
	return parts;
}

// ──────────────────────────────────────────────────────────────────────
// ResponsePane (bottom right) — tabs Body / Headers / Cookies / Tests / Timeline
// ──────────────────────────────────────────────────────────────────────
function ResponsePane({ response, sending, focused, onFocus }) {
	const [tab, setTab] = _us("Body");

	if (sending) {
		return (
			<Box title="response" focused={focused} flex>
				<div className="pane sending-pane" onClick={onFocus}>
					<div className="spinner-wrap">
						<Spinner />
						<div className="dim">
							Sending GET request to{" "}
							<span className="accent">
								https://jsonplaceholder.typicode.com/users/7
							</span>
							…
						</div>
						<div className="dim small">
							─── press <kbd>esc</kbd> to cancel
						</div>
					</div>
				</div>
			</Box>
		);
	}

	if (!response) {
		return (
			<Box title="response" focused={focused} flex>
				<div className="pane" onClick={onFocus}>
					<div className="empty-state">
						<div className="dim small">┌──────────────────────────────────┐</div>
						<div className="dim small">│ No response yet. │</div>
						<div className="dim small">
							│ Press <span className="accent">⌘↵</span> or run{" "}
							<span className="accent">/send</span> to │
						</div>
						<div className="dim small">│ fire the active request. │</div>
						<div className="dim small">└──────────────────────────────────┘</div>
					</div>
				</div>
			</Box>
		);
	}

	const tabs = ["Body", "Headers", "Cookies", "Tests", "Timeline"];
	return (
		<Box title="response" focused={focused} flex>
			<div className="pane" onClick={onFocus}>
				{/* Status line */}
				<div className="resp-status">
					<StatusChip code={response.status} />
					<span className="resp-meta">
						<span className="dim">time </span>
						<span className="accent">{response.timeMs}ms</span>
						<span className="dim spacer"> · size </span>
						<span className="accent">{response.sizeBytes}B</span>
						<span className="dim spacer"> · </span>
						<span>{response.headers.find((h) => h.key === "content-type").value}</span>
					</span>
				</div>

				{/* Tabs */}
				<div className="tab-row">
					{tabs.map((t, i) => (
						<span
							key={t}
							className={`tab ${tab === t ? "active" : ""}`}
							onClick={() => setTab(t)}
						>
							<span className="tab-num dim">{i + 1}</span> {t}
							{t === "Headers" && (
								<span className="tab-badge">{response.headers.length}</span>
							)}
							{t === "Tests" && <span className="tab-badge ok">2/2</span>}
						</span>
					))}
					<span className="tab-fill"></span>
					<span className="tab dim sm">
						view: <span className="accent">pretty</span>
					</span>
				</div>

				{/* Tab content */}
				<div className="tab-content">
					{tab === "Body" && (
						<pre className="json-block scroll">{highlightJSON(response.body)}</pre>
					)}
					{tab === "Headers" && (
						<div className="kv-table">
							<div className="kv-row kv-head">
								<span className="kv-check"> </span>
								<span className="kv-key">KEY</span>
								<span className="kv-val">VALUE</span>
							</div>
							{response.headers.map((h, i) => (
								<div key={i} className="kv-row">
									<span className="kv-check dim">·</span>
									<span className="kv-key">{h.key}</span>
									<span className="kv-val">{h.value}</span>
								</div>
							))}
						</div>
					)}
					{tab === "Cookies" && (
						<div className="empty-tab dim">─── no cookies set ───</div>
					)}
					{tab === "Tests" && (
						<div className="tests-result">
							<div className="test-row pass">
								<span className="ok">✓ PASS</span> status is 200{" "}
								<span className="dim">· 0.4ms</span>
							</div>
							<div className="test-row pass">
								<span className="ok">✓ PASS</span> returns user object{" "}
								<span className="dim">· 1.1ms</span>
							</div>
							<div className="test-summary dim">
								── 2 passing, 0 failing, 0 skipped ──
							</div>
						</div>
					)}
					{tab === "Timeline" && (
						<div className="timeline">
							<TimelineRow label="DNS lookup" ms={12} pct={6} />
							<TimelineRow label="TCP handshake" ms={28} pct={15} />
							<TimelineRow label="TLS negotiation" ms={42} pct={23} />
							<TimelineRow label="Request sent" ms={3} pct={2} />
							<TimelineRow label="Waiting (TTFB)" ms={89} pct={48} />
							<TimelineRow label="Content download" ms={10} pct={6} />
							<div className="dim small" style={{ marginTop: "0.6em" }}>
								─── total: 184ms ───
							</div>
						</div>
					)}
				</div>
			</div>
		</Box>
	);
}

function TimelineRow({ label, ms, pct }) {
	const bar = "█".repeat(Math.max(1, Math.round(pct / 2)));
	return (
		<div className="tl-row">
			<span className="tl-label">{label.padEnd(18)}</span>
			<span className="tl-bar accent">{bar}</span>
			<span className="tl-ms dim">{ms}ms</span>
		</div>
	);
}

function Spinner() {
	const [frame, setFrame] = _us(0);
	_ue(() => {
		const id = setInterval(() => setFrame((f) => f + 1), 90);
		return () => clearInterval(id);
	}, []);
	const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	return <span className="spinner accent">{frames[frame % frames.length]}</span>;
}

Object.assign(window, {
	CollectionsPane,
	RequestEditor,
	ResponsePane,
	Spinner,
});
