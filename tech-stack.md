# Technical Scope & Stack

## 1. Primary Language

* **TypeScript (preferred)**
* JavaScript acceptable where simplicity helps

All core logic should be understandable and reviewable in JS/TS.

---

## 2. System Layers

### Data Layer

* Dataset loaders (e.g., MovieLens adapters)
* Schema normalization
* Deterministic train/test splitting

No hard-coded dataset assumptions.

---

### Modeling Layer

* Matrix factorization (baseline)
* Similarity computation modules
* Graph construction utilities

Models should expose:

* `fit()`
* `score(userId, itemId)` or `rank(userId)`

---

### Ranking & Evaluation Layer

* Top-N ranking generation
* Metric computation:

  * Precision@K
  * NDCG@K
  * MRR

Metrics must be reproducible and dataset-agnostic.

---

### Serving Layer

* API endpoints for recommendations
* Stateless request handling
* Optional caching

---

### Interface Layer (Minimal)

* Simple interactive UI
* Demonstrates real-time recommendation calls
* No visual polish required

---

## 3. Graph Representation

* Bipartite graph: users ↔ items
* Weighted edges (ratings, interactions)
* Traversal-based scoring support

Graph logic must be independent of any specific algorithm.

---

## 4. Extensibility Rules

Every major component must:

* Be swappable
* Have a clear interface
* Avoid leaking implementation details

---

## 5. Engineering Philosophy

* Prefer explicit data flows over magic
* Avoid end-to-end opaque pipelines
* Keep models inspectable

This is a **system you can reason about**, not just run.

---

## 6. Success Criteria

The project is successful if:

* A user can request Top-N recommendations
* Different algorithms can be swapped under the same interface
* Results are explainable and reproducible
* The system feels like a real product backend, not a demo script
