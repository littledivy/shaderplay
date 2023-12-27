## shaderplay

A WebGPU-based native shader playground.

https://github.com/littledivy/shaderplay/assets/34997667/033830b9-2b9d-4c6f-b362-7292b2daa5e9

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
