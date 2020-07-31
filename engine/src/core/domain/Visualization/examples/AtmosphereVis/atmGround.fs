#define M_PI 3.1415926535897932384626433832795

uniform float stop;
uniform float fadeOut;
uniform float power;
uniform vec3 glowColor;

varying vec3 vNormal;
varying vec3 vViewPosition;

#if NUM_DIR_LIGHTS > 0
struct DirectionalLight {
  vec3 direction;
};
uniform DirectionalLight directionalLights[NUM_DIR_LIGHTS];
#endif

float easeInOut(float x) { return x == 0. ? 0. : pow(2., 10. * x - 10.); }

float easeOutSine(float x) { return sin((x * M_PI) / 2.); }

void main() {
  float intensity = 0.;
  float stop = M_PI * stop;
  float dotP = dot(vNormal, normalize(vViewPosition));
  float angle = acos(dotP);

  float g = 1. - ((stop - angle) / stop);
  intensity = mix(easeOutSine(g), easeInOut(g), fadeOut);

  float lightIntensity = 1.;
#if NUM_DIR_LIGHTS > 0
  float dotL = dot(vNormal, directionalLights[0].direction);
  lightIntensity = dotL;
#endif

  intensity = pow(max(0., min(1., intensity)), power) * lightIntensity;

  gl_FragColor = vec4(glowColor, intensity);
}
