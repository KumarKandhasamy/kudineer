/* monthly-sheet.js – Excel-like monthly table with MLD/Litres toggle */
import { METERS, LITRES_COLUMNS, MONTHS, fmtDateDisplay, fmtNum } from '../lib/calculations.js';
import { getMonthlyTable } from '../lib/store.js';

// Persisted view mode
let viewMode = 'litres'; // 'mld' | 'litres'

export function renderMonthlySheet(el, selMonth, selYear) {
  const month = selMonth ?? new Date().getMonth();
  const year = selYear ?? 2026;
  const rows = getMonthlyTable(month, year);

  const mldMeters  = METERS; // columns for MLD view
  const litMeters  = LITRES_COLUMNS; // columns for Litres view
  const c138m = mldMeters.filter(m => m.scheme === 'CWSS-138');
  const c238m = mldMeters.filter(m => m.scheme === 'CWSS-238');
  const c138l = litMeters.filter(c => c.scheme === 'CWSS-138');
  const c238l = litMeters.filter(c => c.scheme === 'CWSS-238');

  const isMLD = viewMode === 'mld';

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">📋 Monthly Readings</div>
      <div class="section-subtitle">Punjai Thalavaipalayam CWSS 138/238</div>
    </div>

    <div class="filters-bar">
      <div class="select-wrap">
        <select id="mSel">${MONTHS.map((m,i) => `<option value="${i}"${i===month?' selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="select-wrap" style="max-width:90px">
        <select id="ySel">
          <option value="2025">2025</option>
          <option value="2026" selected>2026</option>
          <option value="2027">2027</option>
        </select>
      </div>
      <div class="view-toggle-group">
        <button class="view-toggle-btn ${!isMLD ? '' : 'active'}" data-mode="mld">MLD</button>
        <button class="view-toggle-btn ${isMLD ? '' : 'active'}" data-mode="litres">Litres</button>
      </div>
    </div>

    ${isMLD ? renderMLDTable(rows, c138m, c238m) : renderLitresTable(rows, c138l, c238l)}

    <p style="font-size:.68rem;color:var(--text-muted);text-align:center;margin-top:6px">← Scroll horizontally for all meters →</p>
  `;

  // Month / Year change
  el.querySelector('#mSel').onchange = e => renderMonthlySheet(el, +e.target.value, +el.querySelector('#ySel').value);
  el.querySelector('#ySel').onchange = e => renderMonthlySheet(el, +el.querySelector('#mSel').value, +e.target.value);

  // View toggle
  el.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      viewMode = btn.dataset.mode;
      renderMonthlySheet(el, +el.querySelector('#mSel').value, +el.querySelector('#ySel').value);
    };
  });
}

/* ---------- MLD Table ---------- */
function renderMLDTable(rows, c138, c238) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="3" style="min-width:36px">S.No</th>
            <th rowspan="3" style="min-width:64px">Date</th>
            <th colspan="${c138.length + c238.length}" class="gh">Water Meter Reading (MLD)</th>
          </tr>
          <tr>
            <th colspan="${c138.length}" class="gh">CWSS-138</th>
            <th colspan="${c238.length}" class="gh2">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map(m => `<th>${m.shortName}</th>`).join('')}
            ${c238.map(m => `<th>${m.shortName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) return `<tr class="row-total"><td></td><td style="text-align:left;font-weight:800">Total</td>${[...c138,...c238].map(() => '<td></td>').join('')}</tr>`;
            if (r.isAvg)   return `<tr class="row-avg"><td></td><td style="text-align:left;font-weight:700">Average</td>${[...c138,...c238].map(() => '<td></td>').join('')}</tr>`;
            return `<tr class="${r.isBase ? 'row-base' : ''}">
              <td class="cs">${r.sno}</td>
              <td class="cd">${fmtDateDisplay(r.date)}</td>
              ${[...c138,...c238].map(m => { const v = r.mld[m.id]; return `<td class="${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Litres Table ---------- */
function renderLitresTable(rows, c138, c238) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="3" style="min-width:36px">S.No</th>
            <th rowspan="3" style="min-width:64px">Date</th>
            <th colspan="${c138.length + c238.length}" class="gh2">Water Meter Reading (Litres)</th>
          </tr>
          <tr>
            <th colspan="${c138.length}" class="gh">CWSS-138</th>
            <th colspan="${c238.length}" class="gh2">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map(c => `<th>${c.name}</th>`).join('')}
            ${c238.map(c => `<th>${c.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              return `<tr class="row-total"><td></td><td style="text-align:left;font-weight:800">Total</td>${[...c138,...c238].map((c,i) => i===0?'':(`<td class="${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`)).join('')}</tr>`;
            }
            if (r.isAvg) {
              return `<tr class="row-avg"><td></td><td style="text-align:left;font-weight:700">Average</td>${[...c138,...c238].map((c,i) => i===0?'':(`<td class="${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`)).join('')}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cs">${r.sno}</td><td class="cd">${fmtDateDisplay(r.date)}</td>${[...c138,...c238].map(() => '<td class="ce">—</td>').join('')}</tr>`;
            }
            return `<tr>
              <td class="cs">${r.sno}</td>
              <td class="cd">${fmtDateDisplay(r.date)}</td>
              ${[...c138,...c238].map(c => { const v = r.litres[c.id]; return `<td class="${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
