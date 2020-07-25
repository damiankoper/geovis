#define M_PI 3.1415926535897932384626433832795

uniform vec3 viewVector;
uniform float c;
uniform float p;
varying float intensity;
void main() {
  vec3 vNormal = normalize(normalMatrix * normal);
  vec3 vNormalView = normalize(normalMatrix * viewVector);

  intensity = pow(M_PI / 4. * c - dot(vNormal, vNormalView), p);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
