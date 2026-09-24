import { AppError } from "../../../shared/errors/AppError.js";

export class DeactivateEmployee {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (!employee.active) {
      return employee;
    }

    return this.employeeRepository.deactivate(employeeId);
  }
}
