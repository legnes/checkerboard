var phase_accumulator_vert = "                                                                  \n\
  uniform vec2 uInverseResolution;                             \n\
  uniform vec2 uRadiusMinMax;                             \n\
  uniform sampler2D uPositionVelocity;                                                               \n\
  attribute vec2 aUV;                                                                             \n\
  varying vec2 vDiameterUVSpace;                                                                                                                             \n\
                                                                                                  \n\
  void main() {                                                                                   \n\
    vec2 position = texture2D(uPositionVelocity, aUV).xy;                                           \n\
    float diameter = aUV.x;                                                                         \n\
                                                                                                    \n\
    gl_PointSize = mix(uRadiusMinMax.x, uRadiusMinMax.y, aUV.x);                                                  \n\
    vDiameterUVSpace = gl_PointSize * uInverseResolution;                                                                         \n\
                                                                                                    \n\
    gl_Position = vec4(position.xy, 0.0, 1.0);                                                          \n\
  }                                                                                               \n\
";