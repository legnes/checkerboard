var simulator_frag = "                                                                                                                          \n\
  #define BUMP_STRENGTH 6.0                                                               \n\
                                                                 \n\
  uniform vec2 uInverseResolution;                             \n\
  uniform float uDeltaTimeSeconds;                                                                                                                             \n\
  uniform vec2 uRadiusMinMax;                             \n\
  uniform sampler2D uPositionVelocityOld;                             \n\
  uniform vec2 uGravitationalAcceleration;                             \n\
  uniform float uRestitutionCoefficient;                                                                                                                             \n\
  uniform bool uShouldBump;                             \n\
  uniform float uRandomSalt;                                                                                                                             \n\
  varying vec2 vUV;                                                                                                                             \n\
                                                                                                                                                \n\
  float rand(float n) {                                                                                                                                    \n\
    return fract(sin(n) * 292758.82014);                                                                                                                                    \n\
  }                                                                                                                                    \n\
                                                                                                                                                    \n\
  vec2 randomDir(float seed) {                                                                                                                                    \n\
    return vec2(rand(4826.20934 * seed), rand(9737.2092 * seed));                                                                                                                                    \n\
  }                                                                                                                                    \n\
                                                                                                                                             \n\
  void main() {                                                                                                                                 \n\
    // Dividing pixel diameter by resolution works for uv space, i.e. [0, 1], but clip space is [-1, 1]                                                                                          \n\                                                                                          \n\
    // So to get the radius we divide diameter by two but also multiply by two to fix the space range                                                                                          \n\                                                                                          \n\
    vec2 radiusClipSpace = mix(uRadiusMinMax.x, uRadiusMinMax.y, vUV.x) * uInverseResolution;                                                                                          \n\
    vec2 upperBounds = vec2(1.0) - radiusClipSpace;                                                                                          \n\
    vec2 lowerBounds = vec2(-1.0) + radiusClipSpace;                                                                                          \n\
                                                                                              \n\
    vec4 positionVelocityOld = texture2D(uPositionVelocityOld, vUV);      \n\
    vec2 positionOld = positionVelocityOld.xy;      \n\
    vec2 velocityOld = positionVelocityOld.zw;      \n\
                                                                                                                  \n\
    // Ralston's 2nd order Runge-Kutta integration                                                                                         \n\                                                                                          \n\
    // For velocity, the function is linear and can be reduced to simple euler:                                                                                         \n\                                                                                          \n\
    //   v_n+1 = v_n + hg                                                                                         \n\                                                                                          \n\
    // For position, we get                                                                                         \n\                                                                                          \n\
    //   k_1 = f(t_n, y_n) = v_n                                                                                         \n\                                                                                          \n\
    //   k_2 = f(t_n + (h * 3/4), y_n + (h * k_1 * 3/4)) = v_n+3/4                                                                                         \n\                                                                                          \n\
    // So                                                                                         \n\                                                                                          \n\
    //   x_n+1 = x_n + (h * ((v_n * 1/3) + (v_n+3/4 * 2/3))) = x_n + (h * v_n) + (1/2 * h^2 * g)                                                                                         \n\                                                                                          \n\
    vec2 velocityNew = velocityOld + (uDeltaTimeSeconds * uGravitationalAcceleration);                                                                                          \n\
    vec2 positionNew = positionOld + (uDeltaTimeSeconds * velocityOld) + (0.5 * uDeltaTimeSeconds * uDeltaTimeSeconds * uGravitationalAcceleration);                                                                                          \n\
                                                                                                          \n\
    // Simple wall collision handling                                                                                         \n\                                                                                          \n\
    // NOTE: Collisions LEAK ENERGY since bodies accelerate a small amount into walls                                                                                         \n\                                                                                          \n\
    //       It's hard to find the actual velocity at the time of collision                                                                                         \n\                                                                                          \n\
    //       and reverting to old values leaks the other way (why???)                                                                                         \n\                                                                                          \n\
    //       So we use an arbitrarily weighted average of the new and old velocities.                                                                                          \n\                                                                                          \n\
    //       One weird thing is that at small gravities, the system loses energy even when using the end-of-frame velocity outright                                                                                          \n\                                                                                          \n\
    //       This possibly suggests integration error OR some other problem in this collision handling (both?) -- should dig into it more.                                                                                          \n\                                                                                          \n\
    vec2 collisionDirections = step(positionNew, lowerBounds) + step(upperBounds, positionNew);                                                                                          \n\
    velocityNew = velocityNew - (collisionDirections * (1.7 * velocityNew + 0.3 * velocityOld) * uRestitutionCoefficient);                                                                                         \n\
    positionNew = clamp(positionNew, lowerBounds, upperBounds);                                                                                         \n\
                                                                                                                            \n\
    // Add random impulse on input                                                                                         \n\                                                                                          \n\
    // NOTE: This and the randomDir function are both kinda arbitrary...maybe come up with something better?                                                                                         \n\                                                                                          \n\
    //       It might be nice to do something with time rather than this kinda hacky 'salt'                                                                                         \n\                                                                                          \n\
    if (uShouldBump) {                                                                                          \n\
      velocityNew += ((randomDir(vUV.x + uRandomSalt) * 2.0) - 1.0) * BUMP_STRENGTH;                                                                                          \n\
    }                                                                                          \n\
                                                                                            \n\
    gl_FragColor = vec4(positionNew, velocityNew);                                                                                          \n\
  }                                                                                                                                             \n\
";
