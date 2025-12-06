document.getElementById('downloadBtn').addEventListener('click', async () => {
    const urlsText = document.getElementById('urls').value;
    const downloadPath = document.getElementById('downloadPath').value || 'downloads';
    const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u);

    if (urls.length === 0) {
        alert('Please enter at least one URL');
        return;
    }

    const btn = document.getElementById('downloadBtn');
    const statusDiv = document.getElementById('status');

    btn.disabled = true;
    btn.textContent = 'Downloading...';
    statusDiv.innerHTML = `<div class="progress-info">📥 Starting download of ${urls.length} video(s) to: ${downloadPath}</div>`;

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ urls, downloadPath })
        });

        const results = await response.json();

        const successCount = results.filter(r => r.status === 'downloaded').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        let html = `<div class="summary">
            <h3>Download Complete!</h3>
            <p>✓ Success: ${successCount} | ✗ Failed: ${failCount}</p>
            <p class="download-location">📁 Download Location: <strong>${downloadPath}</strong></p>
        </div>
        <div class="results">`;

        results.forEach(r => {
            const statusClass = r.status === 'downloaded' ? 'success' : 'error';
            const verifiedBadge = r.verified ? '<span class="verified-badge">✓ Verified</span>' : '';

            html += `<div class="result-item ${statusClass}">
                <strong>${r.status === 'downloaded' ? '✓' : '✗'}</strong> 
                ${r.url}<br>
                ${r.file ? `<small>📄 File: ${r.file} ${verifiedBadge}</small><br>` : ''}
                ${r.size ? `<small>📊 Size: ${r.size}</small><br>` : ''}
                ${r.location ? `<small>📍 Path: ${r.location}</small><br>` : ''}
                ${r.error ? `<small class="error-msg">❌ Error: ${r.error}</small>` : ''}
            </div>`;
        });

        html += '</div>';
        statusDiv.innerHTML = html;

    } catch (error) {
        statusDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    }

    btn.disabled = false;
    btn.textContent = 'Download Playlist';
});