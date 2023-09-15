import Blog from "../model/Blog.js";
import mongoose from "mongoose";

const create_blog = async (request, response) => {
    const { title, content, author, category, cover } = request.body;

    try {
        if (!title || !content || !author || !category || !cover) {
            return response.status(400).json({ message: 'All fields are required' });
        };

        // Split the comma-separated category string into an array
        const categories = category.split(',').map((cat) => cat.trim());

        const article = new Blog({ title, content, author, categories, cover });
        await article.save();
        response.status(201).json(article);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};

const update_blog = async (request, response) => {
    const id = request.params.id;
    const { title, content, author, category, cover } = request.body;

    // Validate that the provided ID is a valid MongoDB ObjectID
    if (!mongoose.isValidObjectId(id)) {
        return response.status(400).json({ message: 'Invalid ID' });
    }

    try {
        if (!title || !content || !author || !category || !cover) {
            return response.status(400).json({ message: 'All fields are required' });
        };

        // Split the comma-separated category string into an array
        const categories = category.split(',').map((cat) => cat.trim());

        const article = await Blog.findByIdAndUpdate(
            id,
            { title, content, author, categories, cover, updatedAt: Date.now() },
            { new: true }
        );

        if (!article) {
            return response.status(404).json({ message: 'Article not found' });
        }

        response.status(200).json(article);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};


const delete_blog = async (request, response) => {
    const id = request.params.id;

    // Validate that the provided ID is a valid MongoDB ObjectID
    if (!mongoose.isValidObjectId(id)) {
        return response.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const deletedArticle = await Blog.findByIdAndDelete(id);

        if (!deletedArticle) {
            return response.status(404).json({ message: 'Article not found' });
        }

        response.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};

const get_blogs = async (_, response) => {
    try {
        const articles = await Blog.find().sort({ createdAt: -1 });
        response.status(200).json(articles);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};

const get_blog = async (request, response) => {
    const id = request.params.id;

    // Validate that the provided ID is a valid MongoDB ObjectID
    if (!mongoose.isValidObjectId(id)) {
        return response.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const article = await Blog.findById(id);

        if (!article) {
            return response.status(404).json({ message: 'Article not found' });
        }

        response.status(200).json(article);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};


export {
    create_blog,
    update_blog,
    delete_blog,
    get_blog,
    get_blogs
}