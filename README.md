# SeaArt Easy Prompt Selector

🧠 **SeaArt Easy Prompt Selector** is a Chrome Extension that brings the functionality of "Easy Prompt Selector" from Stable Diffusion into the SeaArt web interface.

## 🔍 Overview

This extension injects a floating prompt panel into the SeaArt UI, allowing users to easily browse and insert pre-defined prompts written in YAML format. It helps speed up prompt crafting and ensures consistent, creative input.

## ✨ Features

- Load and manage prompt templates via YAML files
- Toggle button to show/hide the prompt selector panel
- Three-layer hierarchical UI: category → subcategory → individual prompt
- Support for inserting into positive or negative prompt fields
- Resizable and draggable UI panel
- "Sync" button to refresh stored prompt data from local storage

## 📦 Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in your Chrome browser
3. Enable **Developer Mode**
4. Click **"Load unpacked"** and select the project folder

## 🚀 How to Use

1. After loading the extension, a 🧠 button will appear on the SeaArt interface.
2. Click the 🧠 button to open the prompt panel.
3. Visit the extension's **Options Page** (`options.html`) to upload YAML prompt files.
4. Select a YAML file from the dropdown, browse the categories, and click any prompt to insert it directly into the prompt field.
5. Enable the **"Add to Negative"** checkbox to insert into the *Negative Prompts* field instead.

## 🧾 YAML File Structure

The YAML files must follow a three-tiered format, like this:

```yaml
Nature Prompts:
  Seasons:
    Spring: "spring landscape, flowers, vibrant colors"
    Summer: "sunny beach, clear sky"
  Times of Day:
    Morning: "sunrise, soft light"
  Direct Prompt: "breathtaking nature, cinematic"
