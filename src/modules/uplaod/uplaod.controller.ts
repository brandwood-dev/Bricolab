import { BadRequestException, Controller, Post, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import { UplaodService } from './uplaod.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards';

const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const videoFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(mp4|avi|mov|wmv|webm|mkv)$/)) {
    return callback(new BadRequestException('Only video files are allowed!'), false);
  }
  callback(null, true);
};

@Controller('uplaod')
@UseGuards(JwtAuthGuard)
export class UplaodController {
    constructor(
        private readonly uplaodService: UplaodService,
    ) {}

    @Post('images')
    @UseInterceptors(FilesInterceptor('files', 10, {
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
            fileFilter: imageFileFilter,
            storage: null
        }))
    async uploadImages(@UploadedFiles() files: Express.Multer.File[], folder: string): Promise<string | string[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No image files provided');
        }
        return this.uplaodService.uploadMultipleFiles(files, folder);
    }

    @Post('videos')
    @UseInterceptors(FilesInterceptor('files', 5, {
            limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
            fileFilter: videoFileFilter,
            storage: null
        }))
    async uploadVideos(@UploadedFiles() files: Express.Multer.File[], folder: string): Promise<string | string[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No video files provided');
        }
        return this.uplaodService.uploadMultipleFiles(files, folder);
    }
}