'use strict';
const $ = id => document.getElementById(id);
const form = $('forgeForm');
const ruleInputs = [...form.querySelectorAll('.rule input')];
const seedIds = ['fullName', 'nickname', 'petPartner', 'company', 'birthYear'];
let words = [], worker = null, generation = 0, toastTimer, searchTimer;
let stale = false;
const formatter = new Intl.NumberFormat('en');
function notify(text) {
  $('toast').textContent = text; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
function message(text, error = false) { $('formMessage').textContent = text; $('formMessage').classList.toggle('error', error); }
function status(text, ready = false) { $('resultStatus').textContent = text; $('resultStatus').classList.toggle('ready', ready); }
function controls(busy) {
  $('generateBtn').disabled = busy;
  $('cancelBtn').hidden = !busy;
  $('sampleBtn').disabled = busy;
  $('rulesToggle').disabled = busy;
  form.querySelectorAll('input,select').forEach(el => { el.disabled = busy; });
  $('search').disabled = !words.length;
  $('copyBtn').disabled = !words.length;
  $('downloadBtn').disabled = !words.length;
}
function config() {
  return { inputs: { name: $('fullName').value, nick: $('nickname').value, pet: $('petPartner').value, comp: $('company').value, year: $('birthYear').value }, rules: Object.fromEntries(ruleInputs.map(el => [el.name, el.checked])), min: $('minLength').value, max: $('maxLength').value, sort: $('sort').value };
}
function renderPreview() {
  const query = $('search').value.toLowerCase();
  const preview = []; let matched = 0;
  for (const word of words) { if (word.toLowerCase().includes(query)) { matched++; if (preview.length < 200) preview.push(word); } }
  const fragment = document.createDocumentFragment();
  preview.forEach(word => { const li = document.createElement('li'); li.textContent = word; fragment.appendChild(li); });
  $('wordList').replaceChildren(fragment);
  $('wordList').hidden = !preview.length;
  $('emptyState').hidden = !!preview.length;
  if (!preview.length) {
    $('emptyState').querySelector('h3').textContent = words.length ? 'No matching words.' : 'Good wordlists start here.';
    $('emptyState').querySelector('p').textContent = words.length ? 'Try a different filter. Your full list is still available to export.' : 'Configure your inputs and rules. Your generated candidates will appear here.';
    $('emptyState').querySelector('.empty-command').hidden = !!words.length;
  }
  $('previewCount').textContent = `${formatter.format(matched)} ${query ? 'matches' : 'lines'}`;
  $('previewNote').textContent = `Showing ${preview.length} of ${formatter.format(matched)} ${query ? 'matches' : 'words'}. Copy and export include all ${formatter.format(words.length)} words.`;
}
function textOutput() { return words.length ? words.join('\n') + '\n' : ''; }
function finish() { if (worker) worker.terminate(); worker = null; controls(false); }
function cancel() {
  generation++; finish();
  status(words.length ? (stale ? 'Inputs changed' : 'Ready to export') : 'Awaiting input', words.length > 0 && !stale);
  message('Generation cancelled. Previous output, if any, has been kept.');
}
form.addEventListener('submit', event => {
  event.preventDefault(); if (worker) return;
  if (!form.reportValidity()) return;
  const settings = config();
  if (!Object.values(settings.inputs).some(value => value.trim())) { message('Add a seed word or load the sample to get started.', true); $('fullName').focus(); return; }
  if (Number(settings.min) > Number(settings.max)) { message('Minimum length must not exceed maximum length.', true); $('minLength').focus(); return; }
  const job = ++generation;
  try { worker = new Worker('assets/worker.js'); }
  catch { message('Cannot start the worker. Serve this project over HTTP or use the hosted site.', true); return; }
  controls(true); status('Generating…'); message('Generating in the background. You can cancel at any time.');
  worker.onmessage = ({ data }) => {
    if (job !== generation) return;
    if (data.error) { finish(); status(words.length ? 'Previous output' : 'Check inputs'); message(data.error, true); return; }
    words = data.words; stale = false; $('search').value = '';
    $('wordCount').textContent = formatter.format(words.length);
    $('elapsed').replaceChildren(document.createTextNode(data.elapsed < 1 ? '<1' : Math.round(data.elapsed).toString()), Object.assign(document.createElement('small'), { textContent: ' ms' }));
    const bytes = new Blob([textOutput()]).size;
    $('fileSize').replaceChildren(document.createTextNode(bytes >= 1024 ? (bytes / 1024).toFixed(1) : bytes.toString()), Object.assign(document.createElement('small'), { textContent: bytes >= 1024 ? ' KB' : ' B' }));
    renderPreview(); finish();
    status(words.length ? 'Ready to export' : 'No results', words.length > 0);
    const report = data.limited ? 'Reached the 50,000-word limit. Narrow your rules for a smaller list.' : words.length ? `${formatter.format(words.length)} unique words generated. All results meet your length limits.` : 'No words match these length limits. Adjust them and generate again.';
    message(report); notify(words.length ? 'Your wordlist is ready.' : 'No words match your length limits.');
  };
  worker.onerror = event => { event.preventDefault(); if (job !== generation) return; finish(); status('Worker error'); message('Generation could not start. Reload the page and try again over HTTP.', true); };
  worker.postMessage(settings);
});
$('cancelBtn').addEventListener('click', cancel);
function updateToggle() { $('rulesToggle').textContent = ruleInputs.every(input => input.checked) ? 'Deselect all' : 'Select all'; }
function changed() { if (words.length) { stale = true; status('Inputs changed'); message('Inputs changed. Generate again to update the output. Exports still contain the previous list.'); } updateToggle(); }
form.addEventListener('input', changed);
$('rulesToggle').addEventListener('click', () => { const value = !ruleInputs.every(input => input.checked); ruleInputs.forEach(input => { input.checked = value; }); changed(); });
$('sampleBtn').addEventListener('click', () => {
  ['nova', 'orbit', 'luna', 'lab', '2026'].forEach((value, i) => { $(seedIds[i]).value = value; });
  changed(); if (!words.length) message('Fictional sample loaded. Choose your rules, then forge the wordlist.'); $('fullName').focus();
});
$('clearBtn').addEventListener('click', () => {
  generation++; finish(); form.reset(); words = []; stale = false;
  seedIds.forEach(id => { $(id).value = ''; }); $('search').value = '';
  $('wordCount').textContent = '0'; $('elapsed').textContent = '— ms'; $('fileSize').textContent = '0 B';
  status('Awaiting input'); message('Inputs and output cleared. Nothing has been saved.'); renderPreview(); updateToggle(); controls(false); $('fullName').focus();
});
$('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderPreview, 120); });
$('copyBtn').addEventListener('click', async () => {
  if (!words.length) return;
  const text = textOutput(); const count = words.length;
  try { await navigator.clipboard.writeText(text); notify(`Copied all ${formatter.format(count)} words.`); }
  catch { notify('Clipboard access is unavailable. Download the .txt file to keep the full list.'); }
});
$('downloadBtn').addEventListener('click', () => {
  if (!words.length) return;
  const url = URL.createObjectURL(new Blob([textOutput()], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `wordlist-forge_${new Date().toISOString().slice(0, 10)}_${words.length}.txt`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(`Exported ${formatter.format(words.length)} words.`);
});
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (!worker) form.requestSubmit(); } });
window.addEventListener('pagehide', () => { if (worker) worker.terminate(); });
updateToggle(); controls(false);
