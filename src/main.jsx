import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import {
  AlertCircle, ArrowRight, BookOpen, Bot, BrainCircuit, Check, ChevronDown, ChevronRight,
  Clock3, Code2, Database, FileCode2, Gauge, GraduationCap, History, Layers3, LoaderCircle,
  Menu, MessageSquareText, Network, PanelRight, Play, Plus, Save, Send, Settings2, Sparkles,
  TestTube2, UserRound, WandSparkles, Zap
} from 'lucide-react';
import './styles.css';

const phases = [
  ['requirements', 'Requirements', MessageSquareText], ['design', 'System design', Network], ['mvp', 'Runnable MVP', Code2],
  ['testing', 'Tests & load', TestTube2], ['bottlenecks', 'Bottlenecks', Gauge], ['scale', '100M+ scale', Zap],
  ['report', 'Optimization', FileCode2], ['interview', 'Interview', GraduationCap]
];
const stacks = ['Spring Boot', 'Node.js', 'NestJS', 'Django', 'Go', 'FastAPI'];
const modes = ['Copilot', 'Interviewer', 'Hints', 'Expert review'];

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
}

function App() {
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [problem, setProblem] = useState('');
  const [stack, setStack] = useState('Spring Boot');
  const [frontend, setFrontend] = useState('React + TypeScript');
  const [mode, setMode] = useState('Copilot');
  const [selectedPhase, setSelectedPhase] = useState('requirements');
  const [rightTab, setRightTab] = useState('Overview');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { api('/sessions').then(setSessions).catch(() => {}); }, []);
  const run = async (label, action) => { setBusy(label); setError(''); try { return await action(); } catch (e) { setError(e.message); } finally { setBusy(''); } };
  const refreshSessions = () => api('/sessions').then(setSessions);
  const createSession = () => run('Analyzing your problem', async () => {
    const data = await api('/sessions', { method: 'POST', body: JSON.stringify({ problem, preferences: { stack, frontend } }) });
    setSession(data); setSelectedPhase('requirements'); setRightTab('Overview'); refreshSessions();
  });
  const openSession = (id) => run('Opening session', async () => { const data = await api(`/sessions/${id}`); setSession(data); setSelectedPhase(data.phase); });
  const generate = (phase) => run(`Generating ${phases.find(x => x[0] === phase)?.[1]}`, async () => {
    const data = await api(`/sessions/${session.id}/phases/${phase}`, { method: 'POST', body: JSON.stringify({ preferences: { stack, frontend } }) });
    setSession(data); setSelectedPhase(phase); setRightTab('Overview'); refreshSessions();
  });
  const send = () => run(`${mode} is thinking`, async () => {
    const data = await api(`/sessions/${session.id}/messages`, { method: 'POST', body: JSON.stringify({ message, mode }) });
    setSession(data); setMessage('');
  });
  const updateRequirements = (key, value) => setSession({ ...session, requirements: { ...session.requirements, [key]: value.split('\n').map(x => x.trim()).filter(Boolean) } });
  const saveRequirements = () => run('Saving requirements', async () => {
    const data = await api(`/sessions/${session.id}/requirements`, { method: 'PATCH', body: JSON.stringify(session.requirements) }); setSession(data); refreshSessions();
  });

  if (!session) return <Landing {...{ problem, setProblem, stack, setStack, frontend, setFrontend, createSession, busy, error, sessions, openSession }} />;
  const artifact = selectedPhase === 'requirements' ? null : session.artifacts[selectedPhase];
  const latestMessage = session.messages.at(-1);

  return <div className="shell">
    <header className="topbar">
      <Brand/><div className="session-title"><span>{session.category}</span><strong>{session.requirements.title}</strong></div>
      <div className="top-actions"><select value={mode} onChange={e => setMode(e.target.value)}>{modes.map(x => <option key={x}>{x}</option>)}</select><button className="ghost" onClick={() => setSession(null)}><Plus size={15}/> New problem</button><div className="avatar">SC</div></div>
    </header>
    <div className="main-grid">
      <Sidebar sessions={sessions} session={session} openSession={openSession} selectedPhase={selectedPhase} setSelectedPhase={setSelectedPhase}/>
      <main className="conversation-panel">
        <div className="conversation-head"><div><span className="kicker">{mode} mode</span><h2>{phases.find(x => x[0] === selectedPhase)?.[1]}</h2></div><span className="saved"><Check size={13}/> Session state saved</span></div>
        <div className="conversation-body">
          <ChatBubble role="user"><p>{session.problem}</p></ChatBubble>
          {selectedPhase === 'requirements' ? <Requirements session={session} updateRequirements={updateRequirements} saveRequirements={saveRequirements} generate={generate} busy={busy}/> : artifact ? <ArtifactConversation artifact={artifact}/> : <EmptyPhase phase={selectedPhase} generate={generate} busy={busy}/>}
          {latestMessage && <><ChatBubble role="user"><p>{latestMessage.message}</p></ChatBubble><ChatBubble role="ai"><h3>{latestMessage.response.title}</h3><p>{latestMessage.response.summary}</p>{latestMessage.response.sections.slice(0,2).map(x => <section key={x.title}><h4>{x.title}</h4><ReactMarkdown>{x.content}</ReactMarkdown></section>)}</ChatBubble></>}
          {error && <div className="error"><AlertCircle size={17}/><div><strong>Could not complete request</strong><span>{error}</span></div></div>}
        </div>
        <div className="composer"><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Ask ${mode.toLowerCase()} to challenge, explain, or refine the design…`}/><button disabled={!message || busy} onClick={send}>{busy?<LoaderCircle className="spin" size={17}/>:<Send size={17}/>}</button></div>
      </main>
      <ArtifactPanel session={session} phase={selectedPhase} artifact={artifact} tab={rightTab} setTab={setRightTab} generate={generate} busy={busy}/>
    </div>
    {busy && <div className="busy-toast"><LoaderCircle className="spin" size={16}/>{busy}. Earlier decisions are being included…</div>}
  </div>;
}

function Brand() { return <div className="brand"><span><BrainCircuit size={19}/></span><div><strong>System Design</strong><em>Copilot</em></div></div> }

function Landing({ problem, setProblem, stack, setStack, frontend, setFrontend, createSession, busy, error, sessions, openSession }) {
  return <div className="landing"><nav><Brand/><span>AI interview preparation workspace</span></nav><main>
    <div className="landing-copy"><span className="hero-chip"><Sparkles size={14}/> Autonomous senior engineer</span><h1>Practice the problem.<br/><em>Master the decisions.</em></h1><p>From requirements to runnable code, load tests, bottleneck analysis, and staff-level review—generated from your exact interview problem.</p></div>
    <div className="prompt-box"><label>What do you want to prepare for?</label><textarea autoFocus value={problem} onChange={e => setProblem(e.target.value)} placeholder="Enter any system design, Java, Spring Boot, database, API, distributed systems, or object-oriented design problem…"/><div className="preferences"><label>Backend<select value={stack} onChange={e => setStack(e.target.value)}>{stacks.map(x=><option key={x}>{x}</option>)}</select></label><label>Frontend<select value={frontend} onChange={e=>setFrontend(e.target.value)}><option>React + TypeScript</option><option>Next.js</option><option>None</option></select></label><button disabled={problem.trim().length<8 || busy} onClick={createSession}>{busy?<LoaderCircle className="spin" size={17}/>:<WandSparkles size={17}/>} Analyze problem</button></div></div>
    {error && <div className="landing-error"><AlertCircle size={16}/>{error}<small>Configure `OPENAI_API_KEY` in your server environment, then restart the app.</small></div>}
    <div className="capabilities">{[[MessageSquareText,'Requirements','Clarify before designing'],[Network,'Architecture','Dynamic Mermaid diagrams'],[Code2,'Runnable MVP','Stack-matched real code'],[Gauge,'Scale review','Load tests & optimization']].map(([I,t,d])=><div key={t}><I size={18}/><strong>{t}</strong><span>{d}</span></div>)}</div>
    {sessions.length>0 && <div className="recent"><h3>Continue a saved session</h3>{sessions.slice(0,3).map(x=><button key={x.id} onClick={()=>openSession(x.id)}><History size={15}/><span><strong>{x.problem}</strong><small>{x.category} · {x.phase}</small></span><ChevronRight size={15}/></button>)}</div>}
  </main></div>
}

function Sidebar({sessions,session,openSession,selectedPhase,setSelectedPhase}) { return <aside className="sidebar"><div className="side-section"><p>WORKFLOW</p>{phases.map(([id,label,Icon],i)=>{const done=id==='requirements'||Boolean(session.artifacts[id]);return <button key={id} className={selectedPhase===id?'active':''} onClick={()=>setSelectedPhase(id)}><span className={done?'done':''}>{done?<Check size={12}/>:<Icon size={14}/>}</span><em>{String(i+1).padStart(2,'0')}</em>{label}</button>})}</div><div className="side-section sessions"><p>SAVED SESSIONS</p>{sessions.slice(0,5).map(x=><button key={x.id} className={x.id===session.id?'current':''} onClick={()=>openSession(x.id)}><Clock3 size={13}/><span>{x.problem}</span></button>)}</div><div className="side-bottom"><button><BookOpen size={15}/> Learning history</button><button><Settings2 size={15}/> Settings</button></div></aside> }

function ChatBubble({role,children}) { return <div className={`bubble ${role}`}><div className="bubble-icon">{role==='user'?<UserRound size={15}/>:<Sparkles size={15}/>}</div><div className="bubble-content">{children}</div></div> }
function Requirements({session,updateRequirements,saveRequirements,generate,busy}) { return <ChatBubble role="ai"><span className="answer-label">REQUIREMENTS ANALYSIS</span><h3>{session.requirements.summary}</h3><p>Do you want to add or modify any requirements before we continue?</p><div className="requirement-editor">{[['functional','Functional requirements'],['nonFunctional','Non-functional requirements'],['constraints','Constraints'],['assumptions','Assumptions']].map(([key,label])=><label key={key}><span>{label}</span><textarea value={session.requirements[key].join('\n')} onChange={e=>updateRequirements(key,e.target.value)}/></label>)}</div><div className="question-list"><strong>Clarifying questions to consider</strong>{session.requirements.clarifyingQuestions.map(q=><p key={q}><ChevronRight size={12}/>{q}</p>)}</div><div className="bubble-actions"><button className="secondary" onClick={saveRequirements}><Save size={14}/> Save changes</button><button disabled={busy} onClick={()=>generate('design')}>Confirm & design <ArrowRight size={14}/></button></div></ChatBubble> }
function ArtifactConversation({artifact}) { return <ChatBubble role="ai"><span className="answer-label">GENERATED FROM SESSION CONTEXT</span><h3>{artifact.title}</h3><p>{artifact.summary}</p>{artifact.sections.map(section=><section key={section.title}><h4>{section.title}</h4><ReactMarkdown>{section.content}</ReactMarkdown></section>)}{artifact.nextQuestion&&<div className="next-question"><Bot size={16}/><span>{artifact.nextQuestion}</span></div>}</ChatBubble> }
function EmptyPhase({phase,generate,busy}) { const label=phases.find(x=>x[0]===phase)?.[1]; return <ChatBubble role="ai"><div className="empty-phase"><span><Layers3 size={22}/></span><h3>Generate {label}</h3><p>This phase will use your problem, edited requirements, preferences, and every completed decision as context.</p><button disabled={busy} onClick={()=>generate(phase)}><Sparkles size={14}/> Generate dynamically</button></div></ChatBubble> }

function ArtifactPanel({session,phase,artifact,tab,setTab,generate,busy}) { const tabs=['Overview','Diagrams','Code','Metrics']; return <aside className="artifact-panel"><div className="artifact-head"><div><PanelRight size={15}/><strong>Design artifacts</strong></div><button><Menu size={16}/></button></div><div className="artifact-tabs">{tabs.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="artifact-body">{phase==='requirements'?<RequirementSummary requirements={session.requirements}/>:!artifact?<div className="right-empty"><Layers3 size={25}/><h3>No artifact yet</h3><p>Generate this phase to create problem-specific outputs.</p><button disabled={busy} onClick={()=>generate(phase)}>Generate now</button></div>:<ArtifactTab artifact={artifact} tab={tab}/>}</div></aside> }
function RequirementSummary({requirements}) { return <div><div className="artifact-summary"><span className="kicker">Current foundation</span><h3>{requirements.title}</h3><p>{requirements.summary}</p></div>{['functional','nonFunctional','constraints','assumptions'].map(key=><details open key={key}><summary>{key.replace(/([A-Z])/g,' $1')}<span>{requirements[key].length}</span><ChevronDown size={13}/></summary>{requirements[key].map(x=><p className="check-item" key={x}><Check size={12}/>{x}</p>)}</details>)}</div> }
function ArtifactTab({artifact,tab}) { if(tab==='Diagrams') return artifact.diagrams.length?<>{artifact.diagrams.map((x,i)=><Mermaid key={`${x.title}-${i}`} chart={x.mermaid} title={x.title}/>)}</>:<EmptyArtifact text="No diagrams are relevant to this phase."/>; if(tab==='Code') return artifact.codeFiles.length?<>{artifact.codeFiles.map(x=><CodeFile key={x.path} file={x}/>)}</>:<EmptyArtifact text="No code files were generated for this phase."/>; if(tab==='Metrics') return artifact.metrics.length?<div className="metrics">{artifact.metrics.map(x=><div key={x.label}><span>{x.label}</span><strong>{x.value}</strong><p>{x.detail}</p></div>)}</div>:<EmptyArtifact text="No quantitative metrics were generated for this phase."/>; return <div><div className="artifact-summary"><span className="kicker">AI artifact</span><h3>{artifact.title}</h3><p>{artifact.summary}</p></div>{artifact.sections.map(x=><details key={x.title}><summary>{x.title}<ChevronDown size={13}/></summary><div className="markdown"><ReactMarkdown>{x.content}</ReactMarkdown></div></details>)}</div> }
function EmptyArtifact({text}) { return <div className="right-empty"><PanelRight size={22}/><p>{text}</p></div> }
function CodeFile({file}) { const [open,setOpen]=useState(false); return <div className="code-file"><button onClick={()=>setOpen(!open)}><FileCode2 size={13}/><span>{file.path}</span><em>{file.language}</em><ChevronDown size={13}/></button>{open&&<pre><code>{file.content}</code></pre>}</div> }
function Mermaid({chart,title}) { const ref=useRef(null); useEffect(()=>{ let active=true; const id=`m-${crypto.randomUUID().replaceAll('-','')}`; import('mermaid').then(({default:mermaid})=>{ mermaid.initialize({ startOnLoad:false, theme:'neutral', securityLevel:'strict', fontFamily:'DM Sans' }); return mermaid.render(id,chart); }).then(({svg})=>{if(active&&ref.current)ref.current.innerHTML=svg}).catch(()=>{if(ref.current)ref.current.textContent=chart}); return()=>{active=false}},[chart]); return <div className="diagram-card"><h4><Network size={14}/>{title}</h4><div ref={ref}/></div> }

createRoot(document.getElementById('root')).render(<App/>);
