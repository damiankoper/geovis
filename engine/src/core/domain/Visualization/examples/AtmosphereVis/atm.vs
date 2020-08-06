#define M_PI 3.1415926535897932384626433832795

uniform vec3 viewVector;
varying vec3 vNormal;

varying vec3 vViewPosition;

#include <common>
#include <logdepthbuf_pars_vertex>

uniform float start;
uniform float stop;
uniform float fadeOut;
uniform float light;
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

  vNormal = normalize(normalMatrix * normal);

#include <begin_vertex>
#include <project_vertex>

#include <logdepthbuf_vertex>

  vec3 vNormalView = normalize(normalMatrix * viewVector);

  intensity = 0.;

  float start = M_PI * start;
  float stop = M_PI * stop;
  float fadeOut = M_PI * fadeOut;
  float dotP = dot(vNormal, vNormalView);
  float angle = acos(dotP);

  if (angle > start && angle < start + fadeOut) {
    float g = (start - angle + fadeOut) / fadeOut;
    intensity = easeInOut(g);
  } else if (angle <= start && angle >= stop) {
    intensity = 1.;
  } else if (angle < stop && angle > stop - fadeOut) {
    float g = (-stop + angle + fadeOut) / fadeOut;
    intensity = easeInOut(g);
  }

  float lightIntensity = 1.;
#if NUM_DIR_LIGHTS > 0
  float dotL = dot(vNormal, directionalLights[0].direction);
  float angleL = acos(dotL);
  float light = M_PI * light;

  lightIntensity = cos(angleL - light);
#endif

  intensity = pow(max(0., min(1., intensity)), power) * lightIntensity;
}
