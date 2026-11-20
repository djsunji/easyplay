// Räume für Live-Wettbewerb und Online-Duell (server/raum.js). Aufruf wie die anderen Tests: TEST_URL=http://localhost:8090 node --test server/test/
import { test } from "node:test";
import assert from "node:assert/strict";

const B = process.env.TEST_URL || "http://localhost:8090";
const raum = (b) => fetch(B + "/api/raum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

test("Raum: beitreten, sehen, Stand ändern, verlassen", async () => {
  const r = "easyplay-" + (1000 + Math.floor(Math.random() * 9000));
  let x = await raum({ raum: r, peer: "gastgeber1", presence: { role: "host", phase: "lobby" } });
  assert.equal(x.status, 200); assert.deepEqual((await x.json()).peers, []);
  x = await raum({ raum: r, peer: "spieler001", presence: { role: "player", name: "Lea" } });
  let d = await x.json(); assert.equal(d.peers.length, 1); assert.equal(d.peers[0].presence.role, "host");
  x = await raum({ raum: r, peer: "gastgeber1", presence: { role: "host", phase: "q" } });
  d = await x.json(); assert.equal(d.peers[0].presence.name, "Lea");
  x = await raum({ raum: r, peer: "spieler001", presence: null });
  d = await x.json(); assert.equal(d.peers[0].presence.phase, "q", "ohne presence bleibt der alte Stand");
  await raum({ raum: r, peer: "spieler001", weg: true });
  d = await (await raum({ raum: r, peer: "gastgeber1" })).json(); assert.equal(d.peers.length, 0);
  assert.equal((await raum({ raum: "anderer-raum", peer: "gastgeber1" })).status, 400);
  assert.equal((await raum({ raum: r, peer: "x" })).status, 400);
});
