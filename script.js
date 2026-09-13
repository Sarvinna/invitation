/* ============================================================
   ДАТА СВАДЬБЫ
   ============================================================ */
const WEDDING_DATE = "2026-09-26T06:00:00Z";
/* ============================================================
   ОБРАТНЫЙ ОТСЧЁТ
   ============================================================ */
const cdDays    = document.getElementById("cd-days");
const cdHours   = document.getElementById("cd-hours");
const cdMinutes = document.getElementById("cd-minutes");
const cdSeconds = document.getElementById("cd-seconds");

const prev = { days: null, hours: null, minutes: null, seconds: null };

function pad(n){ return String(n).padStart(2, "0"); }

function bump(el){
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function setValue(el, key, value){
  if (!el) return;
  if (prev[key] !== value){
    el.textContent = value;
    if (prev[key] !== null) bump(el);
    prev[key] = value;
  }
}

function tick(){
  const diff = new Date(WEDDING_DATE).getTime() - Date.now();

  if (diff <= 0){
    setValue(cdDays, "days", "0");
    setValue(cdHours, "hours", "00");
    setValue(cdMinutes, "minutes", "00");
    setValue(cdSeconds, "seconds", "00");
    return;
  }

  const t = Math.floor(diff / 1000);
  const days = Math.floor(t / 86400);
  const hours = Math.floor((t % 86400) / 3600);
  const minutes = Math.floor((t % 3600) / 60);
  const seconds = t % 60;

  setValue(cdDays, "days", String(days));
  setValue(cdHours, "hours", pad(hours));
  setValue(cdMinutes, "minutes", pad(minutes));
  setValue(cdSeconds, "seconds", pad(seconds));
}

tick();
setInterval(tick, 1000);

/* ============================================================
   REVEAL
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: "0px 0px -60px 0px"
});

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

window.addEventListener("load", () => {
  document.querySelectorAll(".reveal").forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9){
      el.classList.add("is-visible");
    }
  });
});

/* ============================================================
   ПАРАЛЛАКС СВЕЧЕЙ + ФОНА
   ============================================================ */
const candles = document.querySelector(".candles");
const heroBg = document.querySelector(".hero-bg");
let tickingScroll = false;

function onScrollParallax(){
  const y = window.scrollY;
  if (candles) candles.style.transform = `translateY(${y * 0.15}px)`;
  if (heroBg){
    const maxScroll = window.innerHeight;
    const progress = Math.min(y / maxScroll, 1);
    heroBg.style.transform = `scale(${1.035 + progress * 0.06})`;
    heroBg.style.filter = `saturate(.92) sepia(.16) brightness(${.82 - progress * 0.15})`;
  }
  tickingScroll = false;
}

window.addEventListener("scroll", () => {
  if (!tickingScroll){
    requestAnimationFrame(onScrollParallax);
    tickingScroll = true;
  }
}, { passive: true });

/* ============================================================
   ПАРАЛЛАКС ОТ КУРСОРА
   ============================================================ */
const hero = document.querySelector(".hero");
if (hero && window.matchMedia("(hover: hover)").matches){
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (candles) candles.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    if (heroBg) heroBg.style.transform = `scale(1.05) translate(${x * -8}px, ${y * -6}px)`;
  });
  hero.addEventListener("mouseleave", () => {
    if (candles) candles.style.transform = "";
    if (heroBg) heroBg.style.transform = "";
  });
}

/* ============================================================
   СВЕЧИ — тактильный отклик
   ============================================================ */
document.querySelectorAll(".candle").forEach(c => {
  c.addEventListener("click", () => {
    c.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.2)" },
        { transform: "scale(1)" }
      ],
      { duration: 400, easing: "cubic-bezier(.3,1.5,.5,1)" }
    );
  });
});

/* ============================================================
   ФОНОВАЯ МУЗЫКА
   ============================================================ */
const musicBtn = document.getElementById("musicBtn");
const bgMusic  = document.getElementById("bgMusic");

if (musicBtn && bgMusic){

  // Восстанавливаем состояние из localStorage
  const savedPlaying = localStorage.getItem("weddingMusicOn") === "1";

  // Функция плавного появления/затухания
  function fadeIn(audio, targetVolume = 0.6, duration = 1200){
    audio.volume = 0;
    const steps = 30;
    const stepTime = duration / steps;
    const stepVolume = targetVolume / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepVolume;
      if (current >= targetVolume){
        audio.volume = targetVolume;
        clearInterval(interval);
      } else {
        audio.volume = current;
      }
    }, stepTime);
  }

  function fadeOut(audio, duration = 800){
    const startVolume = audio.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const stepVolume = startVolume / steps;
    let current = startVolume;
    const interval = setInterval(() => {
      current -= stepVolume;
      if (current <= 0){
        audio.volume = 0;
        audio.pause();
        clearInterval(interval);
      } else {
        audio.volume = current;
      }
    }, stepTime);
  }

  // Включаем/выключаем по кнопке
  musicBtn.addEventListener("click", () => {
    if (bgMusic.paused){
      bgMusic.play()
        .then(() => {
          fadeIn(bgMusic, 0.6, 1200);
          musicBtn.classList.add("is-playing");
          localStorage.setItem("weddingMusicOn", "1");
        })
        .catch(err => {
          console.warn("Не удалось запустить музыку:", err);
        });
    } else {
      fadeOut(bgMusic, 800);
      musicBtn.classList.remove("is-playing");
      localStorage.setItem("weddingMusicOn", "0");
    }
  });

  // Если музыка уже играла ранее — показываем кнопку активной
  // (но НЕ запускаем автоматически — браузеры блокируют)
  if (savedPlaying){
    musicBtn.classList.add("is-playing");
  }

  // Останавливаем музыку, когда вкладка скрыта (экономия батареи)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !bgMusic.paused){
      bgMusic.pause();
    } else if (!document.hidden && musicBtn.classList.contains("is-playing") && bgMusic.paused){
      bgMusic.play().catch(() => {});
    }
  });

  // Первый тап в любом месте — если музыка "должна играть", запускаем
  document.addEventListener("click", function autoStart(){
    if (musicBtn.classList.contains("is-playing") && bgMusic.paused){
      bgMusic.play().then(() => fadeIn(bgMusic, 0.6, 1200)).catch(() => {});
    }
    document.removeEventListener("click", autoStart);
  }, { once: true });
}