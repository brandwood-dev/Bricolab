import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

export class BlogExceptions {
    static handleValidationError(error: any): never {
        const validationErrors = Object.values(error.errors).map(
            (err: any) => err.message
        );
        throw new BadRequestException({
            message: 'Validation failed',
            errors: validationErrors
        });
    }

    static handleCastError(): never {
        throw new BadRequestException('Invalid ID format');
    }

    static handleDuplicateKeyError(error: any): never {
        const field = Object.keys(error.keyValue)[0];
        throw new BadRequestException(`${field} already exists`);
    }

    static handleNotFound(resource: string, id?: string): never {
        const message = id 
            ? `${resource} with ID ${id} not found` 
            : `${resource} not found`;
        throw new NotFoundException(message);
    }

    static handleGenericError(error: any, defaultMessage: string): never {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            this.handleValidationError(error);
        }

        // Handle cast errors (invalid ObjectId format)
        if (error.name === 'CastError') {
            this.handleCastError();
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            this.handleDuplicateKeyError(error);
        }

        // Handle known HTTP exceptions
        if (error instanceof BadRequestException || 
            error instanceof NotFoundException) {
            throw error;
        }

        // Log unexpected errors for debugging
        console.error(`${defaultMessage}:`, error);

        // Throw generic internal server error
        throw new InternalServerErrorException(defaultMessage);
    }
}