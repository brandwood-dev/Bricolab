import { Injectable } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { BlogExceptions } from './exceptions/blog.exceptions';

@Injectable()
export class BlogService {
    constructor(
        private readonly blogRepository: BlogRepository
    ) {}

    async createBlog(createBlogDto: any) {
        try {
            const blog = await this.blogRepository.create(createBlogDto);
            return blog;
        } catch (error) {
            BlogExceptions.handleGenericError(error, 'Failed to create blog');
        } 
    }

    async getAllBlogs(category?: string) {
        try {
            return await this.blogRepository.findAll(category);
        } catch (error) {
            BlogExceptions.handleGenericError(error, 'Failed to retrieve blogs');
        }
    }

    async getBlogById(id: string) {
        try {
            const blog = await this.blogRepository.findById(id);
            if (!blog) {
                BlogExceptions.handleNotFound('Blog', id);
            }
            return blog;
        } catch (error) {
            BlogExceptions.handleGenericError(error, `Failed to retrieve blog with ID ${id}`);
        }
    }

    async updateBlog(id: string, updateBlogDto: any) {
        try {
            const blog = await this.blogRepository.update(id, updateBlogDto);
            if (!blog) {
                BlogExceptions.handleNotFound('Blog', id);
            }
            return blog;
        } catch (error) {
            BlogExceptions.handleGenericError(error, `Failed to update blog with ID ${id}`);
        }   
    }

    async deleteBlog(id: string) {
        try {
            const result = await this.blogRepository.delete(id);
            if (!result) {
                BlogExceptions.handleNotFound('Blog', id);
            }
            return result;
        } catch (error) {
            BlogExceptions.handleGenericError(error, `Failed to delete blog with ID ${id}`);
        }
    }

}
