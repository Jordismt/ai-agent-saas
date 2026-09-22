export class UpdateBusinessHours {
  constructor(businessHoursRepository) {
    this.businessHoursRepository = businessHoursRepository;
  }

  async execute(businessId, hours) {
    const updatedHours = [];

    for (const day of hours) {
      const updated = await this.businessHoursRepository.update(businessId, day.dayOfWeek, {
        openTime: day.openTime,
        closeTime: day.closeTime,
        secondOpenTime: day.secondOpenTime,
        secondCloseTime: day.secondCloseTime,
        isClosed: day.isClosed,
      });

      updatedHours.push(updated);
    }

    return updatedHours;
  }
}
