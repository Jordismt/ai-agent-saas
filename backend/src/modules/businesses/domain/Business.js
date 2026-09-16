export class Business {
  constructor({ id, ownerId, name, description = null, phone = null, address = null }) {
    this.id = id;
    this.ownerId = ownerId;
    this.name = name;
    this.description = description;
    this.phone = phone;
    this.address = address;
  }
}
