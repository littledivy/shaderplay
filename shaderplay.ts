import { EventType, WindowBuilder } from "jsr:@divy/sdl2@0.13.0";
import loadGlslang from "npm:@webgpu/glslang@0.0.15";
import "./vendor/cdn.babylonjs.com/twgsl/twgsl.js";

const twgsl = await (globalThis as any).twgsl(
  "https://cdn.babylonjs.com/twgsl/twgsl.wasm",
);

const shaderFile = Deno.args[0];
if (!shaderFile) {
  console.error("No shader file provided");
  Deno.exit(1);
}

const width = 512;
const height = 512;

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter!.requestDevice();

const window = new WindowBuilder(shaderFile, width, height).alwaysOnTop()
  .build();

const surface = window.windowSurface(width, height);
const context = surface.getContext("webgpu");

let pipeline: any;

const fragPrelude = `
struct Uniforms {
    mouse: vec2f,
    clicked: f32,
    frame: f32,
};

@group(0) @binding(0) var<uniform> shaderplay: Uniforms;
`;
const uniformLength = 5;

let uniformValues: any, uniformBindGroup: any, uniformBuffer: any;

async function createPipeline() {
  let shader = Deno.readTextFileSync(shaderFile);
  let fragEntry = "fs_main";
  if (shaderFile.endsWith(".glsl")) {
    // @ts-ignore: loadGlslang is callable default export
    const glslang = await loadGlslang();
    const spirv = glslang.compileGLSL(shader, "fragment", false);
    shader = twgsl.convertSpirV2WGSL(spirv);

    shader = `
struct VertexInput {
    @builtin(vertex_index) vertex_index: u32,
};
@vertex
fn vs_main(in: VertexInput) -> @builtin(position) vec4<f32> {
    // Default vertex shader
    var vertices = array<vec2<f32>, 3>(
        vec2<f32>(-1., 1.),
        vec2<f32>(3.0, 1.),
        vec2<f32>(-1., -3.0),
    );
    return vec4<f32>(vertices[in.vertex_index], 0.0, 1.0);
}
${shader}
`;
    fragEntry = "main";
  }

  shader = `${fragPrelude}\n${shader}`;

  const shaderModule = device.createShaderModule({
    code: shader,
    label: shaderFile,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
        },
      },
    ],
  });
  pipeline = device.createRenderPipeline({
    // "auto" layout not working in Deno but works in browser
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        bindGroupLayout,
      ],
    }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [],
    },
    fragment: {
      module: shaderModule,
      entryPoint: fragEntry,
      targets: [
        {
          format: "bgra8unorm",
        },
      ],
    },
  });

  const value = new Float32Array(uniformLength);
  uniformBuffer = device.createBuffer({
    size: value.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  uniformValues = value;

  device.queue.writeBuffer(uniformBuffer, 0, value);

  uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
    ],
  });

  window.raise();
}

await createPipeline();

context.configure({
  device,
  format: "bgra8unorm",
});

async function run() {
  for await (const event of window.events()) {
    uniformValues[3]++; // frame++
    switch (event.type) {
      case EventType.MouseMotion:
        uniformValues[0] = event.x / width;
        uniformValues[1] = event.y / height;
        break;
      case EventType.MouseButtonDown:
        uniformValues[2] = 1;
        break;
      case EventType.MouseButtonUp:
        uniformValues[2] = 0;
        break;
      case EventType.Draw: {
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: textureView,
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });

        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.draw(3, 1);
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
        surface.present();
        break;
      }
      case EventType.Quit:
        Deno.exit(0);
        break;
      default:
        break;
    }
  }
}
async function watcher() {
  const wacher = Deno.watchFs(shaderFile);
  for await (const _ of wacher) {
    console.log("Shader changed, reloading...");
    createPipeline();
  }
}

if (import.meta.main) {
  run();
  watcher();
}
