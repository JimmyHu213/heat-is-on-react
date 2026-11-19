import assert from "node:assert/strict";
import test from "node:test";
import { createUserWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../src/firebase/config.js";

test("after cut-over a password session loses access and its mapped CCS UID regains it", async () => {
  assert.ok(auth.emulatorConfig);
  const email = "cutover-" + Date.now() + "@example.com";
  const { user } = await createUserWithEmailAndPassword(auth, email, "Password123!");
  const profile = doc(db, "users", user.uid);
  await assert.rejects(setDoc(profile, { email }), { code: "permission-denied" });
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = encode({ alg: "none", typ: "JWT" }) + "." + encode({
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    uid: user.uid, claims: { ccs_email: email, sub_expires: Math.floor(Date.now() / 1000) + 300 },
  }) + ".";
  await signInWithCustomToken(auth, token);
  await setDoc(profile, { userId: user.uid, email });
});
