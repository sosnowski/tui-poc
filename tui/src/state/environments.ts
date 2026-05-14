import { createMemo, createSignal } from "solid-js";

import { ENVIRONMENTS } from "../data";
import type { Environment } from "../data/types";
import { pushToast } from "./app";

const [environments, setEnvironmentsSig] = createSignal<Environment[]>(ENVIRONMENTS);
export { environments };

export const activeEnv = createMemo<Environment>(
	() => environments().find((e) => e.active) ?? environments()[0]!,
);

export function activateEnvironment(id: string): void {
	setEnvironmentsSig((envs) => envs.map((e) => ({ ...e, active: e.id === id })));
	const env = environments().find((e) => e.id === id);
	if (env) pushToast(`environment switched to ${env.name}`, "ok");
}

export function setEnvironmentVariableCell(
	envId: string,
	idx: number,
	col: 0 | 1,
	value: string,
): void {
	setEnvironmentsSig((envs) =>
		envs.map((env) => {
			if (env.id !== envId) return env;
			return {
				...env,
				vars: env.vars.map((v, i) => {
					if (i !== idx) return v;
					return col === 0 ? { ...v, key: value } : { ...v, value };
				}),
			};
		}),
	);
}
