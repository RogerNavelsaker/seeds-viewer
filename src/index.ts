#!/usr/bin/env bun
import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { computeMetrics } from "./graph.ts";
import type { Issue } from "./types.ts";

const program = new Command();

program
	.name("seeds-viewer")
	.description("CLI tool for seeds graph analysis, designed for agents and tools.")
	.option("-d, --dir <path>", "Directory containing .seeds", ".");

async function loadIssues(dir: string): Promise<Issue[]> {
	const seedsDir = path.resolve(dir, ".seeds");
	const issuesFile = path.join(seedsDir, "issues.jsonl");

	let content: string;
	try {
		content = await fs.readFile(issuesFile, "utf-8");
	} catch (error) {
		console.error(`Error reading ${issuesFile}: ${(error as Error).message}`);
		process.exit(1);
	}

	const issues: Issue[] = [];
	for (const line of content.split("\n")) {
		if (!line.trim()) continue;
		try {
			issues.push(JSON.parse(line));
		} catch (e) {
			console.error("Failed to parse line:", line);
		}
	}
	return issues;
}

program
	.command("triage")
	.description("Rank ready issues using graph algorithms (PageRank, betweenness, critical path)")
	.option("--json", "Output as JSON")
	.option("--limit <n>", "Return top N issues only")
	.action(async (opts) => {
		const issues = await loadIssues(program.opts().dir);
		
		const closedIds = new Set(issues.filter((i) => i.status === "closed").map((i) => i.id));
		const openIssues = issues.filter((i) => i.status !== "closed");

		const metrics = computeMetrics(openIssues);

		const ready = openIssues.filter((i) => (i.blockedBy ?? []).every((bid) => closedIds.has(bid)));

		const limit = opts.limit !== undefined ? Number(opts.limit) : 0;

		const ranked = ready
			.map((issue) => {
				const m = metrics.get(issue.id);
				return {
					id: issue.id,
					title: issue.title,
					status: issue.status,
					priority: issue.priority || 0,
					pagerank: m?.pagerank ?? 0,
					betweenness: m?.betweenness ?? 0,
					criticalPathLength: m?.criticalPathLength ?? 0,
					score: m?.score ?? 0,
				};
			})
			.sort((a, b) => b.score - a.score || a.priority - b.priority);

		const output = limit > 0 ? ranked.slice(0, limit) : ranked;

		if (opts.json) {
			console.log(JSON.stringify({ success: true, command: "triage", issues: output, count: output.length }, null, 2));
			return;
		}

		if (output.length === 0) {
			console.log("No ready issues.");
			return;
		}

		for (const entry of output) {
			const scoreStr = `${(entry.score * 100).toFixed(0)}pts`;
			const cpStr = entry.criticalPathLength > 0 ? ` · cp:${entry.criticalPathLength}` : "";
			const bStr = entry.betweenness > 0.01 ? ` · btw:${entry.betweenness.toFixed(2)}` : "";
			console.log(`${entry.id} (${entry.status}) - ${entry.title}`);
			console.log(`    score: ${scoreStr}${cpStr}${bStr}`);
		}
		console.log(`\n${output.length} ready issue(s) (ranked by graph score)`);
	});

program
	.command("graph")
	.description("Export the dependency graph as a Graphviz DOT string")
	.option("--open-only", "Only include open issues")
	.action(async (opts) => {
		let issues = await loadIssues(program.opts().dir);
		
		if (opts.openOnly) {
			issues = issues.filter((i) => i.status !== "closed");
		}

		console.log("digraph G {");
		console.log('  node [shape="box", style="rounded"];');
		console.log('  rankdir="LR";');

		const ids = new Set(issues.map((i) => i.id));

		for (const issue of issues) {
			const label = `${issue.id}\\n${issue.title}\\n[${issue.status}]`.replace(/"/g, '\\"');
			console.log(`  "${issue.id}" [label="${label}"];`);
		}

		for (const issue of issues) {
			for (const blocked of issue.blocks ?? []) {
				if (ids.has(blocked)) {
					console.log(`  "${issue.id}" -> "${blocked}";`);
				}
			}
		}

		console.log("}");
	});

program.parse();
