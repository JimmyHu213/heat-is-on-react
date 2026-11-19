// Generate a Firebase CLI config rooted in the checkout so relative paths stay valid.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile("firebase.json", "utf8"));
const rules = await readFile(source.firestore.rules, "utf8");
const legacy = "return true; // CCS password transition";
if (rules.split(legacy).length !== 2) throw new Error("Expected one CCS transition rule");
await mkdir(".firebase", { recursive: true });
source.firestore.rules = ".firebase/ccs-only.rules";
await writeFile(source.firestore.rules, rules.replace(legacy, "return false;"));
await writeFile("firebase.ccs-only.generated.json", JSON.stringify(source));
