import { Employee } from "../domain/Employee.js";

export class CreateEmployee {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute({ businessId, name, email = null, phone = null }) {
    const employee = new Employee({
      businessId,
      name,
      email,
      phone,
      active: true,
    });

    return this.employeeRepository.create(employee);
  }
}
