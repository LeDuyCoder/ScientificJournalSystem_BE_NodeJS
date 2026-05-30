async function test() {
  const r = await fetch('http://localhost:7070/api/v1/articles?search=NON_EXISTENT');
  const d = await r.json();
  console.log(JSON.stringify(d, null, 2));
}

test();
