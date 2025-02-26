// JavaScript to dynamically generate and apply a ninja favicon
document.addEventListener('DOMContentLoaded', function() {
    // Create an SVG favicon
    const svgString = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <circle cx="32" cy="32" r="30" fill="#102010"/>
  
  <!-- Ninja Body -->
  <ellipse cx="32" cy="40" rx="14" ry="18" fill="#000000"/>
  
  <!-- Ninja Head -->
  <circle cx="32" cy="22" r="14" fill="#000000"/>
  
  <!-- Eye Slit -->
  <rect x="22" y="20" width="20" height="4" fill="#FFFFFF"/>
  
  <!-- Red Scarf -->
  <path d="M26 24 L10 14 L14 24 L26 24" fill="#FF0000"/>
  
  <!-- Shuriken Star -->
  <path d="M52 22 L48 18 L52 14 L56 18 L52 22 Z" fill="#FFCC00" stroke="#FFFFFF"/>
</svg>`;
    
    // Convert the SVG to a data URL
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create a favicon link element
    const faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    faviconLink.href = svgUrl;
    faviconLink.type = 'image/svg+xml';
    
    // Add the favicon to the head
    document.head.appendChild(faviconLink);
}); 