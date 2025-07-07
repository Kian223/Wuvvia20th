document.addEventListener("DOMContentLoaded", () => {
  // === Wavify Animation ===
  class WavifyWave {
    constructor(element, options = {}) {
      this.element = element;
      this.options = {
        height: 60,
        amplitude: 40,
        speed: 0.15,
        points: 3,
        ...options,
      };
      this.vHeight = 400;
      this.vWidth = 1200;
      this.animationId = null;
      this.init();
    }

    init() {
      this.element.setAttribute(
        "viewBox",
        `0 0 ${this.vWidth} ${this.vHeight}`
      );
      this.animate();
    }

    buildPath(time) {
      const { height, amplitude, points } = this.options;
      let path = `M 0 ${height}`;
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * this.vWidth;
        const y = height + Math.sin(time + i * 0.5) * amplitude;
        path += ` Q ${x} ${y} ${x + this.vWidth / points / 2} ${height}`;
      }
      path += ` T ${this.vWidth} ${height} L ${this.vWidth} ${this.vHeight} L 0 ${this.vHeight} Z`;
      return path;
    }

    animate() {
      const animateWave = (time) => {
        const normalizedTime = time * this.options.speed * 0.01;
        const path = this.buildPath(normalizedTime);
        const pathElement = this.element.querySelector("#wavePath");
        if (pathElement) pathElement.setAttribute("d", path);
        this.animationId = requestAnimationFrame(animateWave);
      };
      animateWave(0);
    }

    destroy() {
      if (this.animationId) cancelAnimationFrame(this.animationId);
    }
  }

  // === DRAGGABLE POPUP FUNCTION ===
  function handlePopup({
    buttonSelector,
    popupId,
    closeId,
    dragHeaderSelector,
  }) {
    const btn = document.querySelector(buttonSelector);
    const popup = document.getElementById(popupId);
    const closeBtn = document.getElementById(closeId);
    const header = popup.querySelector(dragHeaderSelector);

    if (!btn || !popup || !closeBtn || !header) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let lastLeft = null;
    let lastTop = null;
    let firstOpen = true;

    const popupSound = document.getElementById("popup-sound");
    const closeSound = document.getElementById("close-sound");

    btn.addEventListener("click", () => {
      popup.style.display = "block";
      document.body.classList.add("noscroll"); // 🚫 Disable scroll body

      if (firstOpen) {
        popup.style.left = "calc(25% + 5px)";
        popup.style.top = "calc(23% - 50px)";
        popup.style.transform = "scale(0.3)";
      } else {
        popup.style.left = `${lastLeft}px`;
        popup.style.top = `${lastTop}px`;
        popup.style.transform = "scale(0.3)";
      }

      popup.style.opacity = "0";
      popup.style.pointerEvents = "none";
      void popup.offsetWidth;

      popup.animate(
        [
          { transform: popup.style.transform, opacity: 0 },
          { transform: "scale(1)", opacity: 1 },
        ],
        {
          duration: 400,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          fill: "forwards",
        }
      );

      popup.style.opacity = "1";
      popup.style.pointerEvents = "auto";
      popup.style.transform = "scale(1)";
      firstOpen = false;

      if (popupSound) {
        popupSound.currentTime = 0;
        popupSound.play().catch(() => {});
      }
    });

    closeBtn.addEventListener("click", () => {
      if (closeSound) {
        closeSound.currentTime = 0;
        closeSound.play().catch(() => {});
      }

      popup.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(0.3)", opacity: 0 },
        ],
        {
          duration: 300,
          easing: "ease-in-out",
          fill: "forwards",
        }
      ).onfinish = () => {
        popup.style.display = "none";
        popup.style.opacity = "0";
        popup.style.pointerEvents = "none";
        document.body.classList.remove("noscroll"); // ✅ Enable back scroll body
      };
    });

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      if (popup.style.transform.includes("translate")) {
        const rect = popup.getBoundingClientRect();
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.top}px`;
        popup.style.transform = "scale(1)";
      }

      const rect = popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      popup.style.transition = "none";
      document.body.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;
      const maxX = window.innerWidth - popup.offsetWidth;
      const maxY = window.innerHeight - popup.offsetHeight;
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
      popup.style.transform = "scale(1)";
      lastLeft = x;
      lastTop = y;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      popup.style.transition = "";
      document.body.style.cursor = "";
    });
  }

  // === DOM READY ===
  const waveElement = document.getElementById("wave");
  if (waveElement)
    new WavifyWave(waveElement, {
      height: 5,
      amplitude: 20,
      speed: 0.1,
      points: 4,
    });

  handlePopup({
    buttonSelector: '[data-tab="about"]',
    popupId: "about-tab",
    closeId: "close-about",
    dragHeaderSelector: ".cursor-move",
  });

  handlePopup({
    buttonSelector: '[data-tab="calc"]',
    popupId: "calc-tab",
    closeId: "close-calc",
    dragHeaderSelector: "#calc-header",
  });

  // Calculator Logic
  const calcDisplay = document.getElementById("calc-display");
  let calcValue = "";
  document.querySelectorAll(".calc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.textContent.trim();
      if (val === "C") calcValue = "";
      else if (val.toLowerCase() === "del") calcValue = calcValue.slice(0, -1);
      else if (val === "=") {
        try {
          calcValue = eval(calcValue).toString();
        } catch {
          calcValue = "Error";
        }
      } else {
        calcValue += val;
      }
      calcDisplay.value = calcValue;
    });
  });

  const notes = ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"];
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playNote(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  function noteToFreq(note) {
    const map = {
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      F5: 698.46,
      G5: 783.99,
      A5: 880,
      B5: 987.77,
      C6: 1046.5,
    };
    return map[note] || 440;
  }

  document.querySelectorAll(".calc-btn").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      playNote(noteToFreq(randomNote));
    });
  });

  document.addEventListener("keydown", (e) => {
    const calcPopup = document.getElementById("calc-tab");
    if (calcPopup.style.display !== "block") return;
    const key = e.key;
    if (/^[0-9+\-*/.]$/.test(key)) {
      calcValue += key;
    } else if (key === "Enter" || key === "=") {
      try {
        calcValue = eval(calcValue).toString();
      } catch {
        calcValue = "Error";
      }
    } else if (key === "Backspace") {
      calcValue = calcValue.slice(0, -1);
    } else if (key.toLowerCase() === "c" || key === "Escape") {
      calcValue = "";
    }
    calcDisplay.value = calcValue;
  });

  // === PIN PROTECTION GALLERY ===
  const galleryMenu = document.querySelector('[data-tab="gallery"]');
  const pinModal = document.getElementById("pin-modal");
  const pinInput = document.getElementById("pin-input");
  const submitPin = document.getElementById("submit-pin");
  const pinError = document.getElementById("pin-error");
  const pinLocked = document.getElementById("pin-locked");
  const galleryPopup = document.getElementById("gallery-tab");
  const closeGallery = document.getElementById("close-gallery");
  const closePinModal = document.getElementById("close-pin");

  const pinSound = document.getElementById("pin-sound");
  const pinCloseSound = document.getElementById("pin-close-sound");
  const galleryOpenSound = document.getElementById("gallery-open-sound");
  const galleryCloseSound = document.getElementById("gallery-close-sound");

  const correctPIN = "250617";
  let pinValidated = false;

  // Ambil dari localStorage
  let failedAttempts = Number(localStorage.getItem("pin_failed")) || 0;
  let lockUntil = Number(localStorage.getItem("pin_lock_until")) || 0;

  // Klik menu Gallery
  galleryMenu?.addEventListener("click", () => {
    if (pinValidated) {
      showGalleryPopup();
    } else {
      showPinModal();
    }
  });

  function showPinModal() {
    const now = Date.now();

    pinModal.classList.remove("hidden");
    pinModal.classList.add("flex");

    if (lockUntil && now < lockUntil) {
      pinInput.disabled = true;
      pinLocked.style.display = "block";
      pinError.style.display = "none";
    } else {
      pinInput.disabled = false;
      pinLocked.style.display = "none";
      pinInput.value = "";
      pinError.style.display = "none";
      pinInput.classList.remove("border-red-500");
      pinInput.focus();
    }

    pinSound?.play().catch(() => {});
  }

  // Tombol tutup PIN
  closePinModal?.addEventListener("click", () => {
    pinModal.classList.add("hidden");
    pinModal.classList.remove("flex");
    pinCloseSound?.play().catch(() => {});
  });

  // Validasi PIN
  submitPin?.addEventListener("click", validatePIN);
  pinInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validatePIN();
  });

  function validatePIN() {
    const now = Date.now();

    // Jika masih dalam masa lock
    if (lockUntil && now < lockUntil) {
      pinLocked.style.display = "block";
      pinInput.disabled = true;
      return;
    }

    if (pinInput.value.trim() === correctPIN) {
      pinValidated = true;
      failedAttempts = 0;
      localStorage.removeItem("pin_failed");
      localStorage.removeItem("pin_lock_until");

      pinModal.classList.remove("flex");
      pinModal.classList.add("hidden");
      pinCloseSound?.play().catch(() => {});
      showGalleryPopup();
    } else {
      failedAttempts++;
      localStorage.setItem("pin_failed", failedAttempts);
      pinError.style.display = "block";
      pinInput.classList.add("border-red-500");
      pinInput.focus();

      if (failedAttempts >= 3) {
        const lockTime = Date.now() + 24 * 60 * 60 * 1000; // 24 jam
        localStorage.setItem("pin_lock_until", lockTime);
        pinInput.disabled = true;
        pinLocked.style.display = "block";
        pinError.style.display = "none";
      }
    }
  }

  // === TAMPILKAN GALLERY ===
  function showGalleryPopup() {
    galleryPopup.style.display = "block";
    galleryPopup.style.opacity = "0";
    galleryPopup.style.transform = "translate(-50%, -50%) scale(0.3)";
    document.body.classList.add("noscroll");

    galleryPopup.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      ],
      {
        duration: 400,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards",
      }
    );

    galleryPopup.style.opacity = "1";
    galleryPopup.style.transform = "translate(-50%, -50%) scale(1)";
    galleryPopup.style.pointerEvents = "auto";

    galleryOpenSound?.play().catch(() => {});
  }

  // === TUTUP GALLERY ===
  closeGallery?.addEventListener("click", () => {
    galleryPopup.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
      ],
      {
        duration: 300,
        easing: "ease-in-out",
        fill: "forwards",
      }
    ).onfinish = () => {
      galleryPopup.style.display = "none";
      galleryPopup.style.opacity = "0";
      galleryPopup.style.pointerEvents = "none";
      galleryPopup.style.transform = "translate(-50%, -50%) scale(0.3)";
      document.body.classList.remove("noscroll");

      galleryCloseSound?.play().catch(() => {});
    };
  });

  // === MODAL IMAGE VIEWER ===
  const images = document.querySelectorAll(".gallery-img");
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const closeModal = document.getElementById("close-modal");
  const modalOpenSound = document.getElementById("modal-open-sound");
  const modalCloseSound = document.getElementById("modal-close-sound");

  // Tampilkan modal saat gambar diklik
  images.forEach((img) => {
    img.addEventListener("click", () => {
      modalImage.src = img.src;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      modalOpenSound?.play().catch(() => {});
    });
  });

  // Tutup modal saat klik tombol ✕
  closeModal?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modalCloseSound?.play().catch(() => {});
  });

  // Tutup modal dengan tombol ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modalCloseSound?.play().catch(() => {});
    }
  });

  // === CHIP KATEGORI (Smooth Scroll) ===
  document.querySelectorAll(".gallery-chips a").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = chip.getAttribute("href")?.replace("#", "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // To DO List \\
  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoList = document.getElementById("todo-list");

  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  function renderTodos() {
    todoList.innerHTML = "";
    todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.className = `todo-item ${todo.done ? "completed" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => {
        todos[index].done = !todos[index].done;
        saveAndRender();
      });

      const span = document.createElement("span");
      span.textContent = todo.text;

      const del = document.createElement("button");
      del.textContent = "Hapus";
      del.addEventListener("click", () => {
        todos.splice(index, 1);
        saveAndRender();
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(del);
      todoList.appendChild(li);
    });
  }

  function saveAndRender() {
    localStorage.setItem("todos", JSON.stringify(todos));
    renderTodos();
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text !== "") {
      todos.push({ text, done: false });
      todoInput.value = "";
      saveAndRender();
    }
  });

  renderTodos();

  // Backsound sama suara meng \\
  handlePopup({
    buttonSelector: '[data-tab="notes"]',
    popupId: "notes-tab",
    closeId: "close-notes",
    dragHeaderSelector: "#notes-header",
  });

  const gifImg = document.getElementById("gif-toggle");
  const gifAudio = document.getElementById("gif-audio");
  const hoverSound = document.getElementById("hover-sound");
  const clickSound = document.getElementById("click-sound");

  const stillSrc = "assets/img/piabobo.jpg";
  const gifSrc = "assets/img/cute-dancing.gif";

  const randomSounds = [
    "assets/audio/meng1.mp3",
    "assets/audio/meng2.mp3",
    "assets/audio/meng3.mp3",
    "assets/audio/meng5.mp3",
    "assets/audio/meng4.mp3",
  ];

  let isPlaying = false;
  let isSoundPlaying = false;

  gifAudio.loop = true;

  // Fungsi untuk ambil suara acak
  function getRandomHoverSound() {
    const index = Math.floor(Math.random() * randomSounds.length);
    return randomSounds[index];
  }

  // Klik gambar
  gifImg.addEventListener("click", () => {
    // Jangan izinkan klik kalau suara sedang diputar
    if (isSoundPlaying) return;

    // Suara klik
    clickSound.currentTime = 0;
    clickSound.play();

    if (isPlaying) {
      // GIF → JPG
      gifImg.src = stillSrc;
      gifAudio.pause();
      gifAudio.currentTime = 0;

      // Mainkan suara random saat pause
      const sound = getRandomHoverSound();
      hoverSound.src = sound;
      hoverSound.currentTime = 0;
      hoverSound.play();
      isSoundPlaying = true;

      hoverSound.onended = () => {
        isSoundPlaying = false;
      };
    } else {
      // JPG → GIF
      gifImg.src = gifSrc;
      gifAudio.currentTime = 0;
      gifAudio.play();
    }

    isPlaying = !isPlaying;
  });

  // === Suara Hover dan Klik untuk #game-trigger ===
  const triggerImg = document.getElementById("game-trigger");
  const hoverAudio = document.getElementById("hover-audio");
  const clickAudio = document.getElementById("click-audio");

  let audioUnlocked = false;

  triggerImg.addEventListener("click", () => {
    // === Tampilkan Game Tab ===
    gameTab.classList.remove("scale-out");
    gameTab.classList.add("scale-in", "active");

    gameTab.style.top = "50%";
    gameTab.style.left = "55%";
    gameTab.style.transform = "translate(-50%, -50%) scale(1)";

    // Reset tombol "Tidak Suka"
    btnNo.style.left = "80%";
    btnNo.style.top = "40px";
    btnNo.style.opacity = "1";
    btnNo.style.pointerEvents = "auto";
    btnNo.style.transform = "scale(1)";
    btnNo.textContent = "Tidak Suka";
    btnNoClicked = false;

    // Simpan posisi awal tombol
    setTimeout(() => {
      const rect = btnNo.getBoundingClientRect();
      const tabRect = gameTab.getBoundingClientRect();
      initialNoPosition = {
        x: rect.left - tabRect.left,
        y: rect.top - tabRect.top,
      };
    }, 50);

    // === UNLOCK AUDIO SAAT KLIK PERTAMA ===
    if (!audioUnlocked) {
      hoverAudio
        .play()
        .then(() => {
          hoverAudio.pause();
          hoverAudio.currentTime = 0;
          audioUnlocked = true;
        })
        .catch((err) => {
          console.warn("Gagal unlock hover-audio:", err);
        });
    }

    // === MAINKAN SUARA KLIK ===
    if (clickAudio) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch((err) => {
        console.warn("Click audio error:", err);
      });
    }
  });

  // === MAINKAN SUARA HOVER JIKA SUDAH DIUNLOCK ===
  triggerImg.addEventListener("mouseenter", () => {
    if (audioUnlocked && hoverAudio) {
      hoverAudio.currentTime = 0;
      hoverAudio.play().catch((err) => {
        console.warn("Hover audio gagal diputar:", err);
      });
    }
  });

  // Quiz \\
  const gameTab = document.getElementById("game-tab");
  const gomaTrigger = document.getElementById("game-trigger");
  const btnNo = document.getElementById("btn-no");
  const btnYes = document.getElementById("btn-yes");
  const btnGroup = document.querySelector(".button-group");

  let initialNoPosition = { x: 0, y: 0 };
  let btnNoClicked = false;
  let animationFrame;
  let btnNoOffset = { x: 0, y: 0 };

  // Munculkan popup
  gomaTrigger.addEventListener("click", () => {
    gameTab.classList.remove("scale-out");
    gameTab.classList.add("scale-in", "active");

    gameTab.style.top = "10%";
    gameTab.style.left = "30%";
    gameTab.style.transform = "translate(-50%, -50%) scale(1)";

    // Reset tombol "Tidak Suka"
    btnNo.style.position = "absolute";
    btnNo.style.transition = "transform 0.3s ease";
    btnNo.style.transform = "translate(0, 0)";
    btnNoOffset = { x: 0, y: 0 };
    btnNoClicked = false;
    btnNo.textContent = "GA";
    btnNo.style.opacity = "1";
    btnNo.style.pointerEvents = "auto";

    setTimeout(() => {
      const rect = btnNo.getBoundingClientRect();
      const tabRect = gameTab.getBoundingClientRect();
      initialNoPosition = {
        x: rect.left - tabRect.left,
        y: rect.top - tabRect.top,
      };
      btnNo.style.left = `${initialNoPosition.x}px`;
      btnNo.style.top = `${initialNoPosition.y}px`;
    }, 50);
  });

  // Tombol "Tidak Suka" kabur dengan smooth
  gameTab.addEventListener("mousemove", (e) => {
    if (btnNoClicked) return;
    cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(() => {
      const tabRect = gameTab.getBoundingClientRect();
      const noRect = btnNo.getBoundingClientRect();

      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const btnCenterX = noRect.left + noRect.width / 2;
      const btnCenterY = noRect.top + noRect.height / 2;

      const distX = mouseX - btnCenterX;
      const distY = mouseY - btnCenterY;
      const distance = Math.sqrt(distX ** 2 + distY ** 2);

      const threshold = 120;
      if (distance < threshold) {
        const moveDistance = 80; // Lebih pendek, tapi tetap nyebelin
        const angle = Math.atan2(distY, distX);
        const offsetX = -Math.cos(angle) * moveDistance;
        const offsetY = -Math.sin(angle) * moveDistance;

        btnNoOffset.x += offsetX;
        btnNoOffset.y += offsetY;

        const maxX = gameTab.clientWidth - btnNo.offsetWidth;
        const maxY = gameTab.clientHeight - btnNo.offsetHeight;

        btnNoOffset.x = Math.max(
          -initialNoPosition.x,
          Math.min(btnNoOffset.x, maxX - initialNoPosition.x)
        );
        btnNoOffset.y = Math.max(
          -initialNoPosition.y,
          Math.min(btnNoOffset.y, maxY - initialNoPosition.y)
        );

        btnNo.style.transform = `translate(${btnNoOffset.x}px, ${btnNoOffset.y}px)`;
      }
    });
  });

  // Klik tombol "Tidak Suka"
  btnNo.addEventListener("click", () => {
    if (btnNoClicked) return;
    btnNoClicked = true;

    btnNo.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    btnNo.style.opacity = "0";
    btnNo.style.pointerEvents = "none";

    setTimeout(() => {
      const loveBtn = document.createElement("button");
      loveBtn.textContent = "Ga salah lagi maksudnya sayangg 💖";
      loveBtn.style.position = "absolute";
      loveBtn.style.left = `${initialNoPosition.x}px`;
      loveBtn.style.top = `${initialNoPosition.y}px`;
      loveBtn.style.width = "150px";
      loveBtn.style.height = "200px";
      loveBtn.style.fontSize = "1.3rem";
      loveBtn.style.borderRadius = "0.75rem";
      loveBtn.style.border = "none";
      loveBtn.style.backgroundColor = "#f5d0fe";
      loveBtn.style.color = "#6b21a8";
      loveBtn.style.fontWeight = "bold";
      loveBtn.style.opacity = "0";
      loveBtn.style.transition = "opacity 0.4s ease";
      loveBtn.style.zIndex = "9999";
      loveBtn.style.left = "calc(40% + 90px)";
      loveBtn.style.top = "0px";

      btnGroup.appendChild(loveBtn);

      requestAnimationFrame(() => {
        loveBtn.style.opacity = "1";
      });

      loveBtn.addEventListener("click", () => {
        gameTab.classList.remove("scale-in");
        gameTab.classList.add("scale-out");

        setTimeout(() => {
          gameTab.classList.remove("active");
          showCongratsTab();
          loveBtn.remove();
        }, 300);
      });
    }, 300);
  });

  // Selamat
  const congratsTab = document.getElementById("congrats-tab");
  const closeCongrats = document.getElementById("close-congrats");
  const gif = document.getElementById("kiss-gif");
  const gifContainer = document.getElementById("gif-container");

  // Audio
  const audioYes = document.getElementById("audio-yes");
  const audioCongrats = document.getElementById("audio-congrats");
  const audioClose = document.getElementById("audio-close");

  // Fungsi untuk munculkan confetti
  function showConfetti() {
    if (window.confetti) {
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 10000,
      };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        confetti({
          ...defaults,
          particleCount: 40,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2,
          },
        });
      }, 200);
    }
  }

  // Tampilkan popup selamat
  function showCongratsTab() {
    congratsTab.style.display = "flex";
    setTimeout(() => {
      congratsTab.style.opacity = "1";
    }, 10);

    // Reset GIF src untuk replay animasi
    gif.style.display = "none";
    gif.src = "";
    setTimeout(() => {
      gif.src = "assets/img/kiss.gif";
      gif.style.display = "block";
    }, 50);

    if (audioCongrats) {
      audioCongrats.currentTime = 0;
      audioCongrats
        .play()
        .catch((err) => console.warn("Gagal play audio:", err));
    }

    showConfetti();
  }

  // Tombol "Suka"
  btnYes.addEventListener("click", () => {
    if (audioYes) {
      audioYes.currentTime = 0;
      audioYes.play();
    }

    gameTab.classList.remove("scale-in");
    gameTab.classList.add("scale-out");

    setTimeout(() => {
      gameTab.classList.remove("active");
      showCongratsTab();
    }, 300);
  });

  // Tombol "OK"
  closeCongrats.addEventListener("click", () => {
    if (audioClose) {
      audioClose.currentTime = 0;
      audioClose.play();
    }

    congratsTab.style.transition = "opacity 0.5s ease";
    congratsTab.style.opacity = "0";

    setTimeout(() => {
      congratsTab.style.display = "none";
      congratsTab.style.opacity = "1";
      congratsTab.style.transition = "";
    }, 500);
  });

  // Timer dan Stopwatch
  // 🔊 Ambil audio klik
  const Tsound = document.getElementById("Tsound");
  Tsound.volume = 1.0;

  function playClickSound() {
    if (Tsound) {
      Tsound.currentTime = 0;
      Tsound.play().catch((err) => {
        console.warn("Gagal memutar audio:", err);
      });
    }
  }

  // TIMER / STOPWATCH LOGIC
  const display = document.getElementById("display");
  const hourInput = document.getElementById("hour-input");
  const minuteInput = document.getElementById("minute-input");
  const secondInput = document.getElementById("second-input");

  const inputGroup = document.getElementById("input-group");
  const setBtn = document.getElementById("set-btn");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const lapList = document.getElementById("lap-list");

  const modeTimerBtn = document.getElementById("mode-timer");
  const modeStopwatchBtn = document.getElementById("mode-stopwatch");

  let mode = "timer";
  let duration = 0;
  let stopwatch = 0;
  let timer;
  let isPaused = false;

  const doneSound = new Audio("./assets/audio/ring1.mp3");
  doneSound.volume = 1.0;
  doneSound.loop = true;

  function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  function updateDisplay(sec) {
    display.textContent = formatTime(sec);
  }

  function limitToTwoDigits(input) {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 2);
    });
  }

  [hourInput, minuteInput, secondInput].forEach(limitToTwoDigits);

  setBtn.addEventListener("click", () => {
    playClickSound();
    if (mode !== "timer") return;
    const hours = parseInt(hourInput.value || "0");
    const minutes = parseInt(minuteInput.value || "0");
    const seconds = parseInt(secondInput.value || "0");
    duration = hours * 3600 + minutes * 60 + seconds;
    updateDisplay(duration);
  });

  startBtn.addEventListener("click", () => {
    playClickSound();

    doneSound
      .play()
      .then(() => {
        doneSound.pause();
        doneSound.currentTime = 0;
      })
      .catch(() => {});

    clearInterval(timer);

    if (mode === "timer") {
      if (duration <= 0) return;

      isPaused = false;
      timer = setInterval(() => {
        if (!isPaused && duration > 0) {
          duration--;
          updateDisplay(duration);
        }

        if (duration <= 0) {
          clearInterval(timer);
          doneSound.play();
          pauseBtn.classList.add("hidden");
          startBtn.classList.remove("hidden");
        }
      }, 1000);

      startBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
    } else {
      timer = setInterval(() => {
        stopwatch++;
        updateDisplay(stopwatch);
      }, 1000);

      lapList.classList.remove("hidden");
      startBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
    }
  });

  pauseBtn.addEventListener("click", () => {
    playClickSound();
    clearInterval(timer);
    isPaused = true;
    pauseBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
  });

  resetBtn.addEventListener("click", () => {
    playClickSound();
    clearInterval(timer);
    isPaused = false;

    if (mode === "timer") {
      duration = 0;
    } else {
      stopwatch = 0;
      lapList.innerHTML = "";
    }

    updateDisplay(0);
    pauseBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
  });

  modeTimerBtn.addEventListener("click", () => {
    playClickSound();
    mode = "timer";
    clearInterval(timer);
    isPaused = false;
    stopwatch = 0;
    updateDisplay(0);
    lapList.classList.add("hidden");
    pauseBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    inputGroup.style.display = "flex";
    setBtn.style.display = "inline-block";
    modeTimerBtn.classList.add("active");
    modeStopwatchBtn.classList.remove("active");
  });

  modeStopwatchBtn.addEventListener("click", () => {
    playClickSound();
    mode = "stopwatch";
    clearInterval(timer);
    isPaused = false;
    duration = 0;
    updateDisplay(0);
    lapList.classList.remove("hidden");
    inputGroup.style.display = "none";
    setBtn.style.display = "none";
    pauseBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    modeStopwatchBtn.classList.add("active");
    modeTimerBtn.classList.remove("active");
  });

  display.addEventListener("click", () => {
    if (mode === "stopwatch" && stopwatch > 0) {
      playClickSound();
      const li = document.createElement("li");
      li.textContent = `Lap ${lapList.children.length + 1}: ${formatTime(
        stopwatch
      )}`;
      lapList.appendChild(li);
    }
  });

  // Aktifkan popup
  handlePopup({
    buttonSelector: '[data-tab="timer"]',
    popupId: "timer-tab",
    closeId: "close-timer",
    dragHeaderSelector: "#timer-header",
  });
});

document.querySelectorAll(".calc-btn").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    playNote(noteToFreq(randomNote));
  });
});

document.addEventListener("keydown", (e) => {
  const calcPopup = document.getElementById("calc-tab");
  if (calcPopup.style.display !== "block") return;
  const key = e.key;
  if (/^[0-9+\-*/.]$/.test(key)) {
    calcValue += key;
  } else if (key === "Enter" || key === "=") {
    try {
      calcValue = eval(calcValue).toString();
    } catch {
      calcValue = "Error";
    }
  } else if (key === "Backspace") {
    calcValue = calcValue.slice(0, -1);
  } else if (key.toLowerCase() === "c" || key === "Escape") {
    calcValue = "";
  }
  calcDisplay.value = calcValue;
});

// Mute
const muteButton = document.getElementById("mute-button");
let isMuted = false;

// Simpan semua Audio() buatan JS
const dynamicAudioList = [];

const OriginalAudio = window.Audio;
window.Audio = function (...args) {
  const audio = new OriginalAudio(...args);
  dynamicAudioList.push(audio);
  if (isMuted) audio.muted = true;
  return audio;
};

muteButton?.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇" : "🔊";

  // Mute semua tag <audio> dan <video>
  document.querySelectorAll("audio, video").forEach((media) => {
    media.muted = isMuted;
  });

  // Mute semua Audio() yang dibuat via JS
  dynamicAudioList.forEach((audio) => {
    audio.muted = isMuted;
  });

  // Animasi tombol
  muteButton.style.transform = "scale(1.2)";
  setTimeout(() => {
    muteButton.style.transform = "scale(1)";
  }, 150);
});
