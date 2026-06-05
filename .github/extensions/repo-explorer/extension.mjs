import { createServer } from "node:http";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from "node:path";
import { CanvasError, joinSession, createCanvas } from "@github/copilot-sdk/extension";

const servers = new Map();
const ignoredDirectoryNames = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo", ".cache"]);
const extensionPath = fileURLToPath(import.meta.url);
const extensionDirectory = dirname(extensionPath);
const repositoryRootPath = resolve(extensionDirectory, "..", "..", "..");
const repositoryName = basename(repositoryRootPath) || "workspace";

function toPortablePath(input) {
    return input.split(sep).join("/");
}

function normalizeRelativePath(rawPath) {
    if (typeof rawPath !== "string" || rawPath.length === 0) {
        return "";
    }

    const normalizedPath = normalize(rawPath).replace(/^([\\/]+)/, "");
    if (isAbsolute(normalizedPath) || normalizedPath.startsWith("..")) {
        return undefined;
    }
    return normalizedPath === "." ? "" : normalizedPath;
}

async function readTreeLevel(rootPath, requestedPath) {
    const normalizedPath = normalizeRelativePath(requestedPath);
    if (normalizedPath === undefined) {
        return undefined;
    }

    const currentPath = normalizedPath ? join(rootPath, normalizedPath) : rootPath;
    let entries;
    try {
        entries = await readdir(currentPath, { withFileTypes: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
            return undefined;
        }
        throw error;
    }

    const directories = [];
    const files = [];
    for (const entry of entries) {
        if (entry.name.startsWith(".")) {
            continue;
        }

        const childRelativePath = normalizedPath ? join(normalizedPath, entry.name) : entry.name;
        const entryRecord = {
            name: entry.name,
            path: toPortablePath(childRelativePath),
        };

        if (entry.isDirectory()) {
            if (ignoredDirectoryNames.has(entry.name)) {
                continue;
            }
            directories.push(entryRecord);
            continue;
        }

        if (entry.isFile()) {
            files.push(entryRecord);
        }
    }

    directories.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
    files.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

    return {
        path: toPortablePath(normalizedPath),
        directories,
        files,
    };
}

function renderHtml(rootName, initialPath) {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Repository explorer</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        background: var(--background-color-default, #ffffff);
        color: var(--text-color-default, #1f2328);
        font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        font-size: var(--text-body-medium, 14px);
        line-height: var(--leading-body-medium, 20px);
      }
      .layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      header {
        border-bottom: 1px solid var(--border-color-default, #d1d9e0);
        padding: 12px;
      }
      h1 {
        margin: 0;
        font-size: var(--text-title-medium, 20px);
      }
      .tree {
        flex: 1;
        overflow: auto;
        padding: 8px 12px 16px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding-left: 14px;
      }
      li {
        margin: 2px 0;
      }
      .node {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .toggle {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        padding: 2px 4px;
      }
      .toggle:focus-visible {
        outline: 2px solid var(--color-focus-outline, #0969da);
        outline-offset: 1px;
      }
      .file-label {
        padding-left: 20px;
      }
      .muted {
        color: var(--text-color-muted, #57606a);
      }
      .error {
        color: var(--true-color-red, #b62324);
      }
      @media (forced-colors: active) {
        body {
          background: Canvas;
          color: CanvasText;
        }
        header {
          border-bottom-color: ButtonBorder;
        }
        .toggle:focus-visible {
          outline-color: Highlight;
        }
        .muted {
          color: GrayText;
        }
        .error {
          color: Mark;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <header>
        <h1>Repository explorer</h1>
        <div class="muted" id="status">Loading</div>
      </header>
      <main class="tree" id="tree" tabindex="-1" aria-label="Repository file tree"></main>
    </div>
    <script type="module">
      const rootName = ${JSON.stringify(rootName)};
      const initialPath = ${JSON.stringify(initialPath)};
      const treeContainer = document.getElementById("tree");
      const statusElement = document.getElementById("status");
      const loadedDirectories = new Map();
      const expandedDirectories = new Set([""]);

      function setStatus(message, isError = false) {
        statusElement.textContent = message;
        statusElement.classList.toggle("error", isError);
      }

      function createList() {
        const list = document.createElement("ul");
        list.setAttribute("role", "tree");
        return list;
      }

      function createFolderLabel(path, name) {
        const label = document.createElement("button");
        const isExpanded = expandedDirectories.has(path);
        label.type = "button";
        label.className = "toggle";
        label.setAttribute("aria-expanded", String(isExpanded));
        label.textContent = (isExpanded ? "▾" : "▸") + " 📁 " + name;
        label.addEventListener("click", async () => {
          const shouldExpand = !expandedDirectories.has(path);
          if (shouldExpand) {
            expandedDirectories.add(path);
            await loadDirectory(path);
          } else {
            expandedDirectories.delete(path);
          }
          renderTree();
        });
        return label;
      }

      function createFileLabel(name) {
        const file = document.createElement("div");
        file.className = "node file-label";
        file.textContent = "📄 " + name;
        return file;
      }

      async function loadDirectory(path) {
        if (loadedDirectories.has(path)) {
          return;
        }

        setStatus("Loading " + (path || rootName));
        const response = await fetch("/api/tree?path=" + encodeURIComponent(path));
        if (!response.ok) {
          throw new Error("Failed to read " + (path || rootName));
        }

        const payload = await response.json();
        loadedDirectories.set(path, payload);
        setStatus("Loaded " + rootName);
      }

      function renderDirectory(path, container) {
        const data = loadedDirectories.get(path);
        if (!data) {
          return;
        }

        for (const directory of data.directories) {
          const item = document.createElement("li");
          const node = document.createElement("div");
          node.className = "node";
          node.append(createFolderLabel(directory.path, directory.name));
          item.append(node);

          if (expandedDirectories.has(directory.path)) {
            const nested = createList();
            item.append(nested);
            renderDirectory(directory.path, nested);
          }

          container.append(item);
        }

        for (const file of data.files) {
          const item = document.createElement("li");
          item.append(createFileLabel(file.name));
          container.append(item);
        }
      }

      function renderTree() {
        treeContainer.innerHTML = "";
        const rootList = createList();
        const rootItem = document.createElement("li");
        const rootNode = document.createElement("div");
        rootNode.className = "node";
        rootNode.append(createFolderLabel("", rootName));
        rootItem.append(rootNode);
        if (expandedDirectories.has("")) {
          const nested = createList();
          rootItem.append(nested);
          renderDirectory("", nested);
        }
        rootList.append(rootItem);
        treeContainer.append(rootList);
      }

      async function initialize() {
        try {
          await loadDirectory("");
          if (initialPath) {
            const segments = initialPath.split("/").filter(Boolean);
            let currentPath = "";
            for (const segment of segments) {
              currentPath = currentPath ? currentPath + "/" + segment : segment;
              expandedDirectories.add(currentPath);
              await loadDirectory(currentPath);
            }
          }
          renderTree();
          treeContainer.focus();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to load repository tree", true);
        }
      }

      initialize();
    </script>
  </body>
</html>`;
}

async function startServer(rootPath, initialPath) {
    const rootName = basename(rootPath) || "workspace";
    const server = createServer((req, res) => {
        const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");

        if (requestUrl.pathname === "/api/tree") {
            const requestedPath = requestUrl.searchParams.get("path") ?? "";
            readTreeLevel(rootPath, requestedPath)
                .then((payload) => {
                    if (!payload) {
                        res.statusCode = 400;
                        res.setHeader("Content-Type", "application/json; charset=utf-8");
                        res.end(JSON.stringify({ error: "invalid_path" }));
                        return;
                    }
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify(payload));
                })
                .catch(() => {
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify({ error: "directory_read_failed" }));
                });
            return;
        }

        if (requestUrl.pathname !== "/") {
            res.statusCode = 404;
            res.end("Not found");
            return;
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(renderHtml(rootName, initialPath));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

await joinSession({
    canvases: [
        createCanvas({
            id: "repo-explorer",
            displayName: "Repository explorer",
            description: "Browse the current repository as an expandable file tree similar to VS Code Explorer.",
            inputSchema: {
                type: "object",
                properties: {
                    startPath: { type: "string" },
                },
                additionalProperties: false,
            },
            actions: [
                {
                    name: "list_directory",
                    description: "Return files and directories for a relative path in the repository.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: { type: "string" },
                        },
                        additionalProperties: false,
                    },
                    handler: async (ctx) => {
                        const requestedPath = ctx.input && typeof ctx.input === "object" ? ctx.input.path : "";
                        const treeLevel = await readTreeLevel(repositoryRootPath, requestedPath);
                        if (!treeLevel) {
                            throw new CanvasError("path_not_found", "Requested path was not found.");
                        }
                        return treeLevel;
                    },
                },
            ],
            open: async (ctx) => {
                let entry = servers.get(ctx.instanceId);
                if (!entry) {
                    const initialPathInput = ctx.input && typeof ctx.input === "object" ? ctx.input.startPath : undefined;
                    const initialPath = normalizeRelativePath(initialPathInput) ?? "";
                    entry = await startServer(repositoryRootPath, initialPath);
                    servers.set(ctx.instanceId, entry);
                }
                return {
                    title: "Repository explorer",
                    status: repositoryName,
                    url: entry.url,
                };
            },
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    await new Promise((resolve) => entry.server.close(() => resolve()));
                }
            },
        }),
    ],
});
