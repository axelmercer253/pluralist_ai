document.addEventListener("DOMContentLoaded", () => {
  const heroStories = [
    {
      title: "Global Markets Rally Amid Economic Optimism",
      label: "TOP STORY",
      description: "Stocks surged worldwide as inflation fears ease and tech giants report strong earnings.",
      image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1400&q=85"
    },
    {
      title: "AI Breakthrough: New Model Sets Benchmark",
      label: "TECHNOLOGY",
      description: "A new generation of AI models is pushing performance benchmarks across research and enterprise applications.",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85"
    },
    {
      title: "Champions League Delivers Stunning Upsets",
      label: "SPORTS",
      description: "Unexpected results have reshaped the tournament and set up a dramatic next round.",
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1400&q=85"
    }
  ];

  const hero = document.getElementById("hero");
  if (hero) {
    let heroIndex = 0;
    const heroTitle = document.getElementById("heroTitle");
    const heroLabel = document.getElementById("heroLabel");
    const heroDescription = document.getElementById("heroDescription");
    const heroReadMore = document.getElementById("heroReadMore");
    const heroDots = document.getElementById("heroDots");

    function renderHeroDots() {
      if (!heroDots) return;
      heroDots.innerHTML = "";
      heroStories.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "hero-dot" + (index === heroIndex ? " active" : "");
        dot.setAttribute("aria-label", "Show story " + (index + 1));
        dot.addEventListener("click", () => {
          heroIndex = index;
          renderHero();
        });
        heroDots.appendChild(dot);
      });
    }

    function renderHero() {
      const story = heroStories[heroIndex];
      if (!story) return;
      if (heroTitle) heroTitle.textContent = story.title;
      if (heroLabel) heroLabel.textContent = story.label;
      if (heroDescription) heroDescription.textContent = story.description;
      hero.style.backgroundImage = `linear-gradient(90deg,rgba(3,9,17,.97),rgba(3,9,17,.73) 42%,rgba(3,9,17,.08)),url("${story.image}")`;
      renderHeroDots();
    }

    const nextButton = document.getElementById("heroNext");
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        heroIndex = (heroIndex + 1) % heroStories.length;
        renderHero();
      });
    }

    if (heroReadMore) {
      heroReadMore.addEventListener("click", () => {
        alert("Opening story: " + heroStories[heroIndex].title);
      });
    }

    renderHero();
  }

  document.querySelectorAll(".category").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".category").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const category = button.dataset.category;
      document.querySelectorAll(".news-card").forEach((card) => {
        const match = category === "all" || card.dataset.category === category;
        card.style.display = match ? "" : "none";
      });
    });
  });

  const searchInput = document.getElementById("searchInput");
  const noResults = document.getElementById("noResults");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      document.querySelectorAll(".news-card").forEach((card) => {
        const match = query === "" || card.textContent.toLowerCase().includes(query);
        card.style.display = match ? "" : "none";
        if (match) visible += 1;
      });

      if (noResults) {
        noResults.style.display = visible === 0 ? "block" : "none";
      }
    });
  }

  document.querySelectorAll(".bookmark").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      button.textContent = button.textContent === "♡" ? "♥" : "♡";
    });
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light");
    });
  }

  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const emailInput = newsletterForm.querySelector("input");
      const email = emailInput ? emailInput.value : "";
      alert(`Thanks! ${email} has been subscribed.`);
      newsletterForm.reset();
    });
  }

  const aiInput = document.getElementById("aiInput");
  const aiResponse = document.getElementById("aiResponse");
  const aiSend = document.getElementById("aiSend");

  function askAI() {
    if (!aiInput || !aiResponse) return;
    const question = aiInput.value.trim();
    if (!question) return;
    aiResponse.textContent = "AI ready: " + question;
    aiInput.value = "";
  }

  if (aiSend) {
    aiSend.addEventListener("click", askAI);
  }

  if (aiInput) {
    aiInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") askAI();
    });
  }
});
