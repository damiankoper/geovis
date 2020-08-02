uniform vec3 viewVector;
varying vec3 vNormal;

varying vec3 vViewPosition;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {

#include <beginnormal_vertex>
#include <defaultnormal_vertex>

  vNormal = normalize(transformedNormal);

#include <begin_vertex>
#include <project_vertex>

#include <logdepthbuf_vertex>

  vViewPosition = normalMatrix * viewVector;
}
