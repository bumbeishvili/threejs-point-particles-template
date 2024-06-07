import * as THREE from 'three';

import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls';

import Stats from 'three/examples/jsm/libs/stats.module';


console.log({ THREE })

export default class Experience {
    constructor() {
        // Defining state attributes
        const attrs = {
            id: "ID" + Math.floor(Math.random() * 1000000),
            width: window.innerWidth - 0,
            height: window.innerHeight - 0,
            marginTop: 0,
            marginBottom: 0,
            marginRight: 0,
            marginLeft: 0,
            container: "body",
            defaultFont: "Helvetica",
            data: null,

            // ThreeJS Stuff
            canvas: null,
            scene: null,
            texture: null,
            geometry: null,
            material: null,
            mesh: null,
            camera: null,
            controls: null,
            renderer: null,
            clock: null,

            // Project specific stuff
            particlesCount: 10000,
            elapsedTime: 0

        };

        // Defining accessors
        this.getState = () => attrs;
        this.setState = (d) => Object.assign(attrs, d);

        // Automatically generate getter and setters for chart object based on the state properties;
        Object.keys(attrs).forEach((key) => {
            //@ts-ignore
            this[key] = function (_) {
                if (!arguments.length) {
                    return attrs[key];
                }
                attrs[key] = _;
                return this;
            };
        });

        // Custom enter exit update pattern initialization (prototype method)
        this.initializeEnterExitUpdatePattern();
    }


    render() {
        this.setDynamicContainer();
        this.drawCanvasAndWrapper();
        this.setupScene()
        this.setupTextures();
        this.setupGeometryMaterialMesh();
        this.setupCamera()
        this.setupControls()
        this.setupRenderer();
        this.setupClock();
        this.tick();

        return this;
    }

    setupScene() {
        const scene = new THREE.Scene()
        this.setState({ scene })

    }
    setupTextures() {

    }

    setupGeometryMaterialMesh() {
        const { scene, particlesCount } = this.getState();
        const particlesGeometry = new THREE.BufferGeometry()

        const positions = new Float32Array(particlesCount * 3)
        const colors = new Float32Array(particlesCount * 3)
        // Set colors and initial positions;
        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
            colors[i] = Math.random();
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const particlesMaterial = new THREE.PointsMaterial({ size: 0.01, sizeAttenuation: true });
        particlesMaterial.transparent = true
        particlesMaterial.depthWrite = false;
        particlesMaterial.blending = THREE.AdditiveBlending;
        particlesMaterial.vertexColors = true;

        const mesh = new THREE.Points(particlesGeometry, particlesMaterial)

        scene.add(mesh)
        this.setState({ geometry: particlesGeometry, material: particlesMaterial, mesh })
    }

    setParticlePositions() {
        const { particlesCount, geometry, elapsedTime } = this.getState();
        let waveSpeed = elapsedTime / 4;
        let waveIntensity = 0.2;
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const x = geometry.attributes.position.array[i3 + 0];
            const y = geometry.attributes.position.array[i3 + 2];
            geometry.attributes.position.array[i3 + 1] = Math.sin(waveSpeed + x) * waveIntensity + Math.sin(waveSpeed + y) * waveIntensity;
        }
        geometry.attributes.position.needsUpdate = true;
    }
    setupControls() {
        const { scene, width, height, canvas, camera } = this.getState();
        const controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true
        this.setState({ controls });
    }
    setupCamera() {
        const { scene, width, height } = this.getState();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
        camera.position.z = 3
        scene.add(camera)
        this.setState({ camera })

    }
    setupRenderer() {
        const { width, height, canvas } = this.getState();
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas
        })
        renderer.setClearColor('#001b47');
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.setState({ renderer })
    }

    setupClock() {
        const clock = new THREE.Clock()
        this.setState({ clock })
    }
    tick() {
        const { scene, renderer, camera, controls, clock } = this.getState();
        const elapsedTime = clock.getElapsedTime()
        this.setState({ elapsedTime });

        //mesh.rotation.y += 0.001;
        this.setParticlePositions();
        controls.update()
        renderer.render(scene, camera)
        window.requestAnimationFrame(this.tick.bind(this))
    }


    drawCanvasAndWrapper() {
        const {
            canvasContainer,
            width,
            height,
            defaultFont,
        } = this.getState();

        // Draw Canvas
        const canvas = canvasContainer
            ._add({
                tag: "canvas",
                className: "webgl"
            })
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", defaultFont)
            .node()

        this.setState({ canvas });
    }

    initializeEnterExitUpdatePattern() {
        d3.selection.prototype._add = function (params) {
            var container = this;
            var className = params.className;
            var elementTag = params.tag;
            var data = params.data || [className];
            var exitTransition = params.exitTransition || null;
            var enterTransition = params.enterTransition || null;
            // Pattern in action
            var selection = container.selectAll("." + className).data(data, (d, i) => {
                if (typeof d === "object") {
                    if (d.id) {
                        return d.id;
                    }
                }
                return i;
            });
            if (exitTransition) {
                exitTransition(selection);
            } else {
                selection.exit().remove();
            }

            const enterSelection = selection.enter().append(elementTag);
            if (enterTransition) {
                enterTransition(enterSelection);
            }
            selection = enterSelection.merge(selection);
            selection.attr("class", className);
            return selection;
        };
    }

    setDynamicContainer() {
        const attrs = this.getState();

        //Drawing containers
        var canvasContainer = d3.select(attrs.container);
        var containerRect = canvasContainer.node().getBoundingClientRect();
        if (containerRect.width > 0) attrs.width = containerRect.width;

        d3.select(window).on("resize." + attrs.id, function () {
            var containerRect = canvasContainer.node().getBoundingClientRect();
            if (containerRect.width > 0) attrs.width = containerRect.width;

            const { width, height, renderer, camera } = attrs;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        this.setState({ canvasContainer });
    }
}