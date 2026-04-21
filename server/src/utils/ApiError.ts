import { HTTP_STATUS } from '@shuttle-sync/shared';

export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public errors?: Record<string, string[]>;

    constructor(
        statusCode: number,
        message: string,
        errors?: Record<string, string[]>,
        isOperational = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        Object.setPrototypeOf(this, ApiError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, errors?: Record<string, string[]>) {
        return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
    }

    static unauthorized(message = 'Bạn chưa đăng nhập') {
        return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
    }

    static forbidden(message = 'Bạn không có quyền truy cập') {
        return new ApiError(HTTP_STATUS.FORBIDDEN, message);
    }

    static notFound(message = 'Không tìm thấy tài nguyên') {
        return new ApiError(HTTP_STATUS.NOT_FOUND, message);
    }

    static conflict(message: string) {
        return new ApiError(HTTP_STATUS.CONFLICT, message);
    }

    static tooManyRequests(message = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
        return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);
    }

    static internal(message = 'Lỗi hệ thống') {
        return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, undefined, false);
    }
}