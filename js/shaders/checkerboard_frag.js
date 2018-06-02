var checkerboard_frag = "                                                                                                                          \n\
  #define FL_PT_EPS 0.0000001                                                               \n\
                                                                                                                                                \n\
  uniform float uInverseAspect;                                                                                                                 \n\
  uniform float uWidth;                                                                                                                 \n\
  uniform float uFrequency;                                                                                                                 \n\
  uniform sampler2D uDistortionPhase;                                                                                                                 \n\
  uniform bool uShouldGlom;                                                                                                                 \n\
  uniform float uPhaseOffset;                                                                                                                 \n\
  varying vec2 vUV;                                                                                                                             \n\
                                                                                                                                                \n\
  void main() {                                                                                                                                 \n\
    vec4 distortionPhase = texture2D(uDistortionPhase, vUV);                                                                           \n\
    vec2 distortionOffset = distortionPhase.xy;                                                                           \n\
    float phase = floor(distortionPhase.z);                                                                           \n\
    if (uShouldGlom) {                                                                           \n\
      phase = max(min(phase, 1.0), 0.0);                                                                           \n\
    }                                                                           \n\
                                                                               \n\
    vec2 checkerboardDims = vec2(uWidth, uWidth * uInverseAspect);                                                                            \n\
    vec2 checkerboardCoord = floor((vUV + distortionOffset) * checkerboardDims);                                                                                     \n\
    float checkerboardValue = mod(checkerboardCoord.x + checkerboardCoord.y + (phase * uPhaseOffset), uFrequency);                                                      \n\
    // NOTE: At certain frequencies, including 7 and 13, mod(n * frequency, frequency) seems to produce a value _just under_ frequency                                                                           \n\
    //       floor()-ing both operands doesn't seem to help, although explicitly specifying the frequency _does_(???)                                                                           \n\
    //       Anyway, that's what this horrible epsilon check is about.                                                                           \n\
    if (uFrequency - checkerboardValue < FL_PT_EPS) {                                                      \n\
      checkerboardValue = 0.0;                                                    \n\
    }                                                      \n\
    // checkerboardValue /= (uFrequency - 1.0);                                                                        \n\
                                                                               \n\
    gl_FragColor = vec4(vec3(checkerboardValue), 1.0);                                                                                          \n\
  }                                                                                                                                             \n\
";