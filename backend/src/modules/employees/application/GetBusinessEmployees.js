export class GetBusinessEmployees {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  async execute(businessId) {
    return this.employeeRepository.findByBusinessId(businessId);
  }
}
