 // Add event listeners for share buttons
 document.addEventListener('DOMContentLoaded', function() {
    // Get buttons
    const facebookBtn = document.getElementById('facebook-btn');
    const twitterBtn = document.getElementById('twitter-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Facebook share
    facebookBtn.addEventListener('click', function() {
      const shareText = "I played Shadow Ninja! Can you beat my score?";
      const shareUrl = window.location.href;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    });

    // Twitter share
    twitterBtn.addEventListener('click', function() {
      const shareText = "I played Shadow Ninja! Can you beat my score?";
      const shareUrl = window.location.href;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    });

    // Download screenshot
    downloadBtn.addEventListener('click', function() {
      const canvas = document.getElementById('gameCanvas');
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'shadow-ninja-score.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });