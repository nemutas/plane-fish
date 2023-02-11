import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { gl } from './core/WebGL'
import { shaders } from './shaders'

gsap.registerPlugin(ScrollTrigger)

export class TCanvas {
  constructor(private parentNode: ParentNode) {
    this.init()
    this.createLights()
    this.createObjects()
    this.createGround()
    this.createScrollAnimation()
    this.resize()
    gl.requestAnimationFrame(this.anime)
  }

  private init() {
    gl.setup(this.parentNode.querySelector('.three-container')!)
    gl.scene.background = new THREE.Color('#efefef')
    gl.camera.position.set(-0.5, 0.6, 1.7)
    gl.camera.lookAt(0, -0.2, 0)

    gl.setResizeCallback(this.resize.bind(this))
  }

  private createLights() {
    const ambient = new THREE.AmbientLight('#fff', 0.2)
    gl.scene.add(ambient)

    const directional = new THREE.DirectionalLight('#fff', 0.9)
    directional.castShadow = true
    directional.position.set(-0.8, 2, 0.5)
    directional.shadow.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5)
    directional.shadow.mapSize.set(2048, 2048)
    gl.scene.add(directional)

    // const helper = new THREE.CameraHelper(directional.shadow.camera)
    // gl.scene.add(helper)
  }

  private createObjects() {
    const geometry = new THREE.BoxGeometry(1, 0.01, 1, 50, 1, 50)
    geometry.rotateY(Math.PI / 4)
    geometry.computeBoundingBox()

    const replaceVertexShader = (shader: THREE.Shader, key: string) => {
      shader.vertexShader = shader.vertexShader.replace(shaders[key].replacer, shaders[key].shader)
    }

    const amplitude = 0.1
    const createMaterials = (phase = 0) => {
      const uniforms: { [uniform: string]: THREE.IUniform<any> } = {
        uMin: { value: geometry.boundingBox?.min },
        uMax: { value: geometry.boundingBox?.max },
        uAmplitude: { value: amplitude },
        uPhase: { value: phase + Math.PI / 4 },
        uTime: { value: 0 },
      }

      const material = new THREE.MeshStandardMaterial()
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms)
        replaceVertexShader(shader, 'define')
        replaceVertexShader(shader, 'beginnormal_vertex')
        replaceVertexShader(shader, 'begin_vertex')
      }

      const depthMaterial = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
      })
      depthMaterial.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms)
        replaceVertexShader(shader, 'define')
        replaceVertexShader(shader, 'beginnormal_vertex')
        replaceVertexShader(shader, 'begin_vertex')
      }

      material.userData.uniforms = uniforms

      return { material, depthMaterial }
    }

    {
      const { material, depthMaterial } = createMaterials()
      const mesh = new THREE.Mesh(geometry, material)
      mesh.customDepthMaterial = depthMaterial
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.y = amplitude + geometry.parameters.height / 2
      mesh.name = 'top-plane'
      gl.scene.add(mesh)
    }
    {
      const { material, depthMaterial } = createMaterials(Math.PI)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.customDepthMaterial = depthMaterial
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.y = -(amplitude + geometry.parameters.height / 2)
      mesh.name = 'bottom-plane'
      gl.scene.add(mesh)
    }
  }

  private createGround() {
    const geometry = new THREE.PlaneGeometry(10, 10)
    geometry.rotateX(-Math.PI / 2)
    const material = new THREE.ShadowMaterial({
      color: '#000',
      opacity: 0.3,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = -0.6
    mesh.receiveShadow = true
    gl.scene.add(mesh)
  }

  private resize() {
    const factor = THREE.MathUtils.smoothstep(gl.size.aspect, 0.5, 1)
    const scale = factor * (1 - 0.5) + 0.5
    gl.scene.scale.set(scale, scale, scale)
  }

  // ----------------------------------
  // animation
  private targetSpeed = 0
  private speed = 0

  private createScrollAnimation() {
    let prev = 0
    ScrollTrigger.create({
      trigger: '.scroll-area',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (e) => {
        this.targetSpeed = e.progress - prev
        prev = e.progress
      },
    })
  }

  private anime = () => {
    // ターゲットとなるスピード（スクロール量の差分）は、徐々に0に減衰していく
    this.targetSpeed = THREE.MathUtils.lerp(this.targetSpeed, 0, 0.05)
    // スピードは、ターゲットに向かっていく
    this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed, 0.05)

    const direction = this.speed < 0 ? -1 : 1
    const dt = direction * gl.time.delta + this.speed * 10

    const topUniforms = gl.getMesh<THREE.MeshStandardMaterial>('top-plane').material.userData.uniforms
    if (topUniforms) {
      topUniforms.uTime.value += dt
    }
    const bottomUniforms = gl.getMesh<THREE.MeshStandardMaterial>('bottom-plane').material.userData.uniforms
    if (bottomUniforms) {
      bottomUniforms.uTime.value += dt
    }

    gl.render()
  }

  // ----------------------------------
  // dispose
  dispose() {
    gl.dispose()
  }
}
