(function(){
  const lang=()=>document.documentElement.lang==='en'?'en':'ar';
  const text=(ar,en)=>lang()==='en'?en:ar;
  function fee(method,weight){
    weight=Math.max(.1,Number(weight||1));
    if(method==='egypt') return 150+Math.max(0,Math.ceil(weight)-1)*15;
    if(method==='international') return 5000;
    return 0;
  }

  function ensureRecipientFields(section){
    const details=section.querySelector('[data-shipping-details]');
    if(!details || details.querySelector('[data-recipient-fields]')) return;
    const recipient=document.createElement('div');
    recipient.className='shipping-recipient-grid';
    recipient.setAttribute('data-recipient-fields','');
    recipient.innerHTML=`
      <div>
        <label data-ar="اسم المستلم" data-en="Recipient Name">اسم المستلم</label>
        <input name="shipping_recipient_name" type="text" autocomplete="name"
          data-ar-placeholder="اكتب الاسم بالكامل" data-en-placeholder="Enter the full name"
          placeholder="اكتب الاسم بالكامل">
      </div>
      <div>
        <label data-ar="رقم موبايل المستلم" data-en="Recipient Mobile Number">رقم موبايل المستلم</label>
        <input name="shipping_phone" type="tel" autocomplete="tel"
          data-ar-placeholder="مثال: 01114578817" data-en-placeholder="Example: 01114578817"
          placeholder="مثال: 01114578817">
        <small data-recipient-phone-note data-ar="سنستخدم الرقم لتأكيد بيانات التسليم." data-en="We will use this number to confirm delivery details.">سنستخدم الرقم لتأكيد بيانات التسليم.</small>
      </div>`;
    details.insertBefore(recipient, details.firstChild);
  }

  function translateSection(section){
    section.querySelectorAll('[data-ar][data-en]').forEach(el=>{
      const value=lang()==='en'?el.dataset.en:el.dataset.ar;
      if(el.matches('input,textarea') && el.hasAttribute('placeholder')) el.placeholder=value;
      else el.textContent=value;
    });
    section.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach(el=>{
      el.placeholder=lang()==='en'?el.dataset.enPlaceholder:el.dataset.arPlaceholder;
    });
  }

  function initSection(section){
    if(!section||section.dataset.ready)return;
    section.dataset.ready='1';
    ensureRecipientFields(section);
    const radios=[...section.querySelectorAll('input[name="shipping_method"]')];
    const details=section.querySelector('[data-shipping-details]');
    const countryWrap=section.querySelector('[data-country-field]');
    const country=section.querySelector('[name="shipping_country"]');
    const address=section.querySelector('[name="shipping_address"]');
    const weight=section.querySelector('[name="shipping_weight_kg"]');
    const recipientName=section.querySelector('[name="shipping_recipient_name"]');
    const shippingPhone=section.querySelector('[name="shipping_phone"]');
    const phoneNote=section.querySelector('[data-recipient-phone-note]');
    const feeEl=section.querySelector('[data-shipping-fee]');

    function update(){
      const method=radios.find(r=>r.checked)?.value||'pickup';
      section.querySelectorAll('.shipping-method-card').forEach(c=>c.classList.toggle('active',c.querySelector('input').checked));
      const ship=method!=='pickup';
      details.hidden=!ship;
      if(countryWrap) countryWrap.hidden=method!=='international';
      if(address) address.required=ship;
      if(country) country.required=method==='international';
      if(weight) weight.required=ship;
      if(recipientName) recipientName.required=ship;
      if(shippingPhone){
        shippingPhone.required=ship;
        if(method==='international'){
          shippingPhone.placeholder='+20 111 234 5678';
          shippingPhone.pattern='\\+[1-9][0-9]{7,14}';
          shippingPhone.title=text('اكتب الرقم بصيغة دولية تبدأ بعلامة + وكود الدولة','Enter an international number beginning with + and the country code');
          if(phoneNote){
            phoneNote.dataset.ar='اكتب الرقم بصيغة دولية تبدأ بعلامة + ثم كود الدولة.';
            phoneNote.dataset.en='Enter the number in international format beginning with + and the country code.';
          }
        }else{
          shippingPhone.removeAttribute('pattern');
          shippingPhone.removeAttribute('title');
          shippingPhone.placeholder=text('مثال: 01114578817','Example: 01114578817');
          if(phoneNote){
            phoneNote.dataset.ar='سنستخدم الرقم لتأكيد بيانات التسليم.';
            phoneNote.dataset.en='We will use this number to confirm delivery details.';
          }
        }
      }
      const v=fee(method,weight?.value);
      if(feeEl){
        feeEl.textContent=v?`${v.toLocaleString()} ${text('جنيه','EGP')}`:text('مجاني','Free');
        feeEl.dataset.ar=v?`${v.toLocaleString()} جنيه`:'مجاني';
        feeEl.dataset.en=v?`EGP ${v.toLocaleString()}`:'Free';
      }
      translateSection(section);
      section.dispatchEvent(new CustomEvent('shippingchange',{bubbles:true,detail:{method,fee:v}}));
    }
    radios.forEach(r=>r.addEventListener('change',update));
    weight?.addEventListener('input',update);
    document.addEventListener('reverseTechLanguageChanged',update);
    update();
  }

  function initAll(){document.querySelectorAll('[data-shipping-section]').forEach(initSection)}

  window.ReverseTechShipping={
    fee,
    initAll,
    openOrderModal(part){
      return new Promise(resolve=>{
        const overlay=document.createElement('div');
        overlay.className='shipping-modal-overlay';
        overlay.innerHTML=`<div class="shipping-modal" role="dialog" aria-modal="true"><div class="shipping-modal-header"><h2>${text('استكمال بيانات الطلب','Complete Order Details')}</h2><button type="button" class="shipping-modal-close">×</button></div><form id="mechanicalShippingForm"><div class="shipping-customer-grid"><div><label>${text('الاسم','Name')}</label><input name="customer_name" required></div><div><label>${text('رقم الموبايل','Mobile Number')}</label><input name="phone" type="tel" required></div><div><label>${text('البريد الإلكتروني (اختياري)','Email (optional)')}</label><input name="email" type="email"></div><div><label>${text('الكمية','Quantity')}</label><input name="quantity" type="number" min="1" value="1" required></div><div class="wide"><label>${text('ملاحظات الطلب','Order Notes')}</label><textarea name="notes" rows="3"></textarea></div></div>${document.querySelector('[data-shipping-section]')?.outerHTML||window.__shippingTemplate||''}<div class="shipping-modal-actions"><button type="button" class="shipping-modal-cancel">${text('إلغاء','Cancel')}</button><button type="submit" class="shipping-modal-confirm">${text('متابعة وحساب السعر','Continue & Calculate')}</button></div></form></div>`;
        document.body.appendChild(overlay);
        const section=overlay.querySelector('[data-shipping-section]');
        section?.removeAttribute('data-ready');
        initSection(section);
        const form=overlay.querySelector('form');
        const close=()=>{overlay.remove();resolve(null)};
        overlay.querySelector('.shipping-modal-close').onclick=close;
        overlay.querySelector('.shipping-modal-cancel').onclick=close;
        form.addEventListener('submit',e=>{
          e.preventDefault();
          if(!form.reportValidity())return;
          const d=Object.fromEntries(new FormData(form).entries());
          d.quantity=Number(d.quantity||1);
          d.shipping_weight_kg=Number(d.shipping_weight_kg||1);
          d.shipping_fee=fee(d.shipping_method,d.shipping_weight_kg);
          overlay.remove();resolve(d);
        });
      });
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const s=document.querySelector('[data-shipping-section]');
    if(s)window.__shippingTemplate=s.outerHTML;
    initAll();
  });
})();
