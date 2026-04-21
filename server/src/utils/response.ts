import { Response } from 'express';
import { IApiResponse, IPagination } from '@shuttle-sync/shared';

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: IPagination
): Response => {
    const response: IApiResponse<T> = {
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
        pagination,
    };
    return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(res: Response, data?: T, message = 'Thành công') =>
    sendResponse(res, 200, message, data);

export const sendCreated = <T>(res: Response, data?: T, message = 'Tạo thành công') =>
    sendResponse(res, 201, message, data);

export const sendPaginated = <T>(
    res: Response,
    data: T,
    pagination: IPagination,
    message = 'Thành công'
) => sendResponse(res, 200, message, data, pagination);