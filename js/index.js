window.requestAnimFrame = (function(){
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function( callback ) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var canvas = document.getElementById('mainCanvas');
canvas.width =  window.innerWidth;
canvas.height =  window.innerHeight;
var ctx = canvas.getContext('2d');

var num_particles = 2000,
  size = 2,
  color = '#000'
  field = false
  power = 5;

var noise_settings = {
  lacunarity: 2,
  octaves: 5,
  gain: 0.50,
  base_frequency: 0.1,
  base_amplitude: 1
};

var noise_image, noise_data, particleSystem;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function round(somenum){
  return (0.5 + somenum) & (0.5 + somenum)
}

var Particle = function(x, y) {
  this.x = x;
  this.y = y;
  this.ax = 0;
  this.ay = 0;
  this.vx = 0;
  this.vy = 0;
};

Particle.prototype.draw = function () {

  cell = (round(this.x) + round(this.y) * canvas.width) * 4;

  this.ax += (noise_data[cell] - 128) * 0.0005;
  this.ay += (noise_data[cell + 2] - 128) * 0.0005;

  this.vx += this.ax;
  this.vy += this.ay;
  this.x += this.vx;
  this.y += this.vy;

  px = this.x;
  py = this.y;

  this.ax *= 0.96;
  this.ay *= 0.96;
  this.vx *= 0.92;
  this.vy *= 0.92;

  this.x = mod(this.x, canvas.width);
  this.y = mod(this.y, canvas.height);


  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
  ctx.fill();
};


var ParticleSystem = function () {
  this.particles = [];
  for (var i = 0; i < num_particles; i++) {
        rand_x = Math.random() * canvas.width;
        rand_y = Math.random() * canvas.height;
    this.particles.push(new Particle(rand_x,rand_y));
  }
};

ParticleSystem.prototype.draw = function () {
  for (var i = 0; i < this.particles.length; i++) {
    this.particles[i].draw();
  }
};

ParticleSystem.prototype.shuffle = function () {
  for (var i = 0; i < num_particles; i++) {
    angle = Math.random()* 360;
    rand_power = Math.random()* power/2;
    this.particles[i].ax += rand_power * Math.cos(angle);
    this.particles[i].ay += rand_power * Math.sin(angle);
  }
};

var timeOut = null;

window.onresize = function(){
    if (timeOut != null)
        clearTimeout(timeOut);

    timeOut = setTimeout(function(){
      dat.GUI.toggleHide();
      initialize();
    }, 500);
};

function starburst(){
  particleSystem.shuffle();
}

function initialize(){
  canvas.width =  window.innerWidth;
  canvas.height =  window.innerHeight;
  var loader = document.querySelector(".loader");
  var bar = document.querySelector(".bar");
  var black = document.querySelector(".load").children[0];
  var main = document.querySelector(".main ").children[0];
  var close_gui = document.querySelector(".close-button");

  first = true;
  TweenLite.set(black, {color:"#000", alpha:1});
  TweenLite.set(bar, {alpha:1, xPercent: -100, yPercent: 0, height:'5px'});
  TweenLite.set(loader, {alpha:1});
  TweenLite.set(main, {alpha:0});
  TweenLite.set(close_gui, {alpha:0});
  worker.postMessage({width: canvas.width, height: canvas.height, settings:noise_settings});
}

function generate(){
  var loader = document.querySelector(".loader");
  var bar = document.querySelector(".bar");

  TweenLite.set(bar, {alpha:1, xPercent: -100, yPercent: 0, height:'5px'});
  TweenLite.set(loader, {alpha:1, background:'transparent'});

  worker.postMessage({width: canvas.width, height: canvas.height, settings:noise_settings});
}

//animation sequence
function animate(){
  var loader = document.querySelector(".loader");
  var bar = document.querySelector(".bar");
  var black = document.querySelector(".load").children[0];
  var main = document.querySelector(".main ").children[0];
  var close_gui = document.querySelector(".close-button");
  
  if (first){
    first = false;
    dat.GUI.toggleHide();

    tl = new TimelineLite();
    tl.set(bar, {yPercent:-100, height: "100%"})
    .to(bar, 0.5, {yPercent: 0}, "invert")
    .to(black, 0.5, {color:"#FFF"}, "invert")
    .set(close_gui, {alpha:1})
    .to(black, 2, {alpha:0}, "finish")
    .to(loader, 1.5, {alpha:0}, 'finish')
    .to(main, 2, {alpha:1 , ease:Power4.easeIn}, 'finish');
  } else {
    tl = new TimelineLite().to(loader, 1.5, {alpha:0}, 'finish');
  }

}


var worker = new Worker('js/fsm.js');
worker.addEventListener('message', function(e) {
  var bar = document.querySelector(".bar");
  if (e.data.state == 'finish'){
    noise_image = new ImageData(e.data.payload, canvas.width, canvas.height);
    noise_data = noise_image.data;
    TweenLite.set(bar, {xPercent:0});
    animate();
  } else {
    TweenLite.set(bar, {xPercent:e.data.payload*100-100});
  }
}, false);




var first = true;
var particleSystem = new ParticleSystem();
noise_data = new Uint8ClampedArray(canvas.height * canvas.width * 4);

// GUI
var gui = new dat.GUI();
dat.GUI.toggleHide();

var f1 = gui.addFolder('Particles');
f1.add(window, 'size').min(0.5).max(5).step(0.1).name('Size');
f1.add(window, 'num_particles').min(100).max(10000).step(1).name('Amount').onFinishChange(function() {
  particleSystem = new ParticleSystem();
});
f1.add(window, 'power').min(1).max(10).step(1).name('Burst Power');
f1.add(window, 'starburst').name('Starburst');

f1.addColor(window, 'color').name('Color');

var f2 = gui.addFolder('Noise Parameters');
f2.add(noise_settings, 'lacunarity').min(1).max(2.5).step(0.001).name('Lacunarity');
f2.add(noise_settings, 'octaves').min(1).max(10).step(1).name('Octaves');
f2.add(noise_settings, 'gain').min(0.1).max(1.5).step(0.01).name('Gain');
f2.add(noise_settings, 'base_frequency').min(0).max(0.5).step(0.001).name('Frequency');
f2.add(noise_settings, 'base_amplitude').min(0).max(2).step(0.1).name('Amplitude');

var f3 = gui.addFolder('Noise');
f3.add(window, 'field').name('Show Fields');
f3.add(window, 'generate').name('Regenerate Fields');
gui.close();

initialize();

ctx.globalAlpha = 0.8;

(function animate(){
  requestAnimFrame(animate);
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (field){
    ctx.putImageData(noise_image, 0, 0);
  }
  particleSystem.draw();
})();