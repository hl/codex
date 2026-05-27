import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const ACTIONS = ["draft", "validate", "review", "compound", "refresh"] as const;
type FlywheelAction = (typeof ACTIONS)[number];

const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const RESOURCE_ROOT = resolve(EXTENSION_DIR, "resources");
const SCRIPT_ROOT = resolve(EXTENSION_DIR, "scripts");

function readResourceFile(relativePath: string): string {
	return readFileSync(resolve(RESOURCE_ROOT, relativePath), "utf8").trim();
}

function usage(): string {
	return [
		"Usage: /flywheel <draft|validate|review|compound|refresh> [target or brief]",
		"Examples:",
		"  /flywheel draft add csv export for invoices",
		"  /flywheel validate docs/specs/csv-export-invoices.md",
		"  /flywheel review docs/specs/csv-export-invoices.md",
		"  /flywheel compound docs/specs/csv-export-invoices.md",
		"  /flywheel refresh authentication jwt rotation",
	].join("\n");
}

function parseAction(args: string): { action?: FlywheelAction; rest: string } {
	const [rawAction = "", ...restParts] = args.trim().split(/\s+/);
	const action = rawAction.toLowerCase();
	if (ACTIONS.includes(action as FlywheelAction)) {
		return { action: action as FlywheelAction, rest: restParts.join(" ").trim() };
	}
	return { rest: args.trim() };
}

function docsForAction(action: FlywheelAction): Array<{ label: string; path: string; content: string }> {
	const paths = new Set<string>(["flywheel.md"]);
	if (["draft", "validate", "review", "compound"].includes(action)) {
		paths.add("spec-template.md");
	}
	if (action === "draft") {
		paths.add("brainstorm.md");
		paths.add("solution-docs.md");
	}
	if (["compound", "refresh"].includes(action)) {
		paths.add("solution-docs.md");
	}

	return [...paths].map((path) => ({
		label: path,
		path: resolve(RESOURCE_ROOT, path),
		content: readResourceFile(path),
	}));
}

function buildPrompt(action: FlywheelAction, rest: string): string {
	const docs = docsForAction(action)
		.map(
			(doc) => `## ${doc.label}\n\nSource: ${doc.path}\n\n\`\`\`markdown\n${doc.content}\n\`\`\``,
		)
		.join("\n\n");

	const target = rest ? rest : "No target or brief was provided; ask only if this is materially ambiguous.";

	return [
		`Use the Flywheel workflow to ${action} the following target or brief:`,
		"",
		target,
		"",
		"Follow the embedded Flywheel instructions exactly. Keep the final response concise and task-shaped.",
		"When review or compound needs the canonical evidence hash, prefer the `flywheel_review_evidence_hash` tool instead of inlining an alternative hash pipeline.",
		"",
		docs,
	].join("\n");
}

export default function flywheelExtension(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (ctx.hasUI) {
			ctx.ui.setStatus("flywheel", "flywheel ready");
		}
	});

	pi.registerCommand("flywheel", {
		description: "Run the Flywheel spec/review/compound workflow: /flywheel <draft|validate|review|compound|refresh> ...",
		handler: async (args, ctx) => {
			const { action, rest } = parseAction(args);
			if (!action) {
				ctx.ui.notify(usage(), "warning");
				return;
			}

			pi.sendUserMessage(buildPrompt(action, rest));
		},
	});

	pi.registerTool({
		name: "flywheel_review_evidence_hash",
		label: "Flywheel Review Evidence Hash",
		description: "Compute Flywheel's canonical review evidence SHA-256 for a git base commit-ish.",
		promptSnippet: "Compute the canonical Flywheel review evidence hash for review/compound checks",
		promptGuidelines: [
			"Use flywheel_review_evidence_hash during Flywheel review or compound whenever a canonical review evidence hash is required.",
		],
		parameters: Type.Object({
			base: Type.String({
				description: "The git base commit-ish to compare against, usually the review merge base or recorded last_review_base.",
			}),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const scriptPath = resolve(SCRIPT_ROOT, "review-evidence-hash.sh");
			if (!existsSync(scriptPath)) {
				return {
					isError: true,
					content: [{ type: "text", text: `Missing Flywheel hash script: ${scriptPath}` }],
					details: { scriptPath },
				};
			}

			try {
				const { stdout, stderr } = await execFileAsync("bash", [scriptPath, params.base], {
					cwd: ctx.cwd,
					maxBuffer: 50 * 1024 * 1024,
					signal,
				});
				const hash = stdout.trim();
				return {
					content: [{ type: "text", text: hash }],
					details: { base: params.base, hash, stderr: stderr.trim() || undefined },
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					isError: true,
					content: [{ type: "text", text: message }],
					details: { base: params.base, scriptPath },
				};
			}
		},
	});
}
