import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import semanticRelease from "semantic-release";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const RELEASE_CONFIG_PATH = path.join(ROOT_DIR, ".releaserc.json");

const PREVIEW_PLUGIN_NAMES = new Set([
  "@semantic-release/commit-analyzer",
  "@semantic-release/release-notes-generator",
]);

const appendSummary = async (content) => {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  await fs.appendFile(summaryPath, `${content}\n`);
};

try {
  const rawConfig = await fs.readFile(RELEASE_CONFIG_PATH, "utf8");
  const releaseConfig = JSON.parse(rawConfig);

  const headBranch = process.env.GITHUB_HEAD_REF;
  const branches = headBranch && headBranch !== "main" ? ["main", headBranch] : ["main"];

  const previewPlugins = (releaseConfig.plugins ?? []).filter((plugin) => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
    return PREVIEW_PLUGIN_NAMES.has(pluginName);
  });

  const result = await semanticRelease(
    {
      branches,
      repositoryUrl: releaseConfig.repositoryUrl,
      plugins: previewPlugins,
      dryRun: true,
      ci: false,
    },
    {
      cwd: ROOT_DIR,
      env: process.env,
      stdout: process.stdout,
      stderr: process.stderr,
    }
  );

  if (!result) {
    const noReleaseMessage = "No release would be published for this PR based on current commit history.";
    console.log(noReleaseMessage);
    await appendSummary(`## Release Preview\n\n${noReleaseMessage}`);
    process.exit(0);
  }

  const previewSummary = [
    "## Release Preview",
    "",
    `- Next version: ${result.nextRelease.version}`,
    `- Release type: ${result.nextRelease.type}`,
    "",
    "### Notes",
    "",
    result.nextRelease.notes || "No release notes generated.",
  ].join("\n");

  console.log(previewSummary);
  await appendSummary(previewSummary);
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  await appendSummary(`## Release Preview\n\nFailed to generate preview.\n\n\`\`\`\n${message}\n\`\`\``);
  throw error;
}
