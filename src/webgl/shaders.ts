import define from './shaders/define.glsl'
import begin_vertex from './shaders/begin_vertex.glsl'
import beginnormal_vertex from './shaders/beginnormal_vertex.glsl'

export const shaders: { [key in string]: { replacer: string; shader: string } } = {
  define: {
    replacer: '#include <common>',
    shader: define,
  },
  begin_vertex: {
    replacer: '#include <begin_vertex>',
    shader: begin_vertex,
  },
  beginnormal_vertex: {
    replacer: '#include <beginnormal_vertex>',
    shader: beginnormal_vertex,
  },
}
