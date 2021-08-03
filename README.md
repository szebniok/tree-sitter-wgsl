<div align="center">
    <h1>
        tree-sitter-wgsl
	</h1>
    <p>
        <a href="https://www.w3.org/TR/WGSL/">WebGPU Shading Language (WGSL)</a> grammar for <a href="https://tree-sitter.github.io/tree-sitter/">tree-sitter</a> parser
    </p>
</div>

## About

The goal of this project is to provide a grammar for [WebGPU Shading Lanugage (WGSL)](https://www.w3.org/TR/WGSL/) that would enable [tree-sitter](https://tree-sitter.github.io/tree-sitter/) to efficiently bulid a syntax tree for a source file.

WGSL is a shading language created as a part of [WebGPU](https://www.w3.org/community/gpu/) &#x2014; future web standard that aims to provide "modern 3D graphics and computation capabilities".

Please note that both the WebGPU and WGSL spec are still under development.

## Showcase

### Code highlighting

![Code highlighting](./assets/code-highlighting.png)

### Incremental selection

![Incremental selection](./assets/incremental-selection.gif)

### Folding
![Folding](./assets/folding.gif)

## License

Distributed under the MIT License. See `LICENSE` for more information.

## References

* [WebGPU Shading Language Working Draft](https://www.w3.org/TR/WGSL/)