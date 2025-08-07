import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { MongooseModule } from '@nestjs/mongoose';
import {Blog,BlogSchema} from './schemas/blog.schema'; 
import { UplaodModule } from '../uplaod/uplaod.module';

@Module({
  providers: [BlogService, BlogRepository],
  controllers: [BlogController],
  imports: [MongooseModule.forFeature([
    {
      name: Blog.name,
      schema: BlogSchema
    }
  ]), UplaodModule],
})
export class BlogModule {}
