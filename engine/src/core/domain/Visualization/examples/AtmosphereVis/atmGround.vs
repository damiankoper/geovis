#define M_PI 3.1415926535897932384626433832795

uniform vec3 viewVector;
uniform float stop;
uniform float fadeOut;
uniform float power;
varying float intensity;

#if NUM_DIR_LIGHTS > 0
struct DirectionalLight {
  vec3 direction;
};
uniform DirectionalLight directionalLights[NUM_DIR_LIGHTS];
#endif

float easeInOut(float x) { return x == 0. ? 0. : pow(2., 10. * x - 10.); }

void main() {
  vec3 vNormal = normalize(normalMatrix * normal);
  vec3 vNormalView = normalize(normalMatrix * viewVector);

  intensity = 0.;

  float stop = M_PI * stop;
  float dotP = dot(vNormal, vNormalView);
  float angle = acos(dotP);

  float g = 1. - ((stop - angle) / stop);
  intensity = mix(g, easeInOut(g), fadeOut);

  float lightIntensity = 1.;
#if NUM_DIR_LIGHTS > 0
  float dotL = dot(vNormal, directionalLights[0].direction);
  lightIntensity = dotL;
#endif

  intensity = pow(max(0., min(1., intensity)), power) * lightIntensity;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
