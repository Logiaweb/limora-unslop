// Tiny helpers shared by the scripts: a --flag parser and a clean exit.
export function stop(message) { console.error(message); process.exit(1); }

export function parseArgs(list, takesValue) {
  const options = {}, positional = [];
  for (let i = 0; i < list.length; i++) {
    if (!list[i].startsWith("--")) { positional.push(list[i]); continue; }
    const key = list[i].slice(2);
    options[key] = takesValue.has(key) ? list[++i] : true;
  }
  return { options, positional };
}

// Scripts print a plain message on failure instead of a stack trace.
process.on("uncaughtException", (err) => { console.error(err.code === "ENOENT" ? `File not found: ${err.path}` : err.message); process.exit(1); });
