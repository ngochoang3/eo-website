/*! Appalo / e.io.vn — Lightweight auto/swipe slider (no deps) */
(function(){
  "use strict";

  function Slider(root){
    this.root = root;
    this.track = root.querySelector(".slider-track");
    this.slides = Array.prototype.slice.call(root.querySelectorAll(".slider-slide"));
    this.dotsWrap = root.querySelector(".slider-dots");
    this.index = 0;
    this.interval = parseInt(root.getAttribute("data-interval"), 10) || 4500;
    this.timer = null;
    if (!this.track || this.slides.length === 0) return;
    this.build();
  }

  Slider.prototype.build = function(){
    var self = this;
    if (this.dotsWrap) {
      this.slides.forEach(function(_, i){
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", function(){ self.go(i); });
        self.dotsWrap.appendChild(dot);
      });
    }
    var prev = this.root.querySelector(".slider-prev");
    var next = this.root.querySelector(".slider-next");
    if (prev) prev.addEventListener("click", function(){ self.go(self.index - 1); });
    if (next) next.addEventListener("click", function(){ self.go(self.index + 1); });

    // touch / swipe
    var startX = 0, deltaX = 0, dragging = false;
    this.track.addEventListener("touchstart", function(e){
      dragging = true; startX = e.touches[0].clientX; self.stop();
    }, { passive: true });
    this.track.addEventListener("touchmove", function(e){
      if (!dragging) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });
    this.track.addEventListener("touchend", function(){
      if (!dragging) return;
      dragging = false;
      if (deltaX > 40) self.go(self.index - 1);
      else if (deltaX < -40) self.go(self.index + 1);
      deltaX = 0;
      self.start();
    });

    this.root.addEventListener("mouseenter", function(){ self.stop(); });
    this.root.addEventListener("mouseleave", function(){ self.start(); });

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.update();
    if (!reduceMotion) this.start();
  };

  Slider.prototype.go = function(i){
    var n = this.slides.length;
    this.index = (i + n) % n;
    this.update();
  };

  Slider.prototype.update = function(){
    this.track.style.transform = "translateX(-" + (this.index * 100) + "%)";
    if (this.dotsWrap) {
      Array.prototype.forEach.call(this.dotsWrap.children, function(dot, i){
        this && dot.classList.toggle("active", i === this.index);
      }.bind(this));
    }
  };

  Slider.prototype.start = function(){
    var self = this;
    this.stop();
    this.timer = setInterval(function(){ self.go(self.index + 1); }, this.interval);
  };

  Slider.prototype.stop = function(){
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  function initAll(){
    document.querySelectorAll("[data-slider]:not([data-slider-dynamic])").forEach(function(el){
      new Slider(el);
    });
  }

  window.AppaloSlider = {
    init: function(el){ return new Slider(el); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
