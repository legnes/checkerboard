var phase_accumulator_frag = "                                                                                                                          \n\
  uniform float uLensHeight;                                                                                                                             \n\
  uniform float uLensRefractiveIndex;                                                                                                                             \n\
  varying vec2 vDiameterUVSpace;                                                                                                                             \n\
                                                                                                                               \n\
  void main() {                                                                                                                                 \n\
    // Coerce into circle                                                                                          \n\
    vec2 centralVec = vec2(0.5) - gl_PointCoord;                                                                                          \n\
    if (length(centralVec) > 0.5) {                                                                                          \n\
      discard;                                                                                          \n\
    }                                                                                            \n\
                                                                                                \n\
    // For a spherical plano-convex half-lens resting on a surface, where                                                                                         \n\
    //    n is the lens's refractive index                                                                                          \n\
    //    d is the distance from the lens's apex to the surface                                                                                           \n\
    //    r is the cross-sectional radius of the lens (i.e radius in gl_PointCoord space)                                                                                          \n\
    //    R is the lens's radius of curvature                                                                                          \n\
    //    f is the lens's focal length                                                                                          \n\
    //    r_frag is the distance from this point (on the lens) to the center of the lens                                                                                          \n\
    //    d_frag the distance from this point (on the lens) to the surface                                                                                         \n\
    // we find the distortion offset (in uv space), the amount (parallel to the surface) that an incident ray perpendicular                                                                                          \n\
    // to the surface at this point is diverted/refracted by the lens before hitting the surface. Since:                                                                                          \n\
    //    R^2 = r^2 + (R - d)^2 --> R = (r^2 + d^2) / 2d                                                                                          \n\
    // and from the lensmaker's equation                                                                                          \n\
    //    1 / f = (n - 1) * ((1 / R1) - (1 / R2) + ((n - 1) * d / (n * R1 * R2)))                                                                                          \n\
    // since this is a planar half-lens, we can approximate R2 = 0, so                                                                                          \n\
    //    1 / f = (n - 1) * (1 / R) --> f = R / (n-1)                                                                                          \n\
    // We can say that for a given point on the lens a distance r_frag from the lens center,                                                                                          \n\
    // there is an angle(lens point, sphere center, lens center) such that:                                                                                          \n\
    //    sin(theta) = r_frag / R                                                                                          \n\
    //    tan(theta) = r_frag / (d - d_frag)                                                                                           \n\
    // Putting this all together yields an equation for the intercept (at the surface) of the vector from                                                                                         \n\
    // this point on the lens to the focal point of the lens, which follows the linear eq                                                                                         \n\
    //    x, y = (r_frag(x,y) / (d_frag + f)) * z                                                                                       \n\
    // which we want to evaluate at z = d_frag                                                                                         \n\
    // TODO: Calculate R & f on the cpu?                                                                                         \n\
    float n = uLensRefractiveIndex;                                                                          \n\
    float d = uLensHeight;                                                                          \n\
    float r = 0.5;                                                                          \n\
    float R = ((r * r) + (d * d)) / (2.0 * d);                                                                          \n\
    float f = R / (n - 1.0);                                                                          \n\
    float r_frag = length(centralVec);                                                                          \n\
    float d_frag = d - (r_frag / tan(asin(r_frag / R)));                                                                          \n\
    vec2 distortionOffset = (centralVec * d_frag) / (d_frag + f);                                                                          \n\
                                                                                                \n\
    // FIX THIS: Why do we need this -1 in x??? Could be uv coords have different origin than gl_PointCoord coords, but in X?                                                                                        \n\
    //       Maybe missing a -1 somewhere and the coords are opposite in y???                                                                                        \n\
    gl_FragColor = vec4(vec2(-1.0, 1.0) * vDiameterUVSpace * distortionOffset, 1.0, 1.0);                                                                                          \n\
  }                                                                                                                                             \n\
";