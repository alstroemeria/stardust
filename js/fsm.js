self.addEventListener('message', function(e) {
	importScripts('perlin-noise.js');

	var data = e.data.settings;
	var width = e.data.width;
	var height = e.data.height;
	var size = width * height;

	var perlin = new ClassicalNoise();

	var noise = function (x, y, z){
		total = 0;
		frequency = data.base_frequency;
		amplitude = data.base_amplitude;

		for (var i = 0; i< data.octaves; i++){
	        total += perlin.noise(x * frequency, y * frequency, z) * amplitude;
	        frequency *= data.lacunarity;
	        amplitude *= data.gain;
		}
	    return total;
	}

	var output = new Uint8ClampedArray(size * 4);


	for (var x = 0; x < width; x++){
		progress = x/width;
		if (x % 3 ==0){
			self.postMessage({state:'progress', payload: progress});
		}

		for (var y = 0; y < height; y++){
			cell = (x + y * width) * 4;
			output[cell] = (1 + noise(x/50, y/50, 0.1)) * 1.1 * 128;
			output[cell + 1] = 0;
			output[cell + 2] = (1 + noise(x/50, y/50, 0.9)) * 1.1 * 128;
			output[cell + 3] = 255;
		}
	}

  	self.postMessage({state:'finish', payload:output});
}, false);