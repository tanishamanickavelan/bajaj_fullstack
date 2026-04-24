import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function ResultPretty({ result }) {
  if (!result) return null;
  return (
    <div className="results">
      <h3>API Response:</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <h4>Hierarchies:</h4>
      {result.hierarchies?.map((h, i) => (
        <div key={i} style={{padding:'0.5em',border:'1px solid #ddd',marginBottom:'1em'}}>
          <b>Root:</b> {h.root} <br/>
          {h.has_cycle ? (
            <span style={{color:'#e53935'}}>Cyclic Group</span>
          ) : (
            <>
              <b>Tree:</b>
              <pre>{JSON.stringify(h.tree, null, 2)}</pre>
              <b>Depth:</b> {h.depth}
            </>
          )}
        </div>
      ))}
      <h4>Summary:</h4>
      <ul>
        <li>Total Trees: {result.summary?.total_trees}</li>
        <li>Total Cycles: {result.summary?.total_cycles}</li>
        <li>Largest Tree Root: {result.summary?.largest_tree_root}</li>
      </ul>
      <h4>Invalid Entries:</h4>
      <pre>{JSON.stringify(result.invalid_entries || [], null, 2)}</pre>
      <h4>Duplicate Edges:</h4>
      <pre>{JSON.stringify(result.duplicate_edges || [], null, 2)}</pre>
    </div>
  );
}

function App() {
  const [input, setInput] = useState(
`A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null); setErr(null); setLoading(true);
    try {
      const arr = input.split('\n').map(s=>s.trim()).filter(Boolean);
     const response = await fetch('http://localhost:5000/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({data: arr})
      });
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setResult(data);
    } catch (ex) {
      setErr(ex.message);
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <h2>SRM BFHL Hierarchy API Demo</h2>
      <form onSubmit={handleSubmit}>
        <label>Enter node relationships (one per line):</label><br/>
        <textarea value={input} onChange={e=>setInput(e.target.value)} />
        <br/>
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Submit"}</button>
      </form>
      {err && <div className="error">{err}</div>}
      <ResultPretty result={result}/>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);