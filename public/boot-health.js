// A classic, same-origin script provides a usable failure state if module loading fails.
(() => {
  let failed = false;
  function showFailure() {
    if (document.querySelector('#main')) return;
    failed = true;
    const ar = document.documentElement.lang === 'ar';
    const box = document.createElement('aside');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'padding:20px;margin:20px;border:1px solid #bd7733;background:#fff8e9;color:#382c22;font:16px/1.8 Arial';
    const text = document.createElement('p');
    text.textContent = ar ? 'تعذر تحميل التطبيق. تحقق من اتصال الشبكة ثم حاول مجدداً.' : 'The application could not load. Check your connection and retry.';
    const button = document.createElement('button');
    button.textContent = ar ? 'إعادة المحاولة' : 'Retry';
    button.onclick = () => location.reload();
    box.append(text, button);
    document.body.prepend(box);
  }
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement && event.target.type === 'module') showFailure();
  }, true);
  window.addEventListener('load', () => setTimeout(() => {
    if (!document.querySelector('#main') && !failed) showFailure();
  }, 5000));
})();
