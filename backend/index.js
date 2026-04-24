const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity — replace with your actual details ──────────────────────────────
const USER_ID = "tanisha_04122005"; // fullname_ddmmyyyy  ← change DOB if needed
const EMAIL_ID = "tm6668@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311050010038";
// ─────────────────────────────────────────────────────────────────────────────

function isValidEntry(raw) {
  const s = raw.trim();
  // Must match exactly X->Y where X,Y are single uppercase letters, X≠Y
  return /^[A-Z]->[A-Z]$/.test(s) && s[0] !== s[3];
}

function buildHierarchies(validEdges) {
  // Track parent→children (first-parent-wins for diamond case)
  const children = {}; // parent -> [child, ...]
  const parentOf = {};  // child  -> parent (first encounter)

  for (const edge of validEdges) {
    const [p, c] = edge.split("->"); // already validated: single chars
    if (!children[p]) children[p] = [];
    if (!children[c]) children[c] = []; // ensure node exists

    if (parentOf[c] !== undefined) {
      // Node already has a parent → discard this edge (diamond/multi-parent rule)
      continue;
    }
    parentOf[c] = p;
    children[p].push(c);
  }

  // All nodes mentioned
  const allNodes = new Set([...Object.keys(children), ...Object.keys(parentOf)]);

  // Find connected groups via Union-Find
  const uf = {};
  function find(x) {
    if (uf[x] === undefined) uf[x] = x;
    if (uf[x] !== x) uf[x] = find(uf[x]);
    return uf[x];
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) uf[ra] = rb;
  }

  for (const edge of validEdges) {
    const [p, c] = edge.split("->");
    union(p, c);
  }

  // Group nodes by component
  const groups = {};
  for (const node of allNodes) {
    const root = find(node);
    if (!groups[root]) groups[root] = new Set();
    groups[root].add(node);
  }

  const hierarchies = [];

  for (const group of Object.values(groups)) {
    const nodes = [...group];

    // Detect cycle: DFS within the group using children map
    // (after multi-parent discard, each node has at most one parent)
    let hasCycle = false;
    const visited = new Set();
    const inStack = new Set();

    function dfs(node) {
      if (inStack.has(node)) { hasCycle = true; return; }
      if (visited.has(node)) return;
      visited.add(node);
      inStack.add(node);
      for (const child of (children[node] || [])) {
        dfs(child);
        if (hasCycle) return;
      }
      inStack.delete(node);
    }

    for (const node of nodes) {
      if (!visited.has(node)) dfs(node);
      if (hasCycle) break;
    }

    // Find root: node in this group that is not a child of any node
    let rootNode = null;
    for (const node of nodes) {
      if (parentOf[node] === undefined) { rootNode = node; break; }
    }
    // Pure cycle: no natural root → lexicographically smallest
    if (rootNode === null) {
      rootNode = nodes.sort()[0];
    }

    if (hasCycle) {
      hierarchies.push({ root: rootNode, tree: {}, has_cycle: true });
    } else {
      // Build nested tree object recursively
      function buildTree(node) {
        const obj = {};
        for (const child of (children[node] || [])) {
          obj[child] = buildTree(child);
        }
        return obj;
      }

      // Depth = longest root-to-leaf path (node count)
      function calcDepth(node) {
        const kids = children[node] || [];
        if (kids.length === 0) return 1;
        return 1 + Math.max(...kids.map(calcDepth));
      }

      const tree = { [rootNode]: buildTree(rootNode) };
      const depth = calcDepth(rootNode);
      hierarchies.push({ root: rootNode, tree, depth });
    }
  }

  return hierarchies;
}

app.post("/bfhl", (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "data must be an array" });
  }

  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const validEdges = [];

  for (const raw of data) {
    const trimmed = String(raw).trim();

    if (!isValidEntry(trimmed)) {
      invalid_entries.push(raw); // keep original value
      continue;
    }

    if (seenEdges.has(trimmed)) {
      // Only push first duplicate (not every repeat beyond the 2nd)
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      continue;
    }

    seenEdges.add(trimmed);
    validEdges.push(trimmed);
  }

  const hierarchies = buildHierarchies(validEdges);

  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const cyclic    = hierarchies.filter((h) =>  h.has_cycle);

  // Largest tree root: greatest depth; tie → lexicographically smaller root
  let largest_tree_root = "";
  let maxDepth = 0;
  for (const h of nonCyclic) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largest_tree_root)
    ) {
      maxDepth = h.depth;
      largest_tree_root = h.root;
    }
  }

  res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root,
    },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BFHL API running on port ${PORT}`));