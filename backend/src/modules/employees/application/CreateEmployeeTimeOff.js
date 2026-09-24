import { AppError } from "../../../shared/errors/AppError.js";

export class CreateEmployeeTimeOff {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId, data) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return this.employeeRepository.createTimeOff(employeeId, data);
  }
}
