document.addEventListener('DOMContentLoaded', function () {
    const copyBtn = document.getElementById('copy-2g-btn');

    const getInlinedHtmlForGmail = () => {
        const clone = document.documentElement.cloneNode(true);

        // --- 移除 GTH不需要的元素 (Phase 3, Step A) ---
        clone.querySelector('title')?.remove();

        // 移除所有<style>標籤 (GTH 樣式是內聯的)
        clone.querySelectorAll('style').forEach(s => s.remove());
        // 移除 操作按鈕
        clone.querySelector('#action-bar')?.remove();
        clone.querySelectorAll('script').forEach(s => s.remove());

        // 返回純淨的 HTML 字符串
        return {
            html: '<!DOCTYPE html>' + clone.outerHTML,
            text: clone.innerText || clone.textContent
        };
    };

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            copyBtn.textContent = 'Processing...';
            copyBtn.disabled = true;

            setTimeout(() => {
                try {
                    const { html, text } = getInlinedHtmlForGmail();


                    // --- 使用 Clipboard API (Phase 3, Step A) ---
                    // 準備一個包含 text/html 和 text/plain 兩種格式的 Blob
                    navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': new Blob([html], { type: 'text/html' }),
                            'text/plain': new Blob([text], { type: 'text/plain' })
                        })
                    ]).then(() => {
                        alert('Quote copied to clipboard (Rich Text)!');
                    }).catch(err => {
                        console.error('Failed to copy rich text:', err);
                        // Fallback to text copy if rich text fails
                        navigator.clipboard.writeText(text).then(() => {
                            alert('Rich text copy failed. Copied as plain text.');
                        }).catch(err2 => {
                            console.error('Fallback text copy failed:', err2);
                            alert('Failed to copy. Please check console.');
                        });
                    });

                } catch (err) {
                    console.error('Error during HTML preparation for Gmail:', err);
                    alert('An error occurred. See console.');
                } finally {
                    copyBtn.textContent = 'Copy';
                    copyBtn.disabled = false;
                }
            }, 50);
        });
    }
});