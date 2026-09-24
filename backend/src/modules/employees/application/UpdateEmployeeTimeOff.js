import { AppError } from "../../../shared/errors/AppError.js";

export class UpdateEmployeeTimeOff {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(employeeId, timeOffId, data) {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const timeOff = await this.employeeRepository.findTimeOffById(timeOffId);

    if (!timeOff || timeOff.employee_id !== employeeId) {
      throw new AppError("Employee time off not found", 404);
    }

    return this.employeeRepository.updateTimeOff(timeOffId, data);
  }
}
