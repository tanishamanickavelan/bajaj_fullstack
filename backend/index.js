import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const NAME = "tanisha";
const EMAIL = "tm6668@srmist.edu.in";
const ROLL = "RA2311050010038";
const USER_ID = `${NAME}_24042026`; // or ddmmyyyy today

function validateEntry(str) {
  let entry = str.trim();
  if (!entry.match(/^[A-Z]->[A-Z]$/)) return false;
  // Self-loop
  if (entry[0] === entry[3]) return false;
  return true;
}

// Parse and process all data
function processData(data) {
  let validEdges = [];
  let invalid_entries = [], duplicate_edges = [];
  let edgeSet = new Set();
  let childToParent = new Map(); // for multi-parent
  let parentToChildren = new Map();

  // Step 1: Parse and validate entries, detect duplicates
  for (let raw of data) {
    const s = raw.trim();
    if (!validateEntry(s))
      { invalid_entries.push(raw); continue; }

    if (edgeSet.has(s))
      { if (!duplicate_edges.includes(s)) duplicate_edges.push(s); continue; }

    const [parent, child] = [s[0], s[3]];
    // Multi-parent: Only first wins
    if (childToParent.has(child)) continue;

    validEdges.push([parent, child]);
    edgeSet.add(s);
    childToParent.set(child, parent);

    if (!parentToChildren.has(parent)) parentToChildren.set(parent, []);
    parentToChildren.get(parent).push(child);
  }

  // Step 2: Build all groups (tree or cyclic)
  // Find all nodes
  let allNodes = new Set();
  validEdges.forEach(([p, c]) => { allNodes.add(p); allNodes.add(c); });

  // Set of all children
  let children = new Set(validEdges.map(([p, c]) => c));
  // Roots are nodes that never appear as child
  let roots = [...allNodes].filter(x => !children.has(x));
  let visited = new Set();
  let groups = [];

  // Build connected groups: for each unvisited node, BFS/DFS
  let nodeToEdges = {};
  validEdges.forEach(([p, c]) => {
    if (!nodeToEdges[p]) nodeToEdges[p] = [];
    nodeToEdges[p].push(c);
    if (!nodeToEdges[c]) nodeToEdges[c] = [];
  });

  function groupDFS(start, currGroup) {
    if (!visited.has(start)) {
      visited.add(start);
      currGroup.push(start);
      for (let child of (nodeToEdges[start]||[])) {
        groupDFS(child, currGroup);
      }
    }
  }
  // cover all components
  for (let node of allNodes) {
    if (!visited.has(node)) {
      let currGroup = [];
      groupDFS(node, currGroup);
      if (currGroup.length) groups.push(currGroup);
    }
  }

  // Step 3: For each group, find root/cycle, and generate object
  let hierarchies = [];
  let largest_tree_root = "";
  let largest_depth = 0;
  let total_trees = 0, total_cycles = 0;

  // For each group, find roots (nodes without parent).
  for (let group of groups) {
    const groupNodes = new Set(group);

    let groupRoots = [...groupNodes].filter(n => !childToParent.has(n));
    let root = null;
    if (groupRoots.length > 0) root = groupRoots.sort()[0];
    else root = [...groupNodes].sort()[0];

    // Cycle detection
    let has_cycle = false;
    let seen = new Set();
    function dfsCycle(n) {
      if (seen.has(n)) { has_cycle = true; return; }
      seen.add(n);
      for (let child of (parentToChildren.get(n) || [])) {
        if (groupNodes.has(child)) dfsCycle(child);
      }
      seen.delete(n);
    }
    dfsCycle(root);

    if (has_cycle) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      total_cycles += 1;
      continue;
    }

    // else: build tree recursively
    function buildTree(n) {
      const children = (parentToChildren.get(n) || []).filter(c => groupNodes.has(c));
      let obj = {};
      for (let c of children) {
        obj[c] = buildTree(c);
      }
      return obj;
    }

    let treeObj = {};
    treeObj[root] = buildTree(root);

    // Calculate depth
    function maxDepth(n) {
      let children = Object.keys(treeObj[n] || {});
      if (children.length === 0) return 0;
      let depths = children.map(child => maxDepth(child));
      return 1 + Math.max(...depths);
    }
    let depth = maxDepth(root);

    hierarchies.push({
      root: root,
      tree: treeObj,
      depth: depth
    });
    total_trees += 1;

    if (
      depth > largest_depth ||
      (depth === largest_depth && root < largest_tree_root)
    ) {
      largest_depth = depth;
      largest_tree_root = root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL,
    college_roll_number: ROLL,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  };
}

app.get('/', (req, res) => {
  res.status(200).json({ message: "BFHL API is running. Send POST to /bfhl" });
});

app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Missing/invalid 'data' array" });
    }
    const response = processData(data);
    return res.json(response);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});