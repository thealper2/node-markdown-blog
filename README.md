# Markdown Blog

A simple blog application built with Node.js that renders Markdown files as blog posts with pagination and responsive design.

## :dart: Features

- Renders Markdown files from a `/posts` directory
- Blog post listing with pagination
- Individual post pages with formatted content
- Front Matter support for post metadata (title, date, tags)
- Responsive design for mobile and desktop
- Error handling and input sanitization

## :clipboard: Technology Stack

- Node.js
- Express.js
- EJS (Embedded JavaScript templates)
- gray-matter (for parsing Front Matter)
- marked (for Markdown to HTML conversion)
- date-fns (for date formatting)

## :hammer_and_wrench: Installation

1. Clone the repository
   ```bash
   git clone https://github.com/thealper2/node-markdown-blog.git
   cd markdown-blog
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `posts` directory and add some Markdown files
   ```bash
   mkdir posts
   ```

4. Start the application
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` in your browser

## :computer: Project Structure

```
markdown-blog/
├── app.js              // Main application file
├── package.json        // Dependencies and scripts
├── public/
│   └── css/
│       └── style.css   // CSS styles
├── views/
│   ├── index.ejs       // Home page template
│   ├── post.ejs        // Single post template
│   ├── error.ejs       // Error page
│   ├── layout.ejs      // Main layout
│   └── partials/
│       ├── header.ejs  // Header partial
│       └── footer.ejs  // Footer partial
└── posts/
    └── example-post.md // Example markdown post
```

## :books: Creating Blog Posts

Create markdown files in the `posts` directory with the following format:

```markdown
---
title: "Your Post Title"
date: "2025-03-23"
tags: ["tag1", "tag2"]
---

# Your Post Title

Content of your post goes here...
```

## :wrench: Configuration

You can modify the following settings in `app.js`:

- `PORT`: The port the application runs on (default: 3000)
- `postsPerPage`: Number of posts to display per page (default: 5)

## :computer: Development

For development with auto-restart:

```bash
npm run dev
```

For production:

```bash
npm start
```

## :handshake: Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## :scroll: License

MIT