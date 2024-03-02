## shaderplay

A WebGPU-based native shader playground.

https://github.com/littledivy/shaderplay/assets/34997667/033830b9-2b9d-4c6f-b362-7292b2daa5e9

This is written on top of the
[`Deno.UnsafeWindowSurface`](https://github.com/denoland/deno/pull/21835).

To run:

```
deno run -A --unstable-ffi --unstable-webgpu ./shaderplay.ts examples/waves.wgsl
```
