function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}
function toggleIframe() {
  var iframeContainer = document.getElementById('iframeContainer');

  // Toggle the display of the iframe
  if (iframeContainer.style.display === "none") {
    iframeContainer.style.display = "block";
  } else {
    iframeContainer.style.display = "none";
  }

  // Scroll to the top of the page
  window.scrollTo(0, 0);
}
