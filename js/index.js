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

var numParticles = 2000,
	lacunarity = 2,
	octaves = 5,
	gain = 0.50,
	base_frequency = 1/10,
	base_amplitude = 1,
	size = 2,
	color = '#000';

// var gui = new dat.GUI();
// gui.close();
// gui.add(window, 'lacunarity').min(1).max(2.5).step(0.001).name('lacunarity').onFinishChange(init());
// gui.add(window, 'octaves').min(1).max(10).step(1).name('octaves').onFinishChange(init());
// gui.add(window, 'gain').min(0.1).max(1.5).step(0.01).name('gain').onFinishChange(init());
// gui.add(window, 'base_frequency').min(0).max(1).step(0.001).name('Frequency').onFinishChange(init());
// gui.add(window, 'base_amplitude').min(0).max(2).step(0.1).name('Amplitude').onFinishChange(init());
// gui.add(window, 'size').min(0.5).max(5).step(0.1).name('Size');
// gui.add(window, 'numParticles').min(100).max(10000).step(1).name('Particles').onFinishChange(function() {
// 	particleSystem = new ParticleSystem();
// });
// gui.addColor(window, 'color').name('Color');


var noise_image, noise_data, perlin, particleSystem;

function noise (x, y, z){
	total = 0;
	frequency = base_frequency;
	amplitude = base_amplitude;

	for (var i = 0; i< octaves; i++){
        total += perlin.noise(x * frequency, y * frequency, z) * amplitude;
        frequency *= lacunarity;
        amplitude *= gain;
	}
    return total;
}

function drawMap(){

}

function mod(n, m) {
    return ((n % m) + m) % m;
}

var Particle = function(x, y) {
    this.x = x;
    this.y = y;
    this.ax = 0;
    this.ay = 0;
    this.vx = 0;
    this.vy = 0;
};

function round(somenum){
	return (0.5 + somenum) & (0.5 + somenum)
}

Particle.prototype.draw = function () {

	cell = (round(this.x) + round(this.y) * canvas.width) * 4;
	red = noise_data[cell];
	blue = noise_data[cell + 2];


	this.ax += (red - 128) * 0.0005;
	this.ay += (blue - 128) * 0.0005;

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
	for (var i = 0; i < numParticles; i++) {
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

window.onresize = function() {
	init()
};

function init(){

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	perlin = new ClassicalNoise();
	noise_image = ctx.createImageData(canvas.width, canvas.height);

	loader = document.querySelector(".loader");
	bar = document.querySelector(".bar");
	black = document.querySelector(".load").children[0];
	main = document.querySelector(".main ").children[0];

	TweenLite.set(black, {alpha:1});

	tl = new TimelineLite();

	tl.set(bar, {xPercent: -100, alpha:1})
	.to(bar, 1, {xPercent: 0})
	.set(bar, {yPercent:-100, height: "100%"})
	.to(bar, 0.5, {yPercent: 0}, "invert")
	.to(black, 0.5, {color:"#FFF"}, "invert")
	.to(black, 2, {alpha:0}, "finish")
	.to(loader, 1.5, {alpha:0}, 'finish')
	.to(main, 2, {alpha:1 , ease:Power4.easeIn},'finish');

	noise_data = noise_image.data;
	for (var x = 0; x < canvas.width; x++){
		for (var y = 0; y < canvas.height; y++){
			red = (1 + noise(x/50, y/50, 0.1)) * 1.1 * 128;
			blue = (1 + noise(x/50, y/50, 0.9)) * 1.1 * 128;
			cell = (x + y * canvas.width) * 4;
			noise_data[cell] = red;
			noise_data[cell + 1] = 0;	
			noise_data[cell + 2] = blue;
			noise_data[cell + 3] = 255;
		}
	}

	particleSystem = new ParticleSystem()
}


var particleSystem = new ParticleSystem();
init();
document.body.addEventListener("click", init);


(function animate(){
	requestAnimFrame(animate);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	particleSystem.draw();
})();