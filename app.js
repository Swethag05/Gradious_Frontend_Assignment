// Simple Form Builder - Vanilla JS
(function(){
  const fieldLibrary = document.getElementById('fieldLibrary')
  const canvas = document.getElementById('canvas')
  const inspector = document.getElementById('inspector')
  const livePreview = document.getElementById('livePreview')
  const formTitle = document.getElementById('formTitle')
  const formDesc = document.getElementById('formDesc')
  const exportBtn = document.getElementById('export-json')
  const downloadHTMLBtn = document.getElementById('download-html')

  let fields = []
  let selectedId = null

  // Utility: generate id
  function uid(prefix='f'){return prefix+Math.random().toString(36).slice(2,9)}

  // Field defaults factory
  function createField(type){
    const id = uid()
    const base = {id,type,label: type.charAt(0).toUpperCase()+type.slice(1),required:false,placeholder:'',options:[]}
    if(type==='radio' || type==='select') base.options = ['Option 1','Option 2']
    if(type==='checkbox') base.checked = false
    return base
  }

  // Render canvas
  function renderCanvas(){
    canvas.innerHTML = ''
    if(fields.length===0){
      const ph = document.createElement('div')
      ph.className = 'placeholder'
      ph.innerText = 'Drop fields here or click a field to add.'
      canvas.appendChild(ph)
      renderPreview()
      inspector.classList.add('empty')
      inspector.innerHTML = '<div class="empty-text">Select a field to edit its properties</div>'
      return
    }
    fields.forEach(f=>{
      const el = document.createElement('div')
      el.className = 'field-card'
      el.dataset.id = f.id

      const meta = document.createElement('div')
      meta.className = 'field-meta'
      const t = document.createElement('div')
      t.innerHTML = `<div style="font-weight:700">${escapeHtml(f.label)}</div><div class="small">${f.type}</div>`
      meta.appendChild(t)

      const actions = document.createElement('div')
      actions.className = 'field-actions'
      const edit = document.createElement('button'); edit.className='iconbtn'; edit.title='Edit'; edit.innerText='✏️'
      const up = document.createElement('button'); up.className='iconbtn'; up.title='Up'; up.innerText='⬆️'
      const down = document.createElement('button'); down.className='iconbtn'; down.title='Down'; down.innerText='⬇️'
      const del = document.createElement('button'); del.className='iconbtn'; del.title='Delete'; del.innerText='🗑️'

      actions.appendChild(edit); actions.appendChild(up); actions.appendChild(down); actions.appendChild(del)

      el.appendChild(meta); el.appendChild(actions)
      canvas.appendChild(el)

      // click to select
      el.addEventListener('click', (ev)=>{
        ev.stopPropagation()
        selectField(f.id)
      })

      edit.addEventListener('click', (ev)=>{ev.stopPropagation(); selectField(f.id)})
      up.addEventListener('click', (ev)=>{ev.stopPropagation(); moveField(f.id,-1)})
      down.addEventListener('click', (ev)=>{ev.stopPropagation(); moveField(f.id,1)})
      del.addEventListener('click', (ev)=>{ev.stopPropagation(); deleteField(f.id)})
    })
    renderPreview()
  }

  function escapeHtml(s){
    return (s+'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
    })
  }

  // Render inspector
  function selectField(id){
    selectedId = id
    const f = fields.find(x=>x.id===id)
    if(!f) return
    inspector.classList.remove('empty')
    inspector.innerHTML = ''

    // label
    inspector.appendChild(makeProperty('Label', 'input', f.label, val=>{f.label=val; renderCanvas()}))
    // placeholder
    inspector.appendChild(makeProperty('Placeholder', 'input', f.placeholder, val=>{f.placeholder=val; renderPreview()}))
    // required
    inspector.appendChild(makeProperty('Required', 'checkbox', f.required, val=>{f.required=val; renderPreview()}))

    if(f.type==='radio' || f.type==='select'){
      const optsWrapper = document.createElement('div')
      optsWrapper.className='property'
      const lab = document.createElement('label'); lab.innerText='Options (one per line)';
      const ta = document.createElement('textarea'); ta.rows=5; ta.value = f.options.join('\n')
      ta.addEventListener('input', ()=>{f.options = ta.value.split('\n').map(s=>s.trim()).filter(Boolean); renderPreview();})
      optsWrapper.appendChild(lab); optsWrapper.appendChild(ta)
      inspector.appendChild(optsWrapper)
    }

    if(f.type==='checkbox'){
      const ch = makeProperty('Checked by default', 'checkbox', f.checked, val=>{f.checked=val; renderPreview()})
      inspector.appendChild(ch)
    }

    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px';
    const cloneBtn = document.createElement('button'); cloneBtn.className='btn'; cloneBtn.innerText='Duplicate';
    const deleteBtn = document.createElement('button'); deleteBtn.className='btn ghost'; deleteBtn.innerText='Delete';
    cloneBtn.addEventListener('click', ()=>{ duplicateField(f.id) })
    deleteBtn.addEventListener('click', ()=>{ deleteField(f.id) })
    row.appendChild(cloneBtn); row.appendChild(deleteBtn)
    inspector.appendChild(row)
  }

  function makeProperty(label, type, value, onChange){
    const wrap = document.createElement('div'); wrap.className='property'
    const lab = document.createElement('label'); lab.innerText = label
    wrap.appendChild(lab)
    if(type==='input'){
      const inp = document.createElement('input'); inp.value = value||''
      inp.addEventListener('input', ()=>{ onChange(inp.value) })
      wrap.appendChild(inp)
    } else if(type==='checkbox'){
      const inp = document.createElement('input'); inp.type='checkbox'; inp.checked = !!value
      inp.addEventListener('change', ()=>{ onChange(inp.checked) })
      wrap.appendChild(inp)
    } else if(type==='textarea'){
      const ta = document.createElement('textarea'); ta.value = value||''
      ta.addEventListener('input', ()=>{ onChange(ta.value) })
      wrap.appendChild(ta)
    }
    return wrap
  }

  function moveField(id, dir){
    const idx = fields.findIndex(x=>x.id===id); if(idx<0) return
    const newIdx = Math.min(Math.max(0, idx+dir), fields.length-1)
    if(newIdx===idx) return
    const item = fields.splice(idx,1)[0]
    fields.splice(newIdx,0,item)
    renderCanvas()
  }

  function deleteField(id){
    fields = fields.filter(x=>x.id!==id)
    if(selectedId===id) selectedId=null
    renderCanvas()
  }

  function duplicateField(id){
    const f = fields.find(x=>x.id===id); if(!f) return
    const copy = JSON.parse(JSON.stringify(f)); copy.id = uid(); copy.label += ' (copy)'
    fields.push(copy); renderCanvas()
  }


  Array.from(fieldLibrary.querySelectorAll('.field-item')).forEach(fi=>{
    fi.addEventListener('click', ()=>{
      const t = fi.dataset.type
      const newf = createField(t)
      fields.push(newf)
      renderCanvas()
      selectField(newf.id)
    })
  })

 
  fieldLibrary.addEventListener('dragstart', e=>{
    e.dataTransfer.setData('text/plain', e.target.dataset.type)
  })
  canvas.addEventListener('dragover', e=>e.preventDefault())
  canvas.addEventListener('drop', e=>{
    e.preventDefault();
    const t = e.dataTransfer.getData('text/plain')
    if(t) { const nf = createField(t); fields.push(nf); renderCanvas(); selectField(nf.id) }
  })

  
  function renderPreview(){
    livePreview.innerHTML = ''
    const title = document.createElement('div'); title.style.fontWeight='700'; title.style.marginBottom='6px'
    title.innerText = formTitle.value || 'Untitled Form'
    livePreview.appendChild(title)
    if(formDesc.value){ const d = document.createElement('div'); d.className='small'; d.style.marginBottom='8px'; d.innerText=formDesc.value; livePreview.appendChild(d) }

    fields.forEach(f=>{
      const row = document.createElement('div'); row.className='preview-row'
      const lab = document.createElement('label'); lab.innerText = f.label + (f.required ? ' *' : '')
      row.appendChild(lab)
      if(f.type==='text' || f.type==='email' || f.type==='number' || f.type==='date'){
        const inp = document.createElement('input'); inp.type = f.type==='text'? 'text' : f.type
        inp.placeholder = f.placeholder||''
        if(f.required) inp.required=true
        row.appendChild(inp)
      } else if(f.type==='textarea'){
        const ta = document.createElement('textarea'); ta.placeholder = f.placeholder || ''
        row.appendChild(ta)
      } else if(f.type==='checkbox'){
        const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=!!f.checked
        row.appendChild(cb)
      } else if(f.type==='radio'){
        f.options.forEach((opt,i)=>{
          const rwrap = document.createElement('label'); rwrap.style.display='flex'; rwrap.style.alignItems='center'; rwrap.style.gap='8px';
          const r = document.createElement('input'); r.type='radio'; r.name = f.id; r.value = opt
          rwrap.appendChild(r); rwrap.appendChild(document.createTextNode(opt))
          row.appendChild(rwrap)
        })
      } else if(f.type==='select'){
        const s = document.createElement('select')
        const empty = document.createElement('option'); empty.value=''; empty.innerText='-- Select --'
        s.appendChild(empty)
        f.options.forEach(opt=>{ const o = document.createElement('option'); o.value=opt; o.innerText=opt; s.appendChild(o) })
        row.appendChild(s)
      }
      livePreview.appendChild(row)
    })
  }

  
  exportBtn.addEventListener('click', ()=>{
    const json = {title: formTitle.value || 'Untitled Form', description: formDesc.value||'', fields}
    const blob = new Blob([JSON.stringify(json,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); 
    a.href=url; 
    a.download='form.json'; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url)
  })


  downloadHTMLBtn.addEventListener('click', ()=>{
    const html = generateStandaloneHTML()
    const blob = new Blob([html],{type:'text/html'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); 
    a.href=url; a.download='form.html'; 
    document.body.appendChild(a); 
    a.click();
     a.remove(); 
     URL.revokeObjectURL(url)
  })

  function generateStandaloneHTML(){
    const metaTitle = escapeHtml(formTitle.value||'Untitled Form')
    const metaDesc = escapeHtml(formDesc.value||'')
    let inner = `<h2>${metaTitle}</h2>` + (metaDesc? `<p>${metaDesc}</p>`: '')
    inner += '<form>'
    fields.forEach(f=>{
      inner += '<div style="margin-bottom:12px">'
      inner += `<label style="display:block;margin-bottom:6px;font-weight:600">${escapeHtml(f.label)}${f.required? ' *':''}</label>`
      if(f.type==='text' || f.type==='email' || f.type==='number' || f.type==='date'){
        inner += `<input type="${f.type==='text'? 'text': f.type}" placeholder="${escapeHtml(f.placeholder||'')}" />`
      } else if(f.type==='textarea'){
        inner += `<textarea placeholder="${escapeHtml(f.placeholder||'')}"></textarea>`
      } else if(f.type==='checkbox'){
        inner += `<input type="checkbox" ${f.checked? 'checked': ''} />`
      } else if(f.type==='radio'){
        f.options.forEach(opt=>{ inner += `<div><label><input type="radio" name="${f.id}" /> ${escapeHtml(opt)}</label></div>` })
      } else if(f.type==='select'){
        inner += `<select><option value="">-- Select --</option>`
        f.options.forEach(opt=>{ inner += `<option>${escapeHtml(opt)}</option>` })
        inner += `</select>`
      }
      inner += '</div>'
    })
    inner += '<button type="submit">Submit</button></form>'

    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${metaTitle}</title><style>body{font-family:Inter, Arial, sans-serif;padding:24px;background:#f6f9fc;color:#0b1220}form input, form textarea, form select{display:block;padding:8px;border:1px solid #d8e1ea;border-radius:8px;width:100%;max-width:480px}button{background:#2563eb;color:#fff;padding:8px 12px;border-radius:8px;border:none;margin-top:8px}</style></head><body>${inner}</body></html>`
  }


  document.addEventListener('click', (e)=>{
    if(!canvas.contains(e.target) && !inspector.contains(e.target)){
      selectedId=null; inspector.classList.add('empty'); inspector.innerHTML = '<div class="empty-text">Select a field to edit its properties</div>'
    }
  })

  
  renderCanvas()

})();
