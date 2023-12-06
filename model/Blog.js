import timestamp from 'mongoose-timestamp';
import mongoose from 'mongoose';


const BlogSchema = mongoose.Schema({
    cover: String,
    title: String,
    content: String,
    categories: [String],
    author: String,
    logs: []
});

BlogSchema.plugin(timestamp);


const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;