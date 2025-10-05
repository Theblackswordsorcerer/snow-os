
(() => {
  const body = document.body;
  let currentUser = null;
  let z = 10;
  let winId = 0;
  const openWindows = new Map();

  const desktop = document.getElementById("desktop");
  const windows = document.getElementById("windows");
  const startBtn = document.getElementById("start-btn");
  const taskList = document.getElementById("task-list");
  const clockEl = document.getElementById("clock");
  const startMenu = document.getElementById("start-menu");

  const defaultWallpapers = [
    'https://images.unsplash.com/photo-1601758123927-46c16d3406a7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=800&q=80'
  ];


  const loginScreen = document.createElement("div");
  loginScreen.id = "login-screen";
  loginScreen.innerHTML = `
    <div class="login-box">
      <h2>Welcome to Snow OS</h2>
      <input id="login-username" placeholder="Username" />
      <input id="login-password" type="password" placeholder="Password" />
      <button id="login-btn">Login</button>
      <button id="signup-btn">Sign Up</button>
      <div id="login-msg"></div>
    </div>
  `;
  body.appendChild(loginScreen);

  function showMsg(msg){ document.getElementById("login-msg").textContent = msg; }

  function login(username, password){
    const users = JSON.parse(localStorage.getItem("snow_users")||"{}");
    if(users[username] && users[username]===password){
      currentUser=username;
      loginScreen.style.display="none";
      body.classList.add("logged-in");
      applyUserPrefs();
    } else showMsg("Invalid login");
  }

  function signup(username,password){
    const users = JSON.parse(localStorage.getItem("snow_users")||"{}");
    if(users[username]){ showMsg("User exists"); return; }
    users[username]=password;
    localStorage.setItem("snow_users",JSON.stringify(users));
    showMsg("Signup successful. Login now.");
  }

  document.getElementById("login-btn").onclick=()=>login(document.getElementById("login-username").value, document.getElementById("login-password").value);
  document.getElementById("signup-btn").onclick=()=>signup(document.getElementById("login-username").value, document.getElementById("login-password").value);

  
  function updateClock(){
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    clockEl.textContent=`${hh}:${mm}`;
  }
  setInterval(updateClock,1000);
  updateClock();

  
  function applyUserPrefs(){
    const wallpaper = localStorage.getItem(`${currentUser}_wallpaper`) || defaultWallpapers[0];
    desktop.style.backgroundImage = `url('${wallpaper}')`;
  }

  function changeWallpaper(url){
    desktop.style.backgroundImage=`url('${url}')`;
    localStorage.setItem(`${currentUser}_wallpaper`,url);
  }

  
  function createTaskItem(id,title){
    const btn=document.createElement('button');
    btn.className='task-item active';
    btn.textContent=title;
    btn.dataset.taskId=id;
    btn.addEventListener('click',()=>{
      const w=openWindows.get(id);
      if(!w) return;
      w.el.style.display=w.el.style.display==='none'?'block':'none';
      focusWindow(w.el);
    });
    taskList.appendChild(btn);
    return btn;
  }

  function focusWindow(el){
    document.querySelectorAll('.task-item').forEach(t=>t.classList.remove('active'));
    const id=el.dataset.id;
    const task=document.querySelector(`[data-task-id="${id}"]`);
    if(task) task.classList.add('active');
    el.style.zIndex=++z;
    el.style.display='block';
  }

 
  function makeWindow(title,contentEl){
    const id=`win-${++winId}`;
    const win=document.createElement('div');
    win.className='window';
    win.dataset.id=id;
    win.style.left='80px';
    win.style.top=`${60 + (winId-1)*20}px`;
    win.innerHTML=`
      <div class="win-header">
        <div class="win-title">${title}</div>
        <div class="win-controls">
          <button class="min">—</button>
          <button class="close">✕</button>
        </div>
      </div>
      <div class="win-body"></div>
    `;
    const bodyEl=win.querySelector('.win-body');
    if(contentEl instanceof HTMLElement) bodyEl.appendChild(contentEl); else bodyEl.innerHTML=contentEl;

    win.querySelector('.close').addEventListener('click',()=>{
      const t=openWindows.get(id);
      if(t){ t.el.remove(); t.task.remove(); openWindows.delete(id); }
    });
    win.querySelector('.min').addEventListener('click',()=>{ win.style.display='none'; });

 
    let dragging=false,dx=0,dy=0;
    const header=win.querySelector('.win-header');
    header.addEventListener('pointerdown',e=>{ dragging=true; dx=e.clientX-win.offsetLeft; dy=e.clientY-win.offsetTop; focusWindow(win); header.setPointerCapture(e.pointerId); });
    header.addEventListener('pointermove',e=>{ if(!dragging) return; win.style.left=(e.clientX-dx)+'px'; win.style.top=(e.clientY-dy)+'px'; });
    header.addEventListener('pointerup',()=>{ dragging=false; });

    win.style.resize='both'; win.style.overflow='auto';
    windows.appendChild(win);
    focusWindow(win);

    const task=createTaskItem(id,title);
    openWindows.set(id,{el:win,task});
    return win;
  }



  function openFiles(){
    const container=document.createElement('div');
    const fileList=document.createElement('div');
    fileList.className='files-grid';
    const files=JSON.parse(localStorage.getItem(`${currentUser}_files`)||'[]');

    function renderFiles(){
      fileList.innerHTML='';
      files.forEach(f=>{
        const card=document.createElement('div');
        card.className='file-card';
        card.innerHTML=`<strong>${f.name}</strong><small>${f.type}</small>`;
        card.onclick=()=>{
          if(f.type.startsWith('text')){
            const txtWin=document.createElement('textarea');
            txtWin.style.width='100%'; txtWin.style.height='100%'; txtWin.value=f.content||'';
            txtWin.addEventListener('input',()=>{ f.content=txtWin.value; localStorage.setItem(`${currentUser}_files`,JSON.stringify(files)); });
            makeWindow(f.name,txtWin);
          } else if(f.type.startsWith('audio')){
            const aud=document.createElement('audio'); aud.controls=true; aud.src=f.url; aud.style.width='100%'; makeWindow(f.name,aud);
          }
        };
        fileList.appendChild(card);
      });
    }

    const browseBtn=document.createElement('button');
    browseBtn.textContent='Browse Files';
    browseBtn.onclick=()=>{
      const input=document.createElement('input'); input.type='file'; input.multiple=true;
      input.onchange=e=>{
        Array.from(e.target.files).forEach(file=>{
          const f={name:file.name,type:file.type,url:URL.createObjectURL(file)};
          if(file.type.startsWith('text')){
            const reader=new FileReader(); reader.onload=()=>{ f.content=reader.result; files.push(f); localStorage.setItem(`${currentUser}_files`,JSON.stringify(files)); renderFiles(); }; reader.readAsText(file);
          } else { files.push(f); localStorage.setItem(`${currentUser}_files`,JSON.stringify(files)); renderFiles(); }
        });
      };
      input.click();
    };

    container.appendChild(fileList);
    container.appendChild(browseBtn);
    renderFiles();
    makeWindow('Files',container);
  }

  function openMusic(){
    const container=document.createElement('div');
    const list=document.createElement('div');
    const tracks=JSON.parse(localStorage.getItem(`${currentUser}_music`)||'[]');

    function render(){
      list.innerHTML='';
      tracks.forEach(track=>{
        const div=document.createElement('div');
        div.textContent=track.name; div.style.cursor='pointer';
        div.onclick=()=>{
          const aud=document.createElement('audio'); aud.controls=true; aud.src=track.url; aud.style.width='100%'; makeWindow(track.name,aud);
        };
        list.appendChild(div);
      });
    }

    const browseBtn=document.createElement('button');
    browseBtn.textContent='Browse Music';
    browseBtn.onclick=()=>{
      const input=document.createElement('input'); input.type='file'; input.multiple=true; input.accept='audio/*';
      input.onchange=e=>{
        Array.from(e.target.files).forEach(f=>{ tracks.push({name:f.name,url:URL.createObjectURL(f)}); });
        localStorage.setItem(`${currentUser}_music`,JSON.stringify(tracks)); render();
      };
      input.click();
    };

    container.appendChild(list);
    container.appendChild(browseBtn);
    render();
    makeWindow('Music',container);
  }

  function openNotes(){
    const ta=document.createElement('textarea');
    ta.className='notes-area';
    ta.value=localStorage.getItem(`${currentUser}_notes`)||'';
    ta.addEventListener('input',()=>{ localStorage.setItem(`${currentUser}_notes`,ta.value); });
    makeWindow('Notes',ta);
  }

  function openTerminal(){
    const el=document.createElement('div'); el.className='terminal';
    el.innerHTML=`<div class='terminal-output'></div><div class='terminal-input'><span>> </span><input type='text'/></div>`;
    const output=el.querySelector('.terminal-output'); const input=el.querySelector('input');
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        const cmd=input.value.trim(); input.value='';
        if(!cmd) return;
        const line=document.createElement('div'); line.textContent=`> ${cmd}`; output.appendChild(line);
        if(cmd==='help') output.innerHTML+='<div>Commands: help, about, clear, echo [msg]</div>';
        else if(cmd==='about') output.innerHTML+='<div>Snow OS — Browser OS simulation.</div>';
        else if(cmd==='clear') output.innerHTML='';
        else if(cmd.startsWith('echo ')) output.innerHTML+='<div>'+cmd.slice(5)+'</div>';
        else output.innerHTML+='<div>Unknown command</div>';
        output.scrollTop=output.scrollHeight;
      }
    });
    makeWindow('Terminal',el);
  }

  function openBrowser(){
    const container=document.createElement('div');
    const input=document.createElement('input'); input.placeholder='https://example.com'; input.style.width='100%';
    const iframe=document.createElement('iframe'); iframe.style.width='100%'; iframe.style.height='240px';
    const btn=document.createElement('button'); btn.textContent='Go';
    btn.onclick=()=>{ iframe.src=input.value; };
    container.appendChild(input); container.appendChild(btn); container.appendChild(iframe);
    makeWindow('Browser',container);
  }

  function openSettings(){
    const container=document.createElement('div');
    container.innerHTML='<h3>Change Wallpaper</h3>';
    defaultWallpapers.forEach(url=>{
      const img=document.createElement('img'); img.src=url; img.style.width='80px'; img.style.margin='5px'; img.style.cursor='pointer';
      img.onclick=()=>changeWallpaper(url);
      container.appendChild(img);
    });
    makeWindow('Settings',container);
  }

 
  function launchApp(app){
    if(app==='files') openFiles();
    else if(app==='music') openMusic();
    else if(app==='notes') openNotes();
    else if(app==='terminal') openTerminal();
    else if(app==='browser') openBrowser();
    else if(app==='settings') openSettings();
  }

  desktop.querySelectorAll('.icon').forEach(ic=>ic.addEventListener('dblclick',()=>launchApp(ic.dataset.app)));
  startBtn.onclick=()=>startMenu.classList.toggle('open');
  startMenu.querySelectorAll('button[data-app]').forEach(btn=>btn.onclick=()=>{ launchApp(btn.dataset.app); startMenu.classList.remove('open'); });
})();
