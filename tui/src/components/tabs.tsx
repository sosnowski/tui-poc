// Horizontal tab strip used by both the request editor and the response pane.
// Renders "1 Params [3]" entries — the leading number is the keyboard shortcut.

import { For } from "solid-js";

import { S } from "./styled-span";
import { theme } from "../state/store";

export interface Tab<T extends string = string> {
	id: T;
	label: string;
	/** Optional badge: count or an indicator dot. */
	badge?: string | number;
	/** Optional badge color override (e.g. ok green for "2/2" tests). */
	badgeColor?: string;
}

interface Props<T extends string> {
	tabs: Tab<T>[];
	active: T;
	onSelect?: (id: T) => void;
}

export function Tabs<T extends string>(props: Props<T>) {
	const t = () => theme();
	return (
		<box flexDirection="row" paddingTop={0} paddingBottom={0} columnGap={1}>
			<For each={props.tabs}>
				{(tab, i) => {
					const isActive = () => props.active === tab.id;
					return (
						<box
							flexDirection="row"
							height={1}
							paddingLeft={1}
							paddingRight={1}
							backgroundColor={isActive() ? t().accentBg : undefined}
						>
							<text>
								<S fg={isActive() ? t().accent : t().textDim}>{i() + 1} </S>
								<S fg={isActive() ? t().accent : t().text2} bold={isActive()}>
									{tab.label}
								</S>
								{tab.badge != null ? (
									<S
										fg={
											isActive()
												? t().textDim
												: (tab.badgeColor ?? t().textDim)
										}
										// bg={isActive() ? t().accent : undefined}
										bold={isActive()}
									>
										{" " + String(tab.badge) + " "}
									</S>
								) : null}
							</text>
						</box>
					);
				}}
			</For>
		</box>
	);
}
