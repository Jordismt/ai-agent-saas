import { CreateEmployee } from "../application/CreateEmployee.js";
import { GetBusinessEmployees } from "../application/GetBusinessEmployees.js";
import { GetEmployee } from "../application/GetEmployee.js";
import { UpdateEmployee } from "../application/UpdateEmployee.js";
import { DeactivateEmployee } from "../application/DeactivateEmployee.js";
import { GetEmployeeServices } from "../application/GetEmployeeServices.js";
import { UpdateEmployeeServices } from "../application/UpdateEmployeeServices.js";
import { GetEmployeeHours } from "../application/GetEmployeeHours.js";
import { UpdateEmployeeHours } from "../application/UpdateEmployeeHours.js";
import { GetEmployeeTimeOff } from "../application/GetEmployeeTimeOff.js";
import { CreateEmployeeTimeOff } from "../application/CreateEmployeeTimeOff.js";
import { UpdateEmployeeTimeOff } from "../application/UpdateEmployeeTimeOff.js";
import { DeleteEmployeeTimeOff } from "../application/DeleteEmployeeTimeOff.js";

export class EmployeeController {
  constructor({ employeeRepository }) {
    this.createEmployee = new CreateEmployee(employeeRepository);

    this.getBusinessEmployees = new GetBusinessEmployees(employeeRepository);

    this.getEmployee = new GetEmployee(employeeRepository);

    this.updateEmployee = new UpdateEmployee(employeeRepository);

    this.deactivateEmployee = new DeactivateEmployee(employeeRepository);

    this.getEmployeeServices = new GetEmployeeServices(employeeRepository);

    this.updateEmployeeServices = new UpdateEmployeeServices(employeeRepository);

    this.getEmployeeHours = new GetEmployeeHours(employeeRepository);

    this.updateEmployeeHours = new UpdateEmployeeHours(employeeRepository);

    this.getEmployeeTimeOff = new GetEmployeeTimeOff(employeeRepository);

    this.createEmployeeTimeOff = new CreateEmployeeTimeOff(employeeRepository);

    this.updateEmployeeTimeOff = new UpdateEmployeeTimeOff(employeeRepository);

    this.deleteEmployeeTimeOff = new DeleteEmployeeTimeOff(employeeRepository);
  }

  async create(req, res, next) {
    try {
      const employee = await this.createEmployee.execute({
        businessId: req.params.businessId,
        ...req.body,
      });

      return res.status(201).json(employee);
    } catch (error) {
      next(error);
    }
  }

  async getByBusinessId(req, res, next) {
    try {
      const employees = await this.getBusinessEmployees.execute(req.params.businessId);

      return res.json(employees);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const employee = await this.getEmployee.execute(req.params.employeeId);

      return res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await this.updateEmployee.execute(req.params.employeeId, req.body);

      return res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const employee = await this.deactivateEmployee.execute(req.params.employeeId);

      return res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async getServices(req, res, next) {
    try {
      const services = await this.getEmployeeServices.execute(req.params.employeeId);

      return res.json(services);
    } catch (error) {
      next(error);
    }
  }

  async updateServices(req, res, next) {
    try {
      const services = await this.updateEmployeeServices.execute(req.params.employeeId, req.body.serviceIds);

      return res.json(services);
    } catch (error) {
      next(error);
    }
  }

  async getHours(req, res, next) {
    try {
      const hours = await this.getEmployeeHours.execute(req.params.employeeId);

      return res.json(hours);
    } catch (error) {
      next(error);
    }
  }

  async updateHours(req, res, next) {
    try {
      const hours = await this.updateEmployeeHours.execute(req.params.employeeId, req.body.hours);

      return res.json(hours);
    } catch (error) {
      next(error);
    }
  }

  async getTimeOff(req, res, next) {
    try {
      const timeOff = await this.getEmployeeTimeOff.execute(req.params.employeeId);

      return res.json(timeOff);
    } catch (error) {
      next(error);
    }
  }

  async createTimeOff(req, res, next) {
    try {
      const timeOff = await this.createEmployeeTimeOff.execute(req.params.employeeId, req.body);

      return res.status(201).json(timeOff);
    } catch (error) {
      next(error);
    }
  }

  async updateTimeOff(req, res, next) {
    try {
      const timeOff = await this.updateEmployeeTimeOff.execute(
        req.params.employeeId,
        req.params.timeOffId,
        req.body,
      );

      return res.json(timeOff);
    } catch (error) {
      next(error);
    }
  }

  async deleteTimeOff(req, res, next) {
    try {
      await this.deleteEmployeeTimeOff.execute(req.params.employeeId, req.params.timeOffId);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
