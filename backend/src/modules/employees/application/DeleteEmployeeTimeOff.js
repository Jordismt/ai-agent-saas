import { AppError } from "../../../shared/errors/AppError.js";

export class DeleteEmployeeTimeOff {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId, timeOffId) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const timeOff = await this.employeeRepository.findTimeOffById(timeOffId);

    if (!timeOff || timeOff.employee_id !== employeeId) {
      throw new AppError("Employee time off not found", 404);
    }

    await this.employeeRepository.deleteTimeOff(timeOffId);
  }
}
