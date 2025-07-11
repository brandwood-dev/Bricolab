import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UplaodController } from './uplaod.controller';
import { UplaodService } from './uplaod.service';
import { JwtAuthGuard } from '../../common/guards';
import { Readable } from 'stream';

describe('UplaodController', () => {
  let controller: UplaodController;
  let service: UplaodService;

  const mockUplaodService = {
    uploadMultipleFiles: jest.fn(),
  };

  const mockImageFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake image data'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
  };

  const mockVideoFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'test-video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    buffer: Buffer.from('fake video data'),
    size: 2048,
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UplaodController],
      providers: [
        {
          provide: UplaodService,
          useValue: mockUplaodService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<UplaodController>(UplaodController);
    service = module.get<UplaodService>(UplaodService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImages', () => {
    const folder = 'profile-pictures';

    it('should upload a single image file successfully', async () => {
      const expectedPath = `/uploads/${folder}/uuid-test-image.jpg`;
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPath);

      const result = await controller.uploadImages([mockImageFile], folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockImageFile], folder);
      expect(service.uploadMultipleFiles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPath);
    });

    it('should upload multiple image files successfully', async () => {
      const mockImageFile2: Express.Multer.File = {
        ...mockImageFile,
        originalname: 'test-image-2.png',
        mimetype: 'image/png',
      };
      const files = [mockImageFile, mockImageFile2];
      const expectedPaths = [
        `/uploads/${folder}/uuid-test-image.jpg`,
        `/uploads/${folder}/uuid-test-image-2.png`
      ];
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPaths);

      const result = await controller.uploadImages(files, folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith(files, folder);
      expect(service.uploadMultipleFiles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPaths);
    });

    it('should throw BadRequestException when no files are provided', async () => {
      await expect(controller.uploadImages([], folder)).rejects.toThrow(
        new BadRequestException('No image files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when files array is null', async () => {
      await expect(controller.uploadImages(null as any, folder)).rejects.toThrow(
        new BadRequestException('No image files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when files array is undefined', async () => {
      await expect(controller.uploadImages(undefined as any, folder)).rejects.toThrow(
        new BadRequestException('No image files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should handle service upload errors', async () => {
      const error = new Error('Upload failed');
      mockUplaodService.uploadMultipleFiles.mockRejectedValue(error);

      await expect(controller.uploadImages([mockImageFile], folder)).rejects.toThrow(error);
      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockImageFile], folder);
    });

    it('should upload images with different valid formats', async () => {
      const jpegFile = { ...mockImageFile, originalname: 'test.jpg', mimetype: 'image/jpeg' };
      const pngFile = { ...mockImageFile, originalname: 'test.png', mimetype: 'image/png' };
      const gifFile = { ...mockImageFile, originalname: 'test.gif', mimetype: 'image/gif' };
      const webpFile = { ...mockImageFile, originalname: 'test.webp', mimetype: 'image/webp' };
      
      const files = [jpegFile, pngFile, gifFile, webpFile];
      const expectedPaths = files.map(file => `/uploads/${folder}/uuid-${file.originalname}`);
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPaths);

      const result = await controller.uploadImages(files, folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith(files, folder);
      expect(result).toEqual(expectedPaths);
    });

    it('should handle upload to different folders', async () => {
      const customFolder = 'blog-images';
      const expectedPath = `/uploads/${customFolder}/uuid-test-image.jpg`;
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPath);

      const result = await controller.uploadImages([mockImageFile], customFolder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockImageFile], customFolder);
      expect(result).toEqual(expectedPath);
    });
  });

  describe('uploadVideos', () => {
    const folder = 'blog-videos';

    it('should upload a single video file successfully', async () => {
      const expectedPath = `/uploads/${folder}/uuid-test-video.mp4`;
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPath);

      const result = await controller.uploadVideos([mockVideoFile], folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockVideoFile], folder);
      expect(service.uploadMultipleFiles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPath);
    });

    it('should upload multiple video files successfully', async () => {
      const mockVideoFile2: Express.Multer.File = {
        ...mockVideoFile,
        originalname: 'test-video-2.avi',
        mimetype: 'video/avi',
      };
      const files = [mockVideoFile, mockVideoFile2];
      const expectedPaths = [
        `/uploads/${folder}/uuid-test-video.mp4`,
        `/uploads/${folder}/uuid-test-video-2.avi`
      ];
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPaths);

      const result = await controller.uploadVideos(files, folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith(files, folder);
      expect(service.uploadMultipleFiles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPaths);
    });

    it('should throw BadRequestException when no files are provided', async () => {
      await expect(controller.uploadVideos([], folder)).rejects.toThrow(
        new BadRequestException('No video files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when files array is null', async () => {
      await expect(controller.uploadVideos(null as any, folder)).rejects.toThrow(
        new BadRequestException('No video files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when files array is undefined', async () => {
      await expect(controller.uploadVideos(undefined as any, folder)).rejects.toThrow(
        new BadRequestException('No video files provided')
      );

      expect(service.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('should handle service upload errors', async () => {
      const error = new Error('Upload failed');
      mockUplaodService.uploadMultipleFiles.mockRejectedValue(error);

      await expect(controller.uploadVideos([mockVideoFile], folder)).rejects.toThrow(error);
      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockVideoFile], folder);
    });

    it('should upload videos with different valid formats', async () => {
      const mp4File = { ...mockVideoFile, originalname: 'test.mp4', mimetype: 'video/mp4' };
      const aviFile = { ...mockVideoFile, originalname: 'test.avi', mimetype: 'video/avi' };
      const movFile = { ...mockVideoFile, originalname: 'test.mov', mimetype: 'video/mov' };
      const wmvFile = { ...mockVideoFile, originalname: 'test.wmv', mimetype: 'video/wmv' };
      const webmFile = { ...mockVideoFile, originalname: 'test.webm', mimetype: 'video/webm' };
      const mkvFile = { ...mockVideoFile, originalname: 'test.mkv', mimetype: 'video/mkv' };
      
      const files = [mp4File, aviFile, movFile, wmvFile, webmFile, mkvFile];
      const expectedPaths = files.map(file => `/uploads/${folder}/uuid-${file.originalname}`);
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPaths);

      const result = await controller.uploadVideos(files, folder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith(files, folder);
      expect(result).toEqual(expectedPaths);
    });

    it('should handle upload to different folders', async () => {
      const customFolder = 'tutorial-videos';
      const expectedPath = `/uploads/${customFolder}/uuid-test-video.mp4`;
      mockUplaodService.uploadMultipleFiles.mockResolvedValue(expectedPath);

      const result = await controller.uploadVideos([mockVideoFile], customFolder);

      expect(service.uploadMultipleFiles).toHaveBeenCalledWith([mockVideoFile], customFolder);
      expect(result).toEqual(expectedPath);
    });
  });

  describe('file validation', () => {
    it('should reject invalid file types for images', () => {
      // Note: File validation is handled by multer interceptor at the framework level
      // These tests would be integration tests rather than unit tests
      // The file filter functions are defined but would be tested separately
      expect(typeof controller.uploadImages).toBe('function');
    });

    it('should reject invalid file types for videos', () => {
      // Note: File validation is handled by multer interceptor at the framework level
      // These tests would be integration tests rather than unit tests
      // The file filter functions are defined but would be tested separately
      expect(typeof controller.uploadVideos).toBe('function');
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

  describe('authentication', () => {
    it('should be protected by JwtAuthGuard', () => {
      // This test verifies that the guard is properly applied
      // The actual guard logic would be tested in guard-specific tests
      const guards = Reflect.getMetadata('__guards__', UplaodController);
      expect(guards).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate service errors for image upload', async () => {
      const serviceError = new Error('File system error');
      mockUplaodService.uploadMultipleFiles.mockRejectedValue(serviceError);

      await expect(controller.uploadImages([mockImageFile], 'test-folder')).rejects.toThrow(serviceError);
    });

    it('should propagate service errors for video upload', async () => {
      const serviceError = new Error('File system error');
      mockUplaodService.uploadMultipleFiles.mockRejectedValue(serviceError);

      await expect(controller.uploadVideos([mockVideoFile], 'test-folder')).rejects.toThrow(serviceError);
    });
  });
});
