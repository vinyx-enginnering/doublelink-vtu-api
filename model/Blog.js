import timestamp from 'mongoose-timestamp';
import mongoose from 'mongoose';


const BlogSchema = new mongoose.Schema({
    cover: String,
    title: String,
    content: String,
    categories: [String],
    logs: []
});

BlogSchema.plugin(timestamp);


const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;