import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Blog } from "./schemas/blog.schema";
import { Model } from "mongoose";
import { CreateBlogDto } from "./dto/create-blog.dto";
@Injectable()
export class BlogRepository {
    constructor(
        @InjectModel(Blog.name) private readonly blogModel: Model<Blog>
    ) {}

    async create(createBlogDto: CreateBlogDto): Promise<Blog> {
        const blog = new this.blogModel(createBlogDto);
        return blog.save();
    }

    async findAll(category?: string): Promise<Blog[]> {
        return this.blogModel.find(
            category ? { category } : {}
        ).sort({ createdAt: -1 }
        ).exec();
    }

    async findById(id: string): Promise<Blog | null> {
        return this.blogModel.findById(id).exec();
    }

    async update(id: string, updateBlogDto: Partial<CreateBlogDto>): Promise<Blog | null> {
        return this.blogModel.findByIdAndUpdate(
            id, updateBlogDto, { new: true }
        ).exec();
        
    }

    async delete(id: string): Promise<Blog | null> {
        return this.blogModel.findByIdAndDelete(id).exec();
    }

}