/**
 * app.js - Main application file for Markdown Blog
 * 
 * This application reads Markdown files from a 'posts' directory,
 * parses them and serves them as a blog with pagination.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const matter = require('gray-matter');
const marked = require('marked');
const { format } = require('date-fns');
const expressLayouts = require('express-ejs-layouts');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Express-EJS-Layouts ayarları
app.use(expressLayouts);
app.set('layout', 'layout');

/**
 * Represents a blog post with metadata and content
 * @typedef {Object} Post
 * @property {string} id - Unique identifier (filename without extension)
 * @property {string} title - Post title
 * @property {Date} date - Publication date
 * @property {string[]} tags - Array of tags
 * @property {string} excerpt - Short excerpt from the post
 * @property {string} content - HTML content of the post
 * @property {string} rawContent - Raw markdown content
 */

/**
 * Reads and parses all markdown files from the posts directory
 * @returns {Promise<Post[]>} Array of parsed blog posts
 */
async function getPosts() {
    try {
        // Read all files from the posts directory
        const postsDirectory = path.join(__dirname, 'posts');
        const files = await fs.readdir(postsDirectory);

        // Filter out only markdown files
        const markdownFiles = files.filter(file => path.extname(file) === '.md');

        // Read and parse each file
        const posts = await Promise.all(markdownFiles.map(async (filename) => {
            const filePath = path.join(postsDirectory, filename);
            const fileContent = await fs.readFile(filePath, 'utf-8');

            // Parse front matter and content
            const { data, content } = matter(fileContent);

            // Validate required metadata
            if (!data.title || !data.date) {
                console.warn(`Warning: Post ${filename} is missing required metadata (title or date)`);
            }

            // Convert markdown to HTML
            const htmlContent = marked.parse(content);

            // Create excerpt (first 150 characters)
            const plainTextContent = content.replace(/[#*_`]/g, '');
            const excerpt = plainTextContent.substring(0, 150) + '...';

            return {
                id: path.basename(filename, '.md'),
                title: data.title || 'Untitled Post',
                date: new Date(data.date || Date.now()),
                tags: data.tags || [],
                excerpt,
                content: htmlContent,
                rawContent: content
            };
        }));

        // Sort posts by date (newest first)
        return posts.sort((a, b) => b.date - a.date);
    } catch (error) {
        console.error('Error reading posts:', error);
        return [];
    }
}

/**
 * Get a single post by ID
 * @param {string} id - Post ID (filename without extension)
 * @returns {Promise<Post|null>} The post or null if not found
 */
async function getPostById(id) {
    try {
        // Sanitize id to prevent directory traversal attacks
        const sanitizedId = path.basename(id);
        const filePath = path.join(__dirname, 'posts', `${sanitizedId}.md`);

        // Check if file exists
        await fs.access(filePath);

        // Read and parse file
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        const htmlContent = marked.parse(content);

        // Create excerpt
        const plainTextContent = content.replace(/[#*_`]/g, '');
        const excerpt = plainTextContent.substring(0, 150) + '...';

        return {
            id: sanitizedId,
            title: data.title || 'Untitled Post',
            date: new Date(data.date || Date.now()),
            tags: data.tags || [],
            excerpt,
            content: htmlContent,
            rawContent: content
        };
    } catch (error) {
        console.error(`Error reading post with ID ${id}:`, error);
        return null;
    }
}

/**
 * Format date for display
 * @param {Date} date - The date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return format(date, 'MMMM d, yyyy');
}

// Home page route with pagination
app.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const postsPerPage = 5;

        const allPosts = await getPosts();
        const totalPages = Math.ceil(allPosts.length / postsPerPage);

        // Calculate pagination indices
        const startIndex = (page - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const paginatedPosts = allPosts.slice(startIndex, endIndex);

        res.render('index', {
            posts: paginatedPosts,
            currentPage: page,
            totalPages,
            formatDate
        });
    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).render('error', {
            message: 'Error loading blog posts',
            error
        });
    }
});

// Single post route
app.get('/post/:id', async (req, res) => {
    try {
        const post = await getPostById(req.params.id);

        if (!post) {
            return res.status(404).render('error', {
                message: 'Post not found'
            });
        }

        res.render('post', {
            post,
            formatDate
        });
    } catch (error) {
        console.error('Error rendering post page:', error);
        res.status(500).render('error', {
            message: 'Error loading post',
            error
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});