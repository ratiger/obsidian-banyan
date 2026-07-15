# 🌲 Welcome to Banyan

Banyan offers an intuitive card view to display your notes, uses tags for organization, and relies on tag-centric filtering schemes for effortless note retrieval.

## 🚀 Banyan User Guide

### 📌 Core Philosophy

Traditional File Tree: You have to specificed the location, such as `Psychology/Adler/Courage.md`.

Banyan: The location of notes no longer matters. The card panel displays notes in chronological order, allowing you to quickly locate your target note using Tags, Dates, and Keywords.
When creating a note, your focus shifts from "Where should I put this?" to "What does this belong to?" For example, by tagging it `#Psychology/Adler #Reading #Progress/Doing`, you might later access the note in many different ways.

### ⚡ Quick Start

1. Notes Directory
The plugin only manages files within the designated `Notes directory` (the default is `cards`). You can change this to any folder in your vault via the settings.

2. Create Your First Note
- New notes' title default to the current time, but you can change it freely.
- Tags added in the note editor will be as the note's property `tags`.
- The plugin use tags in the `tags` property (frontmatter) and the main content for filtering.

3. Filter by Tags
- Supports "OR, AND, NOT" logic combinations. For instance, you can filter for notes in `#Project/A` OR `#Project/B` that are `#Progress/Doing` and **NOT** `#Urgent`.
- You can also combine tag filters with Date Ranges and Keywords for filter.

4. Advanced Settings
- Custom Storage Path: By default, new notes are stored in a Year/Quarter/Month/Day folder hierarchy. While the location is irrelevant, you can fully customize the path in the settings.
- Config Directory: A `banyan_config` folder is automatically generated in the root of your `Notes Directory` to store the plugin's configuration files. It currently cannot be hidden, as doing so prevents the Markdown files inside from being read properly.

### 💡 Try It Out Now!
Create a new note, add the `#Progress/Todo` tag, create a filtering scheme containing `#Progress/Todo` in the card panel sidebar, and click on it to see it in action!

## 📮 Contact Me

Github issue: [obsidian-banyan - ratiger | Github](https://github.com/ratiger/obsidian-banyan)  
Email: 2084939306@qq.com  
RedNote: ratiger (rednote number: 1392996322)  

## ❤️ Support me

- 🇨🇳 [ratiger - Afadian](https://afdian.com/a/ratiger) 
- 🌍 [ratiger - Ko-fi](https://ko-fi.com/ratiger) 