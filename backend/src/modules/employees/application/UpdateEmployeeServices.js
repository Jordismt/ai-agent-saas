import { AppError } from "../../../shared/errors/AppError.js";

export class UpdateEmployeeServices {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId, serviceIds) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return this.employeeRepository.replaceServices(employeeId, serviceIds);
  }
}
