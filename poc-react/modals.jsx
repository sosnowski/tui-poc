// Modal overlays for TUI Postman: command palette, environment manager, history, splash.

const { useState: _ms, useEffect: _me, useRef: _mr } = React;

// ──────────────────────────────────────────────────────────────────────
// CommandPalette — slash-command modal
// ──────────────────────────────────────────────────────────────────────
function CommandPalette({ commands, onClose, onRun }) {
	const [query, setQuery] = _ms("");
	const [idx, setIdx] = _ms(0);
	const inputRef = _mr(null);

	_me(() => {
		inputRef.current?.focus();
	}, []);

	const filtered = commands.filter(
		(c) =>
			c.cmd.toLowerCase().includes(query.toLowerCase()) ||
			c.desc.toLowerCase().includes(query.toLowerCase()),
	);

	_me(() => {
		setIdx(0);
	}, [query]);

	const handleKey = (e) => {
		if (e.key === "Escape") onClose();
		if (e.key === "ArrowDown") {
			setIdx((i) => Math.min(filtered.length - 1, i + 1));
			e.preventDefault();
		}
		if (e.key === "ArrowUp") {
			setIdx((i) => Math.max(0, i - 1));
			e.preventDefault();
		}
		if (e.key === "Enter") {
			onRun(filtered[idx]);
			onClose();
		}
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal cmd-palette" onClick={(e) => e.stopPropagation()}>
				<Box title="command palette" accent focused>
					<div className="cmd-input-row">
						<span className="cmd-prompt accent">/</span>
						<input
							ref={inputRef}
							className="cmd-input"
							value={query}
							placeholder="type a command or search…"
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={handleKey}
						/>
						<span className="cursor-blink">█</span>
					</div>
					<div className="cmd-divider">{"─".repeat(120)}</div>
					<div className="cmd-list">
						{filtered.length === 0 && (
							<div className="dim cmd-empty">─── no matching commands ───</div>
						)}
						{filtered.map((c, i) => (
							<div
								key={c.cmd}
								className={`cmd-row ${i === idx ? "selected" : ""}`}
								onMouseEnter={() => setIdx(i)}
								onClick={() => {
									onRun(c);
									onClose();
								}}
							>
								<span className="cmd-arrow">{i === idx ? "▸" : " "}</span>
								<span className="cmd-name accent">{c.cmd}</span>
								<span className="cmd-desc dim">{c.desc}</span>
								<span className="cmd-hint dim">{c.hint}</span>
							</div>
						))}
					</div>
					<div className="cmd-foot dim">
						<span>
							<kbd>↑↓</kbd> navigate
						</span>
						<span>
							<kbd>↵</kbd> run
						</span>
						<span>
							<kbd>esc</kbd> close
						</span>
						<span className="spacer">
							{filtered.length} of {commands.length}
						</span>
					</div>
				</Box>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────
// EnvironmentManager — modal listing envs + variables
// ──────────────────────────────────────────────────────────────────────
function EnvironmentManager({ environments, onClose, onActivate }) {
	const [selected, setSelected] = _ms(
		environments.find((e) => e.active)?.id || environments[0].id,
	);
	const env = environments.find((e) => e.id === selected);

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal env-mgr" onClick={(e) => e.stopPropagation()}>
				<Box title="environment manager" accent focused>
					<div className="env-grid">
						<div className="env-list">
							<div className="dim small">ENVIRONMENTS</div>
							{environments.map((e) => (
								<div
									key={e.id}
									className={`env-list-row ${selected === e.id ? "selected" : ""}`}
									onClick={() => setSelected(e.id)}
								>
									<span className="env-list-icon">
										{e.active ? <span className="accent">◆</span> : "◇"}
									</span>
									<span className="env-list-name">{e.name}</span>
									{e.active && (
										<span className="env-list-active accent small">active</span>
									)}
								</div>
							))}
							<div className="env-list-row add dim">
								<span className="env-list-icon">+</span>
								<span className="env-list-name">new environment…</span>
							</div>
						</div>

						<div className="env-detail">
							<div className="env-detail-head">
								<span className="dim small">VARIABLES IN</span>
								<span className="accent" style={{ marginLeft: "0.6em" }}>
									{env.name}
								</span>
								{!env.active && (
									<button
										className="env-activate-btn"
										onClick={() => onActivate(env.id)}
									>
										[ activate ]
									</button>
								)}
							</div>
							<div className="kv-table env-vars">
								<div className="kv-row kv-head">
									<span className="kv-key">KEY</span>
									<span className="kv-val">VALUE</span>
									<span className="kv-desc">TYPE</span>
								</div>
								{env.vars.map((v, i) => (
									<div key={i} className="kv-row">
										<span className="kv-key">{v.key}</span>
										<span className="kv-val">
											{v.secret ? (
												<span className="dim">●●●●●●●●●●●●●●●●●●</span>
											) : (
												v.value
											)}
										</span>
										<span className="kv-desc dim">
											{v.secret ? "secret" : "string"}
										</span>
									</div>
								))}
								<div className="kv-row kv-add">
									<span className="kv-key placeholder">+ add variable</span>
									<span className="kv-val placeholder">value</span>
									<span className="kv-desc placeholder">string</span>
								</div>
							</div>
						</div>
					</div>
					<div className="cmd-foot dim">
						<span>
							<kbd>j/k</kbd> navigate
						</span>
						<span>
							<kbd>a</kbd> activate
						</span>
						<span>
							<kbd>e</kbd> edit
						</span>
						<span>
							<kbd>esc</kbd> close
						</span>
					</div>
				</Box>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────
// HistoryModal
// ──────────────────────────────────────────────────────────────────────
function HistoryModal({ history, onClose }) {
	const [idx, setIdx] = _ms(0);
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal history-modal" onClick={(e) => e.stopPropagation()}>
				<Box title="request history" accent focused>
					<div className="history-head dim">
						<span style={{ width: "8ch" }}>WHEN</span>
						<span style={{ width: "8ch" }}>METHOD</span>
						<span style={{ flex: 1 }}>URL</span>
						<span style={{ width: "10ch" }}>STATUS</span>
						<span style={{ width: "8ch", textAlign: "right" }}>TIME</span>
					</div>
					<div className="cmd-divider">{"─".repeat(120)}</div>
					{history.map((h, i) => (
						<div
							key={h.id}
							className={`history-row ${i === idx ? "selected" : ""}`}
							onMouseEnter={() => setIdx(i)}
						>
							<span className="cmd-arrow">{i === idx ? "▸" : " "}</span>
							<span className="hist-when dim" style={{ width: "8ch" }}>
								{h.when}
							</span>
							<span style={{ width: "8ch" }}>
								<MethodTag method={h.method} />
							</span>
							<span className="hist-url" style={{ flex: 1 }}>
								{h.url}
							</span>
							<span style={{ width: "10ch" }}>
								<span
									className={`status-mini ${h.status >= 400 ? "err" : h.status >= 300 ? "warn" : "ok"}`}
								>
									{h.status}
								</span>
							</span>
							<span className="dim" style={{ width: "8ch", textAlign: "right" }}>
								{h.timeMs}ms
							</span>
						</div>
					))}
					<div className="cmd-foot dim">
						<span>
							<kbd>↑↓</kbd> navigate
						</span>
						<span>
							<kbd>↵</kbd> replay
						</span>
						<span>
							<kbd>s</kbd> save to collection
						</span>
						<span>
							<kbd>esc</kbd> close
						</span>
					</div>
				</Box>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────
// Splash
// ──────────────────────────────────────────────────────────────────────
const ASCII_LOGO = String.raw`
  ████████╗██╗   ██╗██╗    ██████╗  ██████╗ ███████╗████████╗███╗   ███╗ █████╗ ███╗   ██╗
  ╚══██╔══╝██║   ██║██║    ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║
     ██║   ██║   ██║██║    ██████╔╝██║   ██║███████╗   ██║   ██╔████╔██║███████║██╔██╗ ██║
     ██║   ██║   ██║██║    ██╔═══╝ ██║   ██║╚════██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║
     ██║   ╚██████╔╝██║    ██║     ╚██████╔╝███████║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║
     ╚═╝    ╚═════╝ ╚═╝    ╚═╝      ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`;

function Splash({ onDismiss }) {
	return (
		<div className="modal-backdrop splash-bg" onClick={onDismiss}>
			<div className="splash-inner" onClick={(e) => e.stopPropagation()}>
				<pre className="splash-logo accent">{ASCII_LOGO}</pre>
				<div className="splash-tagline dim">a postman in your terminal · v0.4.1</div>

				<div className="splash-grid">
					<div className="splash-col">
						<div className="splash-col-head dim">START</div>
						<div className="splash-row">
							<span className="accent">⏎</span>{" "}
							<span>
								open last collection <span className="dim">JSONPlaceholder</span>
							</span>
						</div>
						<div className="splash-row">
							<span className="accent">n</span> <span>new request</span>
						</div>
						<div className="splash-row">
							<span className="accent">o</span>{" "}
							<span>open collection from file…</span>
						</div>
						<div className="splash-row">
							<span className="accent">i</span> <span>import OpenAPI / Postman</span>
						</div>
					</div>
					<div className="splash-col">
						<div className="splash-col-head dim">RECENT</div>
						<div className="splash-row dim">today · users/7</div>
						<div className="splash-row dim">today · posts</div>
						<div className="splash-row dim">y'day · auth/login</div>
						<div className="splash-row dim">2d ago · billing/invoices</div>
					</div>
					<div className="splash-col">
						<div className="splash-col-head dim">HELP</div>
						<div className="splash-row">
							<span className="accent">/</span> <span>command palette</span>
						</div>
						<div className="splash-row">
							<span className="accent">?</span> <span>keybinding cheatsheet</span>
						</div>
						<div className="splash-row">
							<span className="accent">e</span> <span>environment manager</span>
						</div>
						<div className="splash-row">
							<span className="accent">h</span> <span>history</span>
						</div>
					</div>
				</div>

				<div className="splash-foot dim">
					press <span className="accent">⏎</span> to enter ·{" "}
					<span className="accent">esc</span> to dismiss
				</div>
			</div>
		</div>
	);
}

// Toast notification (auto-dismisses)
function Toast({ message, kind = "ok", onClose }) {
	_me(() => {
		const id = setTimeout(onClose, 2400);
		return () => clearTimeout(id);
	}, []);
	return (
		<div className={`toast toast-${kind}`}>
			<span className="toast-icon">{kind === "ok" ? "✓" : kind === "err" ? "✗" : "ℹ"}</span>
			<span>{message}</span>
		</div>
	);
}

Object.assign(window, {
	CommandPalette,
	EnvironmentManager,
	HistoryModal,
	Splash,
	Toast,
});
