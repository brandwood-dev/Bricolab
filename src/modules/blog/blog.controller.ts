import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AdminGuard, JwtAuthGuard } from '../../common/guards';

@Controller('blog')
export class BlogController {

    constructor(
        private readonly blogService: BlogService
    ){}

    @Get('')
    getAllBlogs(
        @Query('category') category?: string
    ) {
        return this.blogService.getAllBlogs(category);
    }
    @Get(':id')
    getBlogById(
        @Param('id') id: string
    ){
        return this.blogService.getBlogById(id);
    }

    @Post('')
    @UseGuards(JwtAuthGuard, AdminGuard)
    createBlog(
        @Body() createBlogDto: any
    ) {
        return this.blogService.createBlog(createBlogDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard,AdminGuard)
    updateBlog(
        @Param('id') id: string,
        @Body() updateBlogDto: any
    ) {
        return this.blogService.updateBlog(id, updateBlogDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    deleteBlog(
        @Param('id') id: string
    ) {
        return this.blogService.deleteBlog(id);

    }

    



}
