// Main app for TUI Postman.

const { useState: _as, useEffect: _ae, useMemo: _aM, useRef: _aR } = React;

function applyTheme(themeKey) {
	const t = window.THEMES[themeKey] || window.THEMES.opencode;
	const root = document.documentElement;
	Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function App() {
	const { COLLECTIONS, REQUEST_DETAILS, SAMPLE_RESPONSE, ENVIRONMENTS, HISTORY, COMMANDS } =
		window.TUIDATA;

	const tweaks = useTweaks(
		/*EDITMODE-BEGIN*/ {
			theme: "opencode",
			showSplash: true,
			borderStyle: "single",
			density: "comfortable",
			showScanlines: false,
		} /*EDITMODE-END*/,
	);

	// Apply theme on mount + on change
	_ae(() => {
		applyTheme(tweaks.values.theme);
	}, [tweaks.values.theme]);

	// App state
	const [splash, setSplash] = _as(tweaks.values.showSplash);
	const [activeRequestId, setActiveRequestId] = _as("r2");
	const [focusedPane, setFocusedPane] = _as("editor"); // collections | editor | response
	const [editorTab, setEditorTab] = _as("Headers");
	const [sending, setSending] = _as(false);
	const [response, setResponse] = _as(SAMPLE_RESPONSE);
	const [environments, setEnvironments] = _as(ENVIRONMENTS);

	const [showCmd, setShowCmd] = _as(false);
	const [showEnv, setShowEnv] = _as(false);
	const [showHist, setShowHist] = _as(false);
	const [toast, setToast] = _as(null);

	const activeEnv = environments.find((e) => e.active) || environments[0];

	const activeRequest = _aM(() => {
		return REQUEST_DETAILS[activeRequestId] || REQUEST_DETAILS.r2;
	}, [activeRequestId]);

	const handleSend = () => {
		setSending(true);
		setResponse(null);
		setTimeout(() => {
			setSending(false);
			setResponse(SAMPLE_RESPONSE);
			setToast({ message: "200 OK · 184ms", kind: "ok" });
		}, 1400);
	};

	const handleActivateEnv = (id) => {
		setEnvironments((envs) => envs.map((e) => ({ ...e, active: e.id === id })));
		setToast({
			message: `environment switched to ${environments.find((e) => e.id === id).name}`,
			kind: "ok",
		});
	};

	const runCommand = (cmd) => {
		if (!cmd) return;
		if (cmd.cmd === "/send") handleSend();
		else if (cmd.cmd === "/env") setShowEnv(true);
		else if (cmd.cmd === "/history") setShowHist(true);
		else if (cmd.cmd === "/headers") setEditorTab("Headers");
		else if (cmd.cmd === "/body") setEditorTab("Body");
		else if (cmd.cmd === "/params") setEditorTab("Params");
		else if (cmd.cmd === "/auth") setEditorTab("Auth");
		else if (cmd.cmd === "/theme") {
			const keys = Object.keys(window.THEMES);
			const next = keys[(keys.indexOf(tweaks.values.theme) + 1) % keys.length];
			tweaks.setTweak("theme", next);
			setToast({ message: `theme: ${window.THEMES[next].label}`, kind: "ok" });
		} else setToast({ message: `ran ${cmd.cmd}`, kind: "ok" });
	};

	// Global key handler
	_ae(() => {
		const handler = (e) => {
			if (e.key === "Escape") {
				if (splash) {
					setSplash(false);
					return;
				}
				if (showCmd) {
					setShowCmd(false);
					return;
				}
				if (showEnv) {
					setShowEnv(false);
					return;
				}
				if (showHist) {
					setShowHist(false);
					return;
				}
			}
			// Ignore typing inside inputs
			if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setShowCmd(true);
			} else if (e.key === "/" && !showCmd) {
				e.preventDefault();
				setShowCmd(true);
			} else if (e.key === "e" && !splash && !showCmd && !showEnv && !showHist) {
				setShowEnv(true);
			} else if (e.key === "h" && !splash && !showCmd && !showEnv && !showHist) {
				setShowHist(true);
			} else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				handleSend();
			} else if (e.key === "Enter" && splash) {
				setSplash(false);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [splash, showCmd, showEnv, showHist]);

	// Header tabs (mock pinned tabs across the top)
	const tabs = [
		{ id: "r1", label: "users", idx: "⌘1" },
		{ id: "r2", label: "users/:id", idx: "⌘2" },
		{ id: "r3", label: "users *", idx: "⌘3" },
		{ id: "r9", label: "comments", idx: "⌘4" },
	];

	return (
		<div
			className={`app density-${tweaks.values.density} ${tweaks.values.showScanlines ? "scanlines" : ""}`}
		>
			{/* Title bar (tmux-style) */}
			<div className="titlebar">
				<div className="tb-traffic">
					<span className="tb-dot" style={{ background: "#ff5f56" }}></span>
					<span className="tb-dot" style={{ background: "#ffbd2e" }}></span>
					<span className="tb-dot" style={{ background: "#27c93f" }}></span>
				</div>
				<div className="tb-tabs">
					{tabs.map((t) => (
						<span
							key={t.id}
							className={`tb-tab ${activeRequestId === t.id ? "active" : ""}`}
							onClick={() => setActiveRequestId(t.id)}
						>
							{t.label}
							<span className="num">{t.idx}</span>
						</span>
					))}
					<span className="tb-tab add">+</span>
				</div>
				<span className="tb-title dim">tui-postman · {activeEnv.name.toLowerCase()}</span>
			</div>

			{/* Three-pane main */}
			<div className="main">
				<div className="col-left">
					<CollectionsPane
						collections={COLLECTIONS}
						activeRequestId={activeRequestId}
						onPick={setActiveRequestId}
						focused={focusedPane === "collections"}
						onFocus={() => setFocusedPane("collections")}
						env={activeEnv}
					/>
				</div>
				<div className="col-right">
					<div className="row-top">
						<RequestEditor
							request={activeRequest}
							focused={focusedPane === "editor"}
							onFocus={() => setFocusedPane("editor")}
							onSend={handleSend}
							sending={sending}
							activeTab={editorTab}
							onTabChange={setEditorTab}
						/>
					</div>
					<div className="row-bot">
						<ResponsePane
							response={response}
							sending={sending}
							focused={focusedPane === "response"}
							onFocus={() => setFocusedPane("response")}
						/>
					</div>
				</div>
			</div>

			{/* Slash-command strip (always visible) */}
			<div className="cmd-strip">
				<span className="prompt">/</span>
				<span className="ph">
					type a command, or press <kbd>⌘K</kbd> for the palette
				</span>
				<span style={{ flex: 1 }}></span>
				<span className="dim">─ {COMMANDS.length} commands available</span>
			</div>

			{/* Status bar */}
			<div className="statusbar">
				<span className="sb-mode">NORMAL</span>
				<span className="dim">●</span>
				<span>
					<span className="accent">◆</span> {activeEnv.name.toLowerCase()}
				</span>
				<span className="sep">│</span>
				<span className="dim">collection</span> <span>JSONPlaceholder</span>
				<span className="sep">│</span>
				<span className="dim">request</span> <span className="accent">users/:id</span>
				<span className="sep">│</span>
				<span className="dim">cursor</span> <span>{focusedPane}</span>
				<span className="sb-spacer"></span>
				<Key k="/" label="cmd" />
				<Key k="e" label="env" />
				<Key k="h" label="hist" />
				<Key k="⌘↵" label="send" />
				<Key k="q" label="quit" />
			</div>

			{/* Modals */}
			{splash && <Splash onDismiss={() => setSplash(false)} />}
			{showCmd && (
				<CommandPalette
					commands={COMMANDS}
					onClose={() => setShowCmd(false)}
					onRun={runCommand}
				/>
			)}
			{showEnv && (
				<EnvironmentManager
					environments={environments}
					onClose={() => setShowEnv(false)}
					onActivate={handleActivateEnv}
				/>
			)}
			{showHist && <HistoryModal history={HISTORY} onClose={() => setShowHist(false)} />}
			{toast && (
				<Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
			)}

			{/* Tweaks panel (only visible when toggled on by host) */}
			<TweaksPanel title="Tweaks">
				<TweakSection label="theme">
					<TweakRadio
						value={tweaks.values.theme}
						onChange={(v) => tweaks.setTweak("theme", v)}
						options={[
							{ value: "opencode", label: "OpenCode" },
							{ value: "catppuccin", label: "Catppuccin" },
							{ value: "matrix", label: "Matrix" },
						]}
					/>
				</TweakSection>
				<TweakSection label="density">
					<TweakRadio
						value={tweaks.values.density}
						onChange={(v) => tweaks.setTweak("density", v)}
						options={[
							{ value: "compact", label: "compact" },
							{ value: "comfortable", label: "comfortable" },
						]}
					/>
				</TweakSection>
				<TweakToggle
					label="CRT scanlines"
					value={tweaks.values.showScanlines}
					onChange={(v) => tweaks.setTweak("showScanlines", v)}
				/>
				<TweakSection label="show splash on next load">
					<TweakToggle
						label="splash"
						value={tweaks.values.showSplash}
						onChange={(v) => tweaks.setTweak("showSplash", v)}
					/>
				</TweakSection>
				<TweakButton label="open command palette" onClick={() => setShowCmd(true)} />
				<TweakButton label="open environment manager" onClick={() => setShowEnv(true)} />
				<TweakButton label="open history" onClick={() => setShowHist(true)} />
				<TweakButton label="show splash" onClick={() => setSplash(true)} />
				<TweakButton label="trigger send (spinner)" onClick={handleSend} />
			</TweaksPanel>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
