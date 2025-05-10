export const EXAMPLE_READMES = {
  'vmath20/IsoPath': `# IsoPath: Comparing Computational Pathology Foundation Models using Representational Similarity Analysis

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/vmath20/IsoPath)
This repository contains code for comparing various pre-trained foundational models on computational pathology tasks using Representational Similarity Analysis (RSA). The analysis focuses on Whole Slide Images (WSIs) from The Cancer Genome Atlas (TCGA) for four cancer subtypes: Breast Invasive Carcinoma (BRCA), Colon Adenocarcinoma (COAD), Lung Adenocarcinoma (LUAD), and Lung Squamous Cell Carcinoma (LUSC).

## Overview

The primary goal of this project is to understand how different state-of-the-art vision models represent histopathology image patches from different cancer types. We achieve this by:

1.  Preprocessing TCGA WSIs to extract relevant image patches.
2.  Generating feature embeddings for these patches using multiple pre-trained models.
3.  Calculating Representational Dissimilarity Matrices (RDMs) for each model based on the embeddings.
4.  Comparing these RDMs using second-order RSA (Spearman correlation, Cosine similarity) to quantify the similarity between model representations.
5.  Performing additional analyses like hierarchical clustering, specificity analysis (slide-level and disease-level using Cliff's Delta), and SVD spectral analysis to further characterize the embeddings.

## Models Compared

The following pre-trained models are included in the comparison:

*   **CONCH:** \`hf_hub:MahmoodLab/conch\` (ViT-B-16 based)
*   **PLIP:** \`vinid/plip\` (CLIP based)
*   **Prov-GigaPath:** \`hf_hub:prov-gigapath/prov-gigapath\`
*   **QuiltNet:** \`wisdomik/QuiltNet-B-32\` (CLIP based)
*   **ResNet50:** \`timm\` implementation, ImageNet pre-trained.
*   **UNI:** \`hf-hub:MahmoodLab/UNI2-h\`
*   **Virchow:** \`hf-hub:paige-ai/Virchow2\`

## Repository Structure

\`\`\`
└── vmath20-isopath/
    ├── README.md               # This file
    ├── FinalRDMGenerationAnalysis.ipynb # Jupyter Notebook for all RSA, clustering, specificity, and spectral analyses
    ├── LICENSE                 # MIT License file
    ├── preprocessing.py        # Script for WSI loading, patch extraction, and saving
    └── generate_embeddings/    # Directory containing scripts/notebooks for generating embeddings
        ├── ConchEmbeddings.ipynb # Generates embeddings using CONCH
        ├── plip.py             # Generates embeddings using PLIP
        ├── prov.py             # Generates embeddings using Prov-GigaPath
        ├── quiltnet.py         # Generates embeddings using QuiltNet
        ├── resnet.py           # Generates embeddings using ResNet50
        ├── uni.py              # Generates embeddings using UNI
        └── virchow.py          # Generates embeddings using Virchow
\`\`\`

## Workflow

1.  **Data Acquisition:** Assumes access to TCGA WSI data (\`.svs\` files) and corresponding metadata (e.g., \`gdc_sample_sheet.tsv\`). Paths in the scripts point to a specific cluster setup (\`/tcga/\`, \`/lotterlab/\`).
2.  **Preprocessing (\`preprocessing.py\`):**
    *   Reads metadata to identify slide paths for BRCA, COAD, LUAD, LUSC.
    *   Samples 250 slides per cancer type.
    *   For each slide:
        *   Loads the WSI using \`openslide\`.
        *   Performs basic tissue segmentation on a thumbnail using Otsu's thresholding.
        *   Extracts 224x224 pixel patches from the tissue regions.
        *   Randomly samples 250 patches per slide.
        *   Saves the selected patches as \`.npy\` files (one file per slide) to a designated directory (e.g., \`/lotterlab/users/vmishra/preprocessed_patches_LUAD\`).
3.  **Embedding Generation (\`generate_embeddings/\`):**
    *   Each script/notebook loads a specific pre-trained model (e.g., CONCH, PLIP).
    *   Loads the preprocessed \`.npy\` patch files for all 4 cancer types.
    *   Applies the model-specific image transformations.
    *   Processes patches in batches through the model on a GPU to generate embeddings.
    *   Saves the embeddings as \`.npy\` files (one file per cancer type per model, e.g., \`brca_embeddings_conch.npy\`) to a designated directory (e.g., \`/lotterlab/users/vmishra/\`).
4.  **Analysis (\`FinalRDMGenerationAnalysis.ipynb\`):**
    *   **Batching:** Loads the full embeddings and splits them into 5 batches (50 slides x 50 patches each) for robustness analysis, saving batched embeddings (e.g., \`/lotterlab/users/vmishra/batched_embeddings\`).
    *   **RDM Calculation:** Calculates RDMs (Euclidean distance) for each model within each batch using \`rsatoolbox\` and saves them (e.g., \`/lotterlab/users/vmishra/rdms\`). Also calculates overall RDMs for visualization.
    *   **RDM Visualization:** Generates and saves heatmap visualizations of the RDMs for each model.
    *   **Second-Order RSA:** Compares the RDMs across models using Spearman correlation and Cosine similarity, averaging results across batches. Generates and saves similarity heatmaps.
    *   **Hierarchical Clustering:** Clusters models based on RDM similarity (using Ward linkage) and plots dendrograms.
    *   **Specificity Analysis:** Calculates Cliff's Delta to compare intra-vs-inter-slide distances ("Slide Specificity") and intra-vs-inter-disease distances ("Disease Specificity"). Saves results to CSV.
    *   **Spectral Analysis:** Performs SVD on the full embeddings for each model and plots the cumulative explained variance to compare effective dimensionality.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`,

  'openai/openai-python': `# OpenAI Python API library
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/openai/openai-python)
The OpenAI Python library provides convenient access to the OpenAI REST API from any Python 3.8+
application. The library includes type definitions for all request params and response fields,
and offers both synchronous and asynchronous clients powered by [httpx](https://github.com/encode/httpx).

It is generated from our [OpenAPI specification](https://github.com/openai/openai-openapi) with [Stainless](https://stainless.com/).

## Documentation

The REST API documentation can be found on [platform.openai.com](https://platform.openai.com/docs/api-reference). The full API of this library can be found in [api.md](api.md).

## Installation

\`\`\`sh
# install from PyPI
pip install openai
\`\`\`

## Usage

The full API of this library can be found in [api.md](api.md).

The primary API for interacting with OpenAI models is the [Responses API](https://platform.openai.com/docs/api-reference/responses). You can generate text from the model with the code below.

\`\`\`python
import os
from openai import OpenAI

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)

response = client.responses.create(
    model="gpt-4o",
    instructions="You are a coding assistant that talks like a pirate.",
    input="How do I check if a Python object is an instance of a class?",
)

print(response.output_text)
\`\`\`

The previous standard (supported indefinitely) for generating text is the [Chat Completions API](https://platform.openai.com/docs/api-reference/chat). You can use that API to generate text from the model with the code below.`,

  'marktext/marktext': `# MarkText

[<img src="https://devin.ai/assets/askdeepwiki.png" alt="Ask https://DeepWiki.com" height="20"/>](https://deepwiki.com/marktext/marktext)

MarkText is a simple and elegant open-source Markdown editor focused on speed and usability. It provides a distraction-free writing experience with a realtime preview (WYSIWYG) interface. MarkText is available for Linux, macOS, and Windows.

## Features

*   **Realtime Preview (WYSIWYG):** Clean and simple interface offering a distraction-free writing experience. What you see is what you get.
*   **Markdown Standards:** Supports [CommonMark Spec](https://spec.commonmark.org/0.29/), [GitHub Flavored Markdown Spec](https://github.github.com/gfm/), and selective support for [Pandoc markdown](https://pandoc.org/MANUAL.html#pandocs-markdown).
*   **Markdown Extensions:** Includes support for math expressions (KaTeX), front matter, emojis, footnotes, and more.
*   **Editing Efficiency:** Paragraph and inline style shortcuts, quick insert menu (\`@\`), table tools, emoji picker, and robust image handling (including pasting from clipboard and optional uploaders).
*   **Output Options:** Export documents to HTML and PDF formats with theme support.
*   **Themes & Modes:** Comes with various themes (e.g., Cadmium Light, Material Dark, One Dark) and editing modes (Source Code, Typewriter, Focus).
*   **File Management:** Integrated sidebar with a file explorer (tree view), file search, and Table of Contents. Supports multiple tabs.
*   **Utilities:** Command palette, spell checking with multi-language support, keybinding customization.
*   **Diagram Support:** Render diagrams using Mermaid, PlantUML, Vega-Lite, Flowchart.js, and sequence diagrams.
*   **Cross-Platform:** Available for Linux, macOS, and Windows.
*   **Open Source:** Licensed under the MIT license.

## Download and Installation

Binaries for Linux, macOS, and Windows are available on the [GitHub Releases page](https://github.com/marktext/marktext/releases/latest).

Package managers like Homebrew (macOS), Chocolatey (Windows), Winget (Windows), and various Linux package managers (AUR, Flathub) often provide MarkText packages.

*   **macOS (Homebrew):** \`brew install --cask mark-text\`
*   **Windows (Chocolatey):** \`choco install marktext\`
*   **Windows (Winget):** \`winget install marktext\`
*   **Linux:** See [Linux Installation Instructions](docs/LINUX.md).

A [portable mode](docs/PORTABLE.md) is also available on Linux and Windows.

## Development

MarkText is built using Electron, Vue.js, and the Muya editor core.

If you wish to build MarkText yourself, please check out the [Build Instructions](docs/dev/BUILD.md).

Further developer documentation can be found here:

*   [Architecture Overview](docs/dev/ARCHITECTURE.md)
*   [Debugging Guide](docs/dev/DEBUGGING.md)
*   [Internal Code Documentation](docs/dev/code/README.md)

## Contribution

Contributions are welcome! MarkText is an open-source project, and we appreciate community help. Before submitting a pull request, please read the [Contributing Guide](CONTRIBUTING.md).

If you find bugs or have feature requests, please check existing issues and open a new one following the templates if necessary.

## License

MarkText is licensed under the [MIT License](LICENSE).`,

  '3b1b/manim': `# ManimGL

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/3b1b/manim)

Manim is an engine for precise programmatic animations, designed for creating explanatory math videos. This repository contains the version of Manim used by Grant Sanderson for videos on the [3Blue1Brown](https://www.3blue1brown.com/) YouTube channel.

This version uses OpenGL for rendering, leveraging the GPU for potentially faster rendering and real-time interactions compared to some other backends.

Note: A separate [community edition](https://github.com/ManimCommunity/manim/) is actively developed by community members, focusing on broader accessibility, testing, and documentation.

## Key Features

*   **Programmatic Animation:** Define animations precisely using Python code.
*   **Mathematical Focus:** Rich set of classes for mathematical objects like functions, coordinate systems, shapes, text (including LaTeX), and vectors.
*   **OpenGL Rendering:** GPU-accelerated rendering pipeline.
*   **Object-Oriented:** Structure animations using Scenes, Mobjects (mathematical objects), and Animations.
*   **LaTeX Support:** Render high-quality mathematical expressions using \`Tex\`.
*   **Text Rendering:** Create text using system fonts via \`Text\`.
*   **SVG Support:** Import and manipulate SVG images (\`SVGMobject\`).
*   **Coordinate Systems:** Classes like \`Axes\`, \`NumberPlane\`, \`ComplexPlane\`, \`ThreeDAxes\`.
*   **3D Capabilities:** Create and manipulate 3D objects like \`Sphere\`, \`Torus\`, \`ParametricSurface\`, and control a 3D camera.
*   **Interactivity:** Use \`Scene.embed()\` to drop into an IPython terminal mid-animation for interactive development and debugging.
*   **Configuration:** Customize behavior via CLI flags and \`custom_config.yml\` files.
*   **Extensibility:** Built with Python, allowing for custom classes and animations.

## Installation

ManimGL requires **Python 3.7 or higher**.

**System Dependencies:**

*   **FFmpeg:** Required for video file creation.
*   **OpenGL:** Usually handled by graphics drivers. Python binding \`PyOpenGL\` is installed via pip.
*   **LaTeX (Optional):** Required for rendering \`Tex\` mobjects. MiKTeX (Windows), MacTeX (macOS), or TeX Live (Linux) are common distributions.
*   **Pango (Linux only):** Required for \`Text\` mobjects. Install \`libpango1.0-dev\` (Debian/Ubuntu) or \`pango-devel\` (Fedora) or equivalent.

**Install ManimGL:**

\`\`\`sh
# Install via pip
pip install manimgl

# Or, for development, clone the repo and install editable:
git clone https://github.com/3b1b/manim.git
cd manim
pip install -e .
\`\`\`

## Basic Usage

Render a scene using the command line:

\`\`\`sh
manimgl <your_script_name>.py <SceneClassName> [flags]
\`\`\`

*   \`<your_script_name>.py\`: The Python file containing your scene definitions.
*   \`<SceneClassName>\`: The name of the specific Scene class you want to render. If omitted and the file contains only one Scene, it will be rendered automatically.
*   \`[flags]\`: Optional command-line arguments.

**Common Flags:**

*   (No flags): Preview the scene in a window.
*   \`-w\`: Write the scene to a video file (default \`.mp4\`).
*   \`-o\`: Write the scene to a video file and open it afterward.
*   \`-s\`: Skip rendering animations and show only the final frame.
    *   \`-so\`: Save the final frame as an image (\`.png\`) and open it.
*   \`-l\`, \`-m\`, \`--hd\`, \`--uhd\`: Set render quality (low, medium, 1080p HD, 4K UHD).
*   \`-t\`: Render with a transparent background (writes a \`.mov\` file).
*   \`-i\`: Render as a GIF file.
*   \`-n <number>\`: Start rendering from animation number \`<number>\`. Use \`-n <start>,<end>\` to render a range.
*   \`-p\`: Enable presenter mode (pause on \`self.wait()\` until spacebar/right arrow).
*   \`--config_file <path>\`: Specify a custom configuration file.

**Example:**

To preview the \`OpeningManimExample\` scene from the included examples:

\`\`\`sh
manimgl example_scenes.py OpeningManimExample
\`\`\`

To write the \`SquareToCircle\` scene from \`docs/example.py\` to a high-definition MP4 file and open it:

\`\`\`sh
manimgl docs/example.py SquareToCircle --hd -o
\`\`\`

## Core Concepts

1.  **Scene:** The container for your animation. You define animations within the \`construct\` method of a class inheriting from \`Scene\`.
2.  **Mobject:** The fundamental object representing items on screen (shapes, text, graphs, etc.). \`Mobject\` is the base class. \`VMobject\` is for vectorized objects (defined by points and curves).
3.  **Animation:** Represents the transition of Mobjects over time (e.g., \`FadeIn\`, \`Transform\`, \`GrowFromCenter\`, \`Write\`). Animations are played using \`self.play(...)\` within a Scene's \`construct\` method.

\`\`\`python
from manimlib import *

class MyScene(Scene):
    def construct(self):
        # Create Mobjects
        square = Square()
        circle = Circle().shift(RIGHT * 2)

        # Show the square
        self.play(ShowCreation(square))
        self.wait(1) # Pause for 1 second

        # Transform the square into the circle
        self.play(Transform(square, circle))
        self.wait(1)

        # Fade out both objects
        self.play(FadeOut(square), FadeOut(circle))
        self.wait(1)
\`\`\`

## Examples

Explore \`example_scenes.py\` for various examples demonstrating Manim's capabilities. The code for 3Blue1Brown videos is available at [github.com/3b1b/videos](https://github.com/3b1b/videos) (note: older code might not be compatible with the latest ManimGL).

## Documentation

Official documentation is available at [3b1b.github.io/manim/](https://3b1b.github.io/manim/).

## Contributing

Contributions are welcome via pull requests. However, note that the most active development and community contributions often occur in the [Manim Community fork](https://github.com/ManimCommunity/manim/).

## License

ManimGL is released under the MIT License. See \`LICENSE.md\` for details.`,

  'mark3labs/mcp-go': `# MCP Go

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/mark3labs/mcp-go)
MCP Go provides a Go implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). MCP allows applications, particularly those powered by Large Language Models (LLMs), to interact with external data sources and execute actions (tools) in a standardized and secure way.

This library enables developers to build MCP servers in Go, exposing resources (data) and tools (functionality) to MCP clients. It also provides a client implementation for interacting with MCP servers.

## Key Features

*   **MCP Server Implementation:** Build servers that adhere to the MCP specification.
*   **Resources:** Expose static or dynamic data resources to clients.
*   **Tools:** Define and handle tools that clients can invoke to perform actions.
*   **Prompts:** Create reusable prompt templates for standardized interactions.
*   **Transport Agnostic Core:** The core server logic is independent of the transport layer.
*   **Built-in Transports:** Includes implementations for \`stdio\`, Server-Sent Events (\`sse\`), and streamable HTTP.
*   **Client Implementation:** Connect to and interact with MCP servers.
*   **Session Management:** Support for managing client sessions.
*   **Hooks & Middleware:** Extend server functionality with request lifecycle hooks and tool handler middleware.
*   **Testing Utilities:** \`mcptest\` package provides helpers for testing MCP servers.

## Installation

\`\`\`bash
go get github.com/mark3labs/mcp-go
\`\`\`

## Quickstart: Simple Stdio Server

This example creates a basic MCP server running over standard input/output (stdio) that exposes a simple "hello world" tool.

\`\`\`go
package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	// Create MCP server
	s := server.NewMCPServer(
		"Demo Server",
		"1.0.0",
		server.WithToolCapabilities(true), // Enable tools
	)

	// Define the 'hello_world' tool
	tool := mcp.NewTool("hello_world",
		mcp.WithDescription("Say hello to someone"),
		mcp.WithString("name", // Define a string parameter 'name'
			mcp.Required(), // Mark it as required
			mcp.Description("Name of the person to greet"),
		),
	)

	// Add the tool and its handler function
	s.AddTool(tool, helloHandler)

	fmt.Println("Starting MCP server over stdio...")
	// Start the server using stdio transport
	if err := server.ServeStdio(s); err != nil {
		fmt.Printf("Server error: %v\\n", err)
	}
}

// helloHandler implements the logic for the 'hello_world' tool
func helloHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	// Extract the 'name' argument using type assertion
	name, ok := request.Params.Arguments["name"].(string)
	if !ok {
		return nil, errors.New("name argument must be a string")
	}

	// Create a successful text result
	resultText := fmt.Sprintf("Hello, %s!", name)
	return mcp.NewToolResultText(resultText), nil
}

\`\`\`

## Core Concepts

*   **Server (\`server.MCPServer\`):** The main component that manages resources, tools, prompts, and client connections. It handles the MCP protocol logic.
*   **Resources (\`mcp.Resource\`, \`mcp.ResourceTemplate\`):** Represent data that the server can provide to clients. Resources are identified by URIs and can be static or dynamically generated via templates. Handlers (\`server.ResourceHandlerFunc\`) provide the content.
*   **Tools (\`mcp.Tool\`):** Define actions that clients can request the server to perform. Tools have names, descriptions, and defined input schemas (\`mcp.ToolInputSchema\`). Handlers (\`server.ToolHandlerFunc\`) execute the tool logic.
*   **Prompts (\`mcp.Prompt\`):** Reusable templates for common interactions, often involving system messages and argument placeholders. Handlers (\`server.PromptHandlerFunc\`) generate the prompt content based on arguments.
*   **Transports (\`client/transport\`, \`server/stdio.go\`, \`server/sse.go\`):** Handle the communication layer (e.g., stdio, SSE, streamable HTTP) between the client and server.
*   **Client (\`client.Client\`):** Allows a Go application to connect to and interact with an MCP server, invoking its tools and reading its resources.

## Packages

*   **\`mcp/\`:** Contains the core MCP type definitions (requests, responses, resources, tools, prompts, etc.) as defined by the specification.
*   **\`server/\`:** Provides the \`MCPServer\` implementation, transport-specific server wrappers (Stdio, SSE), session management, and handler definitions.
*   **\`client/\`:** Contains the \`Client\` implementation and transport-specific client constructors (Stdio, SSE, InProcess, HTTP).
*   **\`client/transport/\`:** Defines the transport interface and implementations used by the client.
*   **\`mcptest/\`:** Utilities for creating test MCP servers.
*   **\`examples/\`:** Contains various usage examples demonstrating different features.

## Examples

Detailed examples can be found in the \`examples/\` directory, showcasing features like:

*   Custom context propagation (\`custom_context\`)
*   Dynamic server paths (\`dynamic_path\`)
*   Comprehensive feature usage (\`everything\`)
*   Connecting to an external filesystem server (\`filesystem_stdio_client\`)

## Contributing

Contributions are welcome! Please refer to the [CONTRIBUTING guide](CONTRIBUTING.md) (if available) or follow standard GitHub practices:

1.  Fork the repository.
2.  Create a feature branch.
3.  Make your changes and add tests.
4.  Run tests: \`go test -v './...'\`
5.  Commit your changes.
6.  Push to your fork.
7.  Open a Pull Request.

Feel free to open an issue or start a discussion for any questions or suggestions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.`
} 