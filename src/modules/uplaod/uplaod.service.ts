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
}

