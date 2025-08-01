import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { BlogExceptions } from './exceptions/blog.exceptions';

describe('BlogService', () => {
  let service: BlogService;
  let repository: BlogRepository;

  const mockBlogRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockBlog = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Blog',
    content: [
      {
        type: 'title',
        data: { text: 'Main Title' }
      },
      {
        type: 'paragraph',
        data: { text: 'This is a test blog content.' }
      }
    ],
    category: 'Bricolage',
    tags: ['test', 'blog'],
    author: 'Test Author',
    readTime: 5,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createBlogDto = {
    title: 'Test Blog',
    content: [
      {
        type: 'title',
        data: { text: 'Main Title' }
      }
    ],
    category: 'Bricolage',
    tags: ['test', 'blog'],
    author: 'Test Author',
    readTime: 5,
    isPublished: true,
  };

  const updateBlogDto = {
    title: 'Updated Blog Title',
    isPublished: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: BlogRepository,
          useValue: mockBlogRepository,
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    repository = module.get<BlogRepository>(BlogRepository);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createBlog', () => {
    it('should create a blog successfully', async () => {
      mockBlogRepository.create.mockResolvedValue(mockBlog);

      const result = await service.createBlog(createBlogDto);

      expect(repository.create).toHaveBeenCalledWith(createBlogDto);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          title: { message: 'Title is required' },
          content: { message: 'Content is required' }
        }
      };

      mockBlogRepository.create.mockRejectedValue(validationError);
      
      // Mock BlogExceptions.handleGenericError to throw BadRequestException
      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: ['Title is required', 'Content is required']
        });
      });

      await expect(service.createBlog(createBlogDto)).rejects.toThrow(BadRequestException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(validationError, 'Failed to create blog');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Database connection failed');
      mockBlogRepository.create.mockRejectedValue(genericError);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new InternalServerErrorException('Failed to create blog');
      });

      await expect(service.createBlog(createBlogDto)).rejects.toThrow(InternalServerErrorException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(genericError, 'Failed to create blog');
    });
  });

  describe('getAllBlogs', () => {
    it('should return all blogs when no category is provided', async () => {
      const mockBlogs = [mockBlog, { ...mockBlog, _id: '507f1f77bcf86cd799439012' }];
      mockBlogRepository.findAll.mockResolvedValue(mockBlogs);

      const result = await service.getAllBlogs();

      expect(repository.findAll).toHaveBeenCalledWith(undefined);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlogs);
    });

    it('should return filtered blogs when category is provided', async () => {
      const category = 'Bricolage';
      const filteredBlogs = [mockBlog];
      mockBlogRepository.findAll.mockResolvedValue(filteredBlogs);

      const result = await service.getAllBlogs(category);

      expect(repository.findAll).toHaveBeenCalledWith(category);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(filteredBlogs);
    });

    it('should handle errors when retrieving blogs', async () => {
      const error = new Error('Database error');
      mockBlogRepository.findAll.mockRejectedValue(error);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new InternalServerErrorException('Failed to retrieve blogs');
      });

      await expect(service.getAllBlogs()).rejects.toThrow(InternalServerErrorException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(error, 'Failed to retrieve blogs');
    });
  });

  describe('getBlogById', () => {
    const blogId = '507f1f77bcf86cd799439011';

    it('should return a blog when found', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlog);

      const result = await service.getBlogById(blogId);

      expect(repository.findById).toHaveBeenCalledWith(blogId);
      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should throw NotFoundException when blog not found', async () => {
      mockBlogRepository.findById.mockResolvedValue(null);

      // Clear any existing mocks before setting up new ones
      jest.restoreAllMocks();
      jest.spyOn(BlogExceptions, 'handleNotFound').mockImplementation(() => {
        throw new NotFoundException(`Blog with ID ${blogId} not found`);
      });

      await expect(service.getBlogById(blogId)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(blogId);
      expect(BlogExceptions.handleNotFound).toHaveBeenCalledWith('Blog', blogId);
    });

    it('should handle cast errors for invalid ID format', async () => {
      const invalidId = 'invalid-id';
      const castError = { name: 'CastError' };
      mockBlogRepository.findById.mockRejectedValue(castError);

      // Clear any existing mocks before setting up new ones
      jest.restoreAllMocks();
      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new BadRequestException('Invalid ID format');
      });

      await expect(service.getBlogById(invalidId)).rejects.toThrow(BadRequestException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(castError, `Failed to retrieve blog with ID ${invalidId}`);
    });

    it('should handle generic errors', async () => {
      const error = new Error('Database error');
      mockBlogRepository.findById.mockRejectedValue(error);

      // Clear any existing mocks before setting up new ones
      jest.restoreAllMocks();
      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new InternalServerErrorException(`Failed to retrieve blog with ID ${blogId}`);
      });

      await expect(service.getBlogById(blogId)).rejects.toThrow(InternalServerErrorException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(error, `Failed to retrieve blog with ID ${blogId}`);
    });
  });

  describe('updateBlog', () => {
    const blogId = '507f1f77bcf86cd799439011';
    const updatedBlog = { ...mockBlog, ...updateBlogDto };

    it('should update a blog successfully', async () => {
      mockBlogRepository.update.mockResolvedValue(updatedBlog);

      const result = await service.updateBlog(blogId, updateBlogDto);

      expect(repository.update).toHaveBeenCalledWith(blogId, updateBlogDto);
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedBlog);
    });

    it('should throw NotFoundException when blog to update is not found', async () => {
      mockBlogRepository.update.mockResolvedValue(null);

      // Clear any existing mocks before setting up new ones
      jest.restoreAllMocks();
      jest.spyOn(BlogExceptions, 'handleNotFound').mockImplementation(() => {
        throw new NotFoundException(`Blog with ID ${blogId} not found`);
      });

      await expect(service.updateBlog(blogId, updateBlogDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).toHaveBeenCalledWith(blogId, updateBlogDto);
      expect(BlogExceptions.handleNotFound).toHaveBeenCalledWith('Blog', blogId);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          title: { message: 'Title must be at least 3 characters long' }
        }
      };
      mockBlogRepository.update.mockRejectedValue(validationError);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: ['Title must be at least 3 characters long']
        });
      });

      await expect(service.updateBlog(blogId, updateBlogDto)).rejects.toThrow(BadRequestException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(validationError, `Failed to update blog with ID ${blogId}`);
    });

    it('should handle cast errors for invalid ID format', async () => {
      const invalidId = 'invalid-id';
      const castError = { name: 'CastError' };
      mockBlogRepository.update.mockRejectedValue(castError);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new BadRequestException('Invalid ID format');
      });

      await expect(service.updateBlog(invalidId, updateBlogDto)).rejects.toThrow(BadRequestException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(castError, `Failed to update blog with ID ${invalidId}`);
    });
  });

  describe('deleteBlog', () => {
    const blogId = '507f1f77bcf86cd799439011';

    it('should delete a blog successfully', async () => {
      mockBlogRepository.delete.mockResolvedValue(mockBlog);

      const result = await service.deleteBlog(blogId);

      expect(repository.delete).toHaveBeenCalledWith(blogId);
      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlog);
    });

    it('should throw NotFoundException when blog to delete is not found', async () => {
      mockBlogRepository.delete.mockResolvedValue(null);

      jest.spyOn(BlogExceptions, 'handleNotFound').mockImplementation(() => {
        throw new NotFoundException(`Blog with ID ${blogId} not found`);
      });

      await expect(service.deleteBlog(blogId)).rejects.toThrow(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith(blogId);
      expect(BlogExceptions.handleNotFound).toHaveBeenCalledWith('Blog', blogId);
    });

    it('should handle cast errors for invalid ID format', async () => {
      const invalidId = 'invalid-id';
      const castError = { name: 'CastError' };
      mockBlogRepository.delete.mockRejectedValue(castError);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new BadRequestException('Invalid ID format');
      });

      await expect(service.deleteBlog(invalidId)).rejects.toThrow(BadRequestException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(castError, `Failed to delete blog with ID ${invalidId}`);
    });

    it('should handle generic errors during deletion', async () => {
      const error = new Error('Database error');
      mockBlogRepository.delete.mockRejectedValue(error);

      jest.spyOn(BlogExceptions, 'handleGenericError').mockImplementation(() => {
        throw new InternalServerErrorException(`Failed to delete blog with ID ${blogId}`);
      });

      await expect(service.deleteBlog(blogId)).rejects.toThrow(InternalServerErrorException);
      expect(BlogExceptions.handleGenericError).toHaveBeenCalledWith(error, `Failed to delete blog with ID ${blogId}`);
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have repository injected', () => {
      expect(repository).toBeDefined();
    });
  });
});
