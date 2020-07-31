uniform vec3 viewVector;
varying vec3 vNormal;

varying vec3 vViewPosition;

void main() {

#include <beginnormal_vertex>
#include <defaultnormal_vertex>

  vNormal = normalize(transformedNormal);

#include <begin_vertex>
#include <project_vertex>

  vViewPosition = normalMatrix * viewVector;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
