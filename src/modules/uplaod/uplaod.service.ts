import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UplaodService {
    private readonly logger = new Logger(UplaodService.name);
    constructor() {}
    async uploadFileLocal(file: Express.Multer.File, folder: string): Promise<string> {
        const fileName = `${uuidv4()}-${file.originalname}`;
        const dir = path.join(__dirname,'..','..','..', 'uploads', folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${folder}/${fileName}`;
    }
    async uploadMultipleFiles(files: Express.Multer.File | Express.Multer.File[], folder: string): Promise<string | string[]> {
        // Handle single file
        if (!Array.isArray(files)) {
            const fileName = `${uuidv4()}-${files.originalname}`;
            const dir = path.join(__dirname,'..','..','..', 'uploads', folder);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, fileName);
            fs.writeFileSync(filePath, files.buffer);
            return `/uploads/${folder}/${fileName}`;
        }

        // Handle multiple files
        const uploadedFiles: string[] = [];
        const dir = path.join(__dirname,'..','..','..', 'uploads', folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        for (const file of files) {
            const fileName = `${uuidv4()}-${file.originalname}`;
            const filePath = path.join(dir, fileName);
            fs.writeFileSync(filePath, file.buffer);
            uploadedFiles.push(`/uploads/${folder}/${fileName}`);
        }

        return uploadedFiles;
    }
}

