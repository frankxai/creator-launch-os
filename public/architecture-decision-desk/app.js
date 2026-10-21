(function () {
  'use strict';
  const core = globalThis.ArchitectureReview;
  const byId = id => document.getElementById(id);
  const clone = value => structuredClone(value);
  const limit = 1024 * 1024;
  let decision = clone(core.exampleDecision);
  let origin = 'Worked example · fictional assumptions · no runtime or customer result';
  let incoming = null;
  let incomingOrigin = '';
  let importEpoch = 0;
  let rejectedText = null;
  let lastValid = null;

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  }
  function status(message) { byId('action-status').textContent = message; }
  function button(label, handler, secondary = true) {
    const element = node('button', label, secondary ? 'secondary' : '');
    element.type = 'button'; element.addEventListener('click', handler); return element;
  }
  function changed() {
    origin = 'Edited decision · author declarations · assumptions and evidence need review';
    status('Unsaved edits in this tab. Save working JSON to keep incomplete fields.');
    renderReport();
  }
  function field(parent, id, label, value, onChange, { multiline = true, hint, numeric = false, integer = false, maximum = 4000 } = {}) {
    const wrapper = node('div', undefined, 'field');
    const caption = node('label', label); caption.htmlFor = id; wrapper.append(caption);
    const control = node(multiline ? 'textarea' : 'input'); control.id = id;
    if (multiline) { control.rows = value.length > 180 ? 4 : 2; control.maxLength = maximum; }
    else if (numeric) { control.type = 'number'; control.min = '0'; control.max = String(maximum); control.step = integer ? '1' : 'any'; control.className = 'number-input'; }
    else { control.type = 'text'; control.maxLength = maximum; }
    control.value = numeric && !Number.isFinite(value) ? '' : value;
    control.addEventListener('input', () => { onChange(numeric ? (control.value === '' ? NaN : Number(control.value)) : control.value); changed(); });
    wrapper.append(control);
    if (hint) { const help = node('small', hint); help.id = `${id}-help`; control.setAttribute('aria-describedby', help.id); wrapper.append(help); }
    parent.append(wrapper); return control;
  }
  function section(parent, title, description) {
    const element = node('section', undefined, 'editor-section'); element.append(node('h3', title));
    if (description) element.append(node('p', description)); parent.append(element); return element;
  }
  function rows(parent, key, title, description, columns, defaultRow, minimum) {
    const container = section(parent, title, description);
    decision[key].forEach((row, index) => {
      const item = node('details', undefined, 'row-editor'); item.open = index === 0;
      item.append(node('summary', `${index + 1}. ${row.name || row.id || title}`));
      for (const [name, label] of columns) {
        field(item, `${key}-${index}-${name}`, label, row[name], value => {
          decision[key][index][name] = value;
          if (key === 'options' && (name === 'name' || name === 'id')) {
            item.querySelector('summary').textContent = `${index + 1}. ${row.name || row.id || title}`;
            refreshChoice();
          }
        }, { multiline: !['id', 'name'].includes(name) });
      }
      const remove = button(`Remove ${key === 'options' ? 'alternative' : key === 'failureTests' ? 'test' : 'boundary'} ${index + 1}`, () => {
        if (!window.confirm('Remove this row from the current tab? Save your JSON first to keep a copy.')) return;
        decision[key].splice(index, 1); buildFields(); changed();
      });
      remove.disabled = decision[key].length <= minimum; item.append(remove); container.append(item);
    });
    const add = button(`Add ${key === 'options' ? 'alternative' : key === 'failureTests' ? 'failure test' : 'trust boundary'}`, () => {
      const row = clone(defaultRow);
      if (Object.hasOwn(row, 'id')) { let index = decision[key].length + 1; while (decision[key].some(item => item.id === `new-${index}`)) index++; row.id = `new-${index}`; }
      decision[key].push(row); buildFields(); changed();
    });
    add.disabled = decision[key].length >= 100; container.append(add);
  }
  function refreshChoice() {
    const select = byId('chosen-option'); if (!select) return;
    select.replaceChildren();
    for (const option of decision.options) { const item = node('option', option.name || option.id || 'Untitled alternative'); item.value = option.id; select.append(item); }
    select.value = decision.chosenOption;
  }
  function buildFields() {
    const parent = byId('decision-fields'); parent.replaceChildren();
    for (const [key, label, hint] of [
      ['title', 'Decision title', 'A specific decision another builder can recognize.'],
      ['buyer', 'Who will use the result?', 'Name the person and context. Avoid private client details.'],
      ['userJob', 'What must they get done?', 'Describe the job independently of the technology.'],
      ['activation', 'What first useful result will a reviewer inspect?', 'A deployed page or downloaded file alone does not establish the user result.'],
    ]) field(parent, key, label, decision[key], value => { decision[key] = value; }, { multiline: key !== 'title', hint });
    field(parent, 'constraints', 'Constraints — one per line', decision.constraints.join('\n'), value => { decision.constraints = value.split('\n').filter(line => line.trim()); },
      { hint: 'Include privacy, ownership, budget, reversibility and the simpler baseline where relevant.' });
    rows(parent, 'options', 'Compare alternatives', 'Keep a credible manual or deterministic baseline. No model ranks these options for you.',
      [['id', 'Stable option ID'], ['name', 'Alternative'], ['advantage', 'Advantage for this job'], ['tradeoff', 'Tradeoff']], { id: '', name: '', advantage: '', tradeoff: '' }, 2);
    const choice = node('div', undefined, 'field'); const label = node('label', 'Your choice for a bounded trial'); label.htmlFor = 'chosen-option';
    const select = node('select'); select.id = 'chosen-option'; select.addEventListener('change', () => { decision.chosenOption = select.value; changed(); });
    choice.append(label, select); parent.append(choice); refreshChoice();
    rows(parent, 'trustBoundaries', 'Name the trust boundaries', 'These are boundaries to implement and test, not permissions enforced by this page.',
      [['name', 'Boundary'], ['reads', 'May read'], ['writes', 'May write'], ['approval', 'Human approval or action boundary']], { name: '', reads: '', writes: '', approval: '' }, 1);
    rows(parent, 'failureTests', 'Plan the failure tests', 'State a trigger, observable required result and recovery. These tests have not run here.',
      [['id', 'Stable test ID'], ['trigger', 'Trigger'], ['expected', 'Required result'], ['recovery', 'Recovery']], { id: '', trigger: '', expected: '', recovery: '' }, 1);
    const recovery = section(parent, 'Make the handoff durable');
    for (const [key, label] of [['rollback', 'Rollback'], ['export', 'What must the next reviewer be able to reopen?'], ['communityContribution', 'Reusable contribution'], ['stopRule', 'Stop rule']]) {
      field(recovery, key, label, decision[key], value => { decision[key] = value; });
    }
    buildEconomics();
  }
  function buildEconomics() {
    const parent = byId('economics-fields'); parent.replaceChildren();
    const wrapper = node('div', undefined, 'field'); const label = node('label', 'Currency'); label.htmlFor = 'currency';
    const currency = node('select'); currency.id = 'currency';
    for (const name of ['EUR', 'USD', 'GBP']) { const option = node('option', name); option.value = name; currency.append(option); }
    currency.value = decision.economics.currency;
    currency.addEventListener('change', () => { decision.economics.currency = currency.value; changed(); }); wrapper.append(label, currency); parent.append(wrapper);
    for (const [key, label, integer] of [
      ['monthlyAttempts', 'Monthly attempts — include failures and retries', true], ['expectedAcceptanceRate', 'Assumed acceptance rate, 0–1', false],
      ['inputTokensPerAttempt', 'Input tokens per attempt', true], ['outputTokensPerAttempt', 'Output tokens per attempt', true],
      ['inputRatePerMillion', 'Input rate per million tokens', false], ['outputRatePerMillion', 'Output rate per million tokens', false],
      ['fixedMonthlyCash', 'Fixed monthly cash', false], ['humanMinutesPerAttempt', 'All human minutes per attempt', false],
      ['hourlyTimeValue', 'Assumed hourly time value — not revenue', false], ['monthlyCashLimit', 'Assumed monthly cash limit', false],
    ]) field(parent, `economics-${key}`, label, decision.economics[key], value => { decision.economics[key] = value; },
      { multiline: false, numeric: true, integer, maximum: key === 'expectedAcceptanceRate' ? 1 : 1000000 });
  }
  function table(parent, headers, data, wide = false, selected = -1) {
    const wrapper = node('div', undefined, `table-wrap${wide ? ' wide' : ''}`);
    const element = node('table'); const head = node('thead'); const heading = node('tr');
    for (const text of headers) { const cell = node('th', text); cell.scope = 'col'; heading.append(cell); } head.append(heading); element.append(head);
    const body = node('tbody'); data.forEach((row, index) => { const tr = node('tr'); if (index === selected) tr.className = 'selected'; for (const text of row) tr.append(node('td', text)); body.append(tr); });
    element.append(body); wrapper.append(element); parent.append(wrapper);
  }
  function definition(parent, label, value) { const dl = node('dl'); dl.append(node('dt', label), node('dd', value)); parent.append(dl); }
  const decimal = value => value === null ? 'Unknown' : value.toFixed(2);
  const amount = (value, currency) => value === null ? 'Unknown' : `${value.toFixed(3)} ${currency}`;
  function renderReport() {
    byId('origin-label').textContent = origin;
    byId('observation-note').textContent = `Evidence mode: ${decision.evidenceMode}. ${decision.observations.length} imported attempt rows. Observation window: ${decision.observationWindow ?? 'none'}.`;
    const state = byId('validation-state'); const target = byId('decision-report'); target.replaceChildren(); lastValid = null;
    try {
      const result = core.analyzeDecision(decision);
      lastValid = { input: clone(decision), result, markdown: core.renderMarkdown(decision, result) };
      state.className = 'validation-ok'; state.textContent = 'Input contract valid. Runtime, evidence, rights and release remain separate reviews.';
      const packet = node('article', undefined, 'packet');
      packet.append(node('p', result.evidenceState, 'evidence-state'), node('h2', decision.title));
      packet.append(node('p', 'Authored plan and imported declarations. No runtime, permission or release verification is performed.'));
      definition(packet, 'Buyer', decision.buyer); definition(packet, 'Job', decision.userJob); definition(packet, 'First useful result', decision.activation);
      packet.append(node('h3', 'Constraints')); const constraints = node('ul'); decision.constraints.forEach(text => constraints.append(node('li', text))); packet.append(constraints);
      packet.append(node('h3', 'Decision and alternatives'));
      table(packet, ['Alternative', 'Choice', 'Advantage', 'Tradeoff'], decision.options.map(option => [option.name, option.id === decision.chosenOption ? 'Selected for trial' : 'Alternative', option.advantage, option.tradeoff]), true, decision.options.findIndex(option => option.id === decision.chosenOption));
      packet.append(node('h3', 'Trust boundaries to implement and test'));
      table(packet, ['Boundary', 'Reads', 'Writes', 'Approval'], decision.trustBoundaries.map(row => [row.name, row.reads, row.writes, row.approval]), true);
      packet.append(node('h3', 'Failure tests still to execute'));
      table(packet, ['ID', 'Trigger', 'Required result', 'Recovery'], decision.failureTests.map(row => [row.id, row.trigger, row.expected, row.recovery]), true);
      packet.append(node('h3', 'Monthly forecast from assumptions'), node('p', 'Rates, acceptance, volume and time value are assumptions. Include retries. Check current rates before using a provider.', 'muted'));
      const metrics = node('div', undefined, 'metric-pair');
      for (const [value, label] of [[amount(result.forecast.cash, result.currency), 'Assumed monthly cash'], [amount(result.forecast.cashPerAccepted, result.currency), 'Cash per expected accepted result']]) {
        const metric = node('div', undefined, 'metric'); metric.append(node('strong', value), node('span', label)); metrics.append(metric);
      } packet.append(metrics);
      const f = result.forecast;
      table(packet, ['Metric', 'Assumed result'], [['Attempts / expected accepted', `${f.attempts} / ${decimal(f.accepted)}`], ['Human minutes, all attempts', decimal(f.humanMinutes)], ['Cash plus valued time', amount(f.totalWithTime, result.currency)], ['Total per expected accepted result', amount(f.totalPerAccepted, result.currency)], ['Cash limit / comparison', `${amount(f.monthlyCashLimit, result.currency)} / ${f.budgetState}`]]);
      packet.append(node('h3', 'Imported observations'));
      const o = result.observed;
      if (o === null) packet.append(node('p', 'No observations supplied. Actual cost, activation, time saved and ROI remain unknown.'));
      else {
        packet.append(node('p', `Window: ${o.window}. Coverage and acceptance are unverified user declarations.`));
        table(packet, ['Metric', 'Declared result'], [['All attempts / accepted / not accepted', `${o.attempts} / ${o.accepted} / ${o.notAccepted}`], ['Cash cost, all attempts', amount(o.cash, result.currency)], ['Human minutes, all attempts', decimal(o.humanMinutes)], ['Cash per accepted result', amount(o.cashPerAccepted, result.currency)], ['Cash plus valued time per accepted result', amount(o.totalPerAccepted, result.currency)], ['Net minutes saved against declared baseline', decimal(o.netMinutesSaved)], ['Net time value after cash', amount(o.netTimeValueAfterCash, result.currency)]]);
        table(packet, ['Attempt', 'Outcome', 'Evidence reference to inspect'], decision.observations.map(row => [row.attemptId, row.outcome, row.evidenceRef]));
        packet.append(node('p', 'Time value is not collected revenue or cash profit. Missing accepted baselines leave savings unknown.', 'muted'));
      }
      for (const [title, value] of [['Export and reopen', decision.export], ['Rollback', decision.rollback], ['Reusable contribution', decision.communityContribution], ['Stop rule', decision.stopRule]]) {
        packet.append(node('h3', title), node('p', value));
      }
      packet.append(node('h3', 'Next review'), node('p', 'A distinct reviewer must inspect the implementation, evidence references, costs and actual user result. Planned failure tests are not executed tests. Commercial readiness remains a separate release decision.'));
      target.append(packet);
    } catch (error) { state.className = 'validation-error'; state.textContent = `${error.message}. Keep editing; the current tab has not been replaced. Complete the contract before exporting.`; }
    for (const id of ['save-json', 'save-markdown', 'print-report']) byId(id).disabled = !lastValid;
  }
  function previewImport(value, label, provenance = 'Imported decision · author declarations · not independently verified') {
    const bytes = new TextEncoder().encode(value); if (bytes.byteLength > limit) throw new Error('Choose a UTF-8 JSON decision no larger than 1 MiB.');
    const parsed = JSON.parse(value); core.analyzeDecision(parsed);
    incoming = clone(parsed); incomingOrigin = provenance; rejectedText = null; byId('repair-import').hidden = true;
    byId('import-summary').textContent = `${label}: ${parsed.title}. ${parsed.options.length} alternatives; evidence mode ${parsed.evidenceMode}; ${parsed.observations.length} attempt rows.`;
    byId('import-review').hidden = false; status('Incoming decision is valid. Review it before replacing the current tab.'); byId('apply-import').focus();
  }
  function download(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type })); const anchor = node('a'); anchor.href = url; anchor.download = filename;
    document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`${filename} download requested. Verify the saved file before closing this tab.`);
  }
  byId('save-json').addEventListener('click', () => { if (lastValid) download('architecture-decision.json', JSON.stringify(lastValid.input, null, 2) + '\n', 'application/json'); });
  byId('save-working').addEventListener('click', () => {
    download('architecture-working-unvalidated.json', JSON.stringify(decision, null, 2) + '\n', 'application/json');
    status('Unvalidated working JSON download requested. Empty number fields become null. Reopen an incomplete file through JSON repair before using the strict CLI.');
  });
  byId('save-markdown').addEventListener('click', () => { if (lastValid) download('architecture-review.md', lastValid.markdown, 'text/markdown;charset=utf-8'); });
  byId('print-report').addEventListener('click', () => { if (lastValid) window.print(); });
  byId('load-example').addEventListener('click', () => {
    importEpoch++; previewImport(JSON.stringify(core.exampleDecision), 'Worked example — fictional assumptions', 'Worked example · fictional assumptions · no runtime or customer result');
  });
  byId('decision-file').addEventListener('change', async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const epoch = ++importEpoch;
    let sourceText = null;
    rejectedText = null; byId('repair-import').hidden = true;
    incoming = null; byId('import-review').hidden = true;
    status('Reading on this device. Current decision unchanged.');
    try {
      if (file.size > limit) throw new Error('Choose a decision no larger than 1 MiB.');
      const bytes = await file.arrayBuffer();
      if (epoch !== importEpoch) return;
      sourceText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      previewImport(sourceText, 'Imported file');
    } catch (error) { if (epoch === importEpoch) {
      incoming = null; rejectedText = sourceText; byId('repair-import').hidden = sourceText === null;
      byId('import-review').hidden = true; status(`Import rejected: ${error.message}. Current decision unchanged. UTF-8 text can be opened in JSON repair.`);
    } }
  });
  byId('apply-import').addEventListener('click', () => {
    if (!incoming) return;
    decision = incoming; incoming = null; origin = incomingOrigin; importEpoch++;
    byId('import-review').hidden = true; buildFields(); renderReport(); byId('full-json').value = JSON.stringify(decision, null, 2);
    status('Incoming decision applied to this tab. Download JSON to keep it.'); byId('title').focus();
  });
  byId('cancel-import').addEventListener('click', () => { incoming = null; importEpoch++; byId('import-review').hidden = true; status('Import canceled. Current decision unchanged.'); byId('load-example').focus(); });
  byId('refresh-json').addEventListener('click', () => { byId('full-json').value = JSON.stringify(decision, null, 2); status('Current fields copied into the JSON editor. Applying JSON still requires review.'); });
  byId('repair-import').addEventListener('click', () => {
    if (rejectedText === null) return;
    byId('full-json').value = rejectedText; byId('json-disclosure').open = true; byId('full-json').focus();
    status('Rejected text opened for repair. Current decision is unchanged. Correct the reported fields, then review and apply.');
  });
  byId('save-raw-json').addEventListener('click', () => {
    download('architecture-json-editor-unvalidated.json', byId('full-json').value, 'application/json');
    status('Unvalidated JSON editor text download requested. This preserves the text as written; it may require repair before import or CLI use.');
  });
  byId('review-json').addEventListener('click', () => { importEpoch++; try { previewImport(byId('full-json').value, 'JSON editor'); } catch (error) { incoming = null; byId('import-review').hidden = true; status(`JSON rejected: ${error.message}. Current decision unchanged.`); } });
  byId('source-info').textContent = `Guide source ${core.metadata.sourceRevision}. Review CLI SHA-256 ${core.metadata.sourceSha256}. Example SHA-256 ${core.metadata.exampleSha256}. Design source ${core.metadata.designRevision}.`;
  buildFields(); renderReport(); byId('full-json').value = JSON.stringify(decision, null, 2);
  status('Worked example loaded. Its rates and workflow are illustrative; edit it for your job.');
})();
