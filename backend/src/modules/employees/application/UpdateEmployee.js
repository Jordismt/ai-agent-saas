import { AppError } from "../../../shared/errors/AppError.js";

export class UpdateEmployee {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId, data) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    return this.employeeRepository.update(employeeId, {
      name: data.name ?? employee.name,
      email: data.email !== undefined ? data.email : employee.email,
      phone: data.phone !== undefined ? data.phone : employee.phone,
      active: data.active !== undefined ? data.active : employee.active,
    });
  }
}
