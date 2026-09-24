import { AppError } from "../../../shared/errors/AppError.js";

export class GetEmployeeHours {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return this.employeeRepository.getHours(employeeId);
  }
}
