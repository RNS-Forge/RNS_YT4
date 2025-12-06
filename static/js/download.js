/* =============================================
   RNS YT4 - Download Page JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initDownloadForm();
    initFolderBrowser();
    initManualDownload();
});

/* Tab Switching */
function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    var tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var targetTab = this.getAttribute('data-tab');

            // Update buttons
            tabBtns.forEach(function (b) {
                b.classList.remove('active');
            });
            this.classList.add('active');

            // Update content
            tabContents.forEach(function (content) {
                content.classList.remove('active');
            });

            var targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

/* Auto Download Form */
function initDownloadForm() {
    var form = document.getElementById('auto-download-form');
    if (!form) return;

    var playlistInput = form.querySelector('input[name="playlist_url"]');
    var extractBtn = form.querySelector('.extract-btn');
    var downloadBtn = form.querySelector('.download-btn');
    var progressSection = document.querySelector('.progress-section');
    var resultsSection = document.querySelector('.results-section');

    // Extract playlist
    if (extractBtn) {
        extractBtn.addEventListener('click', function () {
            var url = playlistInput.value.trim();

            if (!url) {
                showToast('Please enter a playlist URL', 'error');
                return;
            }

            if (!isValidYouTubeUrl(url)) {
                showToast('Please enter a valid YouTube playlist URL', 'error');
                return;
            }

            extractPlaylist(url);
        });
    }

    // Start download
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            startDownload();
        });
    }
}

/* Folder Browser */
function initFolderBrowser() {
    // Auto download browse button
    var browseBtn = document.getElementById('browseBtn');
    var pathText = document.getElementById('pathText');
    
    if (browseBtn) {
        browseBtn.addEventListener('click', function () {
            fetch('/browse-folder', {
                method: 'POST'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.path) {
                        if (pathText) {
                            pathText.textContent = data.path;
                        }
                        window.selectedDownloadPath = data.path;
                        showToast('Download location set', 'success');
                    }
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    showToast('Failed to open folder browser', 'error');
                });
        });
    }
    
    // Manual download browse button
    var manualBrowseBtn = document.getElementById('manualBrowseBtn');
    var manualPathText = document.getElementById('manualPathText');
    
    if (manualBrowseBtn) {
        manualBrowseBtn.addEventListener('click', function () {
            fetch('/browse-folder', {
                method: 'POST'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.path) {
                        if (manualPathText) {
                            manualPathText.textContent = data.path;
                        }
                        window.selectedDownloadPath = data.path;
                        showToast('Download location set', 'success');
                    }
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    showToast('Failed to open folder browser', 'error');
                });
        });
    }
}

/* Extract Playlist */
function extractPlaylist(url) {
    var extractBtn = document.querySelector('.extract-btn');
    var videoList = document.querySelector('.video-list');
    var resultsSection = document.querySelector('.results-section');

    // Show loading
    setButtonLoading(extractBtn, true);

    fetch('/extract-playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            setButtonLoading(extractBtn, false);

            if (data.error) {
                showToast(data.error, 'error');
                return;
            }

            if (data.videos && data.videos.length > 0) {
                window.playlistVideos = data.videos;
                displayVideos(data.videos);
                if (resultsSection) {
                    resultsSection.style.display = 'block';
                }
                showToast('Found ' + data.videos.length + ' videos', 'success');
            } else {
                showToast('No videos found in playlist', 'error');
            }
        })
        .catch(function (error) {
            setButtonLoading(extractBtn, false);
            console.error('Error:', error);
            showToast('Failed to extract playlist', 'error');
        });
}

/* Display Videos */
function displayVideos(videos) {
    var videoList = document.querySelector('.video-list');
    var resultsCount = document.querySelector('.results-count');

    if (!videoList) return;

    videoList.innerHTML = '';

    if (resultsCount) {
        resultsCount.textContent = videos.length + ' videos found';
    }

    videos.forEach(function (video, index) {
        var item = document.createElement('div');
        item.className = 'video-item';
        item.setAttribute('data-video-id', video.id || index);

        item.innerHTML = '\
            <img src="' + (video.thumbnail || 'https://tse3.mm.bing.net/th/id/OIP.v9bBH0svkt-cIB3BK2v83AHaHa?cb=ucfimg2&ucfimg=1&w=600&h=600&rs=1&pid=ImgDetMain&o=7&rm=3') + '" alt="" class="video-thumbnail">\
            <div class="video-info">\
                <div class="video-title">' + escapeHtml(video.title || 'Video ' + (index + 1)) + '</div>\
                <div class="video-meta">\
                    <span>' + (video.duration || '--:--') + '</span>\
                </div>\
            </div>\
            <div class="video-status pending">\
                <i class="fas fa-clock"></i>\
                <span>Pending</span>\
            </div>\
        ';

        videoList.appendChild(item);
    });
}

/* Start Download */
function startDownload() {
    if (!window.playlistVideos || window.playlistVideos.length === 0) {
        showToast('No videos to download', 'error');
        return;
    }

    var downloadBtn = document.querySelector('.download-btn') || document.getElementById('autoDownloadBtn');
    var progressPanel = document.getElementById('progressPanel');
    var videoList = document.getElementById('videoList');

    // Show progress panel
    if (progressPanel) {
        progressPanel.style.display = 'block';
    }

    // Display video list in progress panel
    if (videoList) {
        displayVideosInProgress(window.playlistVideos);
    }

    setButtonLoading(downloadBtn, true);

    var downloadPath = window.selectedDownloadPath || 'downloads';

    fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            videos: window.playlistVideos,
            path: downloadPath
        })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.task_id) {
                pollDownloadProgress(data.task_id);
            } else if (data.error) {
                setButtonLoading(downloadBtn, false);
                showToast(data.error, 'error');
            }
        })
        .catch(function (error) {
            setButtonLoading(downloadBtn, false);
            console.error('Error:', error);
            showToast('Failed to start download', 'error');
        });
}

/* Display Videos in Progress Panel */
function displayVideosInProgress(videos) {
    var videoList = document.getElementById('videoList');
    if (!videoList) return;

    videoList.innerHTML = '';

    videos.forEach(function (video, index) {
        var item = document.createElement('div');
        item.className = 'video-item';
        item.setAttribute('data-video-id', video.id || index);

        item.innerHTML = '\
            <img src="' + (video.thumbnail || 'https://tse3.mm.bing.net/th/id/OIP.v9bBH0svkt-cIB3BK2v83AHaHa?cb=ucfimg2&ucfimg=1&w=600&h=600&rs=1&pid=ImgDetMain&o=7&rm=3') + '" alt="" class="video-thumbnail">\
            <div class="video-info">\
                <div class="video-title">' + escapeHtml(video.title || 'Video ' + (index + 1)) + '</div>\
            </div>\
            <div class="video-status pending">\
                <i class="fas fa-clock"></i>\
                <span>Waiting</span>\
            </div>\
        ';

        videoList.appendChild(item);
    });
}

/* Poll Download Progress */
function pollDownloadProgress(taskId) {
    var progressBar = document.querySelector('.progress-bar');
    var progressText = document.querySelector('.progress-text');
    var progressStatus = document.querySelector('.progress-status');
    var progressMessage = document.querySelector('.progress-message');

    var interval = setInterval(function () {
        fetch('/download-progress/' + taskId)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                // Update progress bar
                if (progressBar) {
                    progressBar.style.width = data.progress + '%';
                    progressBar.classList.add('active');
                }

                if (progressText) {
                    progressText.textContent = data.progress + '%';
                }

                // Update status message (shows what's happening without revealing backend)
                if (progressMessage && data.message) {
                    progressMessage.textContent = data.message;
                }

                if (progressStatus) {
                    progressStatus.className = 'progress-status downloading';
                    var completed = data.completed_videos ? data.completed_videos.length : 0;
                    var total = data.total || 0;
                    progressStatus.innerHTML = '<i class="fas fa-download"></i> ' + completed + ' of ' + total + ' completed';
                }

                // Update current video status
                if (data.current_video) {
                    updateVideoStatus(data.current_video, 'downloading');
                }

                if (data.completed_videos) {
                    data.completed_videos.forEach(function (id) {
                        updateVideoStatus(id, 'completed');
                    });
                }

                if (data.failed_videos) {
                    data.failed_videos.forEach(function (id) {
                        updateVideoStatus(id, 'error');
                    });
                }

                // Check if complete
                if (data.status === 'completed') {
                    clearInterval(interval);
                    onDownloadComplete(data);
                } else if (data.status === 'error') {
                    clearInterval(interval);
                    onDownloadError(data.error);
                }
            })
            .catch(function (error) {
                console.error('Error polling progress:', error);
            });
    }, 1000);
}

/* Update Video Status */
function updateVideoStatus(videoId, status) {
    var item = document.querySelector('.video-item[data-video-id="' + videoId + '"]');
    if (!item) return;

    var statusEl = item.querySelector('.video-status');
    if (!statusEl) return;

    statusEl.className = 'video-status ' + status;

    var icons = {
        pending: 'clock',
        downloading: 'spinner fa-spin',
        completed: 'check',
        error: 'times'
    };

    var labels = {
        pending: 'Pending',
        downloading: 'Downloading',
        completed: 'Done',
        error: 'Failed'
    };

    statusEl.innerHTML = '<i class="fas fa-' + icons[status] + '"></i><span>' + labels[status] + '</span>';
}

/* Download Complete */
function onDownloadComplete(data) {
    var downloadBtn = document.querySelector('.download-btn') || document.getElementById('autoDownloadBtn');
    var progressBar = document.querySelector('.progress-bar');
    var progressStatus = document.querySelector('.progress-status');
    var progressTitle = document.querySelector('.progress-title');
    var progressMessage = document.querySelector('.progress-message');
    var resultsPanel = document.getElementById('resultsPanel');

    setButtonLoading(downloadBtn, false);

    if (progressBar) {
        progressBar.classList.remove('active');
        progressBar.style.width = '100%';
    }

    if (progressTitle) {
        progressTitle.innerHTML = '<i class="fas fa-check-circle"></i> Download Complete';
    }

    if (progressStatus) {
        progressStatus.className = 'progress-status completed';
        var completed = data.completed_videos ? data.completed_videos.length : 0;
        var failed = data.failed_videos ? data.failed_videos.length : 0;
        progressStatus.innerHTML = '<i class="fas fa-check"></i> ' + completed + ' downloaded, ' + failed + ' failed';
    }

    if (progressMessage) {
        progressMessage.textContent = 'All downloads have been processed successfully.';
    }

    // Show results panel
    if (resultsPanel) {
        resultsPanel.style.display = 'block';
        showResultsSummary(data);
    }

    showToast('Download completed successfully', 'success');
}

/* Show Results Summary */
function showResultsSummary(data) {
    var resultsList = document.getElementById('resultsList');
    if (!resultsList) return;

    resultsList.innerHTML = '';

    var completed = data.completed_videos || [];
    var failed = data.failed_videos || [];

    completed.forEach(function (id) {
        var item = document.createElement('div');
        item.className = 'result-item success';
        item.innerHTML = '<i class="fas fa-check-circle"></i><span>Video ' + id + ' downloaded successfully</span>';
        resultsList.appendChild(item);
    });

    failed.forEach(function (id) {
        var item = document.createElement('div');
        item.className = 'result-item error';
        item.innerHTML = '<i class="fas fa-times-circle"></i><span>Video ' + id + ' failed to download</span>';
        resultsList.appendChild(item);
    });
}

/* Download Error */
function onDownloadError(error) {
    var downloadBtn = document.querySelector('.download-btn');
    setButtonLoading(downloadBtn, false);
    showToast(error || 'Download failed', 'error');
}

/* Manual Download */
function initManualDownload() {
    var form = document.getElementById('manual-download-form');
    if (!form) return;

    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var urlsInput = form.querySelector('textarea[name="urls"]');
        var urls = urlsInput.value.trim().split('\n').filter(function (url) {
            return url.trim() !== '';
        });

        if (urls.length === 0) {
            showToast('Please enter at least one URL', 'error');
            return;
        }

        // Validate URLs
        var invalidUrls = urls.filter(function (url) {
            return !isValidYouTubeUrl(url.trim());
        });

        if (invalidUrls.length > 0) {
            showToast('Some URLs are invalid', 'error');
            return;
        }

        // Start manual download
        setButtonLoading(submitBtn, true);

        var videos = urls.map(function (url, index) {
            return {
                url: url.trim(),
                id: 'manual-' + index,
                title: 'Video ' + (index + 1)
            };
        });

        window.playlistVideos = videos;
        displayVideos(videos);

        var downloadPath = window.selectedDownloadPath || '';

        fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videos: videos,
                path: downloadPath
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.task_id) {
                    document.querySelector('.progress-section').style.display = 'block';
                    document.querySelector('.results-section').style.display = 'block';
                    pollDownloadProgress(data.task_id);
                } else if (data.error) {
                    setButtonLoading(submitBtn, false);
                    showToast(data.error, 'error');
                }
            })
            .catch(function (error) {
                setButtonLoading(submitBtn, false);
                console.error('Error:', error);
                showToast('Failed to start download', 'error');
            });
    });
}

/* Utility Functions */
function isValidYouTubeUrl(url) {
    var patterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/
    ];

    return patterns.some(function (pattern) {
        return pattern.test(url);
    });
}

function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        var originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        }
    }
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    type = type || 'info';

    var container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    var icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<i class="fas fa-' + icons[type] + '"></i><span>' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('show');
    }, 10);

    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 3000);
}
