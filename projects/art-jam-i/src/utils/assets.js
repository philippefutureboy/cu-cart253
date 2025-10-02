export async function loadSvgText(path) {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
  return res.text();
}
