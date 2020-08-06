uniform vec3 glowColor;
varying float intensity;
#include <logdepthbuf_pars_fragment>

void main() {
#include <logdepthbuf_fragment>

  gl_FragColor = vec4(glowColor, intensity);
}
