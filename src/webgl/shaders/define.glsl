uniform vec3 uMin;
uniform vec3 uMax;
uniform float uTime;
uniform float uAmplitude;
uniform float uPhase;

#define PI 3.141592653589793

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec3 displace(vec3 pos) {
  vec3 result = pos;
  float freq = map(pos.x, uMin.x, uMax.x, -PI, PI);
  float wave = sin(freq + uPhase - uTime * 3.0) * uAmplitude;
  result.y += wave;
  return result;
}

#include '../glsl/recalcNormal.glsl'

#include <common>