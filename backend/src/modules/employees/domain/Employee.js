export class Employee {
  constructor({ id, businessId, name, email = null, phone = null, active = true }) {
    this.id = id;
    this.businessId = businessId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.active = active;
  }
}
