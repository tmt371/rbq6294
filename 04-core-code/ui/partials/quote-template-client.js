document.addEventListener('DOMContentLoaded', function () {
    const copyBtn = document.getElementById('copy-html-btn');
    const printBtn = document.getElementById('print-btn');
    const actionBar = document.getElementById('action-bar');

    if (printBtn) {
        printBtn.addEventListener('click', function () {
            window.print();
        });
    }

    // [NEW] CSS Inliner function
    const getInlinedHtml = () => {
        // 1. Create a deep clone of the document to avoid modifying the live page
        const clone = document.documentElement.cloneNode(true);

        // 2. Iterate through all stylesheets in the current document
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                // 3. For each rule in the stylesheet, find matching elements in the CLONE
                Array.from(sheet.cssRules).forEach(rule => {
                    const selector = rule.selectorText;
                    if (!selector) return;

                    const elements = clone.querySelectorAll(selector);
                    elements.forEach(el => {
                        // 4. Prepend the rule's styles to the element's existing inline style
                        // This ensures that more specific inline styles (if any) are not overridden.
                        const existingStyle = el.getAttribute('style') || '';
                        el.setAttribute('style', rule.style.cssText + existingStyle);
                    });
                });
            } catch (e) {
                // Ignore potential cross-origin security errors when accessing stylesheets
                console.warn('Could not process a stylesheet, possibly due to CORS policy:', e.message);
            }
        });

        // 5. Remove elements that should not be in the copied output
        clone.querySelector('#action-bar')?.remove();
        clone.querySelector('script')?.remove();

        // 6. Return the full, inlined HTML as a string
        return '<!DOCTYPE html>' + clone.outerHTML;
    };

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            // Temporarily change button text to give user feedback
            copyBtn.textContent = 'Processing...';
            copyBtn.disabled = true;

            // Use a timeout to allow the UI to update before the heavy work
            setTimeout(() => {
                try {
                    const inlinedHtml = getInlinedHtml();

                    navigator.clipboard.writeText(inlinedHtml)
                        .then(() => {
                            alert('HTML with inlined styles copied to clipboard successfully!');
                        })
                        .catch(err => {
                            console.error('Failed to copy with navigator.clipboard:', err);
                            alert('Failed to copy. Please check console for errors.');
                        });
                } catch (err) {
                    console.error('Error during CSS inlining process:', err);
                    alert('An error occurred while preparing the HTML. See console for details.');
                } finally {
                    // Restore button state
                    copyBtn.textContent = 'Copy HTML';
                    copyBtn.disabled = false;
                }
            }, 50); // 50ms delay
        });
    }
});