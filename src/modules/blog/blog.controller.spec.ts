import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { CreateBlogDto, BlogCategory, SectionType } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard, AdminGuard } from '../../common/guards';

describe('BlogController', () => {
  let controller: BlogController;
  let service: BlogService;

  const mockBlogService = {
    getAllBlogs: jest.fn(),
    getBlogById: jest.fn(),
    createBlog: jest.fn(),
    updateBlog: jest.fn(),
    deleteBlog: jest.fn(),
  };

  const mockBlog = {
    id: '507f1f77bcf86cd799439011',
    title: 'Test Blog',
    author: 'Test Author',
    lectureTime: 5,
    category: BlogCategory.Bricolage,
    coverImageUrl: 'https://example.com/image.jpg',
    sections: [
      {
        type: SectionType.Title,
        content: 'Main Title'
      },
      {
        type: SectionType.Paragraph,
        content: 'This is a test blog content.'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createBlogDto: CreateBlogDto = {
    title: 'Test Blog',
    author: 'Test Author',
    lectureTime: 5,
    category: BlogCategory.Bricolage,
    coverImageUrl: 'https://example.com/image.jpg',
    sections: [
      {
        type: SectionType.Title,
        content: 'Main Title'
      }
    ],
  };

  const updateBlogDto: UpdateBlogDto = {
    title: 'Updated Blog Title',
    lectureTime: 8,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: mockBlogService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(AdminGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<BlogController>(BlogController);
    service = module.get<BlogService>(BlogService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBlogs', () => {
    it('should return all blogs when no category is provided', async () => {
      const mockBlogs = [mockBlog, { ...mockBlog, id: '507f1f77bcf86cd799439012' }];
      mockBlogService.getAllBlogs.mockResolvedValue(mockBlogs);

      const result = await controller.getAllBlogs(undefined);

      expect(service.getAllBlogs).toHaveBeenCalledWith(undefined);
      expect(service.getAllBlogs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlogs);
    });

    it('should return filtered blogs when category is provided', async () => {
      const category = 'Bricolage';
      const filteredBlogs = [mockBlog];
      mockBlogService.getAllBlogs.mockResolvedValue(filteredBlogs);

      const result = await controller.getAllBlogs(category);

      expect(service.getAllBlogs).toHaveBeenCalledWith(category);
      expect(service.getAllBlogs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(filteredBlogs);
    });

    it('should handle empty results', async () => {
      mockBlogService.getAllBlogs.mockResolvedValue([]);

      const result = await controller.getAllBlogs('NonExistentCategory');

      expect(service.getAllBlogs).toHaveBeenCalledWith('NonExistentCategory');
      expect(result).toEqual([]);
    });
  });

  describe('getBlogById', () => {
    const blogId = '507f1f77bcf86cd799439011';

    it('should return a blog when found', async () => {
      mockBlogService.getBlogById.mockResolvedValue(mockBlog);

      const result = await controller.getBlogById(blogId);

      expect(service.getBlogById).toHaveBeenCalledWith(blogId);
      expect(service.getBlogById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should handle service errors', async () => {
      const error = new Error('Blog not found');
      mockBlogService.getBlogById.mockRejectedValue(error);

      await expect(controller.getBlogById(blogId)).rejects.toThrow(error);
      expect(service.getBlogById).toHaveBeenCalledWith(blogId);
    });
  });

  describe('createBlog', () => {
    it('should create a blog successfully', async () => {
      mockBlogService.createBlog.mockResolvedValue(mockBlog);

      const result = await controller.createBlog(createBlogDto);

      expect(service.createBlog).toHaveBeenCalledWith(createBlogDto);
      expect(service.createBlog).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      mockBlogService.createBlog.mockRejectedValue(validationError);

      await expect(controller.createBlog(createBlogDto)).rejects.toThrow(validationError);
      expect(service.createBlog).toHaveBeenCalledWith(createBlogDto);
    });

    it('should create a blog with minimal required fields', async () => {
      const minimalBlogDto = {
        title: 'Minimal Blog',
        author: 'Author',
        lectureTime: 3,
        category: BlogCategory.Jardinage,
        coverImageUrl: 'https://example.com/cover.jpg',
        sections: [
          {
            type: SectionType.Paragraph,
            content: 'Minimal content'
          }
        ],
      };

      const createdBlog = { ...mockBlog, ...minimalBlogDto };
      mockBlogService.createBlog.mockResolvedValue(createdBlog);

      const result = await controller.createBlog(minimalBlogDto);

      expect(service.createBlog).toHaveBeenCalledWith(minimalBlogDto);
      expect(result).toEqual(createdBlog);
    });
  });

  describe('updateBlog', () => {
    const blogId = '507f1f77bcf86cd799439011';

    it('should update a blog successfully', async () => {
      const updatedBlog = { ...mockBlog, ...updateBlogDto };
      mockBlogService.updateBlog.mockResolvedValue(updatedBlog);

      const result = await controller.updateBlog(blogId, updateBlogDto);

      expect(service.updateBlog).toHaveBeenCalledWith(blogId, updateBlogDto);
      expect(service.updateBlog).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedBlog);
    });

    it('should handle update errors', async () => {
      const updateError = new Error('Update failed');
      mockBlogService.updateBlog.mockRejectedValue(updateError);

      await expect(controller.updateBlog(blogId, updateBlogDto)).rejects.toThrow(updateError);
      expect(service.updateBlog).toHaveBeenCalledWith(blogId, updateBlogDto);
    });

    it('should update blog with partial data', async () => {
      const partialUpdate = { title: 'New Title Only' };
      const updatedBlog = { ...mockBlog, title: 'New Title Only' };
      mockBlogService.updateBlog.mockResolvedValue(updatedBlog);

      const result = await controller.updateBlog(blogId, partialUpdate);

      expect(service.updateBlog).toHaveBeenCalledWith(blogId, partialUpdate);
      expect(result).toEqual(updatedBlog);
    });

    it('should update blog sections', async () => {
      const sectionsUpdate = {
        sections: [
          {
            type: SectionType.Title,
            content: 'Updated Title'
          },
          {
            type: SectionType.Image,
            content: 'https://example.com/new-image.jpg'
          }
        ]
      };
      const updatedBlog = { ...mockBlog, sections: sectionsUpdate.sections };
      mockBlogService.updateBlog.mockResolvedValue(updatedBlog);

      const result = await controller.updateBlog(blogId, sectionsUpdate);

      expect(service.updateBlog).toHaveBeenCalledWith(blogId, sectionsUpdate);
      expect(result).toEqual(updatedBlog);
    });
  });

  describe('deleteBlog', () => {
    const blogId = '507f1f77bcf86cd799439011';

    it('should delete a blog successfully', async () => {
      mockBlogService.deleteBlog.mockResolvedValue(mockBlog);

      const result = await controller.deleteBlog(blogId);

      expect(service.deleteBlog).toHaveBeenCalledWith(blogId);
      expect(service.deleteBlog).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should handle deletion errors', async () => {
      const deleteError = new Error('Delete failed');
      mockBlogService.deleteBlog.mockRejectedValue(deleteError);

      await expect(controller.deleteBlog(blogId)).rejects.toThrow(deleteError);
      expect(service.deleteBlog).toHaveBeenCalledWith(blogId);
    });

    it('should handle non-existent blog deletion', async () => {
      const notFoundError = new Error('Blog not found');
      mockBlogService.deleteBlog.mockRejectedValue(notFoundError);

      await expect(controller.deleteBlog('nonexistent-id')).rejects.toThrow(notFoundError);
      expect(service.deleteBlog).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have service injected', () => {
      expect(service).toBeDefined();
    });
  });

  describe('guards integration', () => {
    it('should use guards for protected endpoints', () => {
      const createMethod = Reflect.getMetadata('__guards__', controller.constructor.prototype.createBlog);
      const updateMethod = Reflect.getMetadata('__guards__', controller.constructor.prototype.updateBlog);
      const deleteMethod = Reflect.getMetadata('__guards__', controller.constructor.prototype.deleteBlog);

      // Note: These tests verify that guards are applied, but actual guard testing should be done separately
      expect(createMethod).toBeDefined();
      expect(updateMethod).toBeDefined();
      expect(deleteMethod).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate service errors for getAllBlogs', async () => {
      const error = new Error('Service error');
      mockBlogService.getAllBlogs.mockRejectedValue(error);

      await expect(controller.getAllBlogs(undefined)).rejects.toThrow(error);
    });

    it('should propagate service errors for getBlogById', async () => {
      const error = new Error('Service error');
      mockBlogService.getBlogById.mockRejectedValue(error);

      await expect(controller.getBlogById('some-id')).rejects.toThrow(error);
    });

    it('should propagate service errors for createBlog', async () => {
      const error = new Error('Service error');
      mockBlogService.createBlog.mockRejectedValue(error);

      await expect(controller.createBlog(createBlogDto)).rejects.toThrow(error);
    });

    it('should propagate service errors for updateBlog', async () => {
      const error = new Error('Service error');
      mockBlogService.updateBlog.mockRejectedValue(error);

      await expect(controller.updateBlog('some-id', updateBlogDto)).rejects.toThrow(error);
    });

    it('should propagate service errors for deleteBlog', async () => {
      const error = new Error('Service error');
      mockBlogService.deleteBlog.mockRejectedValue(error);

      await expect(controller.deleteBlog('some-id')).rejects.toThrow(error);
    });
  });
});
