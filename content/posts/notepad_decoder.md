---
title: "Decoding Windows Notepad Binary Files: A Step-by-Step Guide"
date: 2025-07-07
description: Learn how to decode and recover unsaved Notepad files from Windows TabState .bin files. This guide covers forensic analysis, command-line tools, and a Python script to extract UTF-16LE encoded content from dual-boot setups or disk images.
image: images/notepad-decoder/step1.png
imageAltAttribute: Screenshot of the Notepad decoding process.
tags:
- notepad
- forensics
- python
- windows
- tutorial
---

This guide demonstrates how to decode and recover unsaved Notepad files from Windows Notepad's TabState directory, containing .bin binaries. The goal is to extract unsaved Notepad content stored in these binary files.

# Background

Recently, while on Ubuntu in a dual-boot setup, I needed some content from my Windows machine in Notepad. I couldn't just reboot into Windows to get it, as that wasn't efficient.

This is useful when you're on dual boot and don't want to reboot into Windows just to get unsaved Notepad files. It's also helpful in CTFs or forensics when you have a disk image of a Windows machine and want to extract unsaved Notepad files from it. You can even run the script on Windows for experimenting and learning.

I remembered a YouTube video from John Hammond where he discovered that unsaved Notepad files are saved somewhere on the disk. So, I decided to do that now and created a tool to extract those unsaved Notepad files directly from Linux without booting into Windows.

The complete Python script is available on my GitHub (linked at the end). But before providing a ready-made solution, I'd like to take the forensics approach to understand the analysis and extraction process first.

## Prerequisites

The command-line tools used in this guide are `strings` and `hexdump`, which are available on Linux. On Windows, you can download the Sysinternals suite from Microsoft, which includes the strings tool. Instead of hexdump, you can use an online hexdump tool like https://hexed.it/.

The location where Windows Notepad saves unsaved files is:
```zsh
C:/Users/<username>/AppData/Local/Packages/Microsoft.WindowsNotepad_8wekyb3d8bbwe/LocalState/TabState/
```

This directory contains multiple .bin files that can't be opened directly.
> If on Linux, using the file explorer, navigate to the mounted Windows partition to find the path above. You can run this command as well to find the mounted drives: `ls -la /media/<USER>/`

Let's start the decoding process.


## Step 1: Using `hexdump` for Initial Analysis

Before extracting text, we can use `hexdump` to get a visual representation of the binary file's contents. This helps us understand the file structure and locate potential text segments.
> If on Windows, use the online hexdump tool like https://hexed.it/ to upload and analyze the .bin files.

```zsh
hexdump -C /path/to/TabState/*.bin | head -20
```
- `-C`: Displays the output in a canonical hex+ASCII format for readability.
- `head -20`: Limits the output to the first 20 lines for a quick overview.

When we run it on any .bin file, the output looks something like this:

![Hexdump output showing Notepad .bin file structure and readable text](/images/notepad-decoder/step1.png)

*Hexdump output showing Notepad .bin file structure and readable text.*

In the screenshot above, we can see that the file starts with "NP" header (4e 50 in hex), indicating it's a Notepad file. The plain text content is visible, confirming readable text is present. The rest shows a mix of hex values and ASCII characters, with many null bytes (00) indicating UTF-16LE encoding.

From this, we know the file contains `UTF-16LE` encoded text, which is crucial for the next steps.

## Step 2: Understanding the `strings` Command

The `strings` command scans a file for sequences of printable characters and outputs them as text. It doesn’t try to interpret the file format or structure; it simply extracts human-readable fragments. While it can be run on any file, it’s especially useful on binaries where text is buried among raw data.

- **Usage example**:  
  - Without encoding flag: `strings /path/to/TabState/*.bin | head -20`  
    (shows empty output since the file is UTF-16LE)  
  - With encoding flag: `strings -el /path/to/TabState/*.bin | head -20`  
    (correctly extracts readable UTF-16LE text)  

- **How it works**:  
  `strings` scans the file byte by byte and prints runs of printable characters.  
  By default it assumes ASCII/UTF-8, but with `-e` you can specify encodings like UTF-16LE.

![Showing empty output from Notepad .bin file using `strings`](/images/notepad-decoder/step2.png)
*Empty output using `strings` on Linux.*

The output was empty with no data. This is because `strings` by default assumes the file is plain ASCII/UTF-8, so without specifying UTF-16, it only sees the null bytes and a few isolated ASCII characters.

This is where the `-e` flag comes into play. For our .bin files, which contain UTF-16LE text, we use `strings -el` (little-endian 16-bit encoding) to extract these strings.

![Showing readable output from Notepad .bin file using `strings -el`](/images/notepad-decoder/step2.2.png)
*Extracted Notepad text using `strings -el` on Linux.*

As seen in the screenshot above, it successfully pulls out readable text fragments.


## Step 3: Advanced Decoding with Python Script

For automation and programmatic decoding, I created a Python script that reads the .bin files, decodes the UTF-16LE content, and extracts the content into markdown files in the directory where the script is run.

The script is available on my GitHub: [Notepad Decoder](https://github.com/anonfaded/NotepadDecoder). Here's a brief overview of how it works:

**Usage:** `python3 notepad_decoder.py /path/to/TabState/file.bin` for single file processing or  
          `python3 notepad_decoder.py /path/to/TabState/` for batch processing of all .bin files in the directory.

**Example output:**  
When run on a single .bin file, this is the output:

```zsh
Extracted Content:
----------------------------------------
zoom feature by https://github.com/anonfaded/FadCam/pull/166/
added immediate delete option
added slash screen
fixed issue with the wide lens and 60fps not working
added app cloaking in recent apps
- Clock Widget: If you click it when FadCam isn't open it takes you to the widget page...
- video stats not updating on first record video, need to manually refresh...
```
