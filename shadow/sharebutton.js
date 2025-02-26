(function() {
  // Get references to game objects
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // References to HTML buttons
  const shareContainer = document.getElementById('share-container');
  const facebookBtn = document.getElementById('facebook-btn');
  const twitterBtn = document.getElementById('twitter-btn');
  const downloadBtn = document.getElementById('download-btn');
  
  // Hide share buttons initially
  shareContainer.style.display = 'none';
  
  // Check game state every 100ms
  const checkInterval = setInterval(function() {
      if (typeof window.gameState !== 'undefined') {
          if (window.gameState === 'game_over' || window.gameState === 'game_complete') {
              shareContainer.style.display = 'block';
          } else {
              shareContainer.style.display = 'none';
          }
      }
  }, 100);
  
  // Facebook share button
  facebookBtn.addEventListener('click', function() {
      const score = window.player && window.player.score ? window.player.score : 0;
      const shareText = `I scored ${score} points in Shadow Ninja! Can you beat that?`;
      const shareUrl = encodeURIComponent(window.location.href);
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(shareText)}`;
      window.open(facebookUrl, '_blank');
  });
  
  // Twitter share button
  twitterBtn.addEventListener('click', function() {
      const score = window.player && window.player.score ? window.player.score : 0;
      const shareText = `I scored ${score} points in Shadow Ninja! Can you beat that?`;
      const shareUrl = encodeURIComponent(window.location.href);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`;
      window.open(twitterUrl, '_blank');
  });
  
  // Download screenshot button
  downloadBtn.addEventListener('click', function() {
      // Wait for the next animation frame to ensure the canvas is fully rendered
      setTimeout(function() {
          try {
              const dataUrl = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = 'shadow-ninja-screenshot.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } catch (e) {
              console.error("Screenshot function not available");
              alert("Sorry, the screenshot functionality is not available.");
          }
      }, 1000); // Wait 1 second for everything to load
  });
  
});


// <!-- Add event listeners to share buttons when the document is loaded -->
      document.addEventListener('DOMContentLoaded', function() {
          // Wait for the game script to fully load
          setTimeout(function() {
              console.log("Setting up share buttons");
              
              // Hide share buttons initially
              document.getElementById('share-container').style.display = 'none';
              
              // Facebook share button
              document.getElementById('facebook-btn').addEventListener('click', function() {
                  console.log("Facebook share clicked");
                  const shareText = `I scored ${window.player?.score || 0} points in Shadow Ninja! Can you beat that?`;
                  const shareUrl = encodeURIComponent(window.location.href);
                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(shareText)}`;
                  window.open(facebookUrl, '_blank');
              });
              
              // Twitter share button
              document.getElementById('twitter-btn').addEventListener('click', function() {
                  console.log("Twitter share clicked");
                  const shareText = `I scored ${window.player?.score || 0} points in Shadow Ninja! Can you beat that?`;
                  const shareUrl = encodeURIComponent(window.location.href);
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`;
                  window.open(twitterUrl, '_blank');
              });
              
              // Download screenshot button
              document.getElementById('download-btn').addEventListener('click', function() {
                  console.log("Download screenshot clicked");
                  // Create a screenshot of the game
                  if (typeof window.createAndDownloadScreenshot === 'function') {
                      window.createAndDownloadScreenshot();
                  } else {
                      console.error("Screenshot function not available");
                      alert("Sorry, the screenshot functionality is not available.");
                  }
              });
          }, 1000); // Wait 1 second for everything to load
      });


/*
  <!-- Remove any existing click listener and add the new one
  canvas.removeEventListener('click', handleCanvasClick);
  canvas.addEventListener('click', handleCanvasClick); -->
  
  <!-- Function to create and download a game screenshot
  function createAndDownloadScreenshot() {
      // Save canvas state
      ctx.save();
      
      // Create a snapshot of the current state
      const gameOverSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Clear canvas and prepare for sharing image
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw game title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHADOW NINJA', canvas.width/2, 50);
      
      // Draw score
      ctx.font = 'bold 30px monospace';
      ctx.fillText(`SCORE: ${player.score.toString().padStart(6, '0')}`, canvas.width/2, canvas.height/2);
      
      // Draw a ninja silhouette
      drawNinjaForShare(canvas.width/2, canvas.height/2 - 80);
      
      // Convert canvas to data URL and download
      try {
          const dataUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = dataUrl;
          downloadLink.download = 'shadow-ninja-score.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Restore canvas state
          ctx.putImageData(gameOverSnapshot, 0, 0);
          ctx.restore();
          
      } catch (error) {
          console.error('Error creating or sharing screenshot:', error);
          // Restore canvas state
          ctx.putImageData(gameOverSnapshot, 0, 0);
          ctx.restore();
      }
  }
  
  // Function to draw a ninja silhouette for the share image
  function drawNinjaForShare(x, y) {
      ctx.fillStyle = '#FFFFFF';
      
      // Ninja body
      ctx.beginPath();
      ctx.ellipse(x, y + 30, 15, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ninja head
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Ninja scarf
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 5);
      ctx.lineTo(x - 25, y - 15);
      ctx.lineTo(x - 20, y - 5);
      ctx.lineTo(x - 5, y + 5);
      ctx.fill();
      
      // Ninja sword
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(x + 10, y - 30, 2, 60);
      
      // Throwing star
      drawStar(x + 30, y, 5, 8, 4, true, '#FFCC00');
  }
  
  // Make function accessible to the global scope
  window.createAndDownloadScreenshot = createAndDownloadScreenshot;
  
  // Function to update enemies --> */
 
 
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