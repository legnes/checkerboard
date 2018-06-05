// TODO LIST:
//   o Forward project in collision detection step?
//   o Performance -- mitigate hit from large gl_PointSize
//   o Less terrible random() logic!
//   o Raw shader materials (manually do uvs etc.)
//   o Try reduced precision targets
//   o Clean up
//       > optimize shader code
//       > neaten up newlines in shaders
//       > separate sim, accum, & check into separate files?
//       > move shaders to respectives too?)
//       > naming (verb/noun)

(function() {

  /////////////////////////////////////////////////////////////
  // INPUT GUI ////////////////////////////////////////////////
  function initInputs() {
    _inputs = {
      particles: {
        count: 5,
        radiusMinMax: new THREE.Vector2(100.0, 100.0)
      },
      checkerboard: {
        width: 7,
        frequency: 2
      },
      physics: {
        shouldBump: false,
        bump: function() { _inputs.physics.shouldBump = true; },
        gravity: new THREE.Vector2(0, -9.8),
        restitution: 1
      },
      phases: {
        shouldPhase: true,
        phaseOffset: 1,
        shouldGlom: false
      },
      lenses: {
        shouldLens: false,
        height: 0.25,
        refractiveIndex: 1.330
      }
    };

    var gui = new dat.GUI();

    var particlesGui = gui.addFolder('particles');
    var countCtl = particlesGui.add(_inputs.particles, 'count', 1, 10000).step(1).onFinishChange(restartSimulation);
    var radiusMinCtl = particlesGui.add(_inputs.particles.radiusMinMax, 'x', 1, 256).step(1).name('radius min'); // I think 256 is the max
    var radiusMaxCtl = particlesGui.add(_inputs.particles.radiusMinMax, 'y', 1, 256).step(1).name('radius max'); // value for gl_PointSize
    radiusMinCtl.onChange(function(val) { var maxVal = radiusMaxCtl.getValue(); if (val > maxVal) this.setValue(maxVal); });
    radiusMaxCtl.onChange(function(val) { var minVal = radiusMinCtl.getValue(); if (val < minVal) this.setValue(minVal); });

    var checkerGui = gui.addFolder('checkerboard');
    var widthCtl = checkerGui.add(_inputs.checkerboard, 'width', 1, 500).step(1);
    var frequencyCtl = checkerGui.add(_inputs.checkerboard, 'frequency', 2, 100).step(1);

    var physGui = gui.addFolder('physics');
    var gravXCtl = physGui.add(_inputs.physics.gravity, 'x', -10, 10).name('gravity x');
    var gravYCtl = physGui.add(_inputs.physics.gravity, 'y', -10, 10).name('gravity y');
    var bounceCtl = physGui.add(_inputs.physics, 'restitution', 0, 1);
    var bumpCtl = physGui.add(_inputs.physics, 'bump');
    _inputs.physics.bump();

    var phasesGui = gui.addFolder('phases');
    var phaseCtl = phasesGui.add(_inputs.phases, 'shouldPhase').name('phasing');
    var offsetCtl = phasesGui.add(_inputs.phases, 'phaseOffset', 1, 99).name('phase offset').step(1);
    var glomCtl = phasesGui.add(_inputs.phases, 'shouldGlom').name('glom');

    var lensesGui = gui.addFolder('lenses');
    var phaseCtl = lensesGui.add(_inputs.lenses, 'shouldLens').name('refraction');
    var heightCtl = lensesGui.add(_inputs.lenses, 'height', 0.01, 1.0).step('0.01');
    var refractionCtl = lensesGui.add(_inputs.lenses, 'refractiveIndex', 1, 10).name('refractive index');

    var presetsGui = gui.addFolder('presets');
    var presets = {
      plink: {particles:{count:5,radiusMinMax:{x:100,y:100}},checkerboard:{width:7,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:-9.8},restitution:1},phases:{shouldPhase:true,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:false,height:0.25,refractiveIndex:1.33}},
      sploosh: {particles:{count:10000,radiusMinMax:{x:30,y:30}},checkerboard:{width:7,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:-9.8},restitution:0.8867826986041702},phases:{shouldPhase:true,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:false,height:0.25,refractiveIndex:1.33}},
      bap: {particles:{count:46,radiusMinMax:{x:1,y:256}},checkerboard:{width:1,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:-9.8},restitution:1},phases:{shouldPhase:true,phaseOffset:1,shouldGlom:true},lenses:{shouldLens:false,height:0.25,refractiveIndex:1.33}},
      zzrr: {particles:{count:2000,radiusMinMax:{x:1,y:256}},checkerboard:{width:152,frequency:33},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:1},phases:{shouldPhase:true,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:false,height:0.25,refractiveIndex:1.33}},
      shhh: {particles:{count:10000,radiusMinMax:{x:20,y:20}},checkerboard:{width:500,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:1},phases:{shouldPhase:true,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:false,height:0.25,refractiveIndex:1.33}},
      blub: {particles:{count:200,radiusMinMax:{x:200,y:200}},checkerboard:{width:9,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:0.8},phases:{shouldPhase:false,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:true,height:0.31,refractiveIndex:1.33}},
      deet: {particles:{count:600,radiusMinMax:{x:200,y:200}},checkerboard:{width:119,frequency:19},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:1},phases:{shouldPhase:false,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:true,height:0.28,refractiveIndex:1.7}},
      drrdrdr: {particles:{count:2,radiusMinMax:{x:200,y:200}},checkerboard:{width:42,frequency:2},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:0.85},phases:{shouldPhase:false,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:true,height:0.44,refractiveIndex:10}},
      fhhhh: {particles:{count:1038,radiusMinMax:{x:143,y:148}},checkerboard:{width:4,frequency:4},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:1},phases:{shouldPhase:false,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:true,height:0.29,refractiveIndex:1.33810098225056}},
      squg: {particles:{count:3000,radiusMinMax:{x:100,y:100}},checkerboard:{width:200,frequency:3},physics:{shouldBump:false,gravity:{x:0,y:0},restitution:0.6},phases:{shouldPhase:false,phaseOffset:1,shouldGlom:false},lenses:{shouldLens:true,height:0.3,refractiveIndex:2.3}},
    };
    function loadPreset(preset) {
      assignDeep(_inputs, preset);
      for (var folderName in gui.__folders) {
        var folder = gui.__folders[folderName];
        for (var i = 0, len = folder.__controllers.length; i < len; i++) {
          folder.__controllers[i].updateDisplay();
        }
      }
      restartSimulation();
    }
    for (var name in presets) {
      presets[name] = loadPreset.bind(null, presets[name]);
      presetsGui.add(presets, name);
    }
  }
  /////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////
  // INIT /////////////////////////////////////////////////////
  function initScenes() {
    _simulatorScene = new THREE.Scene();
    _accumulatorScene = new THREE.Scene();
    _checkerboardScene = new THREE.Scene();
    _renderer = new THREE.WebGLRenderer();
    _camera = new THREE.OrthographicCamera();
    _canvas = _renderer.domElement;
    document.body.appendChild(_canvas);
  }

  function initTargets() {
    _simulatorTarget = new THREE.WebGLRenderTarget(_inputs.particles.count, 1, { type: THREE.HalfFloatType, magFilter: THREE.NearestFilter });
    _simulatorTargetOld = new THREE.WebGLRenderTarget(_inputs.particles.count, 1, { type: THREE.HalfFloatType, magFilter: THREE.NearestFilter });
    _accumulatorTarget = new THREE.WebGLRenderTarget(_canvas.clientWidth, _canvas.clientHeight, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter });
  }

  function initSimulator() {
    _simulation = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          uInverseResolution: { value: new THREE.Vector2(1 / _canvas.clientWidth, 1 / _canvas.clientHeight) },
          uDeltaTimeSeconds: { value: 0 },
          uRadiusMinMax: { value: _inputs.particles.radiusMinMax },
          uPositionVelocityOld: { value: _simulatorTargetOld.texture },
          uGravitationalAcceleration: { value: _inputs.physics.gravity },
          uRestitutionCoefficient: { value: _inputs.physics.restitution },
          uShouldBump: { value: _inputs.physics.shouldBump },
          uRandomSalt: { value: Math.random() }
        },
        vertexShader: screen_quad_vert,
        fragmentShader: simulator_frag
      })
    );

    _simulatorScene.add(_simulation);
  }

  function initAccumulator() {
    // Init dummy positions
    // Real positions come from the simulation but we need these so the points pass cull testing and actually get drawn
    var dummyPositions = new Float32Array(_inputs.particles.count * 3);
    var dummyPosition = new THREE.Vector3(0.0, 0.0, -1.0); // z = -1 to pass cull test

    // Init UV coordinates
    // These are the uv coordinates of the simulation output that correspond to each circle
    var uvs = new Float32Array(_inputs.particles.count * 2);
    var uv = new THREE.Vector2(0.0, 0.5);

    for (var i = 0; i < _inputs.particles.count; i++) {
      dummyPosition.toArray(dummyPositions, i * 3);

      uv.x = (i + 0.5) / _inputs.particles.count;
      uv.toArray(uvs, i * 2);
    }

    _circles = new THREE.Points(
      new THREE.BufferGeometry()
          .addAttribute('position', new THREE.BufferAttribute(dummyPositions, 3))
          .addAttribute('aUV', new THREE.BufferAttribute(uvs, 2)),
      new THREE.ShaderMaterial({
        uniforms: {
          uInverseResolution: { value: new THREE.Vector2(1 / _canvas.clientWidth, 1 / _canvas.clientHeight) },
          uRadiusMinMax: { value: _inputs.particles.radiusMinMax },
          uPositionVelocity: { value: _simulatorTarget.texture },
          uLensHeight: { value: _inputs.lenses.height },
          uLensRefractiveIndex: { value: _inputs.lenses.refractiveIndex }
        },
        vertexShader:   phase_accumulator_vert,
        fragmentShader: phase_accumulator_frag,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true
      })
    );

    _accumulatorScene.add(_circles);
  }

  function initCheckerboard() {
    _checkerboard = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          uInverseAspect: { value: 1 },
          uWidth: { value: _inputs.checkerboard.width },
          uFrequency: { value: _inputs.checkerboard.frequency },
          uDistortionPhase: { value: _accumulatorTarget.texture },
          uShouldGlom: { value: _inputs.phases.shouldGlom },
          uPhaseOffset: { value: _inputs.phases.phaseOffset }
        },
        // Assume shaders were created and are in scope
        // TODO: make a system for this??
        vertexShader: screen_quad_vert,
        fragmentShader: checkerboard_frag
      })
    );

    _checkerboardScene.add(_checkerboard);
  }
  /////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////
  // MISC /////////////////////////////////////////////////////
  function assignDeep(target, source) {
    for (var prop in source) {
      switch(typeof source[prop]) {
        case 'object':
          assignDeep(target[prop], source[prop]);
          break;
        case 'number':
        case 'boolean':
          target[prop] = source[prop];
          break;
      }
    }
  }

  function restartSimulation() {
    cancelAnimationFrame(_animationFrameReqId);
    _simulatorTarget.setSize(_inputs.particles.count, 1);
    _simulatorTargetOld.setSize(_inputs.particles.count, 1);
    _accumulatorScene.remove(_circles);
    initAccumulator();
    _inputs.physics.bump();
    render(performance.now());
  }

  function pingpongTargets() {
    var temp = _simulatorTarget;
    _simulatorTarget = _simulatorTargetOld;
    _simulatorTargetOld = temp;
  }

  function clearEphemera() {
    _inputs.physics.shouldBump = false;
  }
  /////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////
  // RENDER ///////////////////////////////////////////////////
  function renderSimulator() {
    _simulation.material.uniforms.uDeltaTimeSeconds.value = _deltaFrameTime / 1000;
    _simulation.material.uniforms.uPositionVelocityOld.value = _simulatorTargetOld.texture;
    _simulation.material.uniforms.uRestitutionCoefficient.value = _inputs.physics.restitution;
    _simulation.material.uniforms.uShouldBump.value = _inputs.physics.shouldBump;
    _simulation.material.uniforms.uRandomSalt.value = Math.random();

    _renderer.render(_simulatorScene, _camera, _simulatorTarget);
  }

  function renderAccumulator() {
    _circles.material.uniforms.uPositionVelocity.value = _simulatorTarget.texture;
    _circles.material.uniforms.uLensHeight.value = _inputs.lenses.height;
    _circles.material.uniforms.uLensRefractiveIndex.value = _inputs.lenses.shouldLens ? _inputs.lenses.refractiveIndex : 1.0;

    _renderer.render(_accumulatorScene, _camera, _accumulatorTarget);
  }

  function renderCheckerboard() {
    _checkerboard.material.uniforms.uInverseAspect.value = _canvas.clientHeight / _canvas.clientWidth;
    _checkerboard.material.uniforms.uWidth.value = _inputs.checkerboard.width;
    _checkerboard.material.uniforms.uFrequency.value = _inputs.checkerboard.frequency;
    _checkerboard.material.uniforms.uShouldGlom.value = _inputs.phases.shouldGlom;
    _checkerboard.material.uniforms.uPhaseOffset.value = _inputs.phases.shouldPhase ? _inputs.phases.phaseOffset : 0;

    _renderer.render(_checkerboardScene, _camera);
  }

  function render(timestamp) {
    _animationFrameReqId = requestAnimationFrame(render);

    _deltaFrameTime = timestamp - _prevFrameTime;
    _prevFrameTime = timestamp;

    // Handle resize
    var shouldUpdateDims = (_canvas.width !== _canvas.clientWidth || _canvas.height !== _canvas.clientHeight);
    if (shouldUpdateDims) {
      // Update scene stuff
      _renderer.setSize(_canvas.clientWidth, _canvas.clientHeight, false);
      _accumulatorTarget.setSize(_canvas.clientWidth, _canvas.clientHeight);
      // Update uniforms
      _simulation.material.uniforms.uInverseResolution.value.set(1 / _canvas.clientWidth, 1 / _canvas.clientHeight);
      _circles.material.uniforms.uInverseResolution.value.set(1 / _canvas.clientWidth, 1 / _canvas.clientHeight);
    }

    pingpongTargets();

    renderSimulator();
    renderAccumulator();
    renderCheckerboard();

    clearEphemera();
  }
  /////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////
  // MAIN /////////////////////////////////////////////////////
  // Shared local variables
  var _inputs,
      _simulatorScene,
      _accumulatorScene,
      _checkerboardScene,
      _renderer,
      _camera,
      _canvas,
      _simulation,
      _circles,
      _checkerboard,
      _simulatorTarget,
      _simulatorTargetOld,
      _accumulatorTarget,
      _animationFrameReqId,
      _deltaFrameTime,
      _prevFrameTime = performance.now();

  // Do the dang thing
  initInputs();
  initScenes();
  initTargets();
  initCheckerboard();
  initAccumulator();
  initSimulator();
  render(performance.now());

})();