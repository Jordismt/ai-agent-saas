import { Business } from "../domain/Business.js";

export class CreateBusiness {
  constructor(businessRepository) {
    this.businessRepository = businessRepository;
  }

  async execute({ ownerId, name, description, phone, address }) {
    const business = new Business({
      ownerId,
      name,
      description,
      phone,
      address,
    });

    return this.businessRepository.create(business);
  }
}
