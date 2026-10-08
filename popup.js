document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  const statusBar = document.getElementById('status-bar');

  // Load the current active philosophy
  chrome.storage.local.get(['selectedTier'], (result) => {
    const activeTier = result.selectedTier || 1; // Default to Tier 1
    highlightTier(activeTier);
  });

  // Handle tier clicks
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const tier = parseInt(card.getAttribute('data-tier'), 10);
      chrome.storage.local.set({ selectedTier: tier }, () => {
        highlightTier(tier);
      });
    });
  });

  function highlightTier(tier) {
    cards.forEach((card) => {
      if (parseInt(card.getAttribute('data-tier'), 10) === tier) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    const tierNames = {
      1: "The Mindful Observer (Speed Bump)",
      2: "The Stoic Interrupter (Video Paused)",
      3: "The Digital Ascetic (5-Min Lockdown)"
    };

    statusBar.textContent = `Philosophy active: ${tierNames[tier]}`;
  }
});