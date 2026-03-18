import { useState, useEffect } from "react";

// ─── CONFIGURACIÓN ─────────────────────────────────────────────────
// 👇 Cambia estos nombres por los alumnos reales de tu curso
const ALUMNOS = [
  "Alumno 1","Alumno 2","Alumno 3","Alumno 4","Alumno 5",
  "Alumno 6","Alumno 7","Alumno 8","Alumno 9","Alumno 10",
];

// 👇 Cambia por el link de tu Google Form de comprobantes
const FORM_COMPROBANTE_URL = "https://forms.google.com/TU_FORM_AQUI";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CONCEPTOS = ["Cuota mensual","Actividad / Paseo","Materiales","Otro"];
const CATEGORIAS_GASTO = ["Actividades / Paseos","Materiales y útiles","Celebraciones","Refacciones","Otros"];
const MES_ACTUAL = MESES[new Date().getMonth()];
const fmt = (n) => (n||0).toLocaleString("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0});

// ─── API ────────────────────────────────────────────────────────────
const API = "/api/sheets";
async function sheetsCall(body) {
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── Storage local ──────────────────────────────────────────────────
function useStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ─── Estilos ────────────────────────────────────────────────────────
const C = {
  bg:"#06100a", card:"#0b1e12", border:"#183824",
  green:"#4ade80", greenDim:"#1a4d2e", greenText:"#86efac",
  orange:"#fb923c", red:"#f87171", yellow:"#fbbf24",
  text:"#d1fae5", textDim:"#4d8a62", textMuted:"#2d5a3d",
};
const inp = {
  width:"100%", background:"#060f09", border:`1px solid ${C.border}`,
  borderRadius:10, padding:"11px 14px", color:C.text,
  fontFamily:"'DM Mono',monospace", fontSize:13, outline:"none",
  boxSizing:"border-box", transition:"border-color .2s",
};
const cardS = { background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden" };
const bdr = { borderBottom:`1px solid ${C.border}` };

// ─── Toast ──────────────────────────────────────────────────────────
function Toast({ msg, type="ok", onClose }) {
  useEffect(() => { if(msg) { const t=setTimeout(onClose,3200); return ()=>clearTimeout(t); } }, [msg]);
  if(!msg) return null;
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:type==="err"?"#3a0f0f":"#0f2a18",
      color:type==="err"?C.red:C.green,
      padding:"12px 26px",borderRadius:40,fontFamily:"'DM Mono',monospace",
      fontWeight:600,fontSize:13,boxShadow:"0 8px 32px #0008",zIndex:9999,
      border:`1px solid ${type==="err"?C.red+"33":C.green+"33"}`,
      animation:"fadeup .3s ease",whiteSpace:"nowrap"}}>
      {msg}
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────
function Spin({ label }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:40}}>
      <div style={{width:28,height:28,border:`3px solid ${C.greenDim}`,
        borderTop:`3px solid ${C.green}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      {label && <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:12}}>{label}</span>}
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────
function Nav({ view, setView, isAdmin, setIsAdmin, setupDone }) {
  const adminTabs = [
    ["resumen","📊","Resumen"],["pagos","💰","Pagos"],
    ["gastos","📤","Gastos"],["control","✅","Control"],
  ];
  return (
    <nav style={{background:"#040d07",borderBottom:`1px solid ${C.border}`,
      padding:"0 20px",display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",
      position:"sticky",top:0,zIndex:100}}>
      <div style={{padding:"16px 0 12px",marginRight:16}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,
          fontSize:18,color:C.green,letterSpacing:-.3}}>🏫 Tesorería 2026</span>
      </div>
      {isAdmin ? adminTabs.map(([k,icon,label])=>(
        <button key={k} onClick={()=>setView(k)} style={{
          background:view===k?C.greenDim:"transparent",
          color:view===k?C.green:C.textDim,
          border:"none",padding:"8px 14px",borderRadius:8,cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontWeight:600,fontSize:12,
          display:"flex",alignItems:"center",gap:5,transition:"all .15s",
        }}>{icon} <span>{label}</span></button>
      )) : (
        <button onClick={()=>setView("form")} style={{
          background:view==="form"?C.greenDim:"transparent",
          color:view==="form"?C.green:C.textDim,border:"none",
          padding:"8px 14px",borderRadius:8,cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontWeight:600,fontSize:12,
        }}>📝 Registrar Pago</button>
      )}
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
        {isAdmin && setupDone && (
          <a href={`https://docs.google.com/spreadsheets/d/1PjyUW_Jq8R9eBIJdftbr8jK6V_OhX8w51UcRaFv5-cs`}
            target="_blank" rel="noreferrer" style={{
            color:C.textDim,fontSize:11,fontFamily:"'DM Mono',monospace",
            textDecoration:"none",padding:"6px 12px",
            border:`1px solid ${C.border}`,borderRadius:16,
          }}>📊 Drive</a>
        )}
        <button onClick={()=>{setIsAdmin(!isAdmin);setView(isAdmin?"form":"resumen");}} style={{
          background:isAdmin?"#1a0808":C.greenDim,
          color:isAdmin?C.red:C.green,
          border:`1px solid ${isAdmin?"#5a1a1a":C.greenDim}`,
          padding:"6px 14px",borderRadius:20,cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontWeight:600,fontSize:11,
        }}>{isAdmin?"👤 Apoderado":"🔐 Tesorera"}</button>
      </div>
    </nav>
  );
}

// ─── Form Apoderado ─────────────────────────────────────────────────
function FormApoderado({ setToast, ingresos, setIngresos }) {
  const [form, setForm] = useState({ alumno:"", concepto:CONCEPTOS[0], mes:MES_ACTUAL, monto:"", nota:"" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if(!form.alumno||!form.monto||isNaN(+form.monto)||+form.monto<=0) {
      setToast({msg:"⚠️ Selecciona alumno e ingresa monto válido",type:"err"}); return;
    }
    setSaving(true);
    const fecha = new Date().toLocaleDateString("es-CL");
    const ts = new Date().toISOString();
    const nuevo = { id:Date.now(), fecha, ...form, monto:+form.monto };

    // Guardar localmente
    setIngresos(p=>[...p, nuevo]);

    // Guardar en Google Sheets
    const res = await sheetsCall({
      action:"append", sheet:"Ingresos",
      row:[fecha, form.alumno, form.concepto, form.mes, +form.monto, form.nota||"", ts]
    });
    setSaving(false);

    if(res.success) {
      setToast({msg:"✅ Pago guardado en Google Sheets",type:"ok"});
      setSent(true);
      setForm({alumno:"",concepto:CONCEPTOS[0],mes:MES_ACTUAL,monto:"",nota:""});
      setTimeout(()=>setSent(false), 4000);
    } else {
      setToast({msg:"⚠️ Guardado local, revisa Drive: "+res.error?.slice(0,50),type:"err"});
    }
  };

  return (
    <div style={{maxWidth:460,margin:"36px auto",padding:"0 16px"}}>
      <div style={cardS}>
        <div style={{background:"linear-gradient(135deg,#0f2a18,#071510)",padding:"24px 28px 18px",...bdr}}>
          <h2 style={{margin:0,fontFamily:"'Playfair Display',serif",fontSize:22,color:C.greenText}}>
            Registrar Pago
          </h2>
          <p style={{margin:"6px 0 0",color:C.textDim,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
            Completa el formulario — queda guardado automáticamente
          </p>
        </div>
        <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:15}}>
          {[
            {label:"👤 Alumno/a",k:"alumno",type:"sel",opts:["", ...ALUMNOS]},
            {label:"📋 Concepto",k:"concepto",type:"sel",opts:CONCEPTOS},
            {label:"📅 Mes que paga",k:"mes",type:"sel",opts:MESES},
            {label:"💵 Monto ($)",k:"monto",type:"number",ph:"Ej: 5000"},
            {label:"📝 Nota (opcional)",k:"nota",type:"text",ph:"Ej: Transferencia N°123"},
          ].map(({label,k,type,opts,ph})=>(
            <div key={k}>
              <label style={{display:"block",marginBottom:5,color:C.textDim,fontSize:10,
                fontFamily:"'DM Mono',monospace",fontWeight:600,letterSpacing:.8,
                textTransform:"uppercase"}}>{label}</label>
              {type==="sel"
                ? <select value={form[k]} onChange={e=>set(k,e.target.value)} style={inp}>
                    {opts.map(o=><option key={o} value={o}>{o||"— Selecciona —"}</option>)}
                  </select>
                : <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)}
                    placeholder={ph} style={inp}/>
              }
            </div>
          ))}

          {/* Aviso comprobante */}
          <div style={{background:"#070f09",border:`1px solid #1a3a22`,borderRadius:10,
            padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,
            color:C.textDim,lineHeight:1.6}}>
            📎 Después de enviar, sube tu comprobante aquí:<br/>
            <a href={FORM_COMPROBANTE_URL} target="_blank" rel="noreferrer"
              style={{color:C.green,fontWeight:600}}>
              → Formulario de Comprobantes
            </a>
          </div>

          <button onClick={submit} disabled={saving} style={{
            marginTop:4,
            background:saving?"#0f2a18":"linear-gradient(135deg,#166534,#14532d)",
            color:saving?C.textDim:C.green,
            border:`1px solid ${saving?C.border:"#166534"}`,
            borderRadius:12,padding:"14px",fontFamily:"'DM Mono',monospace",
            fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",transition:"all .2s",
          }}>
            {saving ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{display:"inline-block",width:14,height:14,border:`2px solid ${C.greenDim}`,
                borderTop:`2px solid ${C.green}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              Guardando en Drive...
            </span> : "✅ Enviar Pago"}
          </button>

          {sent && (
            <div style={{textAlign:"center",background:"#0f2a18",border:`1px solid ${C.greenDim}`,
              borderRadius:10,padding:"12px",fontFamily:"'DM Mono',monospace",fontSize:13,
              color:C.green,lineHeight:1.6}}>
              ¡Pago registrado! 🎉<br/>
              <span style={{fontSize:11,color:C.textDim}}>No olvides subir el comprobante</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Resumen ────────────────────────────────────────────────────────
function Resumen({ ingresos, gastos }) {
  const totalIng = ingresos.reduce((a,b)=>a+b.monto,0);
  const totalGas = gastos.reduce((a,b)=>a+b.monto,0);
  const saldo = totalIng - totalGas;
  const porMes = MESES.map(mes=>({
    mes:mes.slice(0,3),
    ing:ingresos.filter(p=>p.mes===mes).reduce((a,b)=>a+b.monto,0),
    gas:gastos.filter(p=>p.mes===mes).reduce((a,b)=>a+b.monto,0),
  }));
  const maxV = Math.max(...porMes.map(m=>Math.max(m.ing,m.gas)),1);

  return (
    <div style={{maxWidth:860,margin:"28px auto",padding:"0 16px",display:"flex",flexDirection:"column",gap:18}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {[
          {l:"Total Ingresos",v:fmt(totalIng),c:C.green,bg:"#0b2016",bd:"#1e5a30"},
          {l:"Total Gastos",v:fmt(totalGas),c:C.orange,bg:"#1a0d08",bd:"#5a2a10"},
          {l:"Saldo Disponible",v:fmt(saldo),c:saldo>=0?"#60d8ff":C.red,
           bg:saldo>=0?"#07151e":"#1a0808",bd:saldo>=0?"#1a4a5a":"#5a1a1a"},
        ].map(({l,v,c,bg,bd})=>(
          <div key={l} style={{background:bg,border:`1px solid ${bd}`,borderRadius:14,padding:"18px 22px"}}>
            <div style={{color:C.textMuted,fontSize:10,fontFamily:"'DM Mono',monospace",
              fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{l}</div>
            <div style={{color:c,fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{...cardS,padding:22}}>
        <div style={{...bdr,paddingBottom:14,marginBottom:16,display:"flex",
          justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontFamily:"'Playfair Display',serif",color:C.greenText,fontSize:16}}>
            Ingresos vs Gastos por Mes
          </h3>
          <div style={{display:"flex",gap:14}}>
            {[["#2e7d52","Ingresos"],["#b45309","Gastos"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:2,background:c}}/>
                <span style={{color:C.textDim,fontSize:11,fontFamily:"'DM Mono',monospace"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:120,padding:"0 4px"}}>
          {porMes.map(({mes,ing,gas})=>(
            <div key={mes} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:95}}>
                <div title={`Ingresos: ${fmt(ing)}`} style={{flex:1,background:"#2e7d52",
                  borderRadius:"3px 3px 0 0",height:`${(ing/maxV)*100}%`,
                  minHeight:ing>0?3:0,transition:"height .5s"}}/>
                <div title={`Gastos: ${fmt(gas)}`} style={{flex:1,background:"#b45309",
                  borderRadius:"3px 3px 0 0",height:`${(gas/maxV)*100}%`,
                  minHeight:gas>0?3:0,transition:"height .5s"}}/>
              </div>
              <span style={{color:C.textMuted,fontSize:9,fontFamily:"'DM Mono',monospace"}}>{mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos movimientos */}
      <div style={cardS}>
        <div style={{padding:"16px 22px",...bdr}}>
          <h3 style={{margin:0,fontFamily:"'Playfair Display',serif",color:C.greenText,fontSize:16}}>
            Últimos Movimientos
          </h3>
        </div>
        <div style={{padding:"0 22px"}}>
          {[...ingresos.map(i=>({...i,tipo:"ing"})),...gastos.map(g=>({...g,tipo:"gas"}))]
            .sort((a,b)=>b.id-a.id).slice(0,10).map(m=>(
            <div key={m.id} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"11px 0",...bdr}}>
              <div>
                <div style={{color:C.text,fontSize:13,fontFamily:"'DM Mono',monospace",fontWeight:600}}>
                  {m.tipo==="ing" ? m.alumno : m.concepto}
                </div>
                <div style={{color:C.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:2}}>
                  {m.fecha} · {m.mes||m.categoria}
                  {m.tipo==="ing" && <span style={{color:C.textMuted}}> · {m.concepto}</span>}
                </div>
              </div>
              <div style={{color:m.tipo==="ing"?C.green:C.orange,
                fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13}}>
                {m.tipo==="ing"?"+":"-"}{fmt(m.monto)}
              </div>
            </div>
          ))}
          {ingresos.length===0&&gastos.length===0&&(
            <p style={{color:C.textMuted,textAlign:"center",padding:28,
              fontFamily:"'DM Mono',monospace",fontSize:13}}>Sin movimientos aún</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagos ──────────────────────────────────────────────────────────
function Pagos({ ingresos }) {
  const total = ingresos.reduce((a,b)=>a+b.monto,0);
  return (
    <div style={{maxWidth:900,margin:"28px auto",padding:"0 16px"}}>
      <div style={cardS}>
        <div style={{padding:"18px 22px",...bdr,display:"flex",
          justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,color:C.greenText,fontFamily:"'Playfair Display',serif",fontSize:17}}>
            💰 Registro de Ingresos
          </h3>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <span style={{color:C.green,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14}}>
              {fmt(total)}
            </span>
            <span style={{color:C.textDim,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              {ingresos.length} registros
            </span>
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Mono',monospace"}}>
            <thead>
              <tr style={{background:"#071510"}}>
                {["Fecha","Alumno","Concepto","Mes","Monto","Nota"].map(h=>(
                  <th key={h} style={{padding:"10px 16px",textAlign:"left",color:C.textDim,
                    fontSize:10,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingresos.length===0 ? (
                <tr><td colSpan={6} style={{textAlign:"center",padding:36,
                  color:C.textMuted,fontFamily:"'DM Mono',monospace",fontSize:13}}>
                  Sin registros aún
                </td></tr>
              ) : [...ingresos].reverse().map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?C.card:"#0d2016",...bdr}}>
                  <td style={{padding:"10px 16px",color:C.textDim,fontSize:12}}>{r.fecha}</td>
                  <td style={{padding:"10px 16px",color:C.text,fontSize:12,fontWeight:600}}>{r.alumno}</td>
                  <td style={{padding:"10px 16px",color:C.textDim,fontSize:12}}>{r.concepto}</td>
                  <td style={{padding:"10px 16px",color:C.textDim,fontSize:12}}>{r.mes}</td>
                  <td style={{padding:"10px 16px",color:C.green,fontSize:12,fontWeight:700}}>{fmt(r.monto)}</td>
                  <td style={{padding:"10px 16px",color:C.textMuted,fontSize:12}}>{r.nota||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{color:C.textMuted,fontSize:11,fontFamily:"'DM Mono',monospace",
        textAlign:"center",marginTop:12}}>
        💡 Todos los registros también están en tu Google Sheets para auditoría
      </p>
    </div>
  );
}

// ─── Gastos ─────────────────────────────────────────────────────────
function Gastos({ gastos, setGastos, setToast }) {
  const [form, setForm] = useState({concepto:"",categoria:CATEGORIAS_GASTO[0],monto:"",nota:""});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if(!form.concepto||!form.monto||isNaN(+form.monto)||+form.monto<=0) {
      setToast({msg:"⚠️ Completa concepto y monto",type:"err"}); return;
    }
    setSaving(true);
    const fecha = new Date().toLocaleDateString("es-CL");
    const ts = new Date().toISOString();
    const nuevo = {id:Date.now(), fecha, ...form, monto:+form.monto};
    setGastos(p=>[...p, nuevo]);

    const res = await sheetsCall({
      action:"append", sheet:"Gastos",
      row:[fecha, form.concepto, form.categoria, +form.monto, form.nota||"", ts]
    });
    setSaving(false);
    if(res.success) setToast({msg:"✅ Gasto guardado en Drive",type:"ok"});
    else setToast({msg:"⚠️ Local OK, Drive falló: "+res.error?.slice(0,50),type:"err"});
    setForm({concepto:"",categoria:CATEGORIAS_GASTO[0],monto:"",nota:""});
  };

  return (
    <div style={{maxWidth:900,margin:"28px auto",padding:"0 16px",
      display:"grid",gridTemplateColumns:"320px 1fr",gap:18,alignItems:"start"}}>
      {/* Form */}
      <div style={{...cardS,padding:22}}>
        <h3 style={{margin:"0 0 18px",color:C.yellow,fontFamily:"'Playfair Display',serif",fontSize:17}}>
          📤 Nuevo Gasto
        </h3>
        {[
          {l:"Descripción",k:"concepto",type:"text",ph:"Ej: Compra materiales arte"},
          {l:"Categoría",k:"categoria",type:"sel",opts:CATEGORIAS_GASTO},
          {l:"Monto ($)",k:"monto",type:"number",ph:"Ej: 12000"},
          {l:"Nota (opcional)",k:"nota",type:"text",ph:"Ej: Boleta N°45"},
        ].map(({l,k,type,opts,ph})=>(
          <div key={k} style={{marginBottom:13}}>
            <label style={{display:"block",marginBottom:4,color:"#78716c",fontSize:10,
              fontFamily:"'DM Mono',monospace",fontWeight:600,letterSpacing:.6,
              textTransform:"uppercase"}}>{l}</label>
            {type==="sel"
              ? <select value={form[k]} onChange={e=>set(k,e.target.value)}
                  style={{...inp,borderColor:"#3d2e1a",color:"#fde68a",background:"#0f0a05"}}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              : <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)}
                  placeholder={ph} style={{...inp,borderColor:"#3d2e1a",color:"#fde68a",background:"#0f0a05"}}/>
            }
          </div>
        ))}
        <button onClick={submit} disabled={saving} style={{
          width:"100%",background:saving?"#1a1208":"linear-gradient(135deg,#92400e,#78350f)",
          color:saving?"#78716c":"#fde68a",border:"none",borderRadius:12,padding:"13px",
          fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,
          cursor:saving?"not-allowed":"pointer",marginTop:4,
        }}>
          {saving?"⏳ Guardando...":"Registrar Gasto"}
        </button>
      </div>

      {/* Tabla */}
      <div style={cardS}>
        <div style={{padding:"16px 20px",...bdr,display:"flex",
          justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,color:C.greenText,fontFamily:"'Playfair Display',serif",fontSize:16}}>
            Historial de Gastos
          </h3>
          <span style={{color:C.orange,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13}}>
            {fmt(gastos.reduce((a,b)=>a+b.monto,0))}
          </span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Mono',monospace"}}>
            <thead><tr style={{background:"#071510"}}>
              {["Fecha","Concepto","Categoría","Monto"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",color:C.textDim,
                  fontSize:10,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {gastos.length===0 ? (
                <tr><td colSpan={4} style={{textAlign:"center",padding:28,
                  color:C.textMuted,fontSize:13}}>Sin gastos registrados</td></tr>
              ) : [...gastos].reverse().map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?C.card:"#0d2016",...bdr}}>
                  <td style={{padding:"10px 14px",color:C.textDim,fontSize:12}}>{r.fecha}</td>
                  <td style={{padding:"10px 14px",color:C.text,fontSize:12,fontWeight:600}}>{r.concepto}</td>
                  <td style={{padding:"10px 14px",color:C.textDim,fontSize:12}}>{r.categoria}</td>
                  <td style={{padding:"10px 14px",color:C.orange,fontSize:12,fontWeight:700}}>{fmt(r.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Control ────────────────────────────────────────────────────────
function Control({ ingresos }) {
  const [mesFiltro, setMesFiltro] = useState(MES_ACTUAL);
  const pagosEsteMes = ingresos.filter(p=>p.mes===mesFiltro&&p.concepto==="Cuota mensual");
  const pagaron = [...new Set(pagosEsteMes.map(p=>p.alumno))];
  const noPagaron = ALUMNOS.filter(a=>!pagaron.includes(a));
  const total = pagosEsteMes.reduce((a,b)=>a+b.monto,0);
  const pct = Math.round((pagaron.length/ALUMNOS.length)*100);

  return (
    <div style={{maxWidth:860,margin:"28px auto",padding:"0 16px"}}>
      {/* Selector de mes */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {MESES.map(m=>(
          <button key={m} onClick={()=>setMesFiltro(m)} style={{
            background:mesFiltro===m?C.greenDim:"transparent",
            color:mesFiltro===m?C.green:C.textMuted,
            border:`1px solid ${mesFiltro===m?C.greenDim:C.border}`,
            borderRadius:20,padding:"5px 12px",cursor:"pointer",
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,
          }}>{m.slice(0,3)}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        {[
          {l:"Pagaron",v:pagaron.length,c:C.green,bg:"#0b2016"},
          {l:"Pendientes",v:noPagaron.length,c:C.red,bg:"#1a0808"},
          {l:"Recaudado",v:fmt(total),c:"#60d8ff",bg:"#07151e"},
          {l:"Cumplimiento",v:`${pct}%`,c:pct>=80?C.green:pct>=50?C.yellow:C.red,bg:"#0f0f1a"},
        ].map(({l,v,c,bg})=>(
          <div key={l} style={{background:bg,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"16px 20px",textAlign:"center"}}>
            <div style={{color:c,fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{v}</div>
            <div style={{color:C.textDim,fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:4}}>{l} — {mesFiltro}</div>
          </div>
        ))}
      </div>

      {/* Listas */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardS}>
          <div style={{padding:"14px 18px",...bdr,background:"#0b2016"}}>
            <h4 style={{margin:0,color:C.green,fontFamily:"'DM Mono',monospace",fontSize:13}}>
              ✅ Pagaron ({pagaron.length})
            </h4>
          </div>
          {pagaron.length===0
            ? <p style={{color:C.textMuted,textAlign:"center",padding:24,
                fontFamily:"'DM Mono',monospace",fontSize:12}}>Nadie ha pagado este mes</p>
            : pagaron.map(a=>{
                const monto = pagosEsteMes.filter(p=>p.alumno===a).reduce((s,p)=>s+p.monto,0);
                return <div key={a} style={{display:"flex",justifyContent:"space-between",
                  padding:"10px 18px",...bdr}}>
                  <span style={{color:C.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>{a}</span>
                  <span style={{color:C.green,fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}}>{fmt(monto)}</span>
                </div>;
              })
          }
        </div>
        <div style={{...cardS,border:`1px solid #3a1a14`}}>
          <div style={{padding:"14px 18px",...bdr,background:"#1a0808"}}>
            <h4 style={{margin:0,color:C.red,fontFamily:"'DM Mono',monospace",fontSize:13}}>
              ⏳ Pendientes ({noPagaron.length})
            </h4>
          </div>
          {noPagaron.length===0
            ? <p style={{color:C.textMuted,textAlign:"center",padding:24,
                fontFamily:"'DM Mono',monospace",fontSize:12}}>¡Todos al día! 🎉</p>
            : noPagaron.map(a=>(
                <div key={a} style={{padding:"10px 18px",...bdr}}>
                  <span style={{color:"#f0a090",fontFamily:"'DM Mono',monospace",fontSize:12}}>{a}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── App Principal ──────────────────────────────────────────────────
export default function App() {
  const [ingresos, setIngresos] = useStorage("tesoreria_ingresos", []);
  const [gastos, setGastos] = useStorage("tesoreria_gastos", []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState("form");
  const [toast, setToast] = useState({msg:"",type:"ok"});
  const [setupDone, setSetupDone] = useStorage("tesoreria_setup_done", false);
  const [setupStatus, setSetupStatus] = useState("idle");

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.margin = "0";
    document.body.style.fontFamily = "'DM Mono', monospace";
  }, []);

  // Inicializar sheets al entrar en modo admin por primera vez
  useEffect(() => {
    if(isAdmin && !setupDone && setupStatus==="idle") {
      setSetupStatus("loading");
      sheetsCall({action:"setup"}).then(res => {
        if(res.success) { setSetupDone(true); setSetupStatus("done"); }
        else { setSetupStatus("error"); }
      });
    }
  }, [isAdmin]);

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Mono:wght@400;600;700&display=swap');
        * { box-sizing:border-box; }
        select option { background:#060f09; }
        @keyframes fadeup { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#0b1e12}
        ::-webkit-scrollbar-thumb{background:#1e4d28;border-radius:3px}
        button:hover{opacity:.85}
        input:focus,select:focus{border-color:#2e7d52 !important}
      `}</style>

      <Nav view={view} setView={setView} isAdmin={isAdmin}
           setIsAdmin={setIsAdmin} setupDone={setupDone}/>

      {/* Banner estado Drive */}
      {isAdmin && (
        <div style={{background:"#040d07",borderBottom:`1px solid ${C.border}`,
          padding:"8px 20px",display:"flex",alignItems:"center",gap:8}}>
          {setupStatus==="loading" && <>
            <div style={{width:10,height:10,border:`2px solid ${C.greenDim}`,
              borderTop:`2px solid ${C.green}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
            <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:11}}>
              Conectando con Google Sheets...
            </span>
          </>}
          {(setupStatus==="done"||setupDone) && <>
            <span style={{color:"#2e7d52",fontSize:11}}>●</span>
            <span style={{color:C.textMuted,fontFamily:"'DM Mono',monospace",fontSize:11}}>
              Conectado a Google Sheets · cada registro se guarda automáticamente en tu Drive
            </span>
          </>}
          {setupStatus==="error" && <>
            <span style={{color:C.red,fontSize:11}}>●</span>
            <span style={{color:C.textMuted,fontFamily:"'DM Mono',monospace",fontSize:11}}>
              Sin conexión a Drive — revisa las variables de entorno en Vercel
            </span>
          </>}
        </div>
      )}

      {!isAdmin && <FormApoderado setToast={setToast} ingresos={ingresos} setIngresos={setIngresos}/>}
      {isAdmin && view==="resumen" && <Resumen ingresos={ingresos} gastos={gastos}/>}
      {isAdmin && view==="pagos" && <Pagos ingresos={ingresos}/>}
      {isAdmin && view==="gastos" && <Gastos gastos={gastos} setGastos={setGastos} setToast={setToast}/>}
      {isAdmin && view==="control" && <Control ingresos={ingresos}/>}

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:"",type:"ok"})}/>
    </div>
  );
}
