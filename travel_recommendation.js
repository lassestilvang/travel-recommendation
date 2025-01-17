document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".btn-search");
  const clearButton = document.querySelector(".btn-clear");
  const errorMessage = document.querySelector(".error-message");
  const navLinks = document.querySelectorAll(".nav-link");
  const searchContainer = document.querySelector(".search-container");
  const sections = {
    home: document.getElementById("home-section"),
    about: document.getElementById("about-section"),
    contact: document.getElementById("contact-section"),
  };

  // Create results section
  const resultsSection = document.createElement("section");
  resultsSection.className = "results-section";
  resultsSection.style.display = "none";
  document.body.appendChild(resultsSection);

  // Keywords mapping for search
  const keywordMappings = {
    beaches: ["beach", "beaches", "coast", "coastal", "shore", "seaside"],
    temples: ["temple", "temples", "shrine", "shrines", "religious", "sacred"],
    countries: [
      "country",
      "countries",
      "nation",
      "nations",
      "destination",
      "destinations",
    ],
  };

  // Navigation functionality
  const navBrand = document.querySelector(".navbar-brand");

  function toggleSearchContainer(section) {
    // Show search container only on home page
    searchContainer.style.opacity = section === "home" ? "1" : "0";

    // Clear search and results when navigating away from home
    if (section !== "home") {
      searchInput.value = "";
      resultsSection.style.display = "none";
    }
  }

  navBrand.addEventListener("click", (e) => {
    e.preventDefault();
    // Update active link
    navLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector('[data-section="home"]').classList.add("active");

    // Show search container
    toggleSearchContainer("home");

    // Show home section, hide others
    Object.keys(sections).forEach((key) => {
      if (sections[key]) {
        sections[key].style.display = key === "home" ? "block" : "none";
      }
    });

    // Hide results if visible
    if (resultsSection) {
      resultsSection.style.display = "none";
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");

      // Toggle search container visibility
      toggleSearchContainer(section);

      // Update active link
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Show selected section, hide others
      Object.keys(sections).forEach((key) => {
        if (sections[key]) {
          sections[key].style.display = key === section ? "block" : "none";
        }
      });
    });
  });

  async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query === "") {
      showErrorMessage();
      return;
    }

    try {
      const response = await fetch("travel_recommendation_api.json");
      const data = await response.json();
      const results = searchDestinations(query, data);

      if (results.length === 0) {
        showErrorMessage("No results found for your search.");
        return;
      }

      displayResults(results);
      hideErrorMessage();
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorMessage("An error occurred while searching. Please try again.");
    }
  }

  function searchDestinations(query, data) {
    let results = [];

    // Check if query matches any keyword category
    const category = getMatchingCategory(query);

    if (category === "beaches") {
      results = data.beaches;
    } else if (category === "temples") {
      results = data.temples;
    } else if (category === "countries") {
      // For countries, we need to include all cities
      data.countries.forEach((country) => {
        country.cities.forEach((city) => {
          results.push({
            ...city,
            country: country.name,
          });
        });
      });
    } else {
      // Search across all categories if no specific category matches
      results = [
        ...data.beaches,
        ...data.temples,
        ...data.countries.flatMap((country) =>
          country.cities.map((city) => ({
            ...city,
            country: country.name,
          }))
        ),
      ].filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.country && item.country.toLowerCase().includes(query))
      );
    }

    return results;
  }

  function getMatchingCategory(query) {
    for (const [category, keywords] of Object.entries(keywordMappings)) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        return category;
      }
    }
    return null;
  }

  // Function to format time in 12-hour format with AM/PM
  function formatTime(date) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Function to get local time for a timezone
  function getLocalTime(timezone) {
    const currentTime = new Date("2025-01-17T20:21:04+01:00"); // Source of truth time
    try {
      return formatTime(
        new Date(currentTime.toLocaleString("en-US", { timeZone: timezone }))
      );
    } catch (error) {
      console.error("Error calculating time for timezone:", timezone);
      return "Time unavailable";
    }
  }

  function displayResults(results) {
    // Keep home section visible and show results overlay
    sections.home.style.display = "block";
    sections.about.style.display = "none";
    sections.contact.style.display = "none";

    // Create results HTML
    const resultsHTML = `
            <div class="results-container">
                ${results
                  .map(
                    (result) => `
                    <div class="result-card">
                        <div class="result-image">
                            <img src="${result.imageUrl}" alt="${result.name}">
                        </div>
                        <div class="result-content">
                            <h2>${result.name}</h2>
                            <div class="local-time">
                                <i class="far fa-clock"></i>
                                Local Time: ${getLocalTime(
                                  result.timezone || "UTC"
                                )}
                            </div>
                            <p>${result.description}</p>
                            <button class="visit-btn">Visit</button>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    // Update results section
    resultsSection.style.transform = "translateX(100%)";
    resultsSection.style.display = "block";
    resultsSection.innerHTML = resultsHTML;

    // Trigger reflow for animation
    resultsSection.offsetHeight;

    // Animate in
    resultsSection.style.transform = "translateX(0)";
  }

  function clearSearch() {
    // Clear search input
    searchInput.value = "";

    // Hide error message if visible
    hideErrorMessage();

    // Hide results section with animation
    resultsSection.style.transform = "translateX(100%)";
    setTimeout(() => {
      resultsSection.style.display = "none";
      resultsSection.style.transform = "translateX(0)";

      // Clear the results content
      resultsSection.innerHTML = "";
    }, 300);

    // Ensure home section is visible
    sections.home.style.display = "block";

    // Remove any active search styling
    searchInput.classList.remove("active-search");

    // Focus back on search input
    searchInput.blur();
  }

  // Clear button event listener
  clearButton.addEventListener("click", clearSearch);

  // Add escape key functionality to clear
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && resultsSection.style.display === "block") {
      clearSearch();
    }
  });

  searchButton.addEventListener("click", () => {
    handleSearch();
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  function showErrorMessage(message = "Please enter a valid search query.") {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(hideErrorMessage, 3000);
  }

  function hideErrorMessage() {
    errorMessage.style.display = "none";
  }

  // Contact form handling
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value,
      };

      // Here you would typically send the form data to your backend
      console.log("Form submitted:", formData);

      // Clear form
      contactForm.reset();

      // Show success message
      alert("Thank you for your message! We will get back to you soon.");
    });
  }

  // Navbar scroll effect
  let lastScroll = 0;
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      return;
    }

    if (currentScroll > lastScroll) {
      // Scrolling down
      navbar.style.transform = "translateY(-100%)";
    } else {
      // Scrolling up
      navbar.style.transform = "translateY(0)";
      navbar.style.background = "rgba(255, 255, 255, 1)";
    }
    lastScroll = currentScroll;
  });
});
