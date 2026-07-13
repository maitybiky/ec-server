export class ApiResponse {
  constructor(message, data = null) {
    this.success = true;
    this.message = message;
    this.data = data;
  }

  static send(res, statusCode, message, data = null) {
    return res.status(statusCode).json(new ApiResponse(message, data));
  }

  static ok(res, message, data = null) {
    return ApiResponse.send(res, 200, message, data);
  }

  static created(res, message, data = null) {
    return ApiResponse.send(res, 201, message, data);
  }
}
