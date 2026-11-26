// ===== POPUP: OPEN A POST =====
document.addEventListener('DOMContentLoaded', () => {
    const posts = [...document.querySelectorAll('.post')];
    const dialog = document.getElementById('post-dialog');
    const title = dialog.querySelector('.dialog-title');
    const date = dialog.querySelector('.dialog-date');
    const body = dialog.querySelector('.dialog-body');

    const openPost = (post) => {
        const time = post.querySelector('time');
        title.textContent = post.querySelector('h2').textContent;
        date.textContent = time.textContent;
        date.dateTime = time.dateTime;
        body.innerHTML = post.querySelector('.post-full > div').innerHTML;
        body.scrollTop = 0;
        if (!dialog.open) dialog.showModal();
        if (post.id) history.replaceState(null, '', '#' + post.id);
    };

    posts.forEach((post) => {
        const btn = post.querySelector('.post-more');
        btn.removeAttribute('aria-expanded');
        btn.removeAttribute('aria-controls');
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.addEventListener('click', () => openPost(post));
    });

    // ===== CLOSE: X BUTTON, CLICK OUTSIDE, ESC =====
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));

    // ===== OPEN FROM A LINK LIKE blog.html#post-2 =====
    const hit = posts.find((p) => p.id && '#' + p.id === location.hash);
    if (hit) openPost(hit);
});
