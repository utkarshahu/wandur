const filters = document.querySelectorAll('.filter');
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      let category = filter.getAttribute('data-filter');
      let cards = document.querySelectorAll('.listing-card');

      cards.forEach(card => {
        let cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
