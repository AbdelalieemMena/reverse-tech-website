(function () {
  const serviceOrder = ['pcb', 'maintenance', 'cnc', 'printing3d', 'reverse'];
  const defaultMedia = {
    pcb: ['/media/public/pcb-design-manufacturing.png','/media/public/greenpcb.jpg','/media/public/project3.jpg','/media/public/cardiac_Device.jpg'],
    maintenance: ['/media/public/pcb-maintenance.png','/media/public/project4.jpg','/media/public/project6.jpg','/media/public/serveses.jpg'],
    cnc: ['/media/public/cnc-machining.png','/media/public/project1.png','/media/public/maain.jpg'],
    printing3d: ['/media/public/3d-scanning-printing.png','/media/public/project2.png','/media/public/project5.jpg','/media/public/print.jpg'],
    reverse: ['/media/public/solid.jpg','/media/public/3d-scanning-printing.png','/media/public/project1.png','/media/public/us.jpg']
  };
  function inferType(url){ return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(String(url||'')) ? 'video' : 'image'; }
  function normalize(item){
    if(typeof item==='string') return {url:item,type:inferType(item)};
    const url=String(item?.url||item?.image_url||'').trim();
    return url?{url,type:item?.type==='video'||item?.media_type==='video'?'video':inferType(url)}:null;
  }
  function mediaForService(key, remote){
    const seen=new Set(), out=[];
    const items = (remote && remote[key] && remote[key].length) ? remote[key] : (defaultMedia[key] || []);
    items.forEach(item=>{
      const m=normalize(item); if(m&&!seen.has(m.url)){seen.add(m.url);out.push(m);}
    });
    return out;
  }
  function makeElement(item, template){
    if(item.type==='video'){
      const v=document.createElement('video');
      v.src=item.url; v.muted=true; v.playsInline=true; v.preload='metadata'; v.loop=true;
      v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.setAttribute('aria-label',template.alt||'فيديو الخدمة');
      return v;
    }
    const img=template.cloneNode(false); img.src=item.url; return img;
  }
  function buildSlider(image, media, wrapperClass, slideClass){
    if(!image) return;
    const items = media.length ? [...media] : [];
    if(!items.length) {
      const original=normalize(image.getAttribute('src'));
      if(original) items.push(original);
    }
    if(!items.length) return;
    const wrap=document.createElement('div'); wrap.className=wrapperClass;
    image.parentNode.insertBefore(wrap,image); image.remove();
    const slides=items.map((item,index)=>{
      const el=makeElement(item,image); el.classList.add(slideClass,'service-media-slide');
      el.classList.toggle('active',index===0); el.setAttribute('aria-hidden',index===0?'false':'true');
      wrap.appendChild(el); return el;
    });
    let current=0,timer=null;
    function stopTimer(){ if(timer){ clearTimeout(timer); timer=null; } }
    function syncPlayback(){
      slides.forEach((slide,index)=>{
        if(slide.tagName==='VIDEO'){
          if(index===current){
            slide.currentTime=0;
            slide.play().catch(()=>{});
          } else {
            slide.pause();
            slide.currentTime=0;
          }
        }
      });
    }
    function scheduleNext(){
      stopTimer();
      const active=slides[current];
      if(!active||slides.length<2) return;
      const rawDuration=Number(active.duration);
      const delay=active.tagName==='VIDEO' && Number.isFinite(rawDuration) && rawDuration>0 ? rawDuration*1000 : 3000;
      timer=window.setTimeout(()=>show((current+1)%slides.length), Math.max(1000, delay));
    }
    if(slides.length>1){
      wrap.classList.add('has-controls');
      const shade=document.createElement('div');shade.className='service-slider-shade';shade.setAttribute('aria-hidden','true');wrap.appendChild(shade);
      const counter=document.createElement('div');counter.className='service-slider-counter';wrap.appendChild(counter);
      const dots=document.createElement('div');dots.className='service-slider-dots';dots.setAttribute('role','tablist');dots.setAttribute('aria-label','وسائط الخدمة');wrap.appendChild(dots);
      const buttons=slides.map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='service-slider-dot';b.setAttribute('aria-label',`العنصر ${i+1}`);b.onclick=e=>{e.preventDefault();e.stopPropagation();show(i)};dots.appendChild(b);return b});
      function update(){counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;buttons.forEach((b,i)=>{b.classList.toggle('active',i===current);b.setAttribute('aria-selected',i===current?'true':'false')})}
      function show(i){
        slides[current]?.classList.remove('active');
        slides[current]?.setAttribute('aria-hidden','true');
        current=(i+slides.length)%slides.length;
        slides[current]?.classList.add('active');
        slides[current]?.setAttribute('aria-hidden','false');
        update();
        syncPlayback();
        scheduleNext();
      }
      slides.forEach((slide,index)=>{
        if(slide.tagName==='VIDEO'){
          slide.addEventListener('ended',()=>{ if(index===current) show((current+1)%slides.length); });
          slide.addEventListener('loadedmetadata',()=>{ if(index===current) scheduleNext(); });
        }
      });
      update();
      syncPlayback();
      scheduleNext();
    }else syncPlayback();
  }
  async function load(){try{const r=await fetch('/api/service-images',{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return {}}}
  async function init(){const remote=await load();
    document.querySelectorAll('.services-grid .service-card').forEach((card,i)=>{const key=card.dataset.serviceKey||serviceOrder[i];buildSlider(card.querySelector('img.service-image'),mediaForService(key,remote),'service-image-slider','service-image')});
    document.querySelectorAll('.service-detail-grid[data-service-key]').forEach(section=>{const key=section.dataset.serviceKey;buildSlider(section.querySelector('img.service-detail-image'),mediaForService(key,remote),'service-detail-slider','service-detail-image')});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
