import { Test, TestingModule } from '@nestjs/testing';
import { UplaodService } from './uplaod.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

// Mock external dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('uuid');

describe('UplaodService', () => {
  let service: UplaodService;

  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

  const mockSingleFile: Express.Multer.File = {
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

  const mockMultipleFiles: Express.Multer.File[] = [
    {
      fieldname: 'files',
      originalname: 'test-image-1.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data 1'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: new Readable(),
    },
    {
      fieldname: 'files',
      originalname: 'test-image-2.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake image data 2'),
      size: 2048,
      destination: '',
      filename: '',
      path: '',
      stream: new Readable(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UplaodService],
    }).compile();

    service = module.get<UplaodService>(UplaodService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup common mock implementations
    (mockUuidv4 as jest.Mock).mockReturnValue('mocked-uuid-1234');
    mockPath.join.mockImplementation((...paths) => paths.join('/'));
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFileLocal - Single File', () => {
    const folder = 'profile-pictures';

    it('should upload a single file successfully', async () => {
      const expectedFileName = 'mocked-uuid-1234-test-image.jpg';
      const expectedPath = `/uploads/${folder}/${expectedFileName}`;

      const result = await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String), '..', '..', '..', 'uploads', folder
      );
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String), expectedFileName
      );
      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String), mockSingleFile.buffer
      );
      expect(result).toBe(expectedPath);
    });

    it('should create directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String), { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should not create directory if it already exists', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should generate unique filename with UUID', async () => {
      (mockUuidv4 as jest.Mock).mockReturnValue('unique-uuid-5678');
      const expectedFileName = 'unique-uuid-5678-test-image.jpg';
      const expectedPath = `/uploads/${folder}/${expectedFileName}`;

      const result = await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedPath);
    });

    it('should handle files with different extensions', async () => {
      const pdfFile = {
        ...mockSingleFile,
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
      };

      const result = await service.uploadFileLocal(pdfFile, folder);

      expect(result).toBe(`/uploads/${folder}/mocked-uuid-1234-document.pdf`);
    });

    it('should handle files with special characters in name', async () => {
      const specialFile = {
        ...mockSingleFile,
        originalname: 'test file (1) & special.jpg',
        mimetype: 'image/jpeg',
      };

      const result = await service.uploadFileLocal(specialFile, folder);

      expect(result).toBe(`/uploads/${folder}/mocked-uuid-1234-test file (1) & special.jpg`);
    });

    it('should handle different folder structures', async () => {
      const nestedFolder = 'blog/images/thumbnails';

      const result = await service.uploadFileLocal(mockSingleFile, nestedFolder);

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String), '..', '..', '..', 'uploads', nestedFolder
      );
      expect(result).toBe(`/uploads/${nestedFolder}/mocked-uuid-1234-test-image.jpg`);
    });
  });

  describe('uploadMultipleFiles - Multiple Files', () => {
    const folder = 'blog-images';

    it('should upload single file when passed as non-array', async () => {
      const expectedPath = `/uploads/${folder}/mocked-uuid-1234-test-image.jpg`;

      const result = await service.uploadMultipleFiles(mockSingleFile, folder);

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String), mockSingleFile.buffer
      );
      expect(result).toBe(expectedPath);
    });

    it('should upload multiple files successfully', async () => {
      // Setup different UUIDs for each file
      (mockUuidv4 as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const expectedPaths = [
        `/uploads/${folder}/uuid-1-test-image-1.jpg`,
        `/uploads/${folder}/uuid-2-test-image-2.png`,
      ];

      const result = await service.uploadMultipleFiles(mockMultipleFiles, folder);

      expect(mockUuidv4).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFileSync).toHaveBeenNthCalledWith(
        1, expect.any(String), mockMultipleFiles[0].buffer
      );
      expect(mockFs.writeFileSync).toHaveBeenNthCalledWith(
        2, expect.any(String), mockMultipleFiles[1].buffer
      );
      expect(result).toEqual(expectedPaths);
    });

    it('should create directory once for multiple files', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await service.uploadMultipleFiles(mockMultipleFiles, folder);

      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array of files', async () => {
      const result = await service.uploadMultipleFiles([], folder);

      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle single file in array format', async () => {
      const singleFileArray = [mockSingleFile];
      const expectedPath = [`/uploads/${folder}/mocked-uuid-1234-test-image.jpg`];

      const result = await service.uploadMultipleFiles(singleFileArray, folder);

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPath);
    });

    it('should generate unique UUIDs for each file', async () => {
      const manyFiles = [
        mockMultipleFiles[0],
        mockMultipleFiles[1],
        { ...mockSingleFile, originalname: 'file3.gif' },
        { ...mockSingleFile, originalname: 'file4.webp' },
      ];

      (mockUuidv4 as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3')
        .mockReturnValueOnce('uuid-4');

      const expectedPaths = [
        `/uploads/${folder}/uuid-1-test-image-1.jpg`,
        `/uploads/${folder}/uuid-2-test-image-2.png`,
        `/uploads/${folder}/uuid-3-file3.gif`,
        `/uploads/${folder}/uuid-4-file4.webp`,
      ];

      const result = await service.uploadMultipleFiles(manyFiles, folder);

      expect(mockUuidv4).toHaveBeenCalledTimes(4);
      expect(result).toEqual(expectedPaths);
    });
  });

  describe('error handling', () => {
    const folder = 'test-folder';

    it('should handle file system write errors for single file', async () => {
      const writeError = new Error('Permission denied');
      mockFs.writeFileSync.mockImplementation(() => {
        throw writeError;
      });

      await expect(service.uploadFileLocal(mockSingleFile, folder)).rejects.toThrow(writeError);
    });

    it('should handle file system write errors for multiple files', async () => {
      const writeError = new Error('Disk full');
      mockFs.writeFileSync.mockImplementation(() => {
        throw writeError;
      });

      await expect(service.uploadMultipleFiles(mockMultipleFiles, folder)).rejects.toThrow(writeError);
    });

    it('should handle directory creation errors', async () => {
      const mkdirError = new Error('Permission denied to create directory');
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw mkdirError;
      });

      await expect(service.uploadFileLocal(mockSingleFile, folder)).rejects.toThrow(mkdirError);
    });

    it('should handle path resolution errors', async () => {
      const pathError = new Error('Invalid path');
      mockPath.join.mockImplementation(() => {
        throw pathError;
      });

      await expect(service.uploadFileLocal(mockSingleFile, folder)).rejects.toThrow(pathError);
    });

    it('should handle UUID generation errors', async () => {
      const uuidError = new Error('UUID generation failed');
      (mockUuidv4 as jest.Mock).mockImplementation(() => {
        throw uuidError;
      });

      await expect(service.uploadFileLocal(mockSingleFile, folder)).rejects.toThrow(uuidError);
    });
  });

  describe('file system integration', () => {
    const folder = 'user/profile';
    
    it('should use correct path structure', async () => {
      await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.stringContaining('uplaod'), '..', '..', '..', 'uploads', folder
      );
    });

    it('should write files with correct buffer data', async () => {
      await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String), mockSingleFile.buffer
      );
    });

    it('should create directories recursively', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await service.uploadFileLocal(mockSingleFile, folder);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String), { recursive: true }
      );
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have logger defined', () => {
      expect(service['logger']).toBeDefined();
    });
  });

  describe('return value validation', () => {
    it('should return string for single file upload', async () => {
      const result = await service.uploadFileLocal(mockSingleFile, 'test');

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\/uploads\/test\/.*\.jpg$/);
    });

    it('should return array for multiple files upload', async () => {
      const result = await service.uploadMultipleFiles(mockMultipleFiles, 'test');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatch(/^\/uploads\/test\/.*\.jpg$/);
      expect(result[1]).toMatch(/^\/uploads\/test\/.*\.png$/);
    });

    it('should return empty array for empty files array', async () => {
      const result = await service.uploadMultipleFiles([], 'test');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
