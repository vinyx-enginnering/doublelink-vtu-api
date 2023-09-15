import express from "express";
import { create_blog, delete_blog, get_blog, get_blogs, update_blog } from "../controller/Blog.js";
const router = express.Router();


router.post("/create", create_blog);
router.put("/update/:id", update_blog);
router.delete("/delete/:id", delete_blog);
router.get("/list", get_blogs);
router.get("/list/:id", get_blog);

export default router;