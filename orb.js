(() => {
  const host = document.getElementById("orb");
  if (!host || typeof THREE === "undefined") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 8.2;
  const group = new THREE.Group();
  scene.add(group);

  // nodes on a fibonacci sphere, linked to near neighbours
  const N = 120, R = 1.9, pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963;
    pts.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r).multiplyScalar(R));
  }
  const edges = [], pos = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (pts[i].distanceTo(pts[j]) < 0.62) {
    edges.push([i, j]); pos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 });
  group.add(new THREE.LineSegments(lg, lineMat));

  const pg = new THREE.BufferGeometry().setFromPoints(pts);
  const pointMat = new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0.9 });
  group.add(new THREE.Points(pg, pointMat));

  // inner core and a signal that travels along edges
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.9 }));
  group.add(core);
  const sig = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial());
  group.add(sig);
  let cur = 0, nxt = 0, t = 1;
  const adj = pts.map(() => []);
  edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  function pick() { cur = nxt; const n = adj[cur]; nxt = n.length ? n[(Math.random() * n.length) | 0] : cur; t = 0; }

  function size() {
    const w = host.clientWidth || 1;
    renderer.setSize(w, w, false); camera.aspect = 1; camera.updateProjectionMatrix();
  }
  addEventListener("resize", size); size();

  let tx = 0, ty = 0;
  addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); });

  function colors() {
    const ink = new THREE.Color(css("--ink") || "#14130f"), acc = new THREE.Color(css("--accent") || "#d9432b");
    lineMat.color.copy(ink); pointMat.color.copy(ink); core.material.color.copy(acc); sig.material.color.copy(acc);
  }
  colors();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", colors);

  function frame() {
    if (!document.hidden) {
      if (!reduce) {
        group.rotation.y += 0.0025; core.rotation.x += 0.004; core.rotation.y -= 0.003;
        t += 0.03;
        if (t >= 1) pick();
        sig.position.lerpVectors(pts[cur], pts[nxt], Math.min(t, 1));
      }
      group.rotation.x += (ty * 0.6 - group.rotation.x) * 0.04;
      group.position.x += (tx * 0.5 - group.position.x) * 0.04;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
