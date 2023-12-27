## shaderplay

A WebGPU-based native shader playground.

https://github.com/littledivy/shaderplay/assets/34997667/812ab1e2-aa55-42a1-85b4-04b5f04babae

This is written on top of the Deno "external wgpu surfaces" patch.

To run:

```
git clone --depth=1 https://github.com/littledivy/deno
cd deno

# Build Deno with the patch
git checkout webgpu_external_surface
cargo build -p deno

git clone https://github.com/littledivy/shaderplay

# Run example
/path/to/deno run -A --unstable ./shaderplay.ts examples/waves.wgsl
```
