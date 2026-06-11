import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Box, Braces, Check, CheckCircle2, ChevronDown, Circle, Clock3, Cloud,
  Code2, Copy, Database, ExternalLink, FileCode2, Gauge, GitPullRequest, GitBranch,
  Globe2, Layers3, LayoutDashboard, LoaderCircle, Menu, MessageSquareText, MoreHorizontal,
  Network, Play, Plus, Rocket, Search, Send, Server, Settings, ShieldCheck, Sparkles,
  TerminalSquare, TestTube2, Users, WandSparkles, X, Zap
} from 'lucide-react';
import './styles.css';

const steps = [
  { label: 'Requirements', icon: MessageSquareText, state: 'done' },
  { label: 'Architecture', icon: Network, state: 'done' },
  { label: 'API Contracts', icon: Braces, state: 'done' },
  { label: 'Build MVP', icon: Code2, state: 'active' },
  { label: 'Load test', icon: Gauge, state: 'idle' },
  { label: 'Optimize', icon: Zap, state: 'idle' },
  { label: 'PR Summary', icon: GitPullRequest, state: 'idle' },
];

const defaultReqs = {
  functional: ['Create a short URL from a long URL', 'Redirect short links with low latency', 'Optional custom aliases', 'Basic click analytics'],
  nonFunctional: ['99.99% redirect availability', 'p95 redirect latency under 80ms', 'Links never expire by default', 'Read-heavy traffic pattern']
};

const files = [
  ['src', 'folder'], ['  api', 'folder'], ['    links.ts', 'file'], ['    analytics.ts', 'file'],
  ['  services', 'folder'], ['    shortener.ts', 'active'], ['  db', 'folder'], ['    schema.sql', 'file'],
  ['docker-compose.yml', 'file'], ['README.md', 'file']
];

function App() {
  const [started, setStarted] = useState(false);
  const [prompt, setPrompt] = useState('Design a tiny URL service');
  const [projectName, setProjectName] = useState('Minilink');
  const [requirements, setRequirements] = useState(defaultReqs);
  const [activeTab, setActiveTab] = useState('Architecture');
  const [rightTab, setRightTab] = useState('Build');
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (text) => { setToast(text); setTimeout(() => setToast(''), 2200); };
  const startProject = async () => {
    if (!prompt.trim()) return;
    setBuilding(true);
    try {
      const data = await fetch('/api/projects', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({prompt}) }).then(r => r.json());
      setProjectName(data.name); setRequirements(data.requirements);
    } catch { /* fallback data keeps demo functional */ }
    setStarted(true); setBuilding(false);
  };
  const build = async () => {
    setBuilding(true);
    await new Promise(r => setTimeout(r, 1400));
    setBuilding(false); setBuilt(true); setRightTab('Preview'); notify('MVP built and running locally');
  };
  const optimize = async () => {
    setBuilding(true); await new Promise(r => setTimeout(r, 1300)); setBuilding(false); setOptimized(true); setScaleOpen(false); setRightTab('Performance'); notify('Architecture optimized for 100M users');
  };

  if (!started) return <Welcome prompt={prompt} setPrompt={setPrompt} loading={building} onStart={startProject} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Layers3 size={18}/></div><span>SystemForge</span></div>
        <div className="crumbs"><span>Projects</span><span>/</span><strong>{projectName}</strong><span className="status-pill"><span/> In progress</span></div>
        <div className="top-actions"><button className="icon-button"><Search size={17}/></button><button className="icon-button"><Settings size={17}/></button><button className="github-btn"><GitBranch size={16}/> Connect GitHub</button><div className="avatar">AK</div></div>
      </header>

      <div className="workflow-bar">
        <div className="workflow-inner">{steps.map((step, i) => <React.Fragment key={step.label}><div className={`flow-step ${step.state}`}><span className="flow-icon">{step.state==='done'?<Check size={13}/>:<step.icon size={14}/>}</span><span>{step.label}</span></div>{i < steps.length-1 && <div className={`flow-line ${step.state==='done'?'done':''}`}/>}</React.Fragment>)}</div>
      </div>

      <main className="workspace">
        <aside className="requirements-panel">
          <div className="panel-heading"><div><p className="eyebrow">DISCOVERY</p><h2>Requirements</h2></div><button className="icon-button"><MoreHorizontal size={18}/></button></div>
          <div className="conversation">
            <div className="user-message">{prompt}</div>
            <div className="ai-message"><div className="ai-badge"><Sparkles size={13}/></div><div><p>I’ve translated your idea into a focused first version. Here’s what I’m designing for:</p></div></div>
            <RequirementGroup title="Functional" items={requirements.functional} />
            <RequirementGroup title="Non-functional" items={requirements.nonFunctional} />
            <div className="ai-question"><div className="ai-badge"><Sparkles size={13}/></div><div><strong>Anything else to add?</strong><p>Consider auth, link expiry, or regional data residency.</p><div className="suggestions"><button onClick={()=>notify('Authentication added')}>+ Authentication</button><button onClick={()=>notify('Link expiry added')}>+ Link expiry</button></div></div></div>
          </div>
          <div className="chat-input"><input placeholder="Add a requirement..."/><button onClick={()=>notify('Requirement added')}><Send size={15}/></button></div>
        </aside>

        <section className="design-panel">
          <div className="tabs">{['Architecture','API Contracts','Data model'].map(t=><button key={t} onClick={()=>setActiveTab(t)} className={activeTab===t?'active':''}>{t}</button>)}<button className="icon-button tab-more"><MoreHorizontal size={17}/></button></div>
          {activeTab==='Architecture' && <Architecture optimized={optimized}/>} 
          {activeTab==='API Contracts' && <ApiContracts/>}
          {activeTab==='Data model' && <DataModel/>}
          <div className="design-footer"><div><CheckCircle2 size={15}/><span>Architecture checks passed</span></div><button onClick={()=>setActiveTab('API Contracts')}>View API contracts <ArrowRight size={14}/></button></div>
        </section>

        <aside className="execution-panel">
          <div className="tabs compact">{['Build','Preview','Performance'].map(t=><button key={t} onClick={()=>setRightTab(t)} className={rightTab===t?'active':''}>{t}</button>)}</div>
          {rightTab==='Build' && <BuildPanel building={building} built={built} onBuild={build}/>} 
          {rightTab==='Preview' && <PreviewPanel built={built} onBuild={build}/>} 
          {rightTab==='Performance' && <PerformancePanel optimized={optimized} onScale={()=>setScaleOpen(true)}/>} 
        </aside>
      </main>

      {scaleOpen && <ScaleModal onClose={()=>setScaleOpen(false)} onOptimize={optimize} loading={building}/>} 
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function Welcome({prompt,setPrompt,loading,onStart}) {
  const examples = ['Design a tiny URL service','Build a real-time chat app','Create a video streaming platform'];
  return <div className="welcome">
    <nav className="welcome-nav"><div className="brand"><div className="brand-mark"><Layers3 size={18}/></div><span>SystemForge</span></div><div><button className="text-btn">How it works</button><button className="github-btn"><GitBranch size={16}/> Sign in with GitHub</button></div></nav>
    <div className="welcome-orb orb-one"/><div className="welcome-orb orb-two"/>
    <main className="welcome-main">
      <div className="hero-pill"><WandSparkles size={14}/> AI SYSTEM DESIGN ENGINEER</div>
      <h1>Turn a system idea into a<br/><em>working, scalable MVP.</em></h1>
      <p className="hero-copy">Define requirements, design architecture, generate code, load test, and optimize—without losing the thread.</p>
      <div className="prompt-card"><div className="prompt-top"><Sparkles size={18}/><span>What would you like to build?</span></div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe any system design problem..."/><div className="prompt-bottom"><span><ShieldCheck size={14}/> Private workspace</span><button onClick={onStart} disabled={loading}>{loading?<LoaderCircle className="spin" size={17}/>:<ArrowRight size={17}/>} Start designing</button></div></div>
      <div className="examples"><span>Try an example</span>{examples.map(x=><button key={x} onClick={()=>setPrompt(x)}>{x}</button>)}</div>
      <div className="feature-row"><MiniFeature icon={MessageSquareText} title="Clarifies requirements"/><MiniFeature icon={Network} title="Designs architecture"/><MiniFeature icon={Code2} title="Builds working code"/><MiniFeature icon={Gauge} title="Tests & optimizes"/></div>
    </main>
  </div>
}

function MiniFeature({icon:Icon,title}) { return <div><span><Icon size={16}/></span><p>{title}</p></div> }
function RequirementGroup({title,items}) { return <div className="req-group"><div className="req-title"><span>{title}</span><span>{items.length}</span></div>{items.map(item=><div className="req-item" key={item}><CheckCircle2 size={14}/><span>{item}</span></div>)}</div> }

function Architecture({optimized}) {
  return <div className="architecture-wrap">
    <div className="canvas-toolbar"><span><span className="green-dot"/> Live architecture</span><div><button>−</button><span>100%</span><button>+</button></div></div>
    <div className="architecture-canvas">
      <div className="arch-note">Read-heavy, cache-first architecture</div>
      <ArchNode icon={Users} title="Clients" sub="Web & mobile" x="5%" y="38%"/>
      <ArchNode icon={Globe2} title={optimized?'Global CDN':'API Gateway'} sub={optimized?'Edge redirects':'Rate limiting'} x="28%" y="38%" purple/>
      <ArchNode icon={Server} title="URL Service" sub={optimized?'12 auto-scaled pods':'Stateless API'} x="53%" y="20%"/>
      <ArchNode icon={Gauge} title="Redis Cache" sub={optimized?'Regional cluster':'Hot redirects'} x="53%" y="58%" orange/>
      <ArchNode icon={Database} title={optimized?'Sharded DB':'PostgreSQL'} sub={optimized?'64 logical shards':'Source of truth'} x="79%" y="20%"/>
      <ArchNode icon={Cloud} title="Event Stream" sub="Async analytics" x="79%" y="58%" purple/>
      <svg className="connections" viewBox="0 0 1000 500" preserveAspectRatio="none"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#9d96a4"/></marker></defs><path d="M170 250 L280 250"/><path d="M430 250 C470 250 470 160 530 160"/><path d="M430 250 C470 250 470 350 530 350"/><path d="M690 160 L790 160"/><path d="M690 160 C735 160 735 350 790 350"/><path d="M690 350 C750 350 740 190 790 190"/></svg>
    </div>
    <div className="decision-strip"><div><div className="decision-icon"><Sparkles size={15}/></div><div><strong>Key design decision</strong><p>Cache-aside redirects keep the critical read path fast while PostgreSQL preserves durability.</p></div></div><button>Why this? <ChevronDown size={14}/></button></div>
  </div>
}
function ArchNode({icon:Icon,title,sub,x,y,purple,orange}) { return <div className={`arch-node ${purple?'purple':''} ${orange?'orange':''}`} style={{left:x,top:y}}><div><Icon size={18}/></div><strong>{title}</strong><span>{sub}</span></div> }

function ApiContracts() { return <div className="contract-view"><div className="contract-header"><div><p className="eyebrow">OPENAPI 3.1</p><h3>API Contracts</h3></div><button><Copy size={14}/> Copy spec</button></div>{[['POST','/v1/links','Create a short link'],['GET','/{shortCode}','Redirect to the destination URL'],['GET','/v1/links/{id}/stats','Fetch click analytics']].map(x=><div className="endpoint" key={x[1]}><span className={x[0].toLowerCase()}>{x[0]}</span><code>{x[1]}</code><p>{x[2]}</p><ChevronDown size={16}/></div>)}</div> }
function DataModel() { return <div className="data-model"><div className="table-card"><div><Database size={16}/><strong>links</strong></div>{['id  ·  uuid  ·  primary key','short_code  ·  varchar(8)  ·  unique','destination_url  ·  text','created_at  ·  timestamp','expires_at  ·  timestamp?'].map(x=><p key={x}>{x}</p>)}</div><div className="table-card"><div><Database size={16}/><strong>click_events</strong></div>{['id  ·  bigint  ·  primary key','link_id  ·  uuid  ·  indexed','country  ·  varchar(2)','occurred_at  ·  timestamp'].map(x=><p key={x}>{x}</p>)}</div></div> }

function BuildPanel({building,built,onBuild}) { return <div className="build-panel"><div className="build-heading"><div><p className="eyebrow">WORKING MVP</p><h3>Implementation</h3></div><span className={built?'ready':'draft'}>{built?'Ready':'Draft'}</span></div><div className="stack-row"><span>Node.js</span><span>TypeScript</span><span>Postgres</span><span>Redis</span></div><div className="file-tree">{files.map(([name,type],i)=><div key={i} className={type==='active'?'selected':''} style={{paddingLeft:`${12+(name.length-name.trimStart().length)*5}px`}}>{type==='folder'?<ChevronDown size={13}/>:<FileCode2 size={13}/>}<span>{name.trim()}</span>{type==='active'&&<span className="code-tag">open</span>}</div>)}</div><div className="code-preview"><div><span/><span/><span/><em>shortener.ts</em></div><pre><code><b>export async function</b> createLink(url: string) {'{'}\n  <b>const</b> code = generateCode();\n  <b>await</b> db.links.create({'{'} code, url {'}'});\n  <b>await</b> cache.set(code, url);\n  <b>return</b> {'{'} code {'}'};\n{'}'}</code></pre></div><button className="build-button" onClick={onBuild} disabled={building}>{building?<LoaderCircle className="spin" size={16}/>:<Play size={16}/>} {building?'Building MVP...':built?'Rebuild MVP':'Build & run locally'}</button><p className="build-note"><TerminalSquare size={13}/> Includes Docker setup and seed data</p></div> }
function PreviewPanel({built,onBuild}) { return <div className="preview-panel">{built?<><div className="browser"><div className="browser-top"><span/><span/><span/><div>localhost:4173</div><ExternalLink size={13}/></div><div className="mini-app"><div className="mini-logo"><Zap size={16}/></div><h3>Shorten a long link</h3><p>Create a memorable link in seconds.</p><div><span>https://your-very-long-url.com/...</span><button>Shorten</button></div><section><span>minil.ink/a8Jk2</span><Copy size={14}/></section></div></div><div className="preview-status"><CheckCircle2 size={15}/><div><strong>Running locally</strong><span>All 12 tests passing</span></div><button><ExternalLink size={14}/></button></div></>:<div className="empty-preview"><div><Rocket size={25}/></div><h3>Your preview will appear here</h3><p>Build the MVP to run and interact with the generated application.</p><button onClick={onBuild}>Build MVP</button></div>}</div> }
function PerformancePanel({optimized,onScale}) { return <div className="performance"><div className="perf-hero"><div><p className="eyebrow">LOAD TEST RESULT</p><h3>{optimized?'28,600':'11,240'} <span>req/s</span></h3><p>at p95 latency of <strong>{optimized?'42':'76'}ms</strong></p></div><div className="score-ring"><strong>{optimized?'96':'78'}</strong><span>score</span></div></div><div className="metric-grid"><Metric label="Error rate" value={optimized?'0.01%':'0.12%'} good/><Metric label="Cache hit" value={optimized?'97.8%':'84.2%'} good={optimized}/><Metric label="CPU peak" value={optimized?'61%':'88%'} good={optimized}/><Metric label="DB connections" value={optimized?'420':'1,840'} good={optimized}/></div><div className="bottleneck"><div><Zap size={16}/><strong>{optimized?'Optimization summary':'Bottleneck detected'}</strong></div><p>{optimized?'Global edge caching, sharded storage, and regional replicas lifted throughput by 154%.':'Database connection saturation begins near 10K req/s. Add pooling and read replicas before scaling.'}</p></div><button className="scale-button" onClick={onScale}><Users size={16}/>{optimized?'Review 100M-user plan':'Scale to 100M users'}<ArrowRight size={15}/></button><button className="pr-button" onClick={()=>alert('PR summary generated!')}><GitPullRequest size={15}/> Generate PR summary</button></div> }
function Metric({label,value,good}) { return <div><span>{label}</span><strong>{value}</strong><em className={good?'good':''}>{good?'Healthy':'Watch'}</em></div> }

function ScaleModal({onClose,onOptimize,loading}) { return <div className="modal-backdrop"><div className="scale-modal"><button className="close-modal" onClick={onClose}><X size={18}/></button><div className="modal-icon"><Rocket size={22}/></div><p className="eyebrow">NEXT SCALE TARGET</p><h2>Ready for 100 million<br/>active users?</h2><p>We’ll refactor the architecture and working code around global traffic, fault isolation, and predictable cost.</p><div className="scale-items"><div><Globe2 size={17}/><span><strong>Global edge routing</strong><small>Serve redirects near every user</small></span></div><div><Database size={17}/><span><strong>Sharded data layer</strong><small>Remove the primary database ceiling</small></span></div><div><Zap size={17}/><span><strong>Multi-level caching</strong><small>Target a 97%+ cache hit ratio</small></span></div></div><div className="target-row"><span>Scale target</span><strong>100M MAU <ChevronDown size={14}/></strong></div><button className="optimize-button" onClick={onOptimize} disabled={loading}>{loading?<LoaderCircle className="spin" size={17}/>:<WandSparkles size={17}/>} {loading?'Refactoring architecture...':'Optimize architecture & code'}</button><button className="not-now" onClick={onClose}>Not right now</button></div></div> }

createRoot(document.getElementById('root')).render(<App/>);
