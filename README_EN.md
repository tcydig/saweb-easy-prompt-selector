# Easy Prompt Selector for Seaart (Google Chrome Extension)

## ① Overview

This is a Google Chrome extension developed as a Seaart-compatible version of the widely-used [Easy Prompt Selector](https://github.com/blue-pen5805/sdweb-easy-prompt-selector) for Stable Diffusion.

While Stable Diffusion offers many useful plugins that simplify prompt selection, Seaart does not provide an equivalent solution.  
To address this gap, this extension was developed as a personal project.

The YAML structure and UI design are largely based on the original Easy Prompt Selector. However, some features (e.g., wildcard support) are not implemented.

Feedback from users is very welcome.  
Please note that since this is an individually developed project, there may be cases where the extension does not function as expected, and bug fixes may take time.

---

## ② Features

The main features of this extension include:

- Automatically displays prompts by parsing a YAML file in a hierarchical structure
- Prompts can be inserted into the input field with a single click
- Customizable through the Options page by uploading your own YAML file

![Image](https://github.com/user-attachments/assets/55cc8e68-b757-4a0f-83d1-9a092523e1a6)

---

## ③ How to Install

1. Install the extension from the Chrome Web Store (link will be added once published)
2. Visit [Seaart](https://seaart.ai/)
3. Navigate to the "Generate" page
4. Click the 🧠 icon on the top right corner  
   ![button](/media/button.png)

---

## ④ How to Use

- Upload a YAML file from the Options page to automatically generate a category-based UI.
- Click a prompt button to insert the text directly into the input field.

![Image](https://github.com/user-attachments/assets/c01a9152-55fa-4db9-906a-f36a19a9b0e4)

---

## ⑤ Customization

You can customize prompts by uploading your own YAML file from the Options page.  
![Image](/media/option-button.png)  
![Image](/media/option.png)  
_The Options screen may look extremely minimal, but it’s real and functional._

Uploaded YAML files will be listed on screen.  
To delete a file, simply click the “Delete” button.

The supported YAML structure can take various forms, such as:

```yaml
Morning: "soft morning light, sunrise, misty"
```

![Image](/media/sy_1.png)

```yaml
Scenery Prompts:
  Morning: "soft morning light, sunrise, misty"
```

![Image](/media/sy_2.png)

```yaml
Scenery Prompts:
  Time of Day:
    Morning: "soft morning light, sunrise, misty"
```

![Image](/media/sy_3.png)

```yaml
- 1girl
```

![Image](/media/sy_4.png)

> [!WARNING]
> This syntax is shorthand when the button name and prompt are identical.
> You cannot mix this syntax with `XXX: CCC` format within the same hierarchy.

Example YAMLs can be found in the `test` folder.  
Feel free to refer to them when creating your own.

### synchronous

Uploading Yaml is not enough to synchronise with Seaart. \
After uploading, press the Sync button to synchronise. \
You can also synchronise by reloading the Seaart webpage

![Image](/media/sy_5.png)

---

## ⑥ Notes

- This extension supports **only the Legacy UI model** of Seaart. It will not work with the New UI.
- Prompt data is saved in your browser’s local storage. When using a different browser or device, you’ll need to re-upload your YAML file.
- After updating a YAML file, press the "Sync" button on the Seaart screen to apply the changes.

---

## ⑦ Final Message

We hope this extension enhances your image generation experience — smoother, simpler, and more enjoyable.  
Thank you for using it!
